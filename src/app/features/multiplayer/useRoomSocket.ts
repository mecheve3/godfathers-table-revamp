import { useEffect, useRef, useCallback, useState } from 'react'
import { buildWsUrl } from './api'
import type { ClientMessage, RoomState, ServerMessage, SocketStatus } from './types'

export interface UseRoomSocketOptions {
  roomCode: string
  playerId: string
  playerName: string
  onRoomState?: (room: RoomState) => void
  onGameStarted?: (room: RoomState) => void
  onError?: (message: string) => void
}

export interface UseRoomSocketResult {
  status: SocketStatus
  send: (msg: ClientMessage) => void
  disconnect: () => void
}

export function useRoomSocket({
  roomCode,
  playerId,
  playerName,
  onRoomState,
  onGameStarted,
  onError,
}: UseRoomSocketOptions): UseRoomSocketResult {
  const [status, setStatus] = useState<SocketStatus>('idle')
  const wsRef = useRef<WebSocket | null>(null)
  const intentionalClose = useRef(false)

  useEffect(() => {
    if (!roomCode || !playerId) return

    intentionalClose.current = false
    setStatus('connecting')

    const url = buildWsUrl(roomCode, playerId, playerName)
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => setStatus('open')

    ws.onmessage = (event) => {
      let msg: ServerMessage
      try {
        msg = JSON.parse(event.data)
      } catch {
        return
      }

      switch (msg.type) {
        case 'ROOM_STATE':
          onRoomState?.(msg.room)
          break
        case 'PLAYER_JOINED':
          // Room state will follow — handled by ROOM_STATE
          break
        case 'PLAYER_LEFT':
          // Room state will follow — handled by ROOM_STATE
          break
        case 'GAME_STARTED':
          onGameStarted?.(msg.room)
          break
        case 'ERROR':
          onError?.(msg.message)
          break
      }
    }

    ws.onclose = () => {
      setStatus(intentionalClose.current ? 'closed' : 'error')
      wsRef.current = null
    }

    ws.onerror = () => {
      setStatus('error')
      onError?.('Connection error — check your network')
    }

    return () => {
      intentionalClose.current = true
      ws.close(1000, 'Component unmount')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode, playerId, playerName])

  const send = useCallback((msg: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg))
    }
  }, [])

  const disconnect = useCallback(() => {
    intentionalClose.current = true
    wsRef.current?.close(1000, 'User left')
  }, [])

  return { status, send, disconnect }
}
