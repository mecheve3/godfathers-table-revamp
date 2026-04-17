import type { RoomState, RoomPlayer, ClientMessage, ServerMessage } from './types'

export interface Env {
  GAME_ROOM: DurableObjectNamespace
}

/**
 * GameRoom — Cloudflare Durable Object
 *
 * One instance per match. Holds authoritative lobby/game state in memory
 * and broadcasts updates to all connected WebSocket clients.
 */
export class GameRoom implements DurableObject {
  private state: DurableObjectState
  private sessions: Map<WebSocket, RoomPlayer> = new Map()
  private room: RoomState | null = null

  constructor(state: DurableObjectState, _env: Env) {
    this.state = state
  }

  // ── Entry point ────────────────────────────────────────────────────────────

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/create') return this.handleCreate(request)
    if (url.pathname === '/websocket') return this.handleWebSocket(request)
    if (url.pathname === '/state') return this.handleGetState()

    return new Response('Not found', { status: 404 })
  }

  // ── HTTP: create room ──────────────────────────────────────────────────────

  private async handleCreate(request: Request): Promise<Response> {
    const body = await request.json<{ roomCode: string; maxPlayers: number; hostId: string; hostName: string }>()

    if (this.room) {
      return new Response(JSON.stringify({ error: 'Room already initialised' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    this.room = {
      roomCode: body.roomCode,
      hostId: body.hostId,
      status: 'LOBBY',
      maxPlayers: body.maxPlayers,
      players: [
        {
          id: body.hostId,
          name: body.hostName,
          type: 'HUMAN',
          isHost: true,
          isConnected: false, // becomes true on WS connect
        },
      ],
    }

    return new Response(JSON.stringify({ ok: true, room: this.room }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ── HTTP: get state ────────────────────────────────────────────────────────

  private handleGetState(): Response {
    if (!this.room) {
      return new Response(JSON.stringify({ error: 'Room not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    return new Response(JSON.stringify(this.room), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ── WebSocket upgrade ──────────────────────────────────────────────────────

  private async handleWebSocket(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get('Upgrade')
    if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
      return new Response('Expected WebSocket upgrade', { status: 426 })
    }

    const url = new URL(request.url)
    const playerId = url.searchParams.get('playerId')
    const playerName = url.searchParams.get('name') ?? 'Unknown'

    if (!playerId) {
      return new Response('Missing playerId', { status: 400 })
    }

    if (!this.room) {
      return new Response('Room not found', { status: 404 })
    }

    if (this.room.status !== 'LOBBY') {
      return new Response(JSON.stringify({ error: 'Game already started' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const pair = new WebSocketPair()
    const [client, server] = Object.values(pair)

    this.state.acceptWebSocket(server)

    // Mark existing player connected, or add new joiner
    const existing = this.room.players.find((p) => p.id === playerId)
    if (existing) {
      existing.isConnected = true
    } else {
      if (this.room.players.filter((p) => p.type === 'HUMAN').length >= this.room.maxPlayers) {
        server.close(1008, 'Room full')
        return new Response(null, { status: 101, webSocket: client })
      }
      const newPlayer: RoomPlayer = {
        id: playerId,
        name: playerName,
        type: 'HUMAN',
        isHost: false,
        isConnected: true,
      }
      this.room.players.push(newPlayer)
      this.broadcast({ type: 'PLAYER_JOINED', player: newPlayer }, server)
    }

    this.sessions.set(server, this.room.players.find((p) => p.id === playerId)!)

    // Send full room state to the newly connected client
    this.send(server, { type: 'ROOM_STATE', room: this.room })

    return new Response(null, { status: 101, webSocket: client })
  }

  // ── WebSocket event handlers ───────────────────────────────────────────────

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (!this.room) return
    let msg: ClientMessage
    try {
      msg = JSON.parse(typeof message === 'string' ? message : new TextDecoder().decode(message))
    } catch {
      this.send(ws, { type: 'ERROR', message: 'Invalid JSON' })
      return
    }

    const player = this.sessions.get(ws)
    if (!player) return

    switch (msg.type) {
      case 'START_GAME': {
        if (!player.isHost) {
          this.send(ws, { type: 'ERROR', message: 'Only the host can start the game' })
          return
        }
        if (this.room.status !== 'LOBBY') {
          this.send(ws, { type: 'ERROR', message: 'Game already started' })
          return
        }

        // Fill empty seats with CPU players
        const humanCount = this.room.players.filter((p) => p.type === 'HUMAN').length
        const cpuCount = this.room.maxPlayers - humanCount
        for (let i = 0; i < cpuCount; i++) {
          this.room.players.push({
            id: `cpu-${Date.now()}-${i}`,
            name: `CPU ${i + 1}`,
            type: 'CPU',
            isHost: false,
            isConnected: true,
          })
        }

        this.room.status = 'IN_GAME'
        this.broadcast({ type: 'GAME_STARTED', room: this.room })
        break
      }

      case 'LEAVE_ROOM': {
        this.handleDisconnect(ws)
        ws.close(1000, 'Left room')
        break
      }

      default:
        this.send(ws, { type: 'ERROR', message: 'Unknown message type' })
    }
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    this.handleDisconnect(ws)
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    this.handleDisconnect(ws)
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private handleDisconnect(ws: WebSocket): void {
    const player = this.sessions.get(ws)
    if (!player || !this.room) return

    // Mark as disconnected — don't remove (v1 spec)
    const found = this.room.players.find((p) => p.id === player.id)
    if (found) found.isConnected = false

    this.sessions.delete(ws)
    this.broadcast({ type: 'PLAYER_LEFT', playerId: player.id }, ws)
  }

  private send(ws: WebSocket, msg: ServerMessage): void {
    try {
      ws.send(JSON.stringify(msg))
    } catch {
      // connection already closed — ignore
    }
  }

  private broadcast(msg: ServerMessage, exclude?: WebSocket): void {
    for (const [ws] of this.sessions) {
      if (ws !== exclude) this.send(ws, msg)
    }
  }
}
