// Game state types
export interface GameState {
  players: Player[]
  board: Position[]
  bankMoney: number
  turn: number
  deck: Card[]
  discardPile: Card[]
  currentPhase: GamePhase
  cakes: CakeBomb[] // Added cakes array to track cake bombs
  selectedCakeId?: string // Track selected cake for PASS_CAKE or EXPLODE_CAKE action
  removedCards: Card[] // Permanently removed cards (e.g. Police Raid — never reshuffled)
}

// Player type
export interface Player {
  id: string
  name: string
  money: number
  gangsters: Gangster[]
  hand: Card[]
}

// Gangster type
export interface Gangster {
  id: string
  type: GangsterType
  position: number | null // null means eliminated
  status?: "sleeping"
  sleepingFrom?: string // playerId that administered the first pill
}

// Gangster types
export type GangsterType = "GODFATHER" | "GUNMAN" | "BLADESLINGER" | "THUG"

// Board position
export interface Position {
  id: number
  item: string | null // KNIFE, GUN, CASH_REGISTER, BAR, GAMBLING_HOUSE, STRIP_CLUB, or null
  rightId: number
  leftId: number
  frontId: number | null
  tableSide: string
  occupiedBy: {
    playerId: string
    gangsterId: string
  } | null
}

// Card types
export type CardType = "KNIFE" | "GUN" | "DISPLACEMENT" | "ORDER_CAKE" | "PASS_CAKE" | "EXPLODE_CAKE" | "SLEEPING_PILLS" | "POLICE_RAID"

// Card interface
export interface Card {
  id: string
  type: CardType
}

// Action types
export type ActionType = "KNIFE" | "GUN" | "DISPLACEMENT" | "ORDER_CAKE" | "PASS_CAKE" | "EXPLODE_CAKE" | "SLEEPING_PILLS" | "POLICE_RAID"

// Action interface
export interface Action {
  type: ActionType
  playerId: string
  gangsterId?: number
  direction?: "left" | "right"
  targetPositionId?: number
  cakeId?: string
  pillTargetGangsterIds?: string[] // For SLEEPING_PILLS action
}

// Game phases
export type GamePhase =
  | "SELECT_CARD"
  | "SELECT_GANGSTER"
  | "SELECT_CAKE"
  | "SELECT_DIRECTION"
  | "SELECT_TARGET"
  | "CONFIRM_ACTION"
  | "SELECT_DISCARD"
  | "SECOND_DISPLACEMENT"
  | "END_TURN"
  | "SELECT_PILL_TARGET_1"
  | "SELECT_PILL_TARGET_2"
  | "SELECT_PILL_TARGET_3"
  | "CONFIRM_PILLS"
  | "SEATING_SELECT_GANGSTER"
  | "SEATING_SELECT_SEAT"
  | "SEATING_CONFIRM"

// Board positions that have drinks (valid targets for Sleeping Pills)
export const DRINK_SEAT_IDS: readonly number[] = [5, 6, 8, 9, 14, 20, 21, 25, 29]

// Cake bomb interface
export interface CakeBomb {
  id: string
  seatId: number
  ownerId: string
  roundPlaced: number
  color: string
}
