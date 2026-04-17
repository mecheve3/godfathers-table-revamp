import type { Player, Gangster, ActionType, GameState, Card, GamePhase, CakeBomb, LogEntry } from "../../features/game/types"
import PlayerDashboard from "./PlayerDashboard"
import GameLog from "./GameLog"

interface ActionPanelProps {
  currentPlayer: Player
  selectedGangster: Gangster | null
  selectedGangsterIndex: number | null
  selectedCard: Card | null
  selectedCardId: string | null
  selectedAction: ActionType | null
  selectedDirection?: "left" | "right" | null
  targetPositionId: number | null
  selectedCake: CakeBomb | null
  gamePhase: GamePhase
  onSelectCard: (cardId: string) => void
  onSelectGangster: (gangsterIndex: number) => void
  onSelectTarget: (targetId: number) => void
  onSelectDirection: (direction: "left" | "right") => void
  onConfirmAction: () => void
  onCancelAction: () => void
  onSkipSecondDisplacement: () => void
  onEndTurn: () => void
  onSelectDiscardCard: () => void
  gameOver: boolean
  validGangsters: number[]
  validTargets: number[]
  validDirections: ("left" | "right")[]
  canPlaySecondDisplacement: boolean
  onRestartGame: () => void
  gameState: GameState
  finalStandings: Array<{ player: string; money: number; rank: number; aliveGangsters?: number }>
  playerCount: number
  secondActionTaken: boolean
  seatingQueue?: Record<string, string[]>
  seatingCurrentPlayerId?: string
  seatingSelectedGangsterId?: string | null
  onSeatingGangsterSelect?: (gangsterId: string) => void
  logEntries?: LogEntry[]
}

const getPlayerColor = (playerId: string) => {
  switch (playerId) {
    case "player1": return "border-red-500 bg-red-900/20"
    case "player2": return "border-blue-500 bg-blue-900/20"
    case "player3": return "border-yellow-500 bg-yellow-900/20"
    case "player4": return "border-green-500 bg-green-900/20"
    case "player5": return "border-orange-500 bg-orange-900/20"
    case "player6": return "border-purple-500 bg-purple-900/20"
    default: return "border-gray-500"
  }
}

export default function ActionPanel({
  currentPlayer,
  gameOver,
  gameState,
  finalStandings,
  playerCount,
  seatingQueue,
  seatingCurrentPlayerId,
  seatingSelectedGangsterId,
  onSeatingGangsterSelect,
  logEntries = [],
}: ActionPanelProps) {
  const playerColor = getPlayerColor(currentPlayer.id)
  const currentPlayerIndex = gameState.players.findIndex((p) => p.id === currentPlayer.id)

  return (
    <div className={`border-2 ${playerColor} h-full flex flex-col bg-gradient-to-b from-[#3D2314] to-[#2B1710] overflow-hidden`}>

      {/* Dashboards — scroll internally when there are many players */}
      <div className="flex-1 min-h-0 overflow-y-auto game-log-scroll pt-4 pb-2 px-4 space-y-2 text-[#F5AC0E]">
        <div className="space-y-3">
          {gameState.players.slice(0, playerCount).map((player, index) => (
            <PlayerDashboard
              key={player.id}
              player={player}
              isCurrentPlayer={index === currentPlayerIndex}
              isSeatingPlayer={player.id === seatingCurrentPlayerId}
              seatingGangsterIds={seatingQueue?.[player.id] ?? []}
              selectedSeatingGangsterId={player.id === seatingCurrentPlayerId ? seatingSelectedGangsterId : null}
              onSeatingGangsterSelect={player.id === seatingCurrentPlayerId ? onSeatingGangsterSelect : undefined}
            />
          ))}
        </div>
      </div>

      {/* Bank — always pinned, never scrolls away */}
      <div className="flex-shrink-0 px-4 py-2 border-t border-zinc-700 flex justify-between items-center">
        <span className="font-semibold text-[#F5AC0E] text-sm">Bank</span>
        <span className="text-[#F5AC0E] font-bold">${gameState.bankMoney.toLocaleString()}</span>
      </div>

      {/* Game log — fixed height at the bottom */}
      <div className="flex-shrink-0 border-t border-zinc-700 flex flex-col overflow-hidden" style={{ height: "32%" }}>
        <div className="flex-shrink-0 px-3 py-1 flex items-center gap-1.5">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Game Log</span>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto game-log-scroll px-1 pb-2">
          <GameLog entries={logEntries} currentRound={gameState.turn} />
        </div>
      </div>
    </div>
  )
}
