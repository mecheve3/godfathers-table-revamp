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

/** Returns true if posId falls within the blast zone (center, left, right) of any active cake. */
function isInCakeBlast(state: GameState, posId: number): boolean {
  for (const cake of state.cakes) {
    const cakePos = state.board.find((p) => p.id === cake.seatId)
    if (!cakePos) continue
    if (cake.seatId === posId) return true
    if (cakePos.leftId === posId) return true
    if (cakePos.rightId === posId) return true
  }
  return false
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
  let bestScore = -1

  for (const posId of positions) {
    // Never stack a cake on a seat that already has one — it wastes the card
    if (state.cakes.some((c) => c.seatId === posId)) continue
    // Never place where own gangsters are in blast range
    if (countOwnInBlast(state, posId, botId) > 0) continue

    const enemies = countEnemiesInBlast(state, posId, botId)
    if (enemies === 0) continue

    // Tie-break: prefer a direct center hit (enemy sits exactly at the cake seat)
    // so the CPU targets the enemy directly rather than placing adjacently.
    const centerOccupant = state.board.find((p) => p.id === posId)?.occupiedBy
    const isDirectHit = !!(centerOccupant && centerOccupant.playerId !== botId)
    // enemies×2 so a 2-enemy side-hit outranks a 1-enemy direct hit, but equal
    // enemy counts resolve to the center placement.
    const score = enemies * 2 + (isDirectHit ? 1 : 0)

    if (score > bestScore) {
      bestScore = score
      bestPos = posId
    }
  }

  if (bestPos === -1) return null

  return {
    cardId: card.id,
    action: { type: "ORDER_CAKE", playerId: botId, targetPositionId: bestPos },
    log: `ORDER_CAKE at seat ${bestPos} (score ${bestScore})`,
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

/**
 * Play POLICE_RAID when severely outnumbered on the board or when most of our
 * gangsters are stuck in cake blast zones with no escape.
 */
function decidePoliceRaid(state: GameState, botId: string): BotPlay | null {
  const player = state.players.find((p) => p.id === botId)
  if (!player) return null
  const card = player.hand.find((c) => c.type === "POLICE_RAID")
  if (!card || !isCardPlayable(state, botId, card.id)) return null

  const botAlive = player.gangsters.filter((g) => g.position !== null).length
  if (botAlive === 0) return null

  // Compare against the strongest single enemy team, not the sum of all enemies.
  // Sum comparison always triggers in multi-player games (8 enemies vs 4 bots in 3p).
  const maxEnemyGroupAlive = Math.max(
    0,
    ...state.players
      .filter((p) => p.id !== botId)
      .map((p) => p.gangsters.filter((g) => g.position !== null).length),
  )

  const botInBlast = player.gangsters.filter(
    (g) => g.position !== null && isInCakeBlast(state, g.position),
  ).length

  // Severely outnumbered: the strongest single enemy team has 2+ more gangsters
  const severelyOutnumbered = maxEnemyGroupAlive >= botAlive + 2
  // Desperate: the majority of alive gangsters are trapped in blast zones
  const trapped = botAlive > 0 && botInBlast >= Math.ceil(botAlive / 2) && botInBlast >= 2

  if (!severelyOutnumbered && !trapped) return null

  return {
    cardId: card.id,
    action: { type: "POLICE_RAID", playerId: botId },
    log: `POLICE_RAID — strongestEnemy:${maxEnemyGroupAlive} bot:${botAlive} inBlast:${botInBlast}`,
  }
}

/**
 * Score a seat position for displacement targeting.
 * aliveCount: number of the bot's gangsters currently on the board —
 * CASH_REGISTER is much less valuable with only 1 gangster (nothing to multiply).
 */
function getPositionValue(item: string | null, ownedTypes: Set<string>, aliveCount: number): number {
  if (item === "CASH_REGISTER") return aliveCount <= 1 ? 1 : 5
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

  const aliveCount = player.gangsters.filter((g) => g.position !== null).length

  const businessItems = ["BAR", "GAMBLING_HOUSE", "STRIP_CLUB"]
  const ownedTypes = new Set<string>()
  for (const g of player.gangsters) {
    if (g.position === null) continue
    const pos = state.board.find((p) => p.id === g.position)
    if (pos?.item && businessItems.includes(pos.item)) ownedTypes.add(pos.item)
  }

  type Candidate = { gIdx: number; targetId: number; gain: number; label: string }
  const candidates: Candidate[] = []

  for (const gIdx of validGangsters) {
    const gangster = player.gangsters[gIdx]
    if (!gangster?.position) continue

    const currentPos = state.board.find((p) => p.id === gangster.position)
    const currentInBlast = isInCakeBlast(state, gangster.position)
    // If the gangster is already in a blast zone treat its current position as
    // deeply negative so ANY safe move scores as an improvement.
    const currentValue = currentInBlast
      ? -10
      : getPositionValue(currentPos?.item ?? null, ownedTypes, aliveCount)

    for (const targetId of emptyPositions) {
      // Never move into a blast zone — it's always a mistake
      if (isInCakeBlast(state, targetId)) continue

      const targetPos = state.board.find((p) => p.id === targetId)
      const targetValue = getPositionValue(targetPos?.item ?? null, ownedTypes, aliveCount)
      const gain = targetValue - currentValue

      // Only consider moves that strictly improve (prevents no-ops, same-type swaps,
      // and zig-zagging between seats of equal value)
      if (gain <= 0) continue

      const label = targetPos?.item ? `${targetPos.item} (seat ${targetId})` : `seat ${targetId}`
      candidates.push({ gIdx, targetId, gain, label })
    }
  }

  if (candidates.length === 0) return null

  // Pick the move with the highest gain
  candidates.sort((a, b) => b.gain - a.gain)
  const best = candidates[0]

  return {
    cardId: card.id,
    action: {
      type: "DISPLACEMENT",
      playerId: botId,
      gangsterId: best.gIdx,
      targetPositionId: best.targetId,
    },
    log: `DISPLACEMENT → ${best.label} (gain ${best.gain})`,
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
    decidePoliceRaid(state, botId) ??
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

  if (seat.item === "CASH_REGISTER") {
    score += 100
  } else if (seat.item && ownedTypes.has(seat.item)) {
    score += 85
  } else if (seat.item && SEATING_BUSINESS_ITEMS.includes(seat.item)) {
    score += 60
  } else if (seat.item === "GUN") {
    score += 30
  } else if (seat.item === "KNIFE") {
    score += 20
  } else {
    score += 5
  }

  if ((DRINK_SEAT_IDS as readonly number[]).includes(seat.id)) {
    score -= 45
  }

  if (CORNER_SEAT_IDS.includes(seat.id)) {
    score -= 12
  }

  switch (gangsterType) {
    case "GODFATHER":
      if ((DRINK_SEAT_IDS as readonly number[]).includes(seat.id)) score -= 35
      if (CORNER_SEAT_IDS.includes(seat.id)) score -= 18
      if (seat.item === "GUN") score -= 12
      if (seat.item === "KNIFE") score -= 12
      if (seat.item === "CASH_REGISTER") score += 15
      if (seat.item && SEATING_BUSINESS_ITEMS.includes(seat.item)) score += 10
      break

    case "GUNMAN":
      if (seat.item === "GUN") score -= 20
      if (seat.item === "KNIFE") score += 10
      if (seat.item && SEATING_BUSINESS_ITEMS.includes(seat.item)) score += 8
      break

    case "BLADESLINGER":
      if (seat.item === "KNIFE") score -= 15
      if (seat.item === "GUN") score += 18
      if (seat.item && SEATING_BUSINESS_ITEMS.includes(seat.item)) score += 8
      break

    case "THUG":
      if (seat.item === "GUN") score += 28
      if (seat.item === "KNIFE") score += 22
      if (seat.item && SEATING_BUSINESS_ITEMS.includes(seat.item)) score += 5
      break
  }

  return score
}

/**
 * Decide the best (gangsterId, seatId) pair for a bot during manual/raid seating.
 * Blast-zone seats are avoided — the bot only uses them when no safe seats remain.
 */
export function decideBotSeating(
  state: GameState,
  botId: string,
  gangsterIdsToPlace: string[],
  availableSeatIds: number[],
): { gangsterId: string; seatId: number } | null {
  const player = state.players.find((p) => p.id === botId)
  if (!player || gangsterIdsToPlace.length === 0 || availableSeatIds.length === 0) return null

  // Pre-compute all seats currently in a cake blast zone
  const blastSeatIds = new Set<number>()
  for (const cake of state.cakes) {
    const cakePos = state.board.find((p) => p.id === cake.seatId)
    if (!cakePos) continue
    blastSeatIds.add(cake.seatId)
    if (cakePos.leftId != null) blastSeatIds.add(cakePos.leftId)
    if (cakePos.rightId != null) blastSeatIds.add(cakePos.rightId)
  }

  // Prefer seats outside blast zones; fall back to all seats only when necessary
  const safeSeats = availableSeatIds.filter((id) => !blastSeatIds.has(id))
  const seatsToScore = safeSeats.length > 0 ? safeSeats : availableSeatIds

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

    for (const seatId of seatsToScore) {
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
