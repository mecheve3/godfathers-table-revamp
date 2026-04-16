import type { GameState, Action, Position } from "./types"
import { DRINK_SEAT_IDS } from "./types"
import {
  getValidGangstersForCard,
  getValidDisplacementPositions,
  getValidCakePositions,
  getValidPillTargets,
  isCardPlayable,
} from "./game-logic"

export interface BotPlay {
  cardId: string
  action: Action
  log: string
}

// ── Blast-range helpers ───────────────────────────────────────────────────────

function countOwnInBlast(state: GameState, posId: number, botId: string): number {
  const pos = state.board.find((p) => p.id === posId)
  if (!pos) return 0
  const seats = [posId, pos.leftId, pos.rightId]
  return seats.reduce((n, sid) => {
    const seat = state.board.find((p) => p.id === sid)
    return seat?.occupiedBy?.playerId === botId ? n + 1 : n
  }, 0)
}

function countEnemiesInBlast(state: GameState, posId: number, botId: string): number {
  const pos = state.board.find((p) => p.id === posId)
  if (!pos) return 0
  const seats = [posId, pos.leftId, pos.rightId]
  return seats.reduce((n, sid) => {
    const seat = state.board.find((p) => p.id === sid)
    return seat?.occupiedBy && seat.occupiedBy.playerId !== botId ? n + 1 : n
  }, 0)
}

function countAllyNeighbors(state: GameState, posId: number, playerId: string): number {
  const pos = state.board.find((p) => p.id === posId)
  if (!pos) return 0
  let count = 0
  const left = state.board.find((p) => p.id === pos.leftId)
  const right = state.board.find((p) => p.id === pos.rightId)
  if (left?.occupiedBy?.playerId === playerId) count++
  if (right?.occupiedBy?.playerId === playerId) count++
  return count
}

// ── Individual card decisions ─────────────────────────────────────────────────

function decidePassCake(state: GameState, botId: string): BotPlay | null {
  const player = state.players.find((p) => p.id === botId)
  if (!player) return null
  const card = player.hand.find((c) => c.type === "PASS_CAKE")
  if (!card || !isCardPlayable(state, botId, card.id)) return null

  let bestCakeId: string | null = null
  let bestDir: "left" | "right" | null = null
  let bestReduction = 0

  for (const cake of state.cakes) {
    const ownAtRisk = countOwnInBlast(state, cake.seatId, botId)
    if (ownAtRisk === 0) continue

    const cakePos = state.board.find((p) => p.id === cake.seatId)
    if (!cakePos) continue

    for (const [dir, neighborId] of [
      ["left", cakePos.leftId],
      ["right", cakePos.rightId],
    ] as const) {
      const cakesAtNeighbor = state.cakes.filter((c) => c.seatId === neighborId).length
      if (cakesAtNeighbor >= 2) continue
      const newOwnAtRisk = countOwnInBlast(state, neighborId, botId)
      const reduction = ownAtRisk - newOwnAtRisk
      if (reduction > bestReduction) {
        bestReduction = reduction
        bestCakeId = cake.id
        bestDir = dir
      }
    }
  }

  if (!bestCakeId || !bestDir) return null

  return {
    cardId: card.id,
    action: { type: "PASS_CAKE", playerId: botId, cakeId: bestCakeId, direction: bestDir },
    log: `PASS_CAKE ${bestDir} — reduced own blast risk by ${bestReduction}`,
  }
}

function decideExplodeCake(state: GameState, botId: string): BotPlay | null {
  const player = state.players.find((p) => p.id === botId)
  if (!player) return null
  const card = player.hand.find((c) => c.type === "EXPLODE_CAKE")
  if (!card || !isCardPlayable(state, botId, card.id)) return null

  let bestCakeId: string | null = null
  let bestEnemies = 0

  for (const cake of state.cakes) {
    if (countOwnInBlast(state, cake.seatId, botId) > 0) continue
    const enemies = countEnemiesInBlast(state, cake.seatId, botId)
    if (enemies > bestEnemies) {
      bestEnemies = enemies
      bestCakeId = cake.id
    }
  }

  if (!bestCakeId || bestEnemies === 0) return null

  return {
    cardId: card.id,
    action: { type: "EXPLODE_CAKE", playerId: botId, cakeId: bestCakeId },
    log: `EXPLODE_CAKE — ${bestEnemies} enem${bestEnemies === 1 ? "y" : "ies"} in range`,
  }
}

function decideGun(state: GameState, botId: string): BotPlay | null {
  const player = state.players.find((p) => p.id === botId)
  if (!player) return null
  const card = player.hand.find((c) => c.type === "GUN")
  if (!card || !isCardPlayable(state, botId, card.id)) return null

  const validGangsters = getValidGangstersForCard(state, botId, "GUN")
  if (validGangsters.length === 0) return null

  let bestIdx = -1
  let fewestAllies = Infinity

  for (const gIdx of validGangsters) {
    const gangster = player.gangsters[gIdx]
    if (!gangster?.position) continue
    const pos = state.board.find((p) => p.id === gangster.position)
    if (!pos?.frontId) continue
    const targetPos = state.board.find((p) => p.id === pos.frontId)
    if (!targetPos?.occupiedBy) continue
    const allies = countAllyNeighbors(state, pos.frontId, targetPos.occupiedBy.playerId)
    if (allies < fewestAllies) {
      fewestAllies = allies
      bestIdx = gIdx
    }
  }

  if (bestIdx === -1) return null

  const gangster = player.gangsters[bestIdx]
  const pos = state.board.find((p) => p.id === gangster.position!)!
  const targetId = pos.frontId!

  return {
    cardId: card.id,
    action: { type: "GUN", playerId: botId, gangsterId: bestIdx },
    log: `GUN → seat ${targetId} (target has ${fewestAllies} nearby allies)`,
  }
}

function decideKnife(state: GameState, botId: string): BotPlay | null {
  const player = state.players.find((p) => p.id === botId)
  if (!player) return null
  const card = player.hand.find((c) => c.type === "KNIFE")
  if (!card || !isCardPlayable(state, botId, card.id)) return null

  const validGangsters = getValidGangstersForCard(state, botId, "KNIFE")
  if (validGangsters.length === 0) return null

  let bestIdx = -1
  let bestDir: "left" | "right" = "left"
  let fewestAllies = Infinity

  for (const gIdx of validGangsters) {
    const gangster = player.gangsters[gIdx]
    if (!gangster?.position) continue
    const pos = state.board.find((p) => p.id === gangster.position)
    if (!pos) continue

    for (const [dir, neighborId] of [
      ["left", pos.leftId],
      ["right", pos.rightId],
    ] as const) {
      const targetPos = state.board.find((p) => p.id === neighborId)
      if (!targetPos?.occupiedBy || targetPos.occupiedBy.playerId === botId) continue
      const allies = countAllyNeighbors(state, neighborId, targetPos.occupiedBy.playerId)
      if (allies < fewestAllies) {
        fewestAllies = allies
        bestIdx = gIdx
        bestDir = dir
      }
    }
  }

  if (bestIdx === -1) return null

  const gangster = player.gangsters[bestIdx]
  const pos = state.board.find((p) => p.id === gangster.position!)!
  const targetId = bestDir === "left" ? pos.leftId : pos.rightId

  return {
    cardId: card.id,
    action: { type: "KNIFE", playerId: botId, gangsterId: bestIdx, direction: bestDir },
    log: `KNIFE ${bestDir} → seat ${targetId} (isolated: ${fewestAllies} nearby allies)`,
  }
}

function decideOrderCake(state: GameState, botId: string): BotPlay | null {
  const player = state.players.find((p) => p.id === botId)
  if (!player) return null
  const card = player.hand.find((c) => c.type === "ORDER_CAKE")
  if (!card || !isCardPlayable(state, botId, card.id)) return null

  const positions = getValidCakePositions(state)
  let bestPos = -1
  let bestEnemies = 0

  for (const posId of positions) {
    if (countOwnInBlast(state, posId, botId) > 0) continue
    const enemies = countEnemiesInBlast(state, posId, botId)
    if (enemies > bestEnemies) {
      bestEnemies = enemies
      bestPos = posId
    }
  }

  if (bestPos === -1 || bestEnemies === 0) return null

  return {
    cardId: card.id,
    action: { type: "ORDER_CAKE", playerId: botId, targetPositionId: bestPos },
    log: `ORDER_CAKE at seat ${bestPos} (${bestEnemies} potential target${bestEnemies === 1 ? "" : "s"})`,
  }
}

function decideSleepingPills(state: GameState, botId: string): BotPlay | null {
  const player = state.players.find((p) => p.id === botId)
  if (!player) return null
  const card = player.hand.find((c) => c.type === "SLEEPING_PILLS")
  if (!card || !isCardPlayable(state, botId, card.id)) return null

  const targets = getValidPillTargets(state, botId)
  if (targets.length === 0) return null

  const typePriority: Record<string, number> = { GODFATHER: 4, GUNMAN: 3, BLADESLINGER: 2, THUG: 1 }
  const sorted = [...targets].sort((a, b) => {
    const ga = state.players.flatMap((p) => p.gangsters).find((g) => g.id === a)
    const gb = state.players.flatMap((p) => p.gangsters).find((g) => g.id === b)
    return (typePriority[gb?.type ?? ""] ?? 0) - (typePriority[ga?.type ?? ""] ?? 0)
  })
  const selected = sorted.slice(0, 3)

  return {
    cardId: card.id,
    action: { type: "SLEEPING_PILLS", playerId: botId, pillTargetGangsterIds: selected },
    log: `SLEEPING_PILLS on ${selected.length} gangster${selected.length === 1 ? "" : "s"}`,
  }
}

function getPositionValue(item: string | null, ownedTypes: Set<string>): number {
  if (item === "CASH_REGISTER") return 5
  if (item && ownedTypes.has(item)) return 4
  if (item && ["BAR", "GAMBLING_HOUSE", "STRIP_CLUB"].includes(item)) return 3
  if (item === "GUN") return 2
  return 1
}

function decideDisplacement(state: GameState, botId: string): BotPlay | null {
  const player = state.players.find((p) => p.id === botId)
  if (!player) return null
  const card = player.hand.find((c) => c.type === "DISPLACEMENT")
  if (!card || !isCardPlayable(state, botId, card.id)) return null

  const validGangsters = getValidGangstersForCard(state, botId, "DISPLACEMENT")
  if (validGangsters.length === 0) return null

  const emptyPositions = getValidDisplacementPositions(state)
  if (emptyPositions.length === 0) return null

  const businessItems = ["BAR", "GAMBLING_HOUSE", "STRIP_CLUB"]
  const ownedTypes = new Set<string>()
  for (const g of player.gangsters) {
    if (g.position === null) continue
    const pos = state.board.find((p) => p.id === g.position)
    if (pos?.item && businessItems.includes(pos.item)) ownedTypes.add(pos.item)
  }

  // Find the best (gangsterIdx, targetId) pair — maximize target value
  type Candidate = { gIdx: number; targetId: number; targetValue: number; currentValue: number }
  const candidates: Candidate[] = []

  for (const gIdx of validGangsters) {
    const gangster = player.gangsters[gIdx]
    if (!gangster?.position) continue
    const currentPos = state.board.find((p) => p.id === gangster.position)
    const currentValue = getPositionValue(currentPos?.item ?? null, ownedTypes)

    for (const targetId of emptyPositions) {
      const targetPos = state.board.find((p) => p.id === targetId)
      const targetValue = getPositionValue(targetPos?.item ?? null, ownedTypes)
      candidates.push({ gIdx, targetId, targetValue, currentValue })
    }
  }

  // Sort by target value desc, then prefer candidates that improve on current value
  candidates.sort((a, b) => {
    if (b.targetValue !== a.targetValue) return b.targetValue - a.targetValue
    // Same target value — prefer one with the biggest improvement
    return (b.targetValue - b.currentValue) - (a.targetValue - a.currentValue)
  })

  // Pick first candidate that actually improves position, or else the highest-value target
  const improving = candidates.find((c) => c.targetValue > c.currentValue)
  const best = improving ?? candidates[0]

  if (!best) return null

  const targetPos = state.board.find((p) => p.id === best.targetId)
  const label = targetPos?.item ? `${targetPos.item} (seat ${best.targetId})` : `seat ${best.targetId}`

  return {
    cardId: card.id,
    action: {
      type: "DISPLACEMENT",
      playerId: botId,
      gangsterId: best.gIdx,
      targetPositionId: best.targetId,
    },
    log: `DISPLACEMENT → ${label}`,
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Decide the best first card to play for a bot this turn. */
export function decideBotFirstPlay(state: GameState, botId: string): BotPlay | null {
  return (
    decidePassCake(state, botId) ??
    decideExplodeCake(state, botId) ??
    decideGun(state, botId) ??
    decideKnife(state, botId) ??
    decideOrderCake(state, botId) ??
    decideSleepingPills(state, botId) ??
    decideDisplacement(state, botId)
  )
}

/** Decide the optional second play — always a Displacement if possible. */
export function decideBotSecondPlay(state: GameState, botId: string): BotPlay | null {
  return decideDisplacement(state, botId)
}

/** Pick a random card ID to discard (when no valid play exists). */
export function getRandomDiscardCard(state: GameState, botId: string): string | null {
  const player = state.players.find((p) => p.id === botId)
  if (!player || player.hand.length === 0) return null
  return player.hand[Math.floor(Math.random() * player.hand.length)].id
}

// ── Bot seating (manual seating + Police Raid re-seat) ────────────────────────

const SEATING_BUSINESS_ITEMS = ["BAR", "GAMBLING_HOUSE", "STRIP_CLUB"]
const CORNER_SEAT_IDS = [2, 3, 14, 15, 17, 18, 29, 30]

function scorePlacement(
  gangsterType: string,
  seat: Position,
  ownedTypes: Set<string>,
): number {
  let score = 0

  // ── Base seat value from strategic item ───────────────────────────────────
  if (seat.item === "CASH_REGISTER") {
    score += 100
  } else if (seat.item && ownedTypes.has(seat.item)) {
    score += 85 // Completes or extends a monopoly
  } else if (seat.item && SEATING_BUSINESS_ITEMS.includes(seat.item)) {
    score += 60 // New income source
  } else if (seat.item === "GUN") {
    score += 30
  } else if (seat.item === "KNIFE") {
    score += 20
  } else {
    score += 5
  }

  // ── Drink penalty (sleeping-pills risk) ───────────────────────────────────
  // Applied on top of the item value so GUN+DRINK seats still score lower than plain GUN seats
  if ((DRINK_SEAT_IDS as readonly number[]).includes(seat.id)) {
    score -= 45
  }

  // ── Corner penalty (no frontId — tactically weaker) ──────────────────────
  if (CORNER_SEAT_IDS.includes(seat.id)) {
    score -= 12
  }

  // ── Gangster-type × seat synergy ─────────────────────────────────────────
  switch (gangsterType) {
    case "GODFATHER":
      // Protect godfather: extra penalties for risky seats
      if ((DRINK_SEAT_IDS as readonly number[]).includes(seat.id)) score -= 35
      if (CORNER_SEAT_IDS.includes(seat.id)) score -= 18
      // Weapon seats expose godfather to retaliation — slight penalty
      if (seat.item === "GUN") score -= 12
      if (seat.item === "KNIFE") score -= 12
      // Income seats are safe and valuable
      if (seat.item === "CASH_REGISTER") score += 15
      if (seat.item && SEATING_BUSINESS_ITEMS.includes(seat.item)) score += 10
      break

    case "GUNMAN":
      // GUNMAN can already fire from any seat — GUN seat wastes a strategic position
      if (seat.item === "GUN") score -= 20
      // Place gunmen at income seats or knife seats (enables knife use without waste)
      if (seat.item === "KNIFE") score += 10
      if (seat.item && SEATING_BUSINESS_ITEMS.includes(seat.item)) score += 8
      break

    case "BLADESLINGER":
      // BLADESLINGER can already knife from any seat — KNIFE seat is wasted on them
      if (seat.item === "KNIFE") score -= 15
      // Bladeslinger at GUN seat gains shooting ability (non-obvious value)
      if (seat.item === "GUN") score += 18
      if (seat.item && SEATING_BUSINESS_ITEMS.includes(seat.item)) score += 8
      break

    case "THUG":
      // THUG needs weapon seats to be offensively useful
      if (seat.item === "GUN") score += 28
      if (seat.item === "KNIFE") score += 22
      if (seat.item && SEATING_BUSINESS_ITEMS.includes(seat.item)) score += 5
      break
  }

  return score
}

/**
 * Decide the best (gangsterId, seatId) pair for a bot during manual/raid seating.
 * Greedy: scores every combination and returns the highest.
 */
export function decideBotSeating(
  state: GameState,
  botId: string,
  gangsterIdsToPlace: string[],
  availableSeatIds: number[],
): { gangsterId: string; seatId: number } | null {
  const player = state.players.find((p) => p.id === botId)
  if (!player || gangsterIdsToPlace.length === 0 || availableSeatIds.length === 0) return null

  // Businesses the bot already partially controls (for monopoly targeting)
  const ownedTypes = new Set<string>()
  for (const g of player.gangsters) {
    if (g.position === null) continue
    const pos = state.board.find((p) => p.id === g.position)
    if (pos?.item && SEATING_BUSINESS_ITEMS.includes(pos.item)) ownedTypes.add(pos.item)
  }

  let bestGangsterId: string | null = null
  let bestSeatId = -1
  let bestScore = -Infinity

  for (const gangsterId of gangsterIdsToPlace) {
    const gangster = player.gangsters.find((g) => g.id === gangsterId)
    if (!gangster) continue

    for (const seatId of availableSeatIds) {
      const seat = state.board.find((p) => p.id === seatId)
      if (!seat) continue

      const score = scorePlacement(gangster.type, seat, ownedTypes)
      if (score > bestScore) {
        bestScore = score
        bestGangsterId = gangsterId
        bestSeatId = seatId
      }
    }
  }

  if (!bestGangsterId || bestSeatId === -1) return null
  return { gangsterId: bestGangsterId, seatId: bestSeatId }
}
