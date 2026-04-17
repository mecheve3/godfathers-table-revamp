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
      {/* Top section: standings (game over) OR player dashboards + bank — scrollable if overflow */}
      <div className="flex-shrink-0 max-h-[58%] overflow-y-auto game-log-scroll text-[#F5AC0E]">
        {gameOver ? (
          <div className="p-4">
            <div className="p-4 bg-zinc-700 rounded-md text-center">
              <h3 className="font-bold text-xl mb-2">Game Over!</h3>
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Final Standings</h4>
                <div className="space-y-2 mt-2">
                  {finalStandings.map((standing, index) => (
                    <div key={index} className={`p-2 rounded-md ${index === 0 ? "bg-yellow-900/30 border border-yellow-500" : "bg-zinc-800"}`}>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{standing.rank}. {standing.player}</span>
                        <span className="text-green-400 font-bold">${standing.money.toLocaleString()}</span>
                      </div>
                      {standing.aliveGangsters !== undefined && (
                        <div className="text-xs text-gray-400 mt-1 text-left">Gangsters remaining: {standing.aliveGangsters}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-2">
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

            <div className="pt-3 border-t border-zinc-700">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-[#F5AC0E]">Bank:</span>
                <span className="text-[#F5AC0E] font-bold">${gameState.bankMoney.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Game log — always gets the remaining height */}
      {!gameOver && (
        <div className="flex flex-col flex-1 min-h-0 border-t border-zinc-700 overflow-hidden">
          <div className="flex-shrink-0 px-3 py-1.5 flex items-center gap-1.5">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Game Log</span>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto game-log-scroll px-1 pb-2">
            <GameLog entries={logEntries} currentRound={gameState.turn} />
          </div>
        </div>
      )}
    </div>
  )
}
