import { useEffect, useRef, useCallback, useState } from 'react'
import { buildWsUrl } from './api'
import type { ClientMessage, RoomState, ServerMessage, SocketStatus, TurnDeadlineInfo, TurnTimeoutSignal } from './types'

export interface UseRoomSocketOptions {
  roomCode: string
  playerId: string
  playerName: string
  onRoomState?: (room: RoomState) => void
  onGameStarted?: (room: RoomState) => void
  onGameState?: (payload: unknown) => void
  onGameAbandoned?: (playerName: string, reason: string) => void
  onTurnStarted?: (info: TurnDeadlineInfo) => void
  onTurnTimeout?: (signal: TurnTimeoutSignal) => void
  onPlayerRemoved?: (playerId: string, playerName: string) => void
  onError?: (message: string) => void
}

export interface UseRoomSocketResult {
  status: SocketStatus
  send: (msg: ClientMessage) => void
  sendGameState: (payload: unknown) => void
  sendAbandon: (reason: 'restart' | 'quit', playerName: string) => void
  sendTurnActivity: () => void
  disconnect: () => void
}

const RECONNECT_DELAYS = [1000, 2000, 4000]  // ms — 3 attempts with backoff

export function useRoomSocket({
  roomCode,
  playerId,
  playerName,
  onRoomState,
  onGameStarted,
  onGameState,
  onGameAbandoned,
  onTurnStarted,
  onTurnTimeout,
  onPlayerRemoved,
  onError,
}: UseRoomSocketOptions): UseRoomSocketResult {
  const [status, setStatus] = useState<SocketStatus>('idle')
  const wsRef = useRef<WebSocket | null>(null)
  const intentionalClose = useRef(false)
  const reconnectAttempt = useRef(0)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Stable refs for callbacks so the WebSocket handlers always call the latest version
  const onGameStateRef      = useRef(onGameState)
  const onGameAbandonedRef  = useRef(onGameAbandoned)
  const onTurnStartedRef    = useRef(onTurnStarted)
  const onTurnTimeoutRef    = useRef(onTurnTimeout)
  const onPlayerRemovedRef  = useRef(onPlayerRemoved)
  useEffect(() => { onGameStateRef.current     = onGameState     }, [onGameState])
  useEffect(() => { onGameAbandonedRef.current = onGameAbandoned }, [onGameAbandoned])
  useEffect(() => { onTurnStartedRef.current   = onTurnStarted   }, [onTurnStarted])
  useEffect(() => { onTurnTimeoutRef.current   = onTurnTimeout   }, [onTurnTimeout])
  useEffect(() => { onPlayerRemovedRef.current = onPlayerRemoved }, [onPlayerRemoved])

  // Shared setup for a WebSocket instance — called both on initial mount and reconnect
  const connect = useCallback(() => {
    if (!roomCode || !playerId) return

    const url = buildWsUrl(roomCode, playerId, playerName)
    const ws = new WebSocket(url)
    wsRef.current = ws
    setStatus('connecting')

    ws.onopen = () => {
      reconnectAttempt.current = 0  // reset on successful connection
      setStatus('open')
    }

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
        case 'TURN_STARTED':
          onTurnStartedRef.current?.({ playerId: msg.playerId, idleDeadline: msg.idleDeadline, completionDeadline: msg.completionDeadline })
          break
        case 'TURN_TIMEOUT':
          onTurnTimeoutRef.current?.({
            timedOutPlayerId: msg.timedOutPlayerId,
            timedOutPlayerName: msg.timedOutPlayerName,
            reason: msg.reason,
            executorPlayerId: msg.executorPlayerId,
            removePlayer: msg.removePlayer,
          })
          break
        case 'PLAYER_REMOVED':
          onPlayerRemovedRef.current?.(msg.playerId, msg.playerName)
          break
        case 'ERROR':
          onError?.(msg.message)
          break
      }
    }

    ws.onclose = (event) => {
      wsRef.current = null

      if (intentionalClose.current) {
        setStatus('closed')
        return
      }

      // Unexpected close — attempt reconnect with backoff
      const attempt = reconnectAttempt.current
      if (attempt < RECONNECT_DELAYS.length) {
        reconnectAttempt.current = attempt + 1
        setStatus('connecting')
        reconnectTimer.current = setTimeout(() => {
          if (!intentionalClose.current) connect()
        }, RECONNECT_DELAYS[attempt])
      } else {
        setStatus('error')
        const reason = event.reason || (event.code === 1008 ? 'Rejected by server' : 'Connection lost')
        onError?.(reason)
      }
    }

    ws.onerror = () => {
      // onclose fires right after onerror — let it handle reconnect/error state
      setStatus('connecting')
    }
  // Intentionally stable — roomCode/playerId/playerName are connection-identity fields
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode, playerId, playerName])

  useEffect(() => {
    if (!roomCode || !playerId) return

    intentionalClose.current = false
    reconnectAttempt.current = 0
    connect()

    return () => {
      intentionalClose.current = true
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      wsRef.current?.close(1000, 'Component unmount')
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

  const sendTurnActivity = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'TURN_ACTIVITY' }))
    }
  }, [])

  const disconnect = useCallback(() => {
    intentionalClose.current = true
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
    wsRef.current?.close(1000, 'User left')
  }, [])

  return { status, send, sendGameState, sendAbandon, sendTurnActivity, disconnect }
}
