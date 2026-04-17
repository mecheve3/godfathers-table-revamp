import { useNavigate } from 'react-router'
import { useMatch } from '../features/match/MatchContext'
import GameBoard from '../components/game/GameBoard'

export default function Game() {
  const navigate = useNavigate()
  const { config, clearConfig } = useMatch()

  const slots = config?.slots ?? []
  const maxPlayers = (config?.settings?.maxPlayers ?? (slots.length > 0 ? slots.length : 3)) as 3 | 4 | 5 | 6
  const seating = config?.settings?.seating ?? 'automatic'
  const localPlayerIndex = config?.localPlayerIndex

  const TEAM_COLORS = ["Red", "Blue", "Yellow", "Green", "Orange", "Purple"]
  const playerNames = slots.length > 0
    ? slots.map((s, i) => s.name || `${TEAM_COLORS[i] ?? "Player"} Team`)
    : undefined

  // CPU player IDs derived from slots — these are the only players bot AI should run for
  const cpuPlayerIds = slots.length > 0
    ? slots.map((s, i) => s.kind === 'cpu' ? `player${i + 1}` : null).filter((id): id is string => id !== null)
    : undefined

  // gameMode: 'multiplayer' when localPlayerIndex is set (real network game),
  //           'solo' when there are CPUs but no local index (hotseat+bots),
  //           'hotseat' otherwise
  const gameMode = localPlayerIndex !== undefined
    ? 'multiplayer'
    : slots.some((s) => s.kind === 'cpu') ? 'solo' : 'hotseat'

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
      onReturnToHome={handleReturnToHome}
    />
  )
}
