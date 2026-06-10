// ── Shared types between Worker and Client ──────────────────────────────────

export type RoomStatus = 'LOBBY' | 'IN_GAME' | 'FINISHED'
export type PlayerType = 'HUMAN' | 'CPU'

export interface RoomPlayer {
  id: string
  name: string
  type: PlayerType
  isHost: boolean
  isConnected: boolean
  /** Epoch ms — set on WebSocket close, cleared on reconnect */
  disconnectedAt?: number
  /** Number of turns auto-skipped while this player was disconnected, in a row */
  consecutiveDisconnects: number
}

/** Server-side turn timer state — one active turn at a time */
export interface TurnState {
  playerId: string
  /** Epoch ms — the idle deadline (30 s from turn start) */
  idleDeadline: number
  /** Epoch ms — the completion deadline (90 s from first TURN_ACTIVITY); replaces idleDeadline */
  completionDeadline?: number
}

export interface RoomState {
  roomCode: string
  hostId: string
  status: RoomStatus
  maxPlayers: number
  seating: 'automatic' | 'manual'
  players: RoomPlayer[]
  /** Active only during IN_GAME; undefined when no human turn is in progress */
  turnState?: TurnState
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
  /** Active player signals they began interacting — extends idle (30 s) to completion (90 s) */
  | { type: 'TURN_ACTIVITY' }

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
  /** A human player's turn started; clients should show / resume countdown */
  | { type: 'TURN_STARTED'; playerId: string; idleDeadline: number; completionDeadline?: number }
  /** Turn was auto-skipped (idle or disconnect); executorPlayerId should apply the skip */
  | { type: 'TURN_TIMEOUT'; timedOutPlayerId: string; timedOutPlayerName: string; reason: 'idle' | 'disconnect'; executorPlayerId: string | null; removePlayer: boolean }
  /** Player removed after 3 consecutive disconnected auto-skips */
  | { type: 'PLAYER_REMOVED'; playerId: string; playerName: string }
  | { type: 'ERROR';         message: string }
