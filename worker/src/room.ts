import type { RoomState, RoomPlayer, TurnState, ClientMessage, ServerMessage } from './types'

export interface Env {
  GAME_ROOM: DurableObjectNamespace
}

/** Data attached to each WebSocket — survives DO hibernation */
interface WsAttachment {
  playerId: string
}

const IDLE_TIMEOUT_MS       = 30_000   // 30 s to start a play
const ACTIVITY_TIMEOUT_MS   = 90_000   // 1:30 to finish once started
const GRACE_PERIOD_MS       = 30_000   // disconnect grace (same as idle timeout)
const MAX_CONSECUTIVE_SKIPS = 3        // remove after this many consecutive disconnected turns

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

    const body = await request.json<{ roomCode: string; maxPlayers: number; hostId: string; hostName: string; seating: 'automatic' | 'manual' }>()

    const room: RoomState = {
      roomCode: body.roomCode,
      hostId: body.hostId,
      status: 'LOBBY',
      maxPlayers: body.maxPlayers,
      seating: body.seating ?? 'automatic',
      players: [{
        id: body.hostId,
        name: body.hostName,
        type: 'HUMAN',
        isHost: true,
        isConnected: false,
        consecutiveDisconnects: 0,
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

    const pair = new WebSocketPair()
    const [client, server] = Object.values(pair)

    // Attach player ID to this WebSocket — persists across hibernation wakeups
    server.serializeAttachment({ playerId } satisfies WsAttachment)
    this.state.acceptWebSocket(server)

    // IN_GAME: only existing players may reconnect; new joins are rejected
    if (room.status !== 'LOBBY') {
      const isKnownPlayer = room.players.some((p) => p.id === playerId)
      if (!isKnownPlayer) {
        this.send(server, { type: 'ERROR', message: 'Game already started' })
        server.close(1008, 'Game already started')
        return new Response(null, { status: 101, webSocket: client })
      }
    }

    // Mark existing player as (re)connected, or register new joiner
    const existing = room.players.find((p) => p.id === playerId)
    if (existing) {
      existing.isConnected = true
      existing.disconnectedAt = undefined  // clear grace-period marker
    } else {
      const humanCount = room.players.filter((p) => p.type === 'HUMAN').length
      if (humanCount >= room.maxPlayers) {
        this.send(server, { type: 'ERROR', message: 'Room is full' })
        server.close(1008, 'Room full')
        return new Response(null, { status: 101, webSocket: client })
      }
      room.players.push({
        id: playerId,
        name: playerName,
        type: 'HUMAN',
        isHost: false,
        isConnected: true,
        consecutiveDisconnects: 0,
      })
    }

    await this.saveRoom(room)

    if (room.status === 'LOBBY') {
      this.broadcastAll({ type: 'ROOM_STATE', room })
    } else {
      // IN_GAME reconnect — send state snapshot to the returning client
      this.send(server, { type: 'ROOM_STATE', room })
      const saved = await this.state.storage.get<unknown>('gameState')
      if (saved) this.send(server, { type: 'GAME_STATE', payload: saved })

      // If it's this player's turn, re-send TURN_STARTED so they see their countdown
      if (room.turnState?.playerId === playerId) {
        this.send(server, {
          type: 'TURN_STARTED',
          playerId,
          idleDeadline: room.turnState.idleDeadline,
          completionDeadline: room.turnState.completionDeadline,
        })
      }
    }

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
        const cpuStart = room.players.filter((p) => p.type === 'CPU').length
        for (let i = 0; i < room.maxPlayers - humanCount; i++) {
          const cpuIndex = cpuStart + i + 1
          room.players.push({
            id: `cpu-${cpuIndex}`,
            name: `CPU ${cpuIndex}`,
            type: 'CPU',
            isHost: false,
            isConnected: true,
            consecutiveDisconnects: 0,
          })
        }

        room.status = 'IN_GAME'
        await this.saveRoom(room)
        this.broadcastAll({ type: 'GAME_STARTED', room })
        break
      }

      case 'GAME_ACTION': {
        if (room.status !== 'IN_GAME') {
          this.send(ws, { type: 'ERROR', message: 'Game not in progress' })
          return
        }

        // Persist latest state for reconnects
        await this.state.storage.put('gameState', msg.payload)
        // Broadcast to everyone else
        this.broadcastAll({ type: 'GAME_STATE', payload: msg.payload }, ws)

        // Derive the next player from the payload; start a turn timer if HUMAN
        let nextTurnPlayerId: string | undefined
        try {
          const sync = msg.payload as {
            currentPlayerIndex?: number
            gameState?: { players?: Array<{ id?: string }> }
          }
          const idx = sync?.currentPlayerIndex
          if (typeof idx === 'number') {
            nextTurnPlayerId = sync?.gameState?.players?.[idx]?.id
          }
        } catch { /* payload shape mismatch — skip timer */ }

        const nextRoomPlayer = nextTurnPlayerId
          ? room.players.find(p => p.id === nextTurnPlayerId)
          : null

        if (nextRoomPlayer?.type === 'HUMAN') {
          const idleDeadline = Date.now() + IDLE_TIMEOUT_MS
          room.turnState = { playerId: nextRoomPlayer.id, idleDeadline }
          await this.saveRoom(room)
          await this.state.storage.setAlarm(idleDeadline)
          this.broadcastAll({ type: 'TURN_STARTED', playerId: nextRoomPlayer.id, idleDeadline })
        } else {
          // CPU turn or unknown — clear any existing timer
          if (room.turnState) {
            room.turnState = undefined
            await this.saveRoom(room)
          }
          try { await this.state.storage.deleteAlarm() } catch { /* no alarm pending */ }
        }
        break
      }

      case 'TURN_ACTIVITY': {
        if (!room.turnState || room.turnState.playerId !== playerId) return
        if (room.turnState.completionDeadline) return  // already extended

        const completionDeadline = Date.now() + ACTIVITY_TIMEOUT_MS
        room.turnState = { ...room.turnState, completionDeadline }
        await this.saveRoom(room)
        await this.state.storage.setAlarm(completionDeadline)
        // No broadcast — the active client updates its own display immediately on send
        break
      }

      case 'ABANDON_GAME': {
        this.broadcastAll({ type: 'GAME_ABANDONED', playerName: msg.playerName, reason: msg.reason }, ws)
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

  // ── Alarm: fires when a turn timer expires ─────────────────────────────────

  async alarm(): Promise<void> {
    const room = await this.getRoom()
    if (!room || !room.turnState || room.status !== 'IN_GAME') return

    const now = Date.now()
    const { playerId, idleDeadline, completionDeadline } = room.turnState
    const deadline = completionDeadline ?? idleDeadline

    // Spurious early wakeup (e.g. alarm reset mid-turn) — reschedule at real deadline
    if (now < deadline - 1000) {
      await this.state.storage.setAlarm(deadline)
      return
    }

    const player = room.players.find(p => p.id === playerId)
    if (!player) {
      room.turnState = undefined
      await this.saveRoom(room)
      return
    }

    // Determine whether the player was disconnected for this entire timeout window
    const isDisconnect = !player.isConnected
    player.consecutiveDisconnects = isDisconnect
      ? (player.consecutiveDisconnects ?? 0) + 1
      : 0

    const removePlayer = player.consecutiveDisconnects >= MAX_CONSECUTIVE_SKIPS

    // Find executor: prefer host (if connected), fall back to any connected human
    const executor =
      room.players.find(p => p.id === room.hostId && p.isConnected && p.id !== playerId) ??
      room.players.find(p => p.type === 'HUMAN' && p.isConnected && p.id !== playerId) ??
      null

    // Clear turn state — executor will set a new one via their GAME_ACTION reply
    room.turnState = undefined
    await this.saveRoom(room)

    this.broadcastAll({
      type: 'TURN_TIMEOUT',
      timedOutPlayerId: playerId,
      timedOutPlayerName: player.name,
      reason: isDisconnect ? 'disconnect' : 'idle',
      executorPlayerId: executor?.id ?? null,
      removePlayer,
    })

    if (removePlayer) {
      this.broadcastAll({ type: 'PLAYER_REMOVED', playerId: player.id, playerName: player.name })
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private async handleDisconnect(ws: WebSocket, room: RoomState): Promise<void> {
    const { playerId } = ws.deserializeAttachment() as WsAttachment
    const player = room.players.find((p) => p.id === playerId)
    if (!player) return

    player.isConnected = false
    player.disconnectedAt = Date.now()
    await this.saveRoom(room)

    // If this player's turn is active, the existing alarm will fire after the grace period.
    // We keep the alarm running (don't extend to GRACE_PERIOD_MS) because the idle/completion
    // deadlines already define how long any connected or disconnected player has.
    // The alarm handler checks isConnected at fire time and classifies it as a disconnect skip.

    // Notify remaining clients
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
