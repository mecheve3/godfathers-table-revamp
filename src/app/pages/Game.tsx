import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useMatch } from '../features/match/MatchContext'
import GameBoard, { type GameSyncPayload } from '../components/game/GameBoard'
import { useRoomSocket } from '../features/multiplayer/useRoomSocket'
import { useLang } from '../context/LanguageContext'
import type { TurnDeadlineInfo, TurnTimeoutSignal } from '../features/multiplayer/types'

export default function Game() {
  const navigate = useNavigate()
  const { config, clearConfig } = useMatch()
  const { t } = useLang()

  // Guard: if there is no game config and this is not a multiplayer reconnect, go back to menu.
  useEffect(() => {
    if (!config) navigate('/menu', { replace: true })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const slots = config?.slots ?? []
  const maxPlayers = (config?.settings?.maxPlayers ?? (slots.length > 0 ? slots.length : 3)) as 3 | 4 | 5 | 6
  const seating = config?.settings?.seating ?? 'automatic'
  const localPlayerIndex = config?.localPlayerIndex
  const isMultiplayer = localPlayerIndex !== undefined

  const TEAM_COLORS = ["Red", "Blue", "Yellow", "Green", "Orange", "Purple"]
  const playerNames = slots.length > 0
    ? slots.map((s, i) => s.name || `${TEAM_COLORS[i] ?? "Player"} Team`)
    : undefined

  const cpuPlayerIds = slots.length > 0
    ? slots.map((s, i) => s.kind === 'cpu' ? `player${i + 1}` : null).filter((id): id is string => id !== null)
    : undefined

  const gameMode = isMultiplayer
    ? 'multiplayer'
    : slots.some((s) => s.kind === 'cpu') ? 'solo' : 'solo'

  // ── Multiplayer state sync ─────────────────────────────────────────────────

  const [incomingSync, setIncomingSync] = useState<GameSyncPayload | undefined>(undefined)
  const [turnDeadline, setTurnDeadline] = useState<TurnDeadlineInfo | null>(null)
  const [turnTimeoutSignal, setTurnTimeoutSignal] = useState<TurnTimeoutSignal | null>(null)

  const handleGameState = useCallback((raw: unknown) => {
    setIncomingSync(raw as GameSyncPayload)
  }, [])

  const handleGameAbandoned = useCallback((playerName: string, reason: string) => {
    toast.error(t(reason === 'restart' ? 'game.abandoned.restart' : 'game.abandoned.left', { name: playerName }))
    clearConfig()
    navigate('/menu')
  }, [clearConfig, navigate])

  const handleTurnStarted = useCallback((info: TurnDeadlineInfo) => {
    setTurnDeadline(info)
  }, [])

  const handleTurnTimeout = useCallback((signal: TurnTimeoutSignal) => {
    setTurnDeadline(null)
    setTurnTimeoutSignal(signal)
    const skipMsg = signal.reason === 'disconnect'
      ? `${signal.timedOutPlayerName} disconnected — turn skipped`
      : `${signal.timedOutPlayerName} took too long — turn skipped`
    toast.warning(skipMsg, { duration: 3000 })
  }, [])

  const handlePlayerRemoved = useCallback((pid: string, playerName: string) => {
    toast.error(`${playerName} was removed after too many disconnections`, { duration: 5000 })
  }, [])

  const sendGameStateRef = useRef<((p: unknown) => void) | null>(null)
  const sendAbandonRef   = useRef<((r: 'restart' | 'quit', name: string) => void) | null>(null)
  const sendTurnActivityRef = useRef<(() => void) | null>(null)

  const handleTurnEnd = useCallback((payload: GameSyncPayload) => {
    sendGameStateRef.current?.(payload)
    setTurnDeadline(null)       // clear countdown once we broadcast our turn
    setTurnTimeoutSignal(null)  // clear any pending timeout signal
  }, [])

  const handleAbandon = useCallback((reason: 'restart' | 'quit', playerName: string) => {
    sendAbandonRef.current?.(reason, playerName)
  }, [])

  // Called by GameBoard when the local player first interacts with a card
  const handleTurnActivity = useCallback(() => {
    sendTurnActivityRef.current?.()
    // Update deadline locally so the countdown switches to 1:30 immediately
    setTurnDeadline(prev =>
      prev ? { ...prev, completionDeadline: Date.now() + 90_000 } : prev
    )
  }, [])

  const { sendGameState, sendAbandon, sendTurnActivity, status: socketStatus } = useRoomSocket(
    isMultiplayer
      ? {
          roomCode: config?.roomCode ?? '',
          playerId: config?.hostId ?? '',
          playerName: config?.playerName ?? 'Player',
          onGameState: handleGameState,
          onGameAbandoned: handleGameAbandoned,
          onTurnStarted: handleTurnStarted,
          onTurnTimeout: handleTurnTimeout,
          onPlayerRemoved: handlePlayerRemoved,
        }
      : { roomCode: '', playerId: '', playerName: '' }
  )

  sendGameStateRef.current    = isMultiplayer ? sendGameState    : null
  sendAbandonRef.current      = isMultiplayer ? sendAbandon      : null
  sendTurnActivityRef.current = isMultiplayer ? sendTurnActivity : null

  // ── Navigation ─────────────────────────────────────────────────────────────

  const handleReturnToHome = () => {
    clearConfig()
    navigate('/menu')
  }

  return (
    <GameBoard
      playerCount={maxPlayers}
      seatingType={seating}
      gameMode={gameMode}
      playerNames={playerNames}
      localPlayerIndex={localPlayerIndex}
      cpuPlayerIds={cpuPlayerIds}
      incomingSync={isMultiplayer ? incomingSync : undefined}
      onTurnEnd={isMultiplayer ? handleTurnEnd : undefined}
      onAbandon={isMultiplayer ? handleAbandon : undefined}
      socketStatus={isMultiplayer ? socketStatus : undefined}
      turnDeadline={isMultiplayer ? turnDeadline : null}
      turnTimeoutSignal={isMultiplayer ? turnTimeoutSignal : null}
      onTurnActivity={isMultiplayer ? handleTurnActivity : undefined}
      onReturnToHome={handleReturnToHome}
    />
  )
}
