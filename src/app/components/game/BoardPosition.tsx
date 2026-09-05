import React, { useState, useEffect } from "react"
import type { Position, GameState, GangsterType } from "../../features/game/types"
import { DRINK_SEAT_IDS } from "../../features/game/types"

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
  /** True while any displacement drag is in progress — suppresses cake click-targets and keeps dragging character fully opaque */
  isDragActive?: boolean
  /** True when the SELECT_CAKE phase is active — cake icons should capture clicks exclusively */
  isCakeSelectMode?: boolean
  /** Called when a seating gangster is dragged from the panel and dropped onto this seat */
  onDropSeating?: (gangsterId: string) => void
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
  3: { x: 18, y: 27 },
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
  14: { x: 82, y: 27 },
  15: { x: 87.5, y: 35 },
  16: { x: 87.5, y: 50 },
  17: { x: 87.5, y: 65 },
  18: { x: 82, y: 71.5 },
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
  29: { x: 18, y: 71.5 },
  30: { x: 12.5, y: 65 },
}


// Local tangent angle (degrees) of the table edge at seat `id`, derived from its ring
// neighbors (seats 1..30 form a closed ring around the octagon, wrapping 1<->30). This
// naturally gives ~0deg on the long top/bottom edges, ~90deg on the short left/right
// edges, and a genuine diagonal tilt at each corner seat — used to lay flat markers
// (e.g. the knife) tangent to the table edge without hand-tuning a rotation per seat.
const getEdgeTangentAngleDeg = (id: number): number => {
  const total = Object.keys(positionMap).length
  const prev = positionMap[id === 1 ? total : id - 1]
  const next = positionMap[id === total ? 1 : id + 1]
  if (!prev || !next) return 0
  return Math.atan2(next.y - prev.y, next.x - prev.x) * (180 / Math.PI)
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

const getCakeImage = (ownerId: string): string => {
  const team = getTeam(ownerId)
  return team !== "gray" ? `/images/cakes/${team}.png` : "/images/Sprites/cake.png"
}

// Board marker art — drop-in swappable by filename only, per seat's Position.item /
// DRINK_SEAT_IDS membership. Keep this the single place that maps item type -> asset.
export const STATIC_ITEM_ICON: Partial<Record<string, string>> = {
  BAR: "/images/items/bar.png",
  GAMBLING_HOUSE: "/images/items/casino.png",
  STRIP_CLUB: "/images/items/strip-club.png",
  GUN: "/images/items/gun.png",
  KNIFE: "/images/items/knife.png",
  CASH_REGISTER: "/images/items/cash-register.png",
}
export const DRINK_GLASS_ICON = "/images/items/glass.png"

// Marker size in cqw, by category — business icons read clearly at 2x, weapons a bit
// bigger than the baseline; glass and cash-register stay at the original baseline size.
const MARKER_SIZE_CQW = {
  BUSINESS: 6.66,
  WEAPON: 4.0,
  BASELINE: 3.33,
} as const
const BUSINESS_ITEM_TYPES = new Set(["BAR", "GAMBLING_HOUSE", "STRIP_CLUB"])
const WEAPON_ITEM_TYPES = new Set(["GUN", "KNIFE"])
const getMarkerSizeCqw = (itemType: string): number =>
  BUSINESS_ITEM_TYPES.has(itemType) ? MARKER_SIZE_CQW.BUSINESS
  : WEAPON_ITEM_TYPES.has(itemType) ? MARKER_SIZE_CQW.WEAPON
  : MARKER_SIZE_CQW.BASELINE
// Small fixed breathing room between two stacked markers, on top of their own half-widths.
const MARKER_GAP_CQW = 0.5

/** Marker position: the same inward, on-the-table spot cakes use — a cake placed on the
 *  same seat sits at the identical point and blinks transparent (see .cake-bomb-blink)
 *  so whatever marker is underneath stays visible. */
export const staticItemPositionMap: Record<number, { x: number; y: number }> = itemIconPositionMap

export default function BoardPosition({
  position, gameState, selected, highlighted, onClick, animClass, spriteOverlay, spriteLarge,
  onCakeClick, draggable, onDragStart, onDragOver, onDrop, hideOccupant, previewGangster, pillSelected,
  poseOverride, eliminationSnapshot, isDragActive, isCakeSelectMode, onDropSeating,
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
        className={`group absolute w-[7.78cqw] h-[7.78cqw] flex items-center justify-center cursor-pointer
          ${highlighted ? "animate-pulse" : ""}
          ${animClass ?? ""}`}
        style={{ ...style, opacity: isDragActive && draggable ? 1 : undefined }}
        onClick={onClick}
        draggable={draggable}
        onDragStart={onDragStart ? (e) => {
          e.dataTransfer.effectAllowed = "move"
          const el = e.currentTarget
          // Force the element fully opaque so the browser drag ghost is vibrant
          const prevOpacity = el.style.opacity
          el.style.opacity = '1'
          const clone = el.cloneNode(true) as HTMLElement
          clone.style.cssText = `position:fixed;top:-9999px;left:-9999px;width:${el.offsetWidth}px;height:${el.offsetHeight}px;opacity:1;background:transparent;`
          document.body.appendChild(clone)
          e.dataTransfer.setDragImage(clone, el.offsetWidth / 2, el.offsetHeight / 2)
          requestAnimationFrame(() => { document.body.removeChild(clone); el.style.opacity = prevOpacity })
          onDragStart()
        } : undefined}
        onDragOver={(e) => {
          if (onDragOver) onDragOver(e)
          if (onDropSeating && !e.defaultPrevented) e.preventDefault()
        }}
        onDrop={(e) => {
          e.preventDefault()
          const seatingId = e.dataTransfer.getData("seating-gangster-id")
          if (seatingId && onDropSeating) {
            onDropSeating(seatingId)
          } else {
            onDrop?.()
          }
        }}
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
              ? "w-[3.33cqw] h-[3.33cqw] border-2 border-yellow-400 bg-yellow-400/15 opacity-100"
              : "w-[0.74cqw] h-[0.74cqw] border border-zinc-400/40 opacity-25 group-hover:opacity-60"}`}
          />
        )}
      </div>

      {/* Sprite overlay — sibling outside the hit-area so it's never clipped */}
      {spriteOverlay && (
        <div
          className={`absolute pointer-events-none flex items-center justify-center ${spriteLarge ? "w-[13.33cqw] h-[13.33cqw]" : spriteOverlay?.includes('elimination') ? "w-[4.44cqw] h-[4.44cqw]" : "w-[8.89cqw] h-[8.89cqw]"}`}
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

      {/* Board markers — business/weapon item + drink glass, each its own positioned image
          per Position.item / DRINK_SEAT_IDS (not baked into the board background art) */}
      {(() => {
        const markers: { src: string; size: number; isKnife: boolean }[] = [
          position.item && STATIC_ITEM_ICON[position.item]
            ? { src: STATIC_ITEM_ICON[position.item]!, size: getMarkerSizeCqw(position.item), isKnife: position.item === "KNIFE" }
            : undefined,
          DRINK_SEAT_IDS.includes(position.id)
            ? { src: DRINK_GLASS_ICON, size: MARKER_SIZE_CQW.BASELINE, isKnife: false }
            : undefined,
        ].filter((m): m is { src: string; size: number; isKnife: boolean } => !!m)
        if (markers.length === 0) return null
        const pos = staticItemPositionMap[position.id]
        if (!pos) return null

        // Lay markers out left-to-right, centered as a group, spacing each pair by the
        // sum of their own half-widths plus a small fixed gap — so spacing scales with
        // each marker's actual rendered size instead of one flat constant.
        const totalWidth = markers.reduce((sum, m) => sum + m.size, 0) + MARKER_GAP_CQW * (markers.length - 1)
        let cursor = -totalWidth / 2
        const offsets = markers.map((m) => {
          const center = cursor + m.size / 2
          cursor += m.size + MARKER_GAP_CQW
          return center
        })

        const knifeAngleDeg = getEdgeTangentAngleDeg(position.id)

        return markers.map((marker, index) => (
          <div
            key={marker.src}
            className="absolute pointer-events-none"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              width: `${marker.size}cqw`,
              height: `${marker.size}cqw`,
              transform: `translate(calc(-50% + ${offsets[index]}cqw), -50%)`,
              zIndex: 2,
            }}
          >
            <img
              src={marker.src}
              alt=""
              className="w-full h-full object-contain"
              style={marker.isKnife ? { transform: `rotate(${knifeAngleDeg}deg)` } : undefined}
              draggable={false}
            />
          </div>
        ))
      })()}

      {/* Cake bombs — positioned inward from the seat using itemIconPositionMap */}
      {cakes.map((cake, index) => {
        const iconPos = itemIconPositionMap[position.id]
        return (
          <div
            key={cake.id}
            className={`absolute w-[8.89cqw] h-[8.89cqw] ${isDragActive ? "pointer-events-none" : "cursor-pointer"}`}
            style={iconPos ? {
              left: `${iconPos.x}%`,
              top: `${iconPos.y}%`,
              // NOTE: this translate must stay on a div with no CSS animation of its own —
              // an animated `transform` (the pulse below) fully replaces this value for as
              // long as it's running, silently dropping the -50%/-50% centering and leaving
              // the cake anchored by its top-left corner instead of sitting centered in
              // front of the seat. The pulse lives on the inner wrapper instead.
              transform: `translate(calc(-50% + ${(index - (cakes.length - 1) / 2) * 5.19}cqw), -50%)`,
              zIndex: 5,
            } : {
              left: `calc(${style.left} + ${index === 0 ? "-20px" : "20px"})`,
              top: `calc(${style.top} + ${index === 0 ? "-20px" : "20px"})`,
              zIndex: 5,
            }}
            title="Cake bomb — explodes at the start of the placer's next turn"
            onClick={(e) => { if (isCakeSelectMode) { e.stopPropagation(); if (onCakeClick) onCakeClick(cake.id) } else { onClick() } }}
          >
            <div className="cake-bomb-blink w-full h-full">
              <img
                src={getCakeImage(cake.ownerId)}
                alt="cake bomb"
                className="w-full h-full object-contain"
                draggable={false}
              />
            </div>
          </div>
        )
      })}
    </>
  )
}
