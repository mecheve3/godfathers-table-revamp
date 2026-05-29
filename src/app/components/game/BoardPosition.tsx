import React, { useState, useEffect } from "react"
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
  spriteLarge?: boolean
  draggable?: boolean
  onDragStart?: () => void
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void
  onDrop?: () => void
  /** Hide the real occupant image (displacement source during confirm) */
  hideOccupant?: boolean
  /** Show a blinking preview gangster here (displacement destination during confirm) */
  previewGangster?: { imageSrc: string; playerId: string } | null
  /** Show a purple glow — gangster already selected as a sleeping-pill target */
  pillSelected?: boolean
  /** Replace idle sprite with action pose for gun (variant 2) or knife (variant 3) */
  poseOverride?: { variant: 2 | 3; flipX: boolean } | null
  /** Image src of the gangster who was just eliminated — renders a fading gray ghost while the elimination animation plays */
  eliminationSnapshot?: string | null
}

export const positionMap: Record<number, { x: number; y: number }> = {
  1: { x: 6.5, y: 50 },
  2: { x: 7.5, y: 30 },
  3: { x: 13.5, y: 19 },
  4: { x: 21.5, y: 18 },
  5: { x: 28, y: 18 },
  6: { x: 34, y: 18 },
  7: { x: 40.5, y: 18 },
  8: { x: 47, y: 18 },
  9: { x: 53, y: 18 },
  10: { x: 59.5, y: 18 },
  11: { x: 66, y: 18 },
  12: { x: 72, y: 18 },
  13: { x: 78.5, y: 18 },
  14: { x: 86.5, y: 19 },
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

// Inward positions for on-table items (cake bombs) — offset toward the table centre
const itemIconPositionMap: Record<number, { x: number; y: number }> = {
  1: { x: 12.5, y: 50 },
  2: { x: 12.5, y: 35 },
  3: { x: 16.5, y: 31 },
  4: { x: 21.5, y: 31 },
  5: { x: 28, y: 31 },
  6: { x: 34, y: 31 },
  7: { x: 40.5, y: 31 },
  8: { x: 47, y: 31 },
  9: { x: 53, y: 31 },
  10: { x: 59.5, y: 31 },
  11: { x: 66, y: 31 },
  12: { x: 72, y: 31 },
  13: { x: 78.5, y: 31 },
  14: { x: 86.5, y: 31 },
  15: { x: 87.5, y: 35 },
  16: { x: 87.5, y: 50 },
  17: { x: 87.5, y: 65 },
  18: { x: 86.5, y: 68 },
  19: { x: 78.5, y: 68 },
  20: { x: 72, y: 68 },
  21: { x: 66, y: 68 },
  22: { x: 59.5, y: 68 },
  23: { x: 53, y: 68 },
  24: { x: 47, y: 68 },
  25: { x: 40.5, y: 68 },
  26: { x: 34, y: 68 },
  27: { x: 28, y: 68 },
  28: { x: 21.5, y: 68 },
  29: { x: 16.5, y: 68 },
  30: { x: 12.5, y: 65 },
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

const getGangsterImage = (playerId: string, type: GangsterType, variant?: 2 | 3) =>
  `/images/players/${getTeam(playerId)}/${getGangsterTypeName(type)}${variant ?? ""}.png`

export default function BoardPosition({
  position, gameState, selected, highlighted, onClick, animClass, spriteOverlay, spriteLarge,
  onCakeClick, draggable, onDragStart, onDragOver, onDrop, hideOccupant, previewGangster, pillSelected,
  poseOverride, eliminationSnapshot,
}: BoardPositionProps) {
  const [cakes, setCakes] = useState<typeof gameState.cakes>([])
  const style = getPositionStyle(position.id)

  const occupiedBy = position.occupiedBy

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
        const variant = poseOverride?.variant
        gangsterDetails = { type: gangster.type, imageSrc: getGangsterImage(occupiedBy.playerId, gangster.type, variant) }
        isSleeping = gangster.status === "sleeping"
      }
    }
  }

  const effectivelyEmpty = !occupiedBy || hideOccupant

  // Drop-shadow glows follow the PNG silhouette — no clipping mask needed.
  const glowFilter = pillSelected
    ? "drop-shadow(0 0 6px rgba(192,132,252,1)) drop-shadow(0 0 12px rgba(192,132,252,0.6))"
    : selected
    ? "drop-shadow(0 0 8px rgba(255,255,255,1)) drop-shadow(0 0 16px rgba(255,255,255,0.6))"
    : highlighted
    ? "drop-shadow(0 0 10px rgba(250,204,21,1)) drop-shadow(0 0 20px rgba(250,204,21,0.5))"
    : undefined

  return (
    <>
      {/* Invisible hit-area anchored at the seat point. No circle, no background. */}
      <div
        className={`group absolute w-[3.75rem] h-[3.75rem] md:w-[5.25rem] md:h-[5.25rem] flex items-center justify-center cursor-pointer
          ${highlighted ? "animate-pulse" : ""}
          ${animClass ?? ""}`}
        style={style}
        onClick={onClick}
        draggable={draggable}
        onDragStart={onDragStart ? (e) => {
          e.dataTransfer.effectAllowed = "move"
          const el = e.currentTarget
          const clone = el.cloneNode(true) as HTMLElement
          clone.style.cssText = `position:fixed;top:-9999px;left:-9999px;width:${el.offsetWidth}px;height:${el.offsetHeight}px;opacity:1;`
          document.body.appendChild(clone)
          e.dataTransfer.setDragImage(clone, el.offsetWidth / 2, el.offsetHeight / 2)
          requestAnimationFrame(() => document.body.removeChild(clone))
          onDragStart()
        } : undefined}
        onDragOver={onDragOver}
        onDrop={onDrop ? (e) => { e.preventDefault(); onDrop() } : undefined}
      >
        {/* Gangster PNG — renders freeform without a circular clip */}
        {gangsterDetails && !hideOccupant && (
          <img
            src={gangsterDetails.imageSrc}
            alt={gangsterDetails.type}
            className={`w-full h-full object-contain pointer-events-none select-none
              ${isSleeping ? "opacity-50 saturate-50" : ""}`}
            style={{
              ...(glowFilter ? { filter: glowFilter } : {}),
              ...(poseOverride?.flipX ? { transform: "scaleX(-1)" } : {}),
            }}
            draggable={false}
          />
        )}

        {/* Eliminated character ghost — fades out in gray while the elimination sprite plays */}
        {effectivelyEmpty && !hideOccupant && eliminationSnapshot && (
          <img
            src={eliminationSnapshot}
            alt="eliminated"
            className="w-full h-full object-contain pointer-events-none select-none elimination-victim"
            draggable={false}
          />
        )}

        {/* Sleeping Zzz badge */}
        {isSleeping && !hideOccupant && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-sm font-black text-blue-200 leading-none zzz-blink drop-shadow-lg select-none">Zzz</span>
          </div>
        )}

        {/* Displacement preview */}
        {previewGangster && (
          <img
            src={previewGangster.imageSrc}
            alt="preview"
            className="w-full h-full object-contain displacement-preview-blink pointer-events-none select-none"
            draggable={false}
          />
        )}

        {/* Empty seat — dot that grows into a visible ring when highlighted */}
        {effectivelyEmpty && !previewGangster && (
          <div className={`rounded-full transition-all duration-150
            ${highlighted
              ? "w-7 h-7 md:w-9 md:h-9 border-2 border-yellow-400 bg-yellow-400/15 opacity-100"
              : "w-2 h-2 border border-zinc-400/40 opacity-25 group-hover:opacity-60"}`}
          />
        )}
      </div>

      {/* Sprite overlay — sibling outside the hit-area so it's never clipped */}
      {spriteOverlay && (
        <div
          className={`absolute pointer-events-none flex items-center justify-center ${spriteLarge ? "w-32 h-32 md:w-36 md:h-36" : spriteOverlay?.includes('elimination') ? "w-10 h-10 md:w-12 md:h-12" : "w-20 h-20 md:w-24 md:h-24"}`}
          style={{ ...style, zIndex: 30 }}
        >
          <img
            src={spriteOverlay}
            alt=""
            className={`w-full h-full object-contain ${spriteOverlay.includes('elimination') ? 'elimination-blink' : 'sprite-blink'}`}
            draggable={false}
          />
        </div>
      )}

      {/* Cake bombs — offset slightly from the character position */}
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
            src="/images/Sprites/cake.png"
            alt="cake bomb"
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>
      ))}
    </>
  )
}
