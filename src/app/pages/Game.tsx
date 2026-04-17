import { useNavigate } from 'react-router'
import { useMatch } from '../features/match/MatchContext'
import GameBoard from '../components/game/GameBoard'

export default function Game() {
  const navigate = useNavigate()
  const { config, clearConfig } = useMatch()

  const maxPlayers = (config?.settings?.maxPlayers ?? 3) as 3 | 4 | 5 | 6
  const seating = config?.settings?.seating ?? 'automatic'
  const slots = config?.slots ?? []

  const TEAM_COLORS = ["Red", "Blue", "Yellow", "Green", "Orange", "Purple"]
  // Build player names from lobby slots; fall back to team color names
  const playerNames = slots.length > 0
    ? slots.map((s, i) => s.name || `${TEAM_COLORS[i] ?? "Player"} Team`)
    : undefined

  const handleReturnToHome = () => {
    clearConfig()
    navigate('/menu')
  }

  return (
    <GameBoard
      playerCount={maxPlayers}
      seatingType={seating}
      gameMode={slots.some((s) => s.kind === 'cpu') ? 'solo' : 'hotseat'}
      playerNames={playerNames}
      onReturnToHome={handleReturnToHome}
    />
  )
}
