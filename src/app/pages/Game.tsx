import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useMatch } from '../features/match/MatchContext'
import GameBoard, { type GameSyncPayload } from '../components/game/GameBoard'
import { useRoomSocket } from '../features/multiplayer/useRoomSocket'
import { useLang } from '../context/LanguageContext'

export default function Game() {
  const navigate = useNavigate()
  const { config, clearConfig } = useMatch()
  const { t } = useLang()

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
    : slots.some((s) => s.kind === 'cpu') ? 'solo' : 'hotseat'

  // ── Multiplayer state sync ─────────────────────────────────────────────────

  const [incomingSync, setIncomingSync] = useState<GameSyncPayload | undefined>(undefined)

  const handleGameState = useCallback((raw: unknown) => {
    setIncomingSync(raw as GameSyncPayload)
  }, [])

  const handleGameAbandoned = useCallback((playerName: string, reason: string) => {
    toast.error(t(reason === 'restart' ? 'game.abandoned.restart' : 'game.abandoned.left', { name: playerName }))
    clearConfig()
    navigate('/menu')
  }, [clearConfig, navigate])

  const sendGameStateRef = useRef<((p: unknown) => void) | null>(null)
  const sendAbandonRef = useRef<((r: 'restart' | 'quit', name: string) => void) | null>(null)

  const handleTurnEnd = useCallback((payload: GameSyncPayload) => {
    sendGameStateRef.current?.(payload)
  }, [])

  const handleAbandon = useCallback((reason: 'restart' | 'quit', playerName: string) => {
    sendAbandonRef.current?.(reason, playerName)
  }, [])

  const { sendGameState, sendAbandon, status: socketStatus } = useRoomSocket(
    isMultiplayer
      ? {
          roomCode: config?.roomCode ?? '',
          playerId: config?.hostId ?? '',
          playerName: config?.playerName ?? 'Player',
          onGameState: handleGameState,
          onGameAbandoned: handleGameAbandoned,
        }
      : { roomCode: '', playerId: '', playerName: '' }
  )

  sendGameStateRef.current = isMultiplayer ? sendGameState : null
  sendAbandonRef.current = isMultiplayer ? sendAbandon : null

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
      onReturnToHome={handleReturnToHome}
    />
  )
}
