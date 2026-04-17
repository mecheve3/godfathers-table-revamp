// ── Shared types between Worker and Client ──────────────────────────────────

export type RoomStatus = 'LOBBY' | 'IN_GAME' | 'FINISHED'
export type PlayerType = 'HUMAN' | 'CPU'

export interface RoomPlayer {
  id: string
  name: string
  type: PlayerType
  isHost: boolean
  isConnected: boolean
}

export interface RoomState {
  roomCode: string
  hostId: string
  status: RoomStatus
  maxPlayers: number
  players: RoomPlayer[]
}

// ── Client → Server messages ─────────────────────────────────────────────────

export type ClientMessage =
  | { type: 'JOIN_ROOM'; playerId: string; name: string }
  | { type: 'START_GAME' }
  | { type: 'LEAVE_ROOM' }
  /** Current player broadcasts their new game state after each turn */
  | { type: 'GAME_ACTION'; gameState: unknown; currentPlayerIndex: number }

// ── Server → Client messages ─────────────────────────────────────────────────

export type ServerMessage =
  | { type: 'ROOM_STATE';    room: RoomState }
  | { type: 'PLAYER_JOINED'; player: RoomPlayer }
  | { type: 'PLAYER_LEFT';   playerId: string }
  | { type: 'GAME_STARTED';  room: RoomState }
  /** Latest game state pushed to all clients (including the sender, for reconnects) */
  | { type: 'GAME_STATE';    gameState: unknown; currentPlayerIndex: number }
  | { type: 'ERROR';         message: string }
