import type { Player, GangsterType } from "../../features/game/types"

interface PlayerDashboardProps {
  player: Player
  isCurrentPlayer: boolean
  isSeatingPlayer?: boolean
  seatingGangsterIds?: string[]
  selectedSeatingGangsterId?: string | null
  onSeatingGangsterSelect?: (gangsterId: string) => void
}

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
  isCurrentPlayer,
  isSeatingPlayer = false,
  seatingGangsterIds = [],
  selectedSeatingGangsterId = null,
  onSeatingGangsterSelect,
}: PlayerDashboardProps) {
  const aliveGangsters = player.gangsters.filter((g) => g.position !== null).length
  const isSeatingMode = seatingGangsterIds.length > 0 || isSeatingPlayer

  return (
    <div className={`border-2 border-zinc-600 rounded-lg p-3 ${isCurrentPlayer ? "ring-2 ring-white" : ""}`}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-[#F5AC0E]">{player.name}</h3>
        <span className="text-[#F5AC0E] font-bold">${player.money.toLocaleString()}</span>
      </div>
      <div className="text-sm text-[#F5AC0E]">
        {isSeatingMode ? (
          <p>To place: {seatingGangsterIds.length}</p>
        ) : (
          <p>Gangsters: {aliveGangsters}/{player.gangsters.length}</p>
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
                className={`w-8 h-8 rounded-full overflow-hidden relative
                  ${gangster.position === null && !needsPlacing ? "opacity-30 grayscale" : ""}
                  ${needsPlacing && !isSelected ? "animate-pulse ring-2 ring-yellow-400" : ""}
                  ${isSelected ? "ring-2 ring-white scale-110" : ""}
                  ${isClickable ? "cursor-pointer hover:scale-110 transition-transform" : ""}`}
                title={needsPlacing ? `${gangster.type} — click to place` : gangster.position !== null ? `${gangster.type} at position ${gangster.position}` : `${gangster.type} (eliminated)`}
              >
                <img src={getGangsterImage(player.id, gangster.type)} alt={gangster.type} className="w-full h-full object-contain" />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
