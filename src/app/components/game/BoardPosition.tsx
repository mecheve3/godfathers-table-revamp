import { useState, useEffect } from "react"
import type { Position, GameState, GangsterType } from "../../features/game/types"

interface BoardPositionProps {
  position: Position
  gameState: GameState
  selected: boolean
  highlighted: boolean
  onClick: () => void
  animClass?: string
  /** Sprite image path to blink over this seat when an action targets it */
  spriteOverlay?: string
  /** Called with a specific cake ID when a cake on this seat is clicked — enables multi-cake selection */
  onCakeClick?: (cakeId: string) => void
}

const positionMap: Record<number, { x: number; y: number }> = {
  1: { x: 6.5, y: 50 },
  2: { x: 7.5, y: 30 },
  3: { x: 13.5, y: 21.5 },
  4: { x: 21.5, y: 21 },
  5: { x: 28, y: 21 },
  6: { x: 34, y: 21 },
  7: { x: 40.5, y: 21 },
  8: { x: 47, y: 21 },
  9: { x: 53, y: 21 },
  10: { x: 59.5, y: 21 },
  11: { x: 66, y: 21 },
  12: { x: 72, y: 21 },
  13: { x: 78.5, y: 21 },
  14: { x: 86.5, y: 21.5 },
  15: { x: 92.5, y: 30 },
  16: { x: 93.5, y: 50 },
  17: { x: 92.5, y: 70 },
  18: { x: 86.5, y: 79.5 },
  19: { x: 78.5, y: 80 },
  20: { x: 72, y: 80 },
  21: { x: 66, y: 80 },
  22: { x: 59.5, y: 80 },
  23: { x: 53, y: 80 },
  24: { x: 47, y: 80 },
  25: { x: 40.5, y: 80 },
  26: { x: 34, y: 80 },
  27: { x: 28, y: 80 },
  28: { x: 21.5, y: 80 },
  29: { x: 13.5, y: 79.5 },
  30: { x: 7.5, y: 70 },
}

const getPositionStyle = (positionId: number) => {
  const position = positionMap[positionId]
  if (!position) return { left: "50%", top: "50%", transform: "translate(-50%, -50%)" }
  return { left: `${position.x}%`, top: `${position.y}%`, transform: "translate(-50%, -50%)" }
}

const getTeam = (playerId: string) => {
  switch (playerId) {
    case "player1": return "red"
    case "player2": return "blue"
    case "player3": return "yellow"
    case "player4": return "green"
    case "player5": return "orange"
    case "player6": return "purple"
    default: return "gray"
  }
}

const getGangsterTypeName = (type: GangsterType) => {
  switch (type) {
    case "GODFATHER": return "godfather"
    case "GUNMAN": return "gunman"
    case "BLADESLINGER": return "bladeslinger"
    case "THUG": return "thug"
    default: return "unknown"
  }
}

const getGangsterImage = (playerId: string, type: GangsterType) =>
  `/images/players/${getTeam(playerId)}/${getGangsterTypeName(type)}.png`

export default function BoardPosition({ position, gameState, selected, highlighted, onClick, animClass, spriteOverlay, onCakeClick }: BoardPositionProps) {
  const [cakes, setCakes] = useState<typeof gameState.cakes>([])
  const style = getPositionStyle(position.id)

  const occupiedBy = position.occupiedBy
  const gangsterColor = occupiedBy ? getTeam(occupiedBy.playerId) : ""

  useEffect(() => {
    setCakes(gameState.cakes.filter((cake) => cake.seatId === position.id))
  }, [gameState.cakes, position.id])

  let gangsterDetails: { type: GangsterType; imageSrc: string } | null = null
  let isSleeping = false
  if (occupiedBy) {
    const player = gameState.players.find((p) => p.id === occupiedBy.playerId)
    if (player) {
      const gangster = player.gangsters.find((g) => g.id === occupiedBy.gangsterId)
      if (gangster) {
        gangsterDetails = { type: gangster.type, imageSrc: getGangsterImage(occupiedBy.playerId, gangster.type) }
        isSleeping = gangster.status === "sleeping"
      }
    }
  }

  return (
    <>
      <div
        className={`absolute w-10 h-10 md:w-14 md:h-14 rounded-full overflow-hidden flex items-center justify-center cursor-pointer border-2 border-gray-300
          ${selected ? "ring-4 ring-white" : ""}
          ${highlighted ? "ring-4 ring-yellow-400 animate-pulse" : ""}
          ${animClass ?? ""}
          ${occupiedBy ? gangsterColor : "bg-zinc-800/80 hover:bg-zinc-700/90"}`}
        style={style}
        onClick={onClick}
      >
        {gangsterDetails && (
          <img
            src={gangsterDetails.imageSrc}
            alt={gangsterDetails.type}
            className={`w-full h-full object-contain ${isSleeping ? "opacity-70" : ""}`}
          />
        )}
        {isSleeping && (
          <div className="absolute inset-0 flex items-center justify-center bg-blue-900/50 rounded-full pointer-events-none">
            <span className="text-sm font-black text-blue-100 leading-none zzz-blink drop-shadow-lg">Zzz</span>
          </div>
        )}
        {spriteOverlay && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <img src={spriteOverlay} alt="" className="w-full h-full object-contain sprite-blink" draggable={false} />
          </div>
        )}
      </div>

      {cakes.map((cake, index) => (
        <div
          key={cake.id}
          className="absolute w-8 h-8 rounded-full border-2 border-white flex items-center justify-center cursor-pointer cake-bomb-blink overflow-hidden"
          style={{
            backgroundColor: cake.color,
            left: `calc(${style.left} + ${index === 0 ? "-20px" : "20px"})`,
            top: `calc(${style.top} + ${index === 0 ? "-20px" : "20px"})`,
            zIndex: 5,
          }}
          title={`Cake placed on round ${cake.roundPlaced} — explodes next round`}
          onClick={(e) => { e.stopPropagation(); if (onCakeClick) onCakeClick(cake.id); else onClick() }}
        >
          <img
            src="/images/cards/explodecake.png"
            alt="cake bomb"
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>
      ))}
    </>
  )
}
