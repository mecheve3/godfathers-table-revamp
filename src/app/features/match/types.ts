export type MatchMode = 'quick' | 'create' | 'join'

export type MatchConfig = {
  mode: MatchMode
  playerName?: string
  roomCode?: string
  settings?: {
    maxPlayers: number
    seating: 'automatic' | 'manual'
    isPrivate: boolean
  }
  /** Final filled player slots — set just before navigating to /game */
  slots?: LobbySlot[]
}

/** Cleanly separates who is sitting in each slot. */
export type SlotKind = 'host' | 'human' | 'cpu' | 'empty'

export type LobbySlot = {
  id: string
  name: string
  kind: SlotKind
}
