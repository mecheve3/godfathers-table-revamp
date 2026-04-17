import type { RoomState } from './types'

const BASE_URL = import.meta.env.VITE_WORKER_URL ?? 'http://localhost:8787'

export interface CreateRoomParams {
  maxPlayers: number
  hostId: string
  hostName: string
}

export interface CreateRoomResult {
  roomCode: string
  room: RoomState
}

/** POST /api/rooms — create a new room and return its code */
export async function createRoom(params: CreateRoomParams): Promise<CreateRoomResult> {
  const res = await fetch(`${BASE_URL}/api/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

  if (!res.ok) {
    const err = await res.json<{ error: string }>()
    throw new Error(err.error ?? 'Failed to create room')
  }

  return res.json()
}

/** GET /api/rooms/:code — verify a room exists and return its state */
export async function fetchRoom(roomCode: string): Promise<RoomState> {
  const res = await fetch(`${BASE_URL}/api/rooms/${roomCode.toUpperCase()}`)

  if (!res.ok) {
    if (res.status === 404) throw new Error('Room not found')
    const err = await res.json<{ error: string }>()
    throw new Error(err.error ?? 'Failed to fetch room')
  }

  return res.json()
}

/** Build the WebSocket URL for a room */
export function buildWsUrl(roomCode: string, playerId: string, playerName: string): string {
  const base = BASE_URL.replace(/^http/, 'ws')
  const params = new URLSearchParams({ playerId, name: playerName })
  return `${base}/api/rooms/${roomCode.toUpperCase()}/ws?${params}`
}
