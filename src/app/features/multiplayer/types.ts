// ── Re-export shared types (mirrored from worker/src/types.ts) ───────────────
// Keep in sync with worker/src/types.ts

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
  seating: 'automatic' | 'manual'
  players: RoomPlayer[]
}

// ── WebSocket message types ──────────────────────────────────────────────────

export type ClientMessage =
  | { type: 'START_GAME' }
  | { type: 'LEAVE_ROOM' }
  | { type: 'GAME_ACTION'; payload: unknown }
  | { type: 'ABANDON_GAME'; reason: 'restart' | 'quit'; playerName: string }

export type ServerMessage =
  | { type: 'ROOM_STATE';      room: RoomState }
  | { type: 'PLAYER_JOINED';   player: RoomPlayer }
  | { type: 'PLAYER_LEFT';     playerId: string }
  | { type: 'GAME_STARTED';    room: RoomState }
  | { type: 'GAME_STATE';      payload: unknown }
  | { type: 'GAME_ABANDONED';  playerName: string; reason: 'restart' | 'quit' }
  | { type: 'ERROR';           message: string }

// ── Connection status ────────────────────────────────────────────────────────

export type SocketStatus = 'idle' | 'connecting' | 'open' | 'closed' | 'error'
