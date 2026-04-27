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
  /** Called with a specific cake ID when a cake on this seat is clicked */
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
    case "GODFATHER":    return "godfather"
    case "GUNMAN":       return "gunman"
    case "BLADESLINGER": return "bladeslinger"
    case "THUG":         return "thug"
    default: return "unknown"
  }
}

const getGangsterImage = (playerId: string, type: GangsterType) =>
  `/images/players/${getTeam(playerId)}/${getGangsterTypeName(type)}.png`

export default function BoardPosition({
  position, gameState, selected, highlighted, onClick, animClass, spriteOverlay, spriteLarge,
  onCakeClick, draggable, onDragStart, onDragOver, onDrop, hideOccupant, previewGangster, pillSelected,
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
        gangsterDetails = { type: gangster.type, imageSrc: getGangsterImage(occupiedBy.playerId, gangster.type) }
        isSleeping = gangster.status === "sleeping"
      }
    }
  }

  const effectivelyEmpty = !occupiedBy || hideOccupant

  // Story 3: glow-based highlight replaces circular rings.
  // Multiple drop-shadow layers deepen the glow without needing a border.
  const glowFilter = pillSelected
    ? "drop-shadow(0 0 6px rgba(192,132,252,1)) drop-shadow(0 0 12px rgba(192,132,252,0.6))"
    : selected
    ? "drop-shadow(0 0 8px rgba(255,255,255,1)) drop-shadow(0 0 16px rgba(255,255,255,0.6))"
    : highlighted
    ? "drop-shadow(0 0 10px rgba(250,204,21,1)) drop-shadow(0 0 20px rgba(250,204,21,0.5))"
    : undefined

  // Story 1/4: The outer div is the invisible click-target anchored at the seat center.
  // No circle, no background — purely a hit area + animation host.
  // The avatar image is bottom-aligned so feet rest at the seat anchor point.
  return (
    <>
      <div
        className={`group absolute w-10 h-10 md:w-14 md:h-14 flex items-end justify-center cursor-pointer
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
        {/* Story 1: silhouette avatar — no clip mask, overflows upward from seat anchor */}
        {gangsterDetails && !hideOccupant && (
          <img
            src={gangsterDetails.imageSrc}
            alt={gangsterDetails.type}
            className={`w-12 h-14 md:w-16 md:h-[4.5rem] object-contain object-bottom pointer-events-none select-none
              ${isSleeping ? "opacity-50 saturate-0" : ""}`}
            style={glowFilter ? { filter: glowFilter } : undefined}
            draggable={false}
          />
        )}

        {/* Sleeping Zzz — floats above the avatar head.
            Image is h-14/h-[4.5rem] (56/72px), outer div is h-10/h-14 (40/56px).
            The image extends ~16px above the div top, so offset by (100% + ~16px). */}
        {isSleeping && !hideOccupant && (
          <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none" style={{ bottom: 'calc(100% + 18px)' }}>
            <span className="text-xs font-black text-blue-200 leading-none zzz-blink drop-shadow-lg select-none">Zzz</span>
          </div>
        )}

        {/* Displacement preview — same size, blink animation */}
        {previewGangster && (
          <img
            src={previewGangster.imageSrc}
            alt="preview"
            className="w-12 h-14 md:w-16 md:h-[4.5rem] object-contain object-bottom displacement-preview-blink pointer-events-none select-none"
            draggable={false}
          />
        )}

        {/* Story 2: empty seat — minimal dot indicator (no circle).
            Group hover brightens it so players can see available positions. */}
        {effectivelyEmpty && !previewGangster && (
          <div className="w-2 h-2 rounded-full border border-zinc-400/30 opacity-25 group-hover:opacity-60 transition-opacity mb-1 flex-shrink-0" />
        )}
      </div>

      {/* Sprite overlay — sibling outside the seat div so it's never clipped */}
      {spriteOverlay && (
        <div
          className={`absolute pointer-events-none flex items-center justify-center ${spriteLarge ? "w-32 h-32 md:w-36 md:h-36" : "w-20 h-20 md:w-24 md:h-24"}`}
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

      {/* Cake bombs */}
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
