import type { Action, GameState } from "./types"

export function getPlayerColorName(playerId: string): string {
  switch (playerId) {
    case "player1": return "Red"
    case "player2": return "Blue"
    case "player3": return "Yellow"
    case "player4": return "Green"
    case "player5": return "Orange"
    case "player6": return "Purple"
    default: return "Unknown"
  }
}

function formatGangsterType(type: string): string {
  switch (type) {
    case "GODFATHER": return "Godfather"
    case "GUNMAN": return "Gunman"
    case "BLADESLINGER": return "Bladeslinger"
    case "THUG": return "Thug"
    default: return type
  }
}

function formatCardType(type: string): string {
  return type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Detect gangsters eliminated between preState and postState */
function findEliminated(preState: GameState, postState: GameState): string[] {
  const names: string[] = []
  for (const postPlayer of postState.players) {
    const prePlayer = preState.players.find((p) => p.id === postPlayer.id)
    if (!prePlayer) continue
    for (const gangster of postPlayer.gangsters) {
      const preGangster = prePlayer.gangsters.find((g) => g.id === gangster.id)
      if (preGangster && preGangster.position !== null && gangster.position === null) {
        const color = getPlayerColorName(postPlayer.id)
        names.push(`${color} ${formatGangsterType(gangster.type)}`)
      }
    }
  }
  return names
}

/** Detect gangsters put to sleep between preState and postState */
function findPutToSleep(preState: GameState, postState: GameState): string[] {
  const names: string[] = []
  for (const postPlayer of postState.players) {
    const prePlayer = preState.players.find((p) => p.id === postPlayer.id)
    if (!prePlayer) continue
    for (const gangster of postPlayer.gangsters) {
      const preGangster = prePlayer.gangsters.find((g) => g.id === gangster.id)
      if (preGangster && preGangster.status !== "sleeping" && gangster.status === "sleeping") {
        const color = getPlayerColorName(postPlayer.id)
        names.push(`${color} ${formatGangsterType(gangster.type)}`)
      }
    }
  }
  return names
}

export function buildActionLog(action: Action, preState: GameState, postState: GameState): string {
  const actorPlayer = preState.players.find((p) => p.id === action.playerId)
  if (!actorPlayer) return ""
  const actorColor = getPlayerColorName(action.playerId)
  const eliminated = findEliminated(preState, postState)

  switch (action.type) {
    case "KNIFE": {
      const gangster = actorPlayer.gangsters[action.gangsterId as number]
      if (!gangster) return `${actorPlayer.name} plays Knife`
      const actorPos = preState.board.find((p) => p.id === gangster.position)
      const targetSeatId = action.direction === "left" ? actorPos?.leftId : actorPos?.rightId
      const targetOccupant = targetSeatId != null ? preState.board.find((p) => p.id === targetSeatId)?.occupiedBy : null
      let targetDesc = ""
      if (targetOccupant) {
        const targetPlayer = preState.players.find((p) => p.id === targetOccupant.playerId)
        const targetGangster = targetPlayer?.gangsters.find((g) => g.id === targetOccupant.gangsterId)
        if (targetGangster && targetPlayer) {
          const victimColor = getPlayerColorName(targetPlayer.id)
          targetDesc = ` → ${eliminated.length > 0 ? "eliminates" : "attacks"} ${victimColor} ${formatGangsterType(targetGangster.type)}`
        }
      }
      return `${actorColor} ${formatGangsterType(gangster.type)} plays Knife${targetDesc}`
    }

    case "GUN": {
      const gangster = actorPlayer.gangsters[action.gangsterId as number]
      if (!gangster) return `${actorPlayer.name} plays Gun`
      const actorPos = preState.board.find((p) => p.id === gangster.position)
      const targetSeatId = actorPos?.frontId ?? null
      const targetOccupant = targetSeatId != null ? preState.board.find((p) => p.id === targetSeatId)?.occupiedBy : null
      let targetDesc = ""
      if (targetOccupant) {
        const targetPlayer = preState.players.find((p) => p.id === targetOccupant.playerId)
        const targetGangster = targetPlayer?.gangsters.find((g) => g.id === targetOccupant.gangsterId)
        if (targetGangster && targetPlayer) {
          const victimColor = getPlayerColorName(targetPlayer.id)
          targetDesc = ` → ${eliminated.length > 0 ? "eliminates" : "misses"} ${victimColor} ${formatGangsterType(targetGangster.type)}`
        }
      } else {
        targetDesc = " → misses (empty seat)"
      }
      return `${actorColor} ${formatGangsterType(gangster.type)} plays Gun${targetDesc}`
    }

    case "DISPLACEMENT": {
      const gangster = actorPlayer.gangsters[action.gangsterId as number]
      if (!gangster) return `${actorPlayer.name} plays Displacement`
      const fromSeat = gangster.position
      const toSeat = action.targetPositionId
      // Check if an enemy was displaced (occupied seat picked)
      const occupant = toSeat != null ? preState.board.find((p) => p.id === toSeat)?.occupiedBy : null
      if (occupant) {
        const displaced = preState.players.find((p) => p.id === occupant.playerId)
        const dispGangster = displaced?.gangsters.find((g) => g.id === occupant.gangsterId)
        if (dispGangster && displaced) {
          const victimColor = getPlayerColorName(displaced.id)
          return `${actorColor} ${formatGangsterType(gangster.type)} displaces ${victimColor} ${formatGangsterType(dispGangster.type)} (seat ${fromSeat} → ${toSeat})`
        }
      }
      return `${actorColor} ${formatGangsterType(gangster.type)} moves to seat ${toSeat} (from ${fromSeat})`
    }

    case "ORDER_CAKE": {
      return `${actorColor} team orders a cake bomb at seat ${action.targetPositionId}`
    }

    case "PASS_CAKE": {
      const cake = preState.cakes.find((c) => c.id === action.cakeId)
      if (!cake) return `${actorColor} team passes a cake bomb`
      const fromSeat = cake.seatId
      const fromPos = preState.board.find((p) => p.id === fromSeat)
      const toSeat = action.direction === "left" ? fromPos?.leftId : fromPos?.rightId
      return `${actorColor} team passes cake bomb (seat ${fromSeat} → ${toSeat})`
    }

    case "EXPLODE_CAKE": {
      const cake = preState.cakes.find((c) => c.id === action.cakeId)
      const seatDesc = cake ? ` at seat ${cake.seatId}` : ""
      if (eliminated.length > 0) {
        return `${actorColor} team detonates cake${seatDesc} → eliminates ${eliminated.join(", ")}`
      }
      return `${actorColor} team detonates cake${seatDesc} (no casualties)`
    }

    case "SLEEPING_PILLS": {
      const sleeping = findPutToSleep(preState, postState)
      if (sleeping.length > 0) {
        return `${actorColor} team drugs ${sleeping.join(", ")}`
      }
      return `${actorColor} team uses Sleeping Pills`
    }

    case "POLICE_RAID": {
      return `${actorColor} team triggers Police Raid — all gangsters cleared!`
    }

    default: {
      return `${actorColor} team plays ${formatCardType(action.type)}`
    }
  }
}

export function buildPaymentLog(playerName: string, amount: number): string {
  return `${playerName} collects $${amount.toLocaleString()} from the bank`
}

export function buildExplosionLog(playerName: string, playerId: string, preState: GameState, postState: GameState): string {
  const eliminated = findEliminated(preState, postState)
  const color = getPlayerColorName(playerId)
  if (eliminated.length > 0) {
    return `${color} team's cake bomb explodes — eliminates ${eliminated.join(", ")}`
  }
  return `${color} team's cake bomb explodes (no casualties)`
}
