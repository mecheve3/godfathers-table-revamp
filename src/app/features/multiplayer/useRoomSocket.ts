import { useEffect, useRef, useCallback, useState } from 'react'
import { buildWsUrl } from './api'
import type { ClientMessage, RoomState, ServerMessage, SocketStatus } from './types'

export interface UseRoomSocketOptions {
  roomCode: string
  playerId: string
  playerName: string
  onRoomState?: (room: RoomState) => void
  onGameStarted?: (room: RoomState) => void
  onGameState?: (payload: unknown) => void
  onGameAbandoned?: (playerName: string, reason: string) => void
  onError?: (message: string) => void
}

export interface UseRoomSocketResult {
  status: SocketStatus
  send: (msg: ClientMessage) => void
  sendGameState: (payload: unknown) => void
  sendAbandon: (reason: 'restart' | 'quit', playerName: string) => void
  disconnect: () => void
}

export function useRoomSocket({
  roomCode,
  playerId,
  playerName,
  onRoomState,
  onGameStarted,
  onGameState,
  onGameAbandoned,
  onError,
}: UseRoomSocketOptions): UseRoomSocketResult {
  const [status, setStatus] = useState<SocketStatus>('idle')
  const wsRef = useRef<WebSocket | null>(null)
  const intentionalClose = useRef(false)

  const onGameStateRef = useRef(onGameState)
  const onGameAbandonedRef = useRef(onGameAbandoned)
  useEffect(() => { onGameStateRef.current = onGameState }, [onGameState])
  useEffect(() => { onGameAbandonedRef.current = onGameAbandoned }, [onGameAbandoned])

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
        case 'GAME_STARTED':
          onGameStarted?.(msg.room)
          break
        case 'GAME_STATE':
          onGameStateRef.current?.(msg.payload)
          break
        case 'GAME_ABANDONED':
          onGameAbandonedRef.current?.(msg.playerName, msg.reason)
          break
        case 'ERROR':
          onError?.(msg.message)
          break
      }
    }

    ws.onclose = (event) => {
      if (intentionalClose.current) {
        setStatus('closed')
      } else {
        setStatus('error')
        const reason = event.reason || (event.code === 1008 ? 'Rejected by server' : 'Disconnected unexpectedly')
        onError?.(reason)
      }
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

  const sendGameState = useCallback((payload: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'GAME_ACTION', payload }))
    }
  }, [])

  const sendAbandon = useCallback((reason: 'restart' | 'quit', pName: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'ABANDON_GAME', reason, playerName: pName }))
    }
  }, [])

  const disconnect = useCallback(() => {
    intentionalClose.current = true
    wsRef.current?.close(1000, 'User left')
  }, [])

  return { status, send, sendGameState, sendAbandon, disconnect }
}
