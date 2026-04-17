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

// ── Server → Client messages ─────────────────────────────────────────────────

export type ServerMessage =
  | { type: 'ROOM_STATE';    room: RoomState }
  | { type: 'PLAYER_JOINED'; player: RoomPlayer }
  | { type: 'PLAYER_LEFT';   playerId: string }
  | { type: 'GAME_STARTED';  room: RoomState }
  | { type: 'ERROR';         message: string }
