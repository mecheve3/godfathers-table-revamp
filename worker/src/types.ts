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
  /** Current player broadcasts full sync payload (game state + seating state) after each turn */
  | { type: 'GAME_ACTION'; payload: unknown }
  /** Host signals they are abandoning the current game */
  | { type: 'ABANDON_GAME'; reason: 'restart' | 'quit'; playerName: string }

// ── Server → Client messages ─────────────────────────────────────────────────

export type ServerMessage =
  | { type: 'ROOM_STATE';    room: RoomState }
  | { type: 'PLAYER_JOINED'; player: RoomPlayer }
  | { type: 'PLAYER_LEFT';   playerId: string }
  | { type: 'GAME_STARTED';  room: RoomState }
  /** Latest sync payload pushed to all clients */
  | { type: 'GAME_STATE';    payload: unknown }
  /** Another player abandoned the game */
  | { type: 'GAME_ABANDONED'; playerName: string; reason: 'restart' | 'quit' }
  | { type: 'ERROR';         message: string }
