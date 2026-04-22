import type { RoomState } from './types'

// In production (Cloudflare Pages) this is empty — all /api/* calls go to the
// Worker routed on the same domain. In local dev, set VITE_WORKER_URL=http://localhost:8787
// in .env so calls hit the locally-running worker instead.
const API_BASE = import.meta.env.VITE_WORKER_URL ?? ''

export interface CreateRoomParams {
  maxPlayers: number
  hostId: string
  hostName: string
  seating: 'automatic' | 'manual'
}

export interface CreateRoomResult {
  roomCode: string
  room: RoomState
}

/** POST /api/rooms — create a new room and return its code */
export async function createRoom(params: CreateRoomParams): Promise<CreateRoomResult> {
  const res = await fetch(`${API_BASE}/api/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

  if (!res.ok) {
    const err = await res.json() as { error: string }
    throw new Error(err.error ?? 'Failed to create room')
  }

  return res.json() as Promise<CreateRoomResult>
}

/** GET /api/rooms/:code — verify a room exists and return its state */
export async function fetchRoom(roomCode: string): Promise<RoomState> {
  const res = await fetch(`${API_BASE}/api/rooms/${roomCode.toUpperCase()}`)

  if (!res.ok) {
    if (res.status === 404) throw new Error('Room not found')
    const err = await res.json() as { error: string }
    throw new Error(err.error ?? 'Failed to fetch room')
  }

  return res.json() as Promise<RoomState>
}

/** Build the WebSocket URL for a room.
 *  - Dev (VITE_WORKER_URL set): converts http://localhost:8787 → ws://localhost:8787
 *  - Prod (no env var): derives wss:// from the current page host so the WS
 *    upgrade hits the same Worker that's routed to /api/* on the domain.
 */
export function buildWsUrl(roomCode: string, playerId: string, playerName: string): string {
  let wsBase: string
  if (API_BASE) {
    wsBase = API_BASE.replace(/^http/, 'ws')
  } else {
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
    wsBase = `${proto}://${window.location.host}`
  }
  const params = new URLSearchParams({ playerId, name: playerName })
  return `${wsBase}/api/rooms/${roomCode.toUpperCase()}/ws?${params}`
}
