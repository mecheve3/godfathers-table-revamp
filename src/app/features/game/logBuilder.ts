import type { Action, GameState } from "./types"

type TFn = (key: string, vars?: Record<string, string | number>) => string

export function getPlayerColorName(playerId: string, t: TFn): string {
  switch (playerId) {
    case "player1": return t("log.color.red")
    case "player2": return t("log.color.blue")
    case "player3": return t("log.color.yellow")
    case "player4": return t("log.color.green")
    case "player5": return t("log.color.orange")
    case "player6": return t("log.color.purple")
    default: return "Unknown"
  }
}

function formatGangsterType(type: string, t: TFn): string {
  switch (type) {
    case "GODFATHER":   return t("log.gangster.godfather")
    case "GUNMAN":      return t("log.gangster.gunman")
    case "BLADESLINGER": return t("log.gangster.bladeslinger")
    case "THUG":        return t("log.gangster.thug")
    default: return type
  }
}

function formatCardType(type: string): string {
  return type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Detect gangsters eliminated between preState and postState */
function findEliminated(preState: GameState, postState: GameState, t: TFn): string[] {
  const names: string[] = []
  for (const postPlayer of postState.players) {
    const prePlayer = preState.players.find((p) => p.id === postPlayer.id)
    if (!prePlayer) continue
    for (const gangster of postPlayer.gangsters) {
      const preGangster = prePlayer.gangsters.find((g) => g.id === gangster.id)
      if (preGangster && preGangster.position !== null && gangster.position === null) {
        const color = getPlayerColorName(postPlayer.id, t)
        names.push(`${color} ${formatGangsterType(gangster.type, t)}`)
      }
    }
  }
  return names
}

/** Detect gangsters put to sleep between preState and postState */
function findPutToSleep(preState: GameState, postState: GameState, t: TFn): string[] {
  const names: string[] = []
  for (const postPlayer of postState.players) {
    const prePlayer = preState.players.find((p) => p.id === postPlayer.id)
    if (!prePlayer) continue
    for (const gangster of postPlayer.gangsters) {
      const preGangster = prePlayer.gangsters.find((g) => g.id === gangster.id)
      if (preGangster && preGangster.status !== "sleeping" && gangster.status === "sleeping") {
        const color = getPlayerColorName(postPlayer.id, t)
        names.push(`${color} ${formatGangsterType(gangster.type, t)}`)
      }
    }
  }
  return names
}

export function buildActionLog(action: Action, preState: GameState, postState: GameState, t: TFn): string {
  const actorPlayer = preState.players.find((p) => p.id === action.playerId)
  if (!actorPlayer) return ""
  const actorColor = getPlayerColorName(action.playerId, t)
  const eliminated = findEliminated(preState, postState, t)

  switch (action.type) {
    case "KNIFE": {
      const gangster = actorPlayer.gangsters[action.gangsterId as number]
      if (!gangster) return t("log.knife.no_target", { actor: actorColor, type: "" })
      const actorPos = preState.board.find((p) => p.id === gangster.position)
      const targetSeatId = action.direction === "left" ? actorPos?.leftId : actorPos?.rightId
      const targetOccupant = targetSeatId != null ? preState.board.find((p) => p.id === targetSeatId)?.occupiedBy : null
      const gangsterName = formatGangsterType(gangster.type, t)
      if (targetOccupant) {
        const targetPlayer = preState.players.find((p) => p.id === targetOccupant.playerId)
        const targetGangster = targetPlayer?.gangsters.find((g) => g.id === targetOccupant.gangsterId)
        if (targetGangster && targetPlayer) {
          const victimColor = getPlayerColorName(targetPlayer.id, t)
          const victim = `${victimColor} ${formatGangsterType(targetGangster.type, t)}`
          const key = eliminated.length > 0 ? "log.knife.eliminates" : "log.knife.attacks"
          return t(key, { actor: actorColor, type: gangsterName, victim })
        }
      }
      return t("log.knife.no_target", { actor: actorColor, type: gangsterName })
    }

    case "GUN": {
      const gangster = actorPlayer.gangsters[action.gangsterId as number]
      if (!gangster) return t("log.gun.no_target", { actor: actorColor, type: "" })
      const actorPos = preState.board.find((p) => p.id === gangster.position)
      const targetSeatId = actorPos?.frontId ?? null
      const targetOccupant = targetSeatId != null ? preState.board.find((p) => p.id === targetSeatId)?.occupiedBy : null
      const gangsterName = formatGangsterType(gangster.type, t)
      if (targetOccupant) {
        const targetPlayer = preState.players.find((p) => p.id === targetOccupant.playerId)
        const targetGangster = targetPlayer?.gangsters.find((g) => g.id === targetOccupant.gangsterId)
        if (targetGangster && targetPlayer) {
          const victimColor = getPlayerColorName(targetPlayer.id, t)
          const victim = `${victimColor} ${formatGangsterType(targetGangster.type, t)}`
          const key = eliminated.length > 0 ? "log.gun.eliminates" : "log.gun.misses"
          return t(key, { actor: actorColor, type: gangsterName, victim })
        }
      }
      return t("log.gun.misses_empty", { actor: actorColor, type: gangsterName })
    }

    case "DISPLACEMENT": {
      const gangster = actorPlayer.gangsters[action.gangsterId as number]
      if (!gangster) return t("log.displacement.moves", { actor: actorColor, type: "", to: String(action.targetPositionId), from: "?" })
      const gangsterName = formatGangsterType(gangster.type, t)
      const fromSeat = String(gangster.position)
      const toSeat = String(action.targetPositionId)
      const occupant = action.targetPositionId != null ? preState.board.find((p) => p.id === action.targetPositionId)?.occupiedBy : null
      if (occupant) {
        const displaced = preState.players.find((p) => p.id === occupant.playerId)
        const dispGangster = displaced?.gangsters.find((g) => g.id === occupant.gangsterId)
        if (dispGangster && displaced) {
          const victimColor = getPlayerColorName(displaced.id, t)
          const victim = `${victimColor} ${formatGangsterType(dispGangster.type, t)}`
          return t("log.displacement.displaces", { actor: actorColor, type: gangsterName, victim, from: fromSeat, to: toSeat })
        }
      }
      return t("log.displacement.moves", { actor: actorColor, type: gangsterName, to: toSeat, from: fromSeat })
    }

    case "ORDER_CAKE":
      return t("log.ordercake", { actor: actorColor, pos: String(action.targetPositionId) })

    case "PASS_CAKE": {
      const cake = preState.cakes.find((c) => c.id === action.cakeId)
      if (!cake) return t("log.passcake", { actor: actorColor, from: "?", to: "?" })
      const fromSeat = String(cake.seatId)
      const fromPos = preState.board.find((p) => p.id === cake.seatId)
      const toSeat = String(action.direction === "left" ? fromPos?.leftId : fromPos?.rightId)
      return t("log.passcake", { actor: actorColor, from: fromSeat, to: toSeat })
    }

    case "EXPLODE_CAKE": {
      const cake = preState.cakes.find((c) => c.id === action.cakeId)
      const seatDesc = cake ? t("log.at_seat", { pos: String(cake.seatId) }) : ""
      if (eliminated.length > 0) {
        return t("log.explodecake.eliminates", { actor: actorColor, seat: seatDesc, victims: eliminated.join(", ") })
      }
      return t("log.explodecake.no_casualties", { actor: actorColor, seat: seatDesc })
    }

    case "SLEEPING_PILLS": {
      const sleeping = findPutToSleep(preState, postState, t)
      if (sleeping.length > 0) {
        return t("log.pills.drugs", { actor: actorColor, victims: sleeping.join(", ") })
      }
      return t("log.pills.uses", { actor: actorColor })
    }

    case "POLICE_RAID":
      return t("log.policeraid", { actor: actorColor })

    default:
      return t("log.plays_card", { actor: actorColor, card: formatCardType(action.type) })
  }
}

export function buildPaymentLog(playerName: string, amount: number, t: TFn, breakdown?: import('./game-logic').PaymentBreakdown): string {
  const base = t("log.payment", { name: playerName, amount: amount.toLocaleString() })
  if (!breakdown) return base

  const parts: string[] = []
  if (breakdown.godfather > 0)     parts.push(t("log.payment.godfather", { amount: breakdown.godfather.toLocaleString() }))
  if (breakdown.bar > 0)           parts.push(t("log.payment.bar",       { amount: breakdown.bar.toLocaleString() }))
  if (breakdown.casino > 0)        parts.push(t("log.payment.casino",    { amount: breakdown.casino.toLocaleString() }))
  if (breakdown.stripClub > 0)     parts.push(t("log.payment.strip_club",{ amount: breakdown.stripClub.toLocaleString() }))
  if (breakdown.monopolyBonus > 0) parts.push(t("log.payment.monopoly",  { amount: breakdown.monopolyBonus.toLocaleString() }))
  if (breakdown.hasCashRegister)   parts.push(t("log.payment.register"))

  return parts.length > 0 ? `${base} (${parts.join(' · ')})` : base
}

export function buildExplosionLog(playerName: string, playerId: string, preState: GameState, postState: GameState, t: TFn): string {
  const eliminated = findEliminated(preState, postState, t)
  const color = getPlayerColorName(playerId, t)
  if (eliminated.length > 0) {
    return t("log.explosion.eliminates", { color, victims: eliminated.join(", ") })
  }
  return t("log.explosion.no_casualties", { color })
}
