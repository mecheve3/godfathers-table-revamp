import type { Player, Position, GangsterType } from "../../features/game/types"
import { calculatePaymentBreakdown } from "../../features/game/game-logic"
import { STATIC_ITEM_ICON } from "./BoardPosition"

interface PlayerDashboardProps {
  player: Player
  board: Position[]
  /** This player's current live standing (1 = leading) — see computeStandings in game-logic.ts */
  rank: number
  isCurrentPlayer: boolean
  isSeatingPlayer?: boolean
  seatingGangsterIds?: string[]
  selectedSeatingGangsterId?: string | null
  onSeatingGangsterSelect?: (gangsterId: string) => void
}

const BUSINESS_TYPES = ["BAR", "GAMBLING_HOUSE", "STRIP_CLUB"] as const

const getGangsterImage = (playerId: string, type: GangsterType) => {
  const teamMap: Record<string, string> = {
    player1: "red", player2: "blue", player3: "yellow",
    player4: "green", player5: "orange", player6: "purple",
  }
  const typeMap: Record<GangsterType, string> = {
    GODFATHER: "godfather", GUNMAN: "gunman",
    BLADESLINGER: "bladeslinger", THUG: "thug",
  }
  return `/images/players/${teamMap[playerId]}/${typeMap[type]}.png`
}

export default function PlayerDashboard({
  player,
  board,
  rank,
  isCurrentPlayer,
  isSeatingPlayer = false,
  seatingGangsterIds = [],
  selectedSeatingGangsterId = null,
  onSeatingGangsterSelect,
}: PlayerDashboardProps) {
  const aliveGangsters = player.gangsters.filter((g) => g.position !== null).length
  const isSeatingMode = seatingGangsterIds.length > 0 || isSeatingPlayer
  const isEliminated = player.gangsters.length > 0 && aliveGangsters === 0 && !isSeatingMode
  const { businessCounts } = calculatePaymentBreakdown(player, board)

  return (
    <div className={`border-2 rounded-lg p-3 ${isCurrentPlayer ? "ring-2 ring-white" : ""}
      ${isEliminated ? "border-red-900/60 bg-red-950/10" : "border-zinc-600"}`}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-[#F5AC0E] flex items-center gap-1.5">
          {player.name}
          {isEliminated && (
            <span className="text-[10px] font-bold uppercase tracking-wide text-red-400 border border-red-900/60 rounded px-1 py-0.5 leading-none">
              Out
            </span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          {!isSeatingMode && <span className="text-xs text-zinc-400 font-mono">#{rank}</span>}
          <span className="text-[#F5AC0E] font-bold">${player.money.toLocaleString()}</span>
        </div>
      </div>
      <div className="text-sm text-[#F5AC0E]">
        {isSeatingMode ? (
          <p>To place: {seatingGangsterIds.length}</p>
        ) : (
          <div className="flex items-center justify-between">
            <p>Gangsters: {aliveGangsters}/{player.gangsters.length}</p>
            <div className="flex items-center gap-1">
              {BUSINESS_TYPES.map((type) => {
                const count = businessCounts[type]
                const isMonopoly = count >= 2
                const isLit = count >= 1
                return (
                  <div
                    key={type}
                    className={`w-5 h-5 rounded-full flex items-center justify-center ${isMonopoly ? "ring-1 ring-yellow-400" : ""}`}
                    style={isMonopoly ? { filter: "drop-shadow(0 0 3px rgba(250,204,21,0.9))" } : undefined}
                    title={`${type.replace("_", " ")}: ${count} held${isMonopoly ? " (monopoly)" : ""}`}
                  >
                    <img
                      src={STATIC_ITEM_ICON[type]}
                      alt={type}
                      className={`w-full h-full object-contain ${isLit ? "" : "opacity-30 grayscale"}`}
                      draggable={false}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )}
        <div className="mt-2 flex flex-wrap gap-1">
          {player.gangsters.map((gangster) => {
            const needsPlacing = seatingGangsterIds.includes(gangster.id)
            const isSelected = gangster.id === selectedSeatingGangsterId
            const isClickable = isSeatingPlayer && needsPlacing && !!onSeatingGangsterSelect
            return (
              <div
                key={gangster.id}
                onClick={() => isClickable && onSeatingGangsterSelect!(gangster.id)}
                draggable={isClickable}
                onDragStart={isClickable ? (e) => {
                  e.dataTransfer.setData("seating-gangster-id", gangster.id)
                  e.dataTransfer.effectAllowed = "move"
                } : undefined}
                className={`w-8 h-8 rounded-full overflow-hidden relative
                  ${gangster.position === null && !needsPlacing ? "opacity-30 grayscale" : ""}
                  ${needsPlacing && !isSelected ? "animate-pulse ring-2 ring-yellow-400" : ""}
                  ${isSelected ? "ring-2 ring-white scale-110" : ""}
                  ${isClickable ? "cursor-grab hover:scale-110 transition-transform" : ""}`}
                title={needsPlacing ? `${gangster.type} — click or drag to place` : gangster.position !== null ? `${gangster.type} at position ${gangster.position}` : `${gangster.type} (eliminated)`}
              >
                <img src={getGangsterImage(player.id, gangster.type)} alt={gangster.type} className="w-full h-full object-contain" draggable={false} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
