import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useMatch } from '../features/match/MatchContext'
import GameBoard from '../components/game/GameBoard'
import { useRoomSocket } from '../features/multiplayer/useRoomSocket'
import type { GameState } from '../features/game/types'

export default function Game() {
  const navigate = useNavigate()
  const { config, clearConfig } = useMatch()

  const slots = config?.slots ?? []
  const maxPlayers = (config?.settings?.maxPlayers ?? (slots.length > 0 ? slots.length : 3)) as 3 | 4 | 5 | 6
  const seating = config?.settings?.seating ?? 'automatic'
  const localPlayerIndex = config?.localPlayerIndex
  const isMultiplayer = localPlayerIndex !== undefined

  const TEAM_COLORS = ["Red", "Blue", "Yellow", "Green", "Orange", "Purple"]
  const playerNames = slots.length > 0
    ? slots.map((s, i) => s.name || `${TEAM_COLORS[i] ?? "Player"} Team`)
    : undefined

  // CPU player IDs — only these trigger bot AI
  const cpuPlayerIds = slots.length > 0
    ? slots.map((s, i) => s.kind === 'cpu' ? `player${i + 1}` : null).filter((id): id is string => id !== null)
    : undefined

  const gameMode = isMultiplayer
    ? 'multiplayer'
    : slots.some((s) => s.kind === 'cpu') ? 'solo' : 'hotseat'

  // ── Multiplayer state sync ─────────────────────────────────────────────────

  // Incoming state from the server — applied by GameBoard when it changes
  const [incomingState, setIncomingState] = useState<
    { gameState: GameState; currentPlayerIndex: number } | undefined
  >(undefined)

  const handleGameState = useCallback((rawState: unknown, currentPlayerIndex: number) => {
    setIncomingState({ gameState: rawState as GameState, currentPlayerIndex })
  }, [])

  // sendGameStateRef gives GameBoard stable access to sendGameState before socket opens
  const sendGameStateRef = useRef<((gs: unknown, idx: number) => void) | null>(null)

  const handleTurnEnd = useCallback((gameState: GameState, currentPlayerIndex: number) => {
    sendGameStateRef.current?.(gameState, currentPlayerIndex)
  }, [])

  const { sendGameState } = useRoomSocket(
    isMultiplayer
      ? {
          roomCode: config?.roomCode ?? '',
          playerId: config?.hostId ?? '',
          playerName: config?.playerName ?? 'Player',
          onGameState: handleGameState,
        }
      : {
          // Provide dummy values — hook won't connect without a valid roomCode
          roomCode: '',
          playerId: '',
          playerName: '',
        }
  )

  // Keep the ref in sync with the live sendGameState function
  sendGameStateRef.current = isMultiplayer ? sendGameState : null

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
      incomingState={isMultiplayer ? incomingState : undefined}
      onTurnEnd={isMultiplayer ? handleTurnEnd : undefined}
      onReturnToHome={handleReturnToHome}
    />
  )
}
