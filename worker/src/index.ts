import { GameRoom } from './room'

export { GameRoom }

export interface Env {
  GAME_ROOM: DurableObjectNamespace
}

// ── Room code helpers ──────────────────────────────────────────────────────

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no ambiguous chars
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

function getRoomStub(env: Env, roomCode: string): DurableObjectStub {
  const id = env.GAME_ROOM.idFromName(roomCode)
  return env.GAME_ROOM.get(id)
}

// ── CORS helpers ───────────────────────────────────────────────────────────

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function cors(response: Response): Response {
  const r = new Response(response.body, response)
  for (const [k, v] of Object.entries(CORS_HEADERS)) r.headers.set(k, v)
  return r
}

function json(data: unknown, status = 200): Response {
  return cors(
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  )
}

// ── Main Worker ────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    // Preflight
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })

    // POST /api/rooms  — create a new room
    if (request.method === 'POST' && url.pathname === '/api/rooms') {
      const body = await request.json<{ maxPlayers: number; hostId: string; hostName: string; seating?: 'automatic' | 'manual' }>()

      if (!body.hostId || !body.hostName) {
        return json({ error: 'hostId and hostName are required' }, 400)
      }
      if (!body.maxPlayers || body.maxPlayers < 3 || body.maxPlayers > 6) {
        return json({ error: 'maxPlayers must be 3–6' }, 400)
      }

      const roomCode = generateRoomCode()
      const stub = getRoomStub(env, roomCode)
      const innerUrl = new URL(`https://do/create`)

      const res = await stub.fetch(innerUrl.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, ...body }),
      })

      if (!res.ok) {
        const err = await res.json<{ error: string }>()
        return json(err, res.status)
      }

      const data = await res.json<Record<string, unknown>>()
      return json({ roomCode, ...data })
    }

    // GET /api/rooms/:code  — fetch room state
    const stateMatch = url.pathname.match(/^\/api\/rooms\/([A-Z0-9]{4,8})$/)
    if (request.method === 'GET' && stateMatch) {
      const roomCode = stateMatch[1]
      const stub = getRoomStub(env, roomCode)
      const res = await stub.fetch('https://do/state')
      const data = await res.json()
      return json(data, res.status)
    }

    // GET /api/rooms/:code/ws  — WebSocket upgrade proxy
    const wsMatch = url.pathname.match(/^\/api\/rooms\/([A-Z0-9]{4,8})\/ws$/)
    if (wsMatch) {
      const roomCode = wsMatch[1]
      const stub = getRoomStub(env, roomCode)

      // Forward the WebSocket upgrade to the Durable Object
      const playerId = url.searchParams.get('playerId') ?? ''
      const name = url.searchParams.get('name') ?? 'Unknown'
      const doUrl = `https://do/websocket?playerId=${encodeURIComponent(playerId)}&name=${encodeURIComponent(name)}`

      return stub.fetch(doUrl, request)
    }

    return json({ error: 'Not found' }, 404)
  },
}
