import type { RoomState, RoomPlayer, ClientMessage, ServerMessage } from './types'

export interface Env {
  GAME_ROOM: DurableObjectNamespace
}

/** Data attached to each WebSocket — survives DO hibernation */
interface WsAttachment {
  playerId: string
}

/**
 * GameRoom — Cloudflare Durable Object
 *
 * State is persisted to DO storage so it survives hibernation.
 * Per-socket player identity is stored via ws.serializeAttachment().
 * state.getWebSockets() is used for broadcasting (no in-memory Map needed).
 */
export class GameRoom implements DurableObject {
  private state: DurableObjectState

  constructor(state: DurableObjectState, _env: Env) {
    this.state = state
  }

  // ── Entry point ────────────────────────────────────────────────────────────

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/create')    return this.handleCreate(request)
    if (url.pathname === '/websocket') return this.handleWebSocket(request)
    if (url.pathname === '/state')     return this.handleGetState()

    return new Response('Not found', { status: 404 })
  }

  // ── Persistent state helpers ───────────────────────────────────────────────

  private async getRoom(): Promise<RoomState | null> {
    return (await this.state.storage.get<RoomState>('room')) ?? null
  }

  private async saveRoom(room: RoomState): Promise<void> {
    await this.state.storage.put('room', room)
  }

  // ── HTTP: create room ──────────────────────────────────────────────────────

  private async handleCreate(request: Request): Promise<Response> {
    const existing = await this.getRoom()
    if (existing) {
      return Response.json({ error: 'Room already initialised' }, { status: 409 })
    }

    const body = await request.json<{ roomCode: string; maxPlayers: number; hostId: string; hostName: string }>()

    const room: RoomState = {
      roomCode: body.roomCode,
      hostId: body.hostId,
      status: 'LOBBY',
      maxPlayers: body.maxPlayers,
      players: [{
        id: body.hostId,
        name: body.hostName,
        type: 'HUMAN',
        isHost: true,
        isConnected: false,
      }],
    }

    await this.saveRoom(room)
    return Response.json({ ok: true, room })
  }

  // ── HTTP: get state ────────────────────────────────────────────────────────

  private async handleGetState(): Promise<Response> {
    const room = await this.getRoom()
    if (!room) return Response.json({ error: 'Room not found' }, { status: 404 })
    return Response.json(room)
  }

  // ── WebSocket upgrade ──────────────────────────────────────────────────────

  private async handleWebSocket(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
      return new Response('Expected WebSocket upgrade', { status: 426 })
    }

    const url = new URL(request.url)
    const playerId = url.searchParams.get('playerId')
    const playerName = url.searchParams.get('name') ?? 'Unknown'

    if (!playerId) return new Response('Missing playerId', { status: 400 })

    const room = await this.getRoom()
    if (!room) return new Response('Room not found', { status: 404 })
    if (room.status !== 'LOBBY') {
      return Response.json({ error: 'Game already started' }, { status: 409 })
    }

    const pair = new WebSocketPair()
    const [client, server] = Object.values(pair)

    // Attach player ID to this WebSocket — persists across hibernation wakeups
    server.serializeAttachment({ playerId } satisfies WsAttachment)
    this.state.acceptWebSocket(server)

    // Mark existing player as connected, or register new joiner
    const existing = room.players.find((p) => p.id === playerId)
    if (existing) {
      existing.isConnected = true
    } else {
      const humanCount = room.players.filter((p) => p.type === 'HUMAN').length
      if (humanCount >= room.maxPlayers) {
        server.close(1008, 'Room full')
        return new Response(null, { status: 101, webSocket: client })
      }
      room.players.push({
        id: playerId,
        name: playerName,
        type: 'HUMAN',
        isHost: false,
        isConnected: true,
      })
    }

    await this.saveRoom(room)

    // Broadcast full state to ALL connected clients (including this one)
    // This is the simplest way to keep every client in sync
    this.broadcastAll({ type: 'ROOM_STATE', room })

    return new Response(null, { status: 101, webSocket: client })
  }

  // ── WebSocket event handlers (called by DO runtime on hibernation wakeup) ──

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    const room = await this.getRoom()
    if (!room) return

    let msg: ClientMessage
    try {
      msg = JSON.parse(typeof message === 'string' ? message : new TextDecoder().decode(message))
    } catch {
      this.send(ws, { type: 'ERROR', message: 'Invalid JSON' })
      return
    }

    // Player identity comes from the WebSocket attachment — survives hibernation
    const { playerId } = ws.deserializeAttachment() as WsAttachment
    const player = room.players.find((p) => p.id === playerId)
    if (!player) return

    switch (msg.type) {
      case 'START_GAME': {
        if (!player.isHost) {
          this.send(ws, { type: 'ERROR', message: 'Only the host can start the game' })
          return
        }
        if (room.status !== 'LOBBY') {
          this.send(ws, { type: 'ERROR', message: 'Game already started' })
          return
        }

        // Fill empty seats with CPU players
        const humanCount = room.players.filter((p) => p.type === 'HUMAN').length
        for (let i = 0; i < room.maxPlayers - humanCount; i++) {
          room.players.push({
            id: `cpu-${Date.now()}-${i}`,
            name: `CPU ${i + 1}`,
            type: 'CPU',
            isHost: false,
            isConnected: true,
          })
        }

        room.status = 'IN_GAME'
        await this.saveRoom(room)
        this.broadcastAll({ type: 'GAME_STARTED', room })
        break
      }

      case 'LEAVE_ROOM': {
        await this.handleDisconnect(ws, room)
        ws.close(1000, 'Left room')
        break
      }

      default:
        this.send(ws, { type: 'ERROR', message: 'Unknown message type' })
    }
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    const room = await this.getRoom()
    if (room) await this.handleDisconnect(ws, room)
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    const room = await this.getRoom()
    if (room) await this.handleDisconnect(ws, room)
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private async handleDisconnect(ws: WebSocket, room: RoomState): Promise<void> {
    const { playerId } = ws.deserializeAttachment() as WsAttachment
    const player = room.players.find((p) => p.id === playerId)
    if (!player) return

    player.isConnected = false
    await this.saveRoom(room)
    // Notify remaining clients of updated state
    this.broadcastAll({ type: 'ROOM_STATE', room }, ws)
  }

  private send(ws: WebSocket, msg: ServerMessage): void {
    try { ws.send(JSON.stringify(msg)) } catch { /* already closed */ }
  }

  /** Broadcast to all accepted WebSockets, optionally excluding one */
  private broadcastAll(msg: ServerMessage, exclude?: WebSocket): void {
    for (const ws of this.state.getWebSockets()) {
      if (ws !== exclude) this.send(ws, msg)
    }
  }
}
