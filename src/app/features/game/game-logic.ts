import type { GameState, Player, Position, Action, Card, CardType, CakeBomb } from "./types"
import { DRINK_SEAT_IDS } from "./types"

// Initial board setup
const createInitialBoard = (): Position[] => {
  const board: Position[] = []

  // Create positions based on the provided board layout
  board.push({
    id: 1,
    item: "CASH_REGISTER",
    rightId: 2,
    leftId: 30,
    frontId: 16,
    tableSide: "A",
    occupiedBy: { playerId: "player2", gangsterId: "blue-thug-1" },
  })
  board.push({
    id: 2,
    item: null,
    rightId: 3,
    leftId: 1,
    frontId: null,
    tableSide: "B",
    occupiedBy: { playerId: "player3", gangsterId: "yellow-bladeslinger-1" },
  })
  board.push({
    id: 3,
    item: "KNIFE",
    rightId: 4,
    leftId: 2,
    frontId: null,
    tableSide: "B",
    occupiedBy: { playerId: "player2", gangsterId: "blue-thug-2" },
  })
  board.push({
    id: 4,
    item: "GAMBLING_HOUSE",
    rightId: 5,
    leftId: 3,
    frontId: 28,
    tableSide: "C",
    occupiedBy: { playerId: "player3", gangsterId: "yellow-gunman-1" },
  })
  board.push({
    id: 5,
    item: "GUN",
    rightId: 6,
    leftId: 4,
    frontId: 27,
    tableSide: "C",
    occupiedBy: { playerId: "player2", gangsterId: "blue-thug-3" },
  })
  board.push({
    id: 6,
    item: null,
    rightId: 7,
    leftId: 5,
    frontId: 26,
    tableSide: "C",
    occupiedBy: { playerId: "player1", gangsterId: "red-godfather" },
  })
  board.push({
    id: 7,
    item: "BAR",
    rightId: 8,
    leftId: 6,
    frontId: 25,
    tableSide: "C",
    occupiedBy: { playerId: "player2", gangsterId: "blue-bladeslinger-1" },
  })
  board.push({
    id: 8,
    item: null,
    rightId: 9,
    leftId: 7,
    frontId: 24,
    tableSide: "C",
    occupiedBy: { playerId: "player1", gangsterId: "red-bladeslinger-1" },
  })
  board.push({
    id: 9,
    item: "GUN",
    rightId: 10,
    leftId: 8,
    frontId: 23,
    tableSide: "C",
    occupiedBy: { playerId: "player3", gangsterId: "yellow-thug-1" },
  })
  board.push({
    id: 10,
    item: null,
    rightId: 11,
    leftId: 9,
    frontId: 22,
    tableSide: "C",
    occupiedBy: { playerId: "player2", gangsterId: "blue-gunman-1" },
  })
  board.push({
    id: 11,
    item: "KNIFE",
    rightId: 12,
    leftId: 10,
    frontId: 21,
    tableSide: "C",
    occupiedBy: { playerId: "player1", gangsterId: "red-thug-1" },
  })
  board.push({
    id: 12,
    item: "STRIP_CLUB",
    rightId: 13,
    leftId: 11,
    frontId: 20,
    tableSide: "C",
    occupiedBy: { playerId: "player1", gangsterId: "red-gunman-1" },
  })
  board.push({
    id: 13,
    item: "GUN",
    rightId: 14,
    leftId: 12,
    frontId: 19,
    tableSide: "C",
    occupiedBy: { playerId: "player2", gangsterId: "blue-thug-4" },
  })
  board.push({
    id: 14,
    item: null,
    rightId: 15,
    leftId: 13,
    frontId: null,
    tableSide: "D",
    occupiedBy: { playerId: "player1", gangsterId: "red-thug-2" },
  })
  board.push({
    id: 15,
    item: "KNIFE",
    rightId: 16,
    leftId: 14,
    frontId: null,
    tableSide: "D",
    occupiedBy: { playerId: "player3", gangsterId: "yellow-thug-2" },
  })
  board.push({
    id: 16,
    item: "GUN",
    rightId: 17,
    leftId: 15,
    frontId: 1,
    tableSide: "E",
    occupiedBy: { playerId: "player1", gangsterId: "red-thug-3" },
  })
  board.push({
    id: 17,
    item: "KNIFE",
    rightId: 18,
    leftId: 16,
    frontId: null,
    tableSide: "F",
    occupiedBy: { playerId: "player2", gangsterId: "blue-thug-5" },
  })
  board.push({
    id: 18,
    item: null,
    rightId: 19,
    leftId: 17,
    frontId: null,
    tableSide: "F",
    occupiedBy: { playerId: "player3", gangsterId: "yellow-bladeslinger-2" },
  })
  board.push({
    id: 19,
    item: "BAR",
    rightId: 20,
    leftId: 18,
    frontId: 13,
    tableSide: "G",
    occupiedBy: { playerId: "player1", gangsterId: "red-gunman-2" },
  })
  board.push({
    id: 20,
    item: null,
    rightId: 21,
    leftId: 19,
    frontId: 12,
    tableSide: "G",
    occupiedBy: { playerId: "player3", gangsterId: "yellow-godfather" },
  })
  board.push({
    id: 21,
    item: "GUN",
    rightId: 22,
    leftId: 20,
    frontId: 11,
    tableSide: "G",
    occupiedBy: { playerId: "player3", gangsterId: "yellow-thug-3" },
  })
  board.push({
    id: 22,
    item: null,
    rightId: 23,
    leftId: 21,
    frontId: 10,
    tableSide: "G",
    occupiedBy: { playerId: "player2", gangsterId: "blue-bladeslinger-2" },
  })
  board.push({
    id: 23,
    item: "GAMBLING_HOUSE",
    rightId: 24,
    leftId: 22,
    frontId: 9,
    tableSide: "G",
    occupiedBy: { playerId: "player2", gangsterId: "blue-gunman-2" },
  })
  board.push({
    id: 24,
    item: "KNIFE",
    rightId: 25,
    leftId: 23,
    frontId: 8,
    tableSide: "G",
    occupiedBy: { playerId: "player3", gangsterId: "yellow-thug-4" },
  })
  board.push({
    id: 25,
    item: "GUN",
    rightId: 26,
    leftId: 24,
    frontId: 7,
    tableSide: "G",
    occupiedBy: { playerId: "player1", gangsterId: "red-thug-4" },
  })
  board.push({
    id: 26,
    item: null,
    rightId: 27,
    leftId: 25,
    frontId: 6,
    tableSide: "G",
    occupiedBy: { playerId: "player1", gangsterId: "red-bladeslinger-2" },
  })
  board.push({
    id: 27,
    item: "STRIP_CLUB",
    rightId: 28,
    leftId: 26,
    frontId: 5,
    tableSide: "G",
    occupiedBy: { playerId: "player3", gangsterId: "yellow-gunman-2" },
  })
  board.push({
    id: 28,
    item: "GUN",
    rightId: 29,
    leftId: 27,
    frontId: 4,
    tableSide: "G",
    occupiedBy: { playerId: "player1", gangsterId: "red-thug-5" },
  })
  board.push({
    id: 29,
    item: null,
    rightId: 30,
    leftId: 28,
    frontId: null,
    tableSide: "H",
    occupiedBy: { playerId: "player3", gangsterId: "yellow-thug-5" },
  })
  board.push({
    id: 30,
    item: null,
    rightId: 1,
    leftId: 29,
    frontId: null,
    tableSide: "H",
    occupiedBy: { playerId: "player2", gangsterId: "blue-godfather" },
  })

  return board
}

// Create 4-player board — same physical layout, different occupancy
const createInitialBoard4 = (): Position[] => {
  const board = createInitialBoard()
  const occupancy: Record<number, { playerId: string; gangsterId: string } | null> = {
    1:  null,
    2:  { playerId: "player4", gangsterId: "green-bladeslinger-1" },
    3:  { playerId: "player1", gangsterId: "red-thug-1" },
    4:  { playerId: "player2", gangsterId: "blue-bladeslinger-1" },
    5:  { playerId: "player4", gangsterId: "green-thug-1" },
    6:  { playerId: "player3", gangsterId: "yellow-godfather" },
    7:  { playerId: "player1", gangsterId: "red-bladeslinger-1" },
    8:  { playerId: "player4", gangsterId: "green-thug-2" },
    9:  { playerId: "player2", gangsterId: "blue-godfather" },
    10: { playerId: "player3", gangsterId: "yellow-gunman-1" },
    11: { playerId: "player1", gangsterId: "red-thug-2" },
    12: { playerId: "player2", gangsterId: "blue-gunman-1" },
    13: { playerId: "player2", gangsterId: "blue-bladeslinger-2" },
    14: { playerId: "player4", gangsterId: "green-thug-3" },
    15: { playerId: "player2", gangsterId: "blue-thug-1" },
    16: null,
    17: { playerId: "player3", gangsterId: "yellow-bladeslinger-1" },
    18: { playerId: "player1", gangsterId: "red-bladeslinger-2" },
    19: { playerId: "player3", gangsterId: "yellow-thug-1" },
    20: { playerId: "player1", gangsterId: "red-godfather" },
    21: { playerId: "player2", gangsterId: "blue-thug-2" },
    22: { playerId: "player3", gangsterId: "yellow-thug-2" },
    23: { playerId: "player4", gangsterId: "green-gunman-1" },
    24: { playerId: "player1", gangsterId: "red-thug-3" },
    25: { playerId: "player3", gangsterId: "yellow-bladeslinger-2" },
    26: { playerId: "player2", gangsterId: "blue-thug-3" },
    27: { playerId: "player1", gangsterId: "red-gunman-1" },
    28: { playerId: "player4", gangsterId: "green-bladeslinger-2" },
    29: { playerId: "player3", gangsterId: "yellow-thug-3" },
    30: { playerId: "player4", gangsterId: "green-godfather" },
  }
  return board.map((pos) => ({ ...pos, occupiedBy: occupancy[pos.id] ?? null }))
}

// Create initial players
const createInitialPlayers = (): Player[] => {
  return [
    {
      id: "player1",
      name: "Red Family",
      money: 0,
      hand: [],
      gangsters: [
        { id: "red-godfather", type: "GODFATHER", position: 6 },
        { id: "red-gunman-1", type: "GUNMAN", position: 12 },
        { id: "red-gunman-2", type: "GUNMAN", position: 19 },
        { id: "red-bladeslinger-1", type: "BLADESLINGER", position: 8 },
        { id: "red-bladeslinger-2", type: "BLADESLINGER", position: 26 },
        { id: "red-thug-1", type: "THUG", position: 11 },
        { id: "red-thug-2", type: "THUG", position: 14 },
        { id: "red-thug-3", type: "THUG", position: 16 },
        { id: "red-thug-4", type: "THUG", position: 25 },
        { id: "red-thug-5", type: "THUG", position: 28 },
      ],
    },
    {
      id: "player2",
      name: "Blue Family",
      money: 0,
      hand: [],
      gangsters: [
        { id: "blue-godfather", type: "GODFATHER", position: 30 },
        { id: "blue-gunman-1", type: "GUNMAN", position: 10 },
        { id: "blue-gunman-2", type: "GUNMAN", position: 23 },
        { id: "blue-bladeslinger-1", type: "BLADESLINGER", position: 7 },
        { id: "blue-bladeslinger-2", type: "BLADESLINGER", position: 22 },
        { id: "blue-thug-1", type: "THUG", position: 1 },
        { id: "blue-thug-2", type: "THUG", position: 3 },
        { id: "blue-thug-3", type: "THUG", position: 5 },
        { id: "blue-thug-4", type: "THUG", position: 13 },
        { id: "blue-thug-5", type: "THUG", position: 17 },
      ],
    },
    {
      id: "player3",
      name: "Yellow Family",
      money: 0,
      hand: [],
      gangsters: [
        { id: "yellow-godfather", type: "GODFATHER", position: 20 },
        { id: "yellow-gunman-1", type: "GUNMAN", position: 4 },
        { id: "yellow-gunman-2", type: "GUNMAN", position: 27 },
        { id: "yellow-bladeslinger-1", type: "BLADESLINGER", position: 2 },
        { id: "yellow-bladeslinger-2", type: "BLADESLINGER", position: 18 },
        { id: "yellow-thug-1", type: "THUG", position: 9 },
        { id: "yellow-thug-2", type: "THUG", position: 15 },
        { id: "yellow-thug-3", type: "THUG", position: 21 },
        { id: "yellow-thug-4", type: "THUG", position: 24 },
        { id: "yellow-thug-5", type: "THUG", position: 29 },
      ],
    },
  ]
}

// Create 4-player roster: 1 Godfather, 1 Gunman, 2 Bladesingers, 3 Thugs per team
const createInitialPlayers4 = (): Player[] => {
  return [
    {
      id: "player1",
      name: "Red Family",
      money: 0,
      hand: [],
      gangsters: [
        { id: "red-godfather",       type: "GODFATHER",    position: 20 },
        { id: "red-gunman-1",        type: "GUNMAN",       position: 27 },
        { id: "red-bladeslinger-1",  type: "BLADESLINGER", position: 7  },
        { id: "red-bladeslinger-2",  type: "BLADESLINGER", position: 18 },
        { id: "red-thug-1",          type: "THUG",         position: 3  },
        { id: "red-thug-2",          type: "THUG",         position: 11 },
        { id: "red-thug-3",          type: "THUG",         position: 24 },
      ],
    },
    {
      id: "player2",
      name: "Blue Family",
      money: 0,
      hand: [],
      gangsters: [
        { id: "blue-godfather",      type: "GODFATHER",    position: 9  },
        { id: "blue-gunman-1",       type: "GUNMAN",       position: 12 },
        { id: "blue-bladeslinger-1", type: "BLADESLINGER", position: 4  },
        { id: "blue-bladeslinger-2", type: "BLADESLINGER", position: 13 },
        { id: "blue-thug-1",         type: "THUG",         position: 15 },
        { id: "blue-thug-2",         type: "THUG",         position: 21 },
        { id: "blue-thug-3",         type: "THUG",         position: 26 },
      ],
    },
    {
      id: "player3",
      name: "Yellow Family",
      money: 0,
      hand: [],
      gangsters: [
        { id: "yellow-godfather",      type: "GODFATHER",    position: 6  },
        { id: "yellow-gunman-1",       type: "GUNMAN",       position: 10 },
        { id: "yellow-bladeslinger-1", type: "BLADESLINGER", position: 17 },
        { id: "yellow-bladeslinger-2", type: "BLADESLINGER", position: 25 },
        { id: "yellow-thug-1",         type: "THUG",         position: 19 },
        { id: "yellow-thug-2",         type: "THUG",         position: 22 },
        { id: "yellow-thug-3",         type: "THUG",         position: 29 },
      ],
    },
    {
      id: "player4",
      name: "Green Family",
      money: 0,
      hand: [],
      gangsters: [
        { id: "green-godfather",      type: "GODFATHER",    position: 30 },
        { id: "green-gunman-1",       type: "GUNMAN",       position: 23 },
        { id: "green-bladeslinger-1", type: "BLADESLINGER", position: 2  },
        { id: "green-bladeslinger-2", type: "BLADESLINGER", position: 28 },
        { id: "green-thug-1",         type: "THUG",         position: 5  },
        { id: "green-thug-2",         type: "THUG",         position: 8  },
        { id: "green-thug-3",         type: "THUG",         position: 14 },
      ],
    },
  ]
}

// Create initial deck of cards
const createInitialDeck = (): Card[] => {
  const deck: Card[] = []

  // Add 9 Knife cards
  for (let i = 1; i <= 9; i++) {
    deck.push({ id: `knife-${i}`, type: "KNIFE" })
  }

  // Add 9 Gun cards
  for (let i = 1; i <= 9; i++) {
    deck.push({ id: `gun-${i}`, type: "GUN" })
  }

  // Add 16 Displacement cards
  for (let i = 1; i <= 16; i++) {
    deck.push({ id: `displacement-${i}`, type: "DISPLACEMENT" })
  }

  // Add 8 Order Cake cards
  for (let i = 1; i <= 8; i++) {
    deck.push({ id: `order-cake-${i}`, type: "ORDER_CAKE" })
  }

  // Add 6 Pass Cake cards
  for (let i = 1; i <= 6; i++) {
    deck.push({ id: `pass-cake-${i}`, type: "PASS_CAKE" })
  }

  // Add 4 Explode Cake cards
  for (let i = 1; i <= 4; i++) {
    deck.push({ id: `explode-cake-${i}`, type: "EXPLODE_CAKE" })
  }

  // Add 6 Sleeping Pills cards
  for (let i = 1; i <= 6; i++) {
    deck.push({ id: `sleeping-pills-${i}`, type: "SLEEPING_PILLS" })
  }

  // Add 2 Police Raid cards
  for (let i = 1; i <= 2; i++) {
    deck.push({ id: `police-raid-${i}`, type: "POLICE_RAID" })
  }

  // Shuffle the deck
  return shuffleDeck(deck)
}

// Shuffle deck function using Fisher-Yates algorithm for true randomization
export const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck]

  // Fisher-Yates shuffle algorithm
  for (let i = shuffled.length - 1; i > 0; i--) {
    // Generate a random index between 0 and i (inclusive)
    const j = Math.floor(Math.random() * (i + 1))

    // Swap elements at indices i and j
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  return shuffled
}

// Deal cards to players
export const dealCards = (gameState: GameState, count = 5): GameState => {
  const newGameState = JSON.parse(JSON.stringify(gameState)) as GameState
  const { players, deck } = newGameState

  // Deal cards to each player
  for (const player of players) {
    const cardsNeeded = Math.max(0, count - player.hand.length)
    if (cardsNeeded > 0) {
      // Check if we need to reshuffle
      if (deck.length < cardsNeeded) {
        // Reshuffle discard pile into deck, but never reshuffle Police Raid cards
        const reshuffleCards = newGameState.discardPile.filter((c) => c.type !== "POLICE_RAID")
        newGameState.deck = shuffleDeck([...deck, ...reshuffleCards])
        newGameState.discardPile = newGameState.discardPile.filter((c) => c.type === "POLICE_RAID")
      }

      // Draw cards from the top of the deck
      const drawnCards = newGameState.deck.splice(0, cardsNeeded)
      player.hand.push(...drawnCards)
    }
  }

  return newGameState
}

// Play a card from hand
export const playCard = (gameState: GameState, playerId: string, cardId: string): GameState => {
  const newGameState = JSON.parse(JSON.stringify(gameState)) as GameState
  const player = newGameState.players.find((p) => p.id === playerId)

  if (!player) return newGameState

  // Find the card in the player's hand
  const cardIndex = player.hand.findIndex((card) => card.id === cardId)
  if (cardIndex === -1) return newGameState

  // Remove the card from hand
  const [card] = player.hand.splice(cardIndex, 1)

  // Add to discard pile
  newGameState.discardPile.push(card)

  return newGameState
}

// Return a card to hand (for canceled actions)
export const returnCardToHand = (gameState: GameState, playerId: string, cardId: string): GameState => {
  const newGameState = JSON.parse(JSON.stringify(gameState)) as GameState
  const player = newGameState.players.find((p) => p.id === playerId)

  if (!player) return newGameState

  // Find the card in the discard pile
  const cardIndex = newGameState.discardPile.findIndex((card) => card.id === cardId)
  if (cardIndex === -1) return newGameState

  // Remove the card from discard pile
  const [card] = newGameState.discardPile.splice(cardIndex, 1)

  // Add back to player's hand
  player.hand.push(card)

  return newGameState
}

// Get player color
export const getPlayerColor = (playerId: string): string => {
  switch (playerId) {
    case "player1":
      return "#ff0000" // Red
    case "player2":
      return "#0000ff" // Blue
    case "player3":
      return "#ffcc00" // Yellow
    default:
      return "#888888" // Gray
  }
}

// Place a cake bomb
export const placeCakeBomb = (gameState: GameState, playerId: string, seatId: number): GameState => {
  const newGameState = JSON.parse(JSON.stringify(gameState)) as GameState

  // Check if there are already 2 cakes at this seat (max allowed)
  const cakesAtSeat = newGameState.cakes.filter((cake) => cake.seatId === seatId)
  if (cakesAtSeat.length >= 2) {
    return newGameState
  }

  // Create a new cake bomb
  const newCake: CakeBomb = {
    id: `cake-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    seatId,
    ownerId: playerId,
    roundPlaced: newGameState.turn,
    color: getPlayerColor(playerId),
  }

  // Add the cake to the game state
  newGameState.cakes.push(newCake)

  return newGameState
}

// Pass a cake bomb to an adjacent seat
export const passCakeBomb = (gameState: GameState, cakeId: string, direction: "left" | "right"): GameState => {
  const newGameState = JSON.parse(JSON.stringify(gameState)) as GameState

  // Find the cake to move
  const cakeIndex = newGameState.cakes.findIndex((cake) => cake.id === cakeId)
  if (cakeIndex === -1) return newGameState

  const cake = newGameState.cakes[cakeIndex]

  // Find the current seat position
  const currentSeat = newGameState.board.find((pos) => pos.id === cake.seatId)
  if (!currentSeat) return newGameState

  // Determine the target seat based on direction
  const targetSeatId = direction === "left" ? currentSeat.leftId : currentSeat.rightId

  // Check if the target seat already has 2 cakes (max allowed)
  const cakesAtTargetSeat = newGameState.cakes.filter((c) => c.seatId === targetSeatId)
  if (cakesAtTargetSeat.length >= 2) {
    return newGameState
  }

  // Update the cake's position
  newGameState.cakes[cakeIndex] = {
    ...cake,
    seatId: targetSeatId,
  }

  return newGameState
}

// Check for cake explosions at the start of a player's turn
export const checkCakeExplosions = (gameState: GameState, playerId: string): GameState => {
  const newGameState = JSON.parse(JSON.stringify(gameState)) as GameState

  // Find all cakes placed by this player in previous turns
  // The issue is here - we need to find cakes placed by this player in the previous round
  const explodingCakes = newGameState.cakes.filter(
    (cake) => cake.ownerId === playerId && cake.roundPlaced < newGameState.turn,
  )

  if (explodingCakes.length === 0) {
    return newGameState
  }

  console.log(`Found ${explodingCakes.length} cakes to explode for player ${playerId}`)

  // Process each exploding cake
  for (const cake of explodingCakes) {
    console.log(`Exploding cake at seat ${cake.seatId}`)

    // Get the seat and adjacent seats
    const position = newGameState.board.find((pos) => pos.id === cake.seatId)
    if (!position) continue

    // Get left and right adjacent seats
    const affectedSeats = [cake.seatId, position.leftId, position.rightId]
    console.log(`Affected seats: ${affectedSeats.join(", ")}`)

    // Eliminate gangsters in affected seats
    for (const seatId of affectedSeats) {
      const seat = newGameState.board.find((pos) => pos.id === seatId)
      if (!seat || !seat.occupiedBy) continue

      console.log(`Eliminating gangster at seat ${seatId}: ${seat.occupiedBy.gangsterId}`)

      // Find the player and gangster
      const player = newGameState.players.find((p) => p.id === seat.occupiedBy?.playerId)
      if (!player) continue

      const gangster = player.gangsters.find((g) => g.id === seat.occupiedBy?.gangsterId)
      if (!gangster) continue

      // Eliminate the gangster
      gangster.position = null
      seat.occupiedBy = null
    }

    // Remove the exploded cake
    newGameState.cakes = newGameState.cakes.filter((c) => c.id !== cake.id)
  }

  return newGameState
}

// Count cakes at a specific seat
export const countCakesAtSeat = (gameState: GameState, seatId: number): number => {
  return gameState.cakes.filter((cake) => cake.seatId === seatId).length
}

// Initial game state
export const initialGameState: GameState = {
  players: createInitialPlayers(),
  board: createInitialBoard(),
  bankMoney: 120000, // Starting bank money - changed to $120,000
  turn: 1,
  deck: createInitialDeck(),
  discardPile: [],
  currentPhase: "SELECT_CARD",
  cakes: [], // Initialize empty cakes array
  removedCards: [],
}

// Create initial state for manual seating (all positions null, phase is SEATING_SELECT_GANGSTER)
export const createManualSeatingInitialState = (): GameState => {
  const players = createInitialPlayers().map((player) => ({
    ...player,
    gangsters: player.gangsters.map((g) => ({ ...g, position: null as null })),
  }))
  const board = createInitialBoard().map((pos) => ({ ...pos, occupiedBy: null as null }))
  return {
    players,
    board,
    bankMoney: 120000,
    turn: 1,
    deck: createInitialDeck(),
    discardPile: [],
    currentPhase: "SEATING_SELECT_GANGSTER" as const,
    cakes: [],
    removedCards: [],
  }
}

// 4-player game initial state ($90,000 bank)
export const initialGameState4: GameState = {
  players: createInitialPlayers4(),
  board: createInitialBoard4(),
  bankMoney: 90000,
  turn: 1,
  deck: createInitialDeck(),
  discardPile: [],
  currentPhase: "SELECT_CARD",
  cakes: [],
  removedCards: [],
}

// Create 4-player manual seating initial state
export const createManualSeatingInitialState4 = (): GameState => {
  const players = createInitialPlayers4().map((player) => ({
    ...player,
    gangsters: player.gangsters.map((g) => ({ ...g, position: null as null })),
  }))
  const board = createInitialBoard4().map((pos) => ({ ...pos, occupiedBy: null as null }))
  return {
    players,
    board,
    bankMoney: 90000,
    turn: 1,
    deck: createInitialDeck(),
    discardPile: [],
    currentPhase: "SEATING_SELECT_GANGSTER" as const,
    cakes: [],
    removedCards: [],
  }
}

// ── 5-Player Support ─────────────────────────────────────────────────────────

const createInitialBoard5 = (): Position[] => {
  const board = createInitialBoard()
  const occupancy: Record<number, { playerId: string; gangsterId: string } | null> = {
    1:  { playerId: "player5", gangsterId: "orange-thug-1" },
    2:  { playerId: "player1", gangsterId: "red-thug-1" },
    3:  { playerId: "player2", gangsterId: "blue-thug-1" },
    4:  { playerId: "player1", gangsterId: "red-gunman-1" },
    5:  { playerId: "player3", gangsterId: "yellow-bladeslinger-1" },
    6:  { playerId: "player4", gangsterId: "green-godfather" },
    7:  { playerId: "player3", gangsterId: "yellow-thug-1" },
    8:  { playerId: "player2", gangsterId: "blue-godfather" },
    9:  { playerId: "player1", gangsterId: "red-thug-2" },
    10: { playerId: "player5", gangsterId: "orange-bladeslinger-1" },
    11: { playerId: "player3", gangsterId: "yellow-thug-2" },
    12: { playerId: "player2", gangsterId: "blue-gunman-1" },
    13: { playerId: "player4", gangsterId: "green-thug-1" },
    14: { playerId: "player2", gangsterId: "blue-thug-2" },
    15: { playerId: "player1", gangsterId: "red-thug-3" },
    16: { playerId: "player4", gangsterId: "green-thug-2" },
    17: { playerId: "player5", gangsterId: "orange-thug-2" },
    18: { playerId: "player2", gangsterId: "blue-thug-3" },
    19: { playerId: "player5", gangsterId: "orange-thug-3" },
    20: { playerId: "player3", gangsterId: "yellow-godfather" },
    21: { playerId: "player4", gangsterId: "green-thug-3" },
    22: { playerId: "player3", gangsterId: "yellow-gunman-1" },
    23: { playerId: "player5", gangsterId: "orange-godfather" },
    24: { playerId: "player5", gangsterId: "orange-gunman-1" },
    25: { playerId: "player2", gangsterId: "blue-bladeslinger-1" },
    26: { playerId: "player3", gangsterId: "yellow-thug-3" },
    27: { playerId: "player4", gangsterId: "green-gunman-1" },
    28: { playerId: "player1", gangsterId: "red-bladeslinger-1" },
    29: { playerId: "player4", gangsterId: "green-bladeslinger-1" },
    30: { playerId: "player1", gangsterId: "red-godfather" },
  }
  return board.map((pos) => ({ ...pos, occupiedBy: occupancy[pos.id] ?? null }))
}

// 5 players × 6 gangsters: 1 Godfather, 1 Gunman, 1 Bladeslinger, 3 Thugs
const createInitialPlayers5 = (): Player[] => {
  return [
    {
      id: "player1", name: "Red Family", money: 0, hand: [],
      gangsters: [
        { id: "red-godfather",      type: "GODFATHER",    position: 30 },
        { id: "red-gunman-1",       type: "GUNMAN",       position: 4  },
        { id: "red-bladeslinger-1", type: "BLADESLINGER", position: 28 },
        { id: "red-thug-1",         type: "THUG",         position: 2  },
        { id: "red-thug-2",         type: "THUG",         position: 9  },
        { id: "red-thug-3",         type: "THUG",         position: 15 },
      ],
    },
    {
      id: "player2", name: "Blue Family", money: 0, hand: [],
      gangsters: [
        { id: "blue-godfather",      type: "GODFATHER",    position: 8  },
        { id: "blue-gunman-1",       type: "GUNMAN",       position: 12 },
        { id: "blue-bladeslinger-1", type: "BLADESLINGER", position: 25 },
        { id: "blue-thug-1",         type: "THUG",         position: 3  },
        { id: "blue-thug-2",         type: "THUG",         position: 14 },
        { id: "blue-thug-3",         type: "THUG",         position: 18 },
      ],
    },
    {
      id: "player3", name: "Yellow Family", money: 0, hand: [],
      gangsters: [
        { id: "yellow-godfather",      type: "GODFATHER",    position: 20 },
        { id: "yellow-gunman-1",       type: "GUNMAN",       position: 22 },
        { id: "yellow-bladeslinger-1", type: "BLADESLINGER", position: 5  },
        { id: "yellow-thug-1",         type: "THUG",         position: 7  },
        { id: "yellow-thug-2",         type: "THUG",         position: 11 },
        { id: "yellow-thug-3",         type: "THUG",         position: 26 },
      ],
    },
    {
      id: "player4", name: "Green Family", money: 0, hand: [],
      gangsters: [
        { id: "green-godfather",      type: "GODFATHER",    position: 6  },
        { id: "green-gunman-1",       type: "GUNMAN",       position: 27 },
        { id: "green-bladeslinger-1", type: "BLADESLINGER", position: 29 },
        { id: "green-thug-1",         type: "THUG",         position: 13 },
        { id: "green-thug-2",         type: "THUG",         position: 16 },
        { id: "green-thug-3",         type: "THUG",         position: 21 },
      ],
    },
    {
      id: "player5", name: "Orange Family", money: 0, hand: [],
      gangsters: [
        { id: "orange-godfather",      type: "GODFATHER",    position: 23 },
        { id: "orange-gunman-1",       type: "GUNMAN",       position: 24 },
        { id: "orange-bladeslinger-1", type: "BLADESLINGER", position: 10 },
        { id: "orange-thug-1",         type: "THUG",         position: 1  },
        { id: "orange-thug-2",         type: "THUG",         position: 17 },
        { id: "orange-thug-3",         type: "THUG",         position: 19 },
      ],
    },
  ]
}

export const initialGameState5: GameState = {
  players: createInitialPlayers5(),
  board: createInitialBoard5(),
  bankMoney: 70000,
  turn: 1,
  deck: createInitialDeck(),
  discardPile: [],
  currentPhase: "SELECT_CARD",
  cakes: [],
  removedCards: [],
}

export const createManualSeatingInitialState5 = (): GameState => {
  const players = createInitialPlayers5().map((player) => ({
    ...player,
    gangsters: player.gangsters.map((g) => ({ ...g, position: null as null })),
  }))
  const board = createInitialBoard5().map((pos) => ({ ...pos, occupiedBy: null as null }))
  return {
    players, board, bankMoney: 70000, turn: 1, deck: createInitialDeck(),
    discardPile: [], currentPhase: "SEATING_SELECT_GANGSTER" as const, cakes: [], removedCards: [],
  }
}

// ── 6-Player Support ─────────────────────────────────────────────────────────

const createInitialBoard6 = (): Position[] => {
  const board = createInitialBoard()
  const occupancy: Record<number, { playerId: string; gangsterId: string } | null> = {
    1:  { playerId: "player5", gangsterId: "orange-thug-1" },
    2:  { playerId: "player1", gangsterId: "red-godfather" },
    3:  { playerId: "player4", gangsterId: "green-thug-1" },
    4:  { playerId: "player1", gangsterId: "red-bladeslinger-1" },
    5:  { playerId: "player3", gangsterId: "yellow-thug-1" },
    6:  { playerId: "player6", gangsterId: "purple-gunman-1" },
    7:  { playerId: "player2", gangsterId: "blue-bladeslinger-1" },
    8:  { playerId: "player1", gangsterId: "red-gunman-1" },
    9:  { playerId: "player5", gangsterId: "orange-thug-2" },
    10: { playerId: "player3", gangsterId: "yellow-godfather" },
    11: { playerId: "player3", gangsterId: "yellow-thug-2" },
    12: { playerId: "player6", gangsterId: "purple-thug-1" },
    13: { playerId: "player6", gangsterId: "purple-godfather" },
    14: { playerId: "player1", gangsterId: "red-thug-1" },
    15: { playerId: "player2", gangsterId: "blue-thug-1" },
    16: { playerId: "player6", gangsterId: "purple-thug-2" },
    17: { playerId: "player1", gangsterId: "red-thug-2" },
    18: { playerId: "player2", gangsterId: "blue-thug-2" },
    19: { playerId: "player3", gangsterId: "yellow-gunman-1" },
    20: { playerId: "player6", gangsterId: "purple-bladeslinger-1" },
    21: { playerId: "player3", gangsterId: "yellow-bladeslinger-1" },
    22: { playerId: "player2", gangsterId: "blue-gunman-1" },
    23: { playerId: "player4", gangsterId: "green-gunman-1" },
    24: { playerId: "player5", gangsterId: "orange-godfather" },
    25: { playerId: "player4", gangsterId: "green-thug-2" },
    26: { playerId: "player2", gangsterId: "blue-godfather" },
    27: { playerId: "player5", gangsterId: "orange-gunman-1" },
    28: { playerId: "player4", gangsterId: "green-bladeslinger-1" },
    29: { playerId: "player5", gangsterId: "orange-bladeslinger-1" },
    30: { playerId: "player4", gangsterId: "green-godfather" },
  }
  return board.map((pos) => ({ ...pos, occupiedBy: occupancy[pos.id] ?? null }))
}

// 6 players × 5 gangsters: 1 Godfather, 1 Gunman, 1 Bladeslinger, 2 Thugs
const createInitialPlayers6 = (): Player[] => {
  return [
    {
      id: "player1", name: "Red Family", money: 0, hand: [],
      gangsters: [
        { id: "red-godfather",      type: "GODFATHER",    position: 2  },
        { id: "red-gunman-1",       type: "GUNMAN",       position: 8  },
        { id: "red-bladeslinger-1", type: "BLADESLINGER", position: 4  },
        { id: "red-thug-1",         type: "THUG",         position: 14 },
        { id: "red-thug-2",         type: "THUG",         position: 17 },
      ],
    },
    {
      id: "player2", name: "Blue Family", money: 0, hand: [],
      gangsters: [
        { id: "blue-godfather",      type: "GODFATHER",    position: 26 },
        { id: "blue-gunman-1",       type: "GUNMAN",       position: 22 },
        { id: "blue-bladeslinger-1", type: "BLADESLINGER", position: 7  },
        { id: "blue-thug-1",         type: "THUG",         position: 15 },
        { id: "blue-thug-2",         type: "THUG",         position: 18 },
      ],
    },
    {
      id: "player3", name: "Yellow Family", money: 0, hand: [],
      gangsters: [
        { id: "yellow-godfather",      type: "GODFATHER",    position: 10 },
        { id: "yellow-gunman-1",       type: "GUNMAN",       position: 19 },
        { id: "yellow-bladeslinger-1", type: "BLADESLINGER", position: 21 },
        { id: "yellow-thug-1",         type: "THUG",         position: 5  },
        { id: "yellow-thug-2",         type: "THUG",         position: 11 },
      ],
    },
    {
      id: "player4", name: "Green Family", money: 0, hand: [],
      gangsters: [
        { id: "green-godfather",      type: "GODFATHER",    position: 30 },
        { id: "green-gunman-1",       type: "GUNMAN",       position: 23 },
        { id: "green-bladeslinger-1", type: "BLADESLINGER", position: 28 },
        { id: "green-thug-1",         type: "THUG",         position: 3  },
        { id: "green-thug-2",         type: "THUG",         position: 25 },
      ],
    },
    {
      id: "player5", name: "Orange Family", money: 0, hand: [],
      gangsters: [
        { id: "orange-godfather",      type: "GODFATHER",    position: 24 },
        { id: "orange-gunman-1",       type: "GUNMAN",       position: 27 },
        { id: "orange-bladeslinger-1", type: "BLADESLINGER", position: 29 },
        { id: "orange-thug-1",         type: "THUG",         position: 1  },
        { id: "orange-thug-2",         type: "THUG",         position: 9  },
      ],
    },
    {
      id: "player6", name: "Purple Family", money: 0, hand: [],
      gangsters: [
        { id: "purple-godfather",      type: "GODFATHER",    position: 13 },
        { id: "purple-gunman-1",       type: "GUNMAN",       position: 6  },
        { id: "purple-bladeslinger-1", type: "BLADESLINGER", position: 20 },
        { id: "purple-thug-1",         type: "THUG",         position: 12 },
        { id: "purple-thug-2",         type: "THUG",         position: 16 },
      ],
    },
  ]
}

export const initialGameState6: GameState = {
  players: createInitialPlayers6(),
  board: createInitialBoard6(),
  bankMoney: 60000,
  turn: 1,
  deck: createInitialDeck(),
  discardPile: [],
  currentPhase: "SELECT_CARD",
  cakes: [],
  removedCards: [],
}

export const createManualSeatingInitialState6 = (): GameState => {
  const players = createInitialPlayers6().map((player) => ({
    ...player,
    gangsters: player.gangsters.map((g) => ({ ...g, position: null as null })),
  }))
  const board = createInitialBoard6().map((pos) => ({ ...pos, occupiedBy: null as null }))
  return {
    players, board, bankMoney: 60000, turn: 1, deck: createInitialDeck(),
    discardPile: [], currentPhase: "SEATING_SELECT_GANGSTER" as const, cakes: [], removedCards: [],
  }
}

// Initialize game with cards
export const initializeGame = (gameState: GameState): GameState => {
  // Create a deep copy of the game state
  const newGameState = JSON.parse(JSON.stringify(gameState)) as GameState

  // Ensure the deck is shuffled at the start of the game
  newGameState.deck = shuffleDeck(newGameState.deck)

  // Deal 5 cards to each player
  return dealCards(newGameState)
}

// Calculate payment for a player
export const calculatePayment = (player: Player, board: Position[]): number => {
  let payment = 0

  // Check if godfather is alive AND awake (sleeping godfather earns nothing)
  const godfatherAlive = player.gangsters.some((g) => g.type === "GODFATHER" && g.position !== null && g.status !== "sleeping")
  if (godfatherAlive) {
    payment += 1000
  }

  // Count businesses controlled — sleeping gangsters earn nothing
  const businessTypes = ["BAR", "GAMBLING_HOUSE", "STRIP_CLUB"]
  const controlledBusinesses: Record<string, number> = {
    BAR: 0,
    GAMBLING_HOUSE: 0,
    STRIP_CLUB: 0,
  }

  // Check which businesses player controls (only awake gangsters contribute)
  player.gangsters.forEach((gangster) => {
    if (gangster.position !== null && gangster.status !== "sleeping") {
      const position = board.find((pos) => pos.id === gangster.position)
      if (position && businessTypes.includes(position.item as string)) {
        controlledBusinesses[position.item as string]++
        payment += 1000 // $1000 for each business
      }
    }
  })

  // Check for monopolies ($4000 for controlling both of a business type)
  Object.values(controlledBusinesses).forEach((count) => {
    if (count >= 2) {
      payment += 4000
    }
  })

  // Check if any awake gangster is at the cash register (doubles income)
  const hasCashRegister = player.gangsters.some((gangster) => {
    if (gangster.position !== null && gangster.status !== "sleeping") {
      const position = board.find((pos) => pos.id === gangster.position)
      return position && position.item === "CASH_REGISTER"
    }
    return false
  })

  if (hasCashRegister) {
    payment *= 2
  }

  return payment
}

// Perform an action and return the new game state
export const performAction = (gameState: GameState, action: Action): GameState => {
  const newGameState = JSON.parse(JSON.stringify(gameState)) as GameState
  const player = newGameState.players.find((p) => p.id === action.playerId)

  if (!player) return newGameState

  switch (action.type) {
    case "KNIFE": {
      if (action.gangsterId === undefined || !action.direction) return newGameState

      const gangster = player.gangsters[action.gangsterId]
      if (!gangster || gangster.position === null) return newGameState

      const position = newGameState.board.find((pos) => pos.id === gangster.position)
      if (!position) return newGameState

      const targetPositionId = action.direction === "left" ? position.leftId : position.rightId
      const targetPosition = newGameState.board.find((pos) => pos.id === targetPositionId)

      if (targetPosition && targetPosition.occupiedBy) {
        const targetPlayerId = targetPosition.occupiedBy.playerId
        const targetGangsterId = targetPosition.occupiedBy.gangsterId

        // Find target player and gangster
        const targetPlayer = newGameState.players.find((p) => p.id === targetPlayerId)
        if (targetPlayer) {
          const targetGangster = targetPlayer.gangsters.find((g) => g.id === targetGangsterId)
          if (targetGangster) {
            // Eliminate gangster
            targetGangster.position = null
            targetPosition.occupiedBy = null
          }
        }
      }
      break
    }
    case "GUN": {
      if (action.gangsterId === undefined) return newGameState

      const gangster = player.gangsters[action.gangsterId]
      if (!gangster || gangster.position === null) return newGameState

      const position = newGameState.board.find((pos) => pos.id === gangster.position)
      if (!position || position.frontId === null) return newGameState

      const targetPosition = newGameState.board.find((pos) => pos.id === position.frontId)

      if (targetPosition && targetPosition.occupiedBy) {
        const targetPlayerId = targetPosition.occupiedBy.playerId
        const targetGangsterId = targetPosition.occupiedBy.gangsterId

        // Find target player and gangster
        const targetPlayer = newGameState.players.find((p) => p.id === targetPlayerId)
        if (targetPlayer) {
          const targetGangster = targetPlayer.gangsters.find((g) => g.id === targetGangsterId)
          if (targetGangster) {
            // Eliminate gangster
            targetGangster.position = null
            targetPosition.occupiedBy = null
          }
        }
      }
      break
    }
    case "DISPLACEMENT": {
      if (action.gangsterId === undefined || action.targetPositionId === undefined) return newGameState

      // Get the gangster directly from the player's gangsters array using the index
      const gangsterIndex = action.gangsterId
      const gangster = player.gangsters[gangsterIndex]

      if (!gangster || gangster.position === null) return newGameState

      // Find the current position and target position
      const currentPosition = newGameState.board.find((pos) => pos.id === gangster.position)
      const targetPosition = newGameState.board.find((pos) => pos.id === action.targetPositionId)

      // Make sure both positions exist and target is empty
      if (!currentPosition || !targetPosition || targetPosition.occupiedBy !== null) return newGameState

      // Update the board - clear current position
      currentPosition.occupiedBy = null

      // Update the board - set new position
      targetPosition.occupiedBy = {
        playerId: player.id,
        gangsterId: gangster.id,
      }

      // Update the gangster's position
      gangster.position = action.targetPositionId

      // Log for debugging
      console.log(
        `Moved gangster ${gangster.id} (${gangster.type}) from position ${currentPosition.id} to position ${targetPosition.id}`,
      )

      return newGameState
    }
    case "ORDER_CAKE": {
      if (!action.targetPositionId) return newGameState

      // Place a cake bomb at the target position
      return placeCakeBomb(newGameState, action.playerId, action.targetPositionId)
    }
    case "PASS_CAKE": {
      if (!action.cakeId || !action.direction) return newGameState

      // Pass the cake bomb to an adjacent seat
      return passCakeBomb(newGameState, action.cakeId, action.direction)
    }
    case "EXPLODE_CAKE": {
      if (!action.cakeId) return newGameState

      // Explode the cake bomb
      return explodeCakeBomb(newGameState, action.cakeId)
    }
    case "SLEEPING_PILLS": {
      const targets = action.pillTargetGangsterIds ?? []
      for (const gangsterId of targets) {
        for (const p of newGameState.players) {
          const g = p.gangsters.find((g) => g.id === gangsterId)
          if (!g || g.position === null) continue

          if (g.sleepingFrom && g.sleepingFrom !== action.playerId) {
            // Second pill from a different player — eliminate
            const boardPos = newGameState.board.find((pos) => pos.id === g.position)
            if (boardPos) boardPos.occupiedBy = null
            g.position = null
            g.status = undefined
            g.sleepingFrom = undefined
          } else {
            // First pill (or repeat from same player) — put to sleep
            g.status = "sleeping"
            g.sleepingFrom = action.playerId
          }
          break
        }
      }
      break
    }
    case "POLICE_RAID": {
      // Clear all non-eliminated gangsters from the board and wake up any sleeping ones
      for (const pos of newGameState.board) {
        if (pos.occupiedBy) {
          const p = newGameState.players.find((pl) => pl.id === pos.occupiedBy?.playerId)
          if (p) {
            const g = p.gangsters.find((g) => g.id === pos.occupiedBy?.gangsterId)
            if (g) {
              g.position = null
              g.status = undefined
              g.sleepingFrom = undefined
            }
          }
          pos.occupiedBy = null
        }
      }

      // Move the Police Raid card from discard to removedCards (never reshuffled)
      const raidCardIdx = newGameState.discardPile.findIndex((c) => c.type === "POLICE_RAID")
      if (raidCardIdx !== -1) {
        const [raidCard] = newGameState.discardPile.splice(raidCardIdx, 1)
        newGameState.removedCards.push(raidCard)
      }

      // Clear cakes from the board too (the board is being reset)
      newGameState.cakes = []

      // Enter seating phase
      newGameState.currentPhase = "SEATING_SELECT_GANGSTER"
      break
    }
  }

  return newGameState
}

// Place a gangster on a specific board seat (manual seating)
export const seatGangsterOnBoard = (gameState: GameState, gangsterId: string, seatId: number): GameState => {
  const newGameState = JSON.parse(JSON.stringify(gameState)) as GameState

  const seat = newGameState.board.find((p) => p.id === seatId)
  if (!seat || seat.occupiedBy !== null) return newGameState

  for (const player of newGameState.players) {
    const gangster = player.gangsters.find((g) => g.id === gangsterId)
    if (gangster) {
      gangster.position = seatId
      // Always wake up on placement — Police Raid (and any future re-seating) clears sleep status
      gangster.status = undefined
      gangster.sleepingFrom = undefined
      seat.occupiedBy = { playerId: player.id, gangsterId }
      console.log(`${player.name} seated ${gangster.type} (${gangsterId}) at seat #${seatId}`)
      break
    }
  }

  return newGameState
}

// Clear all non-eliminated gangsters from the board (Police Raid effect)
export const clearBoardForRaid = (gameState: GameState): GameState => {
  const newGameState = JSON.parse(JSON.stringify(gameState)) as GameState

  for (const pos of newGameState.board) {
    if (pos.occupiedBy) {
      const player = newGameState.players.find((p) => p.id === pos.occupiedBy?.playerId)
      if (player) {
        const gangster = player.gangsters.find((g) => g.id === pos.occupiedBy?.gangsterId)
        if (gangster) gangster.position = null
      }
      pos.occupiedBy = null
    }
  }

  return newGameState
}

// Check if a player has a card of a specific type
export const hasCardOfType = (player: Player, cardType: CardType): boolean => {
  return player.hand.some((card) => card.type === cardType)
}

// Get gangster IDs of enemy gangsters seated at drink positions (valid pill targets)
export const getValidPillTargets = (
  gameState: GameState,
  currentPlayerId: string,
  alreadyTargetedIds: string[] = [],
): string[] => {
  const results: string[] = []
  for (const pos of gameState.board) {
    if (!DRINK_SEAT_IDS.includes(pos.id)) continue
    if (!pos.occupiedBy) continue
    if (pos.occupiedBy.playerId === currentPlayerId) continue
    const gangsterId = pos.occupiedBy.gangsterId
    if (alreadyTargetedIds.includes(gangsterId)) continue
    results.push(gangsterId)
  }
  return results
}

// Wake up all sleeping gangsters belonging to a team at end of their turn
export const wakeUpSleepingGangsters = (gameState: GameState, teamPlayerId: string): GameState => {
  const newGameState = JSON.parse(JSON.stringify(gameState)) as GameState
  const teamPlayer = newGameState.players.find((p) => p.id === teamPlayerId)
  if (!teamPlayer) return newGameState
  for (const g of teamPlayer.gangsters) {
    if (g.status === "sleeping") {
      g.status = undefined
      g.sleepingFrom = undefined
    }
  }
  return newGameState
}

// Check if a card is playable based on the current game state
export const isCardPlayable = (gameState: GameState, playerId: string, cardId: string): boolean => {
  const player = gameState.players.find((p) => p.id === playerId)
  if (!player) return false

  const card = player.hand.find((c) => c.id === cardId)
  if (!card) return false

  switch (card.type) {
    case "KNIFE": {
      // Check if player has any gangsters that can use a knife
      return player.gangsters.some((gangster, index) => {
        if (gangster.position === null) return false

        const position = gameState.board.find((pos) => pos.id === gangster.position)
        if (!position) return false

        // Valid if gangster is a BLADESLINGER or in front of a KNIFE
        const isBladeSlinger = gangster.type === "BLADESLINGER"
        const isInFrontOfKnife = position.item === "KNIFE"

        // Check if there are valid targets (opponents to left or right)
        const { leftValid, rightValid } = checkKnifeTargets(gameState, playerId, index)

        return (isBladeSlinger || isInFrontOfKnife) && (leftValid || rightValid)
      })
    }
    case "GUN": {
      // Check if player has any gangsters that can use a gun
      return player.gangsters.some((gangster, index) => {
        if (gangster.position === null) return false

        const position = gameState.board.find((pos) => pos.id === gangster.position)
        if (!position) return false

        // Valid if gangster is a GUNMAN, GODFATHER, or in front of a GUN
        const isGunman = gangster.type === "GUNMAN"
        const isInFrontOfGun = position.item === "GUN"

        // Check if not in a corner position
        const cornerPositions = [2, 3, 14, 15, 17, 18, 29, 30]
        const isNotCorner = !cornerPositions.includes(position.id)

        // Check if there's a valid target in front
        const hasValidTarget = checkGunTarget(gameState, playerId, index)

        return (isGunman || isInFrontOfGun) && isNotCorner && hasValidTarget
      })
    }
    case "DISPLACEMENT": {
      // Check if there are any empty positions on the board
      const hasEmptyPositions = gameState.board.some((position) => position.occupiedBy === null)

      // Check if player has any gangsters that can be moved
      const hasGangsters = player.gangsters.some((gangster) => gangster.position !== null)

      return hasEmptyPositions && hasGangsters
    }
    case "ORDER_CAKE": {
      // Check if there are any positions that can have a cake placed
      return gameState.board.some((position) => {
        const cakesAtPosition = gameState.cakes.filter((cake) => cake.seatId === position.id)
        return cakesAtPosition.length < 2
      })
    }
    case "PASS_CAKE": {
      // Check if there are any cakes on the board
      return (
        gameState.cakes.length > 0 &&
        gameState.cakes.some((cake) => {
          const position = gameState.board.find((pos) => pos.id === cake.seatId)
          if (!position) return false

          // Check if there's space in either adjacent position
          const cakesAtLeft = gameState.cakes.filter((c) => c.seatId === position.leftId).length
          const cakesAtRight = gameState.cakes.filter((c) => c.seatId === position.rightId).length

          return cakesAtLeft < 2 || cakesAtRight < 2
        })
      )
    }
    case "EXPLODE_CAKE": {
      // Check if there are any cakes on the board
      return gameState.cakes.length > 0
    }
    case "SLEEPING_PILLS": {
      return getValidPillTargets(gameState, playerId).length > 0
    }
    case "POLICE_RAID": {
      // Always playable (if player has the card, they can use it)
      return true
    }
    default:
      return false
  }
}

// Get valid gangsters for a card type
export const getValidGangstersForCard = (gameState: GameState, playerId: string, cardType: CardType): number[] => {
  const player = gameState.players.find((p) => p.id === playerId)
  if (!player) return []

  // For ORDER_CAKE, PASS_CAKE, EXPLODE_CAKE, POLICE_RAID — no gangster selection needed
  if (cardType === "ORDER_CAKE" || cardType === "PASS_CAKE" || cardType === "EXPLODE_CAKE" || cardType === "POLICE_RAID") {
    return []
  }

  const validGangsterIndices: number[] = []

  player.gangsters.forEach((gangster, index) => {
    if (gangster.position === null) return
    if (gangster.status === "sleeping") return // sleeping gangsters cannot act

    const position = gameState.board.find((pos) => pos.id === gangster.position)
    if (!position) return

    switch (cardType) {
      case "KNIFE": {
        // Valid if gangster is a BLADESLINGER or in front of a KNIFE
        const isBladeSlinger = gangster.type === "BLADESLINGER"
        const isInFrontOfKnife = position.item === "KNIFE"

        // Check if there are valid targets (opponents to left or right)
        const hasValidTarget =
          checkKnifeTargets(gameState, player.id, index).leftValid ||
          checkKnifeTargets(gameState, player.id, index).rightValid

        if ((isBladeSlinger || isInFrontOfKnife) && hasValidTarget) {
          validGangsterIndices.push(index)
        }
        break
      }
      case "GUN": {
        // Valid if gangster is a GUNMAN, GODFATHER, or in front of a GUN
        const isGunman = gangster.type === "GUNMAN"
        const isInFrontOfGun = position.item === "GUN"

        // Check if not in a corner position
        const cornerPositions = [2, 3, 14, 15, 17, 18, 29, 30]
        const isNotCorner = !cornerPositions.includes(position.id)

        // Check if there's a valid target in front
        const hasValidTarget = checkGunTarget(gameState, player.id, index)

        if ((isGunman || isInFrontOfGun) && isNotCorner && hasValidTarget) {
          validGangsterIndices.push(index)
        }
        break
      }
      case "DISPLACEMENT": {
        // All gangsters are valid for displacement if there are empty positions
        if (checkDisplacementTargets(gameState)) {
          validGangsterIndices.push(index)
        }
        break
      }
    }
  })

  return validGangsterIndices
}

// Check if left/right targets are valid for knife action
export const checkKnifeTargets = (gameState: GameState, playerId: string, gangsterIndex: number) => {
  const player = gameState.players.find((p) => p.id === playerId)
  if (!player) return { leftValid: false, rightValid: false }

  const gangster = player.gangsters[gangsterIndex]
  if (!gangster || gangster.position === null) return { leftValid: false, rightValid: false }

  const position = gameState.board.find((pos) => pos.id === gangster.position)
  if (!position) return { leftValid: false, rightValid: false }

  // Check if gangster is in front of knife or is a knife slinger
  const isKnifeSlinger = gangster.type === "BLADESLINGER"
  const isInFrontOfKnife = position.item === "KNIFE"

  if (!isKnifeSlinger && !isInFrontOfKnife) {
    return { leftValid: false, rightValid: false }
  }

  // Check left target
  let leftValid = false
  const leftTargetPosition = gameState.board.find((pos) => pos.id === position.leftId)
  if (leftTargetPosition && leftTargetPosition.occupiedBy) {
    // Check if target is not own gangster
    leftValid = leftTargetPosition.occupiedBy.playerId !== player.id
  }

  // Check right target
  let rightValid = false
  const rightTargetPosition = gameState.board.find((pos) => pos.id === position.rightId)
  if (rightTargetPosition && rightTargetPosition.occupiedBy) {
    // Check if target is not own gangster
    rightValid = rightTargetPosition.occupiedBy.playerId !== player.id
  }

  return { leftValid, rightValid }
}

// Check if gun target is valid
export const checkGunTarget = (gameState: GameState, playerId: string, gangsterIndex: number): boolean => {
  const player = gameState.players.find((p) => p.id === playerId)
  if (!player) return false

  const gangster = player.gangsters[gangsterIndex]
  if (!gangster || gangster.position === null) return false

  const position = gameState.board.find((pos) => pos.id === gangster.position)
  if (!position) return false

  // Check if gangster is in front of gun, is a gunman, or is the godfather
  const isGunman = gangster.type === "GUNMAN" || gangster.type === "GODFATHER"
  const isInFrontOfGun = position.item === "GUN"

  if (!isGunman && !isInFrontOfGun) {
    return false
  }

  // Check if there's a gangster in front
  if (position.frontId === null) return false

  const targetPosition = gameState.board.find((pos) => pos.id === position.frontId)
  if (!targetPosition || targetPosition.occupiedBy === null) return false

  // Check if target is not own gangster
  return targetPosition.occupiedBy.playerId !== player.id
}

// Check if there are any empty positions for displacement
export const checkDisplacementTargets = (gameState: GameState): boolean => {
  return gameState.board.some((position) => position.occupiedBy === null)
}

// Get valid positions for displacement
export const getValidDisplacementPositions = (gameState: GameState): number[] => {
  return gameState.board.filter((position) => position.occupiedBy === null).map((position) => position.id)
}

// Get valid knife target positions for a gangster
export const getValidKnifeTargetPositions = (
  gameState: GameState,
  playerId: string,
  gangsterIndex: number,
): number[] => {
  const { leftValid, rightValid } = checkKnifeTargets(gameState, playerId, gangsterIndex)
  const validPositions: number[] = []

  const player = gameState.players.find((p) => p.id === playerId)
  if (!player) return validPositions

  const gangster = player.gangsters[gangsterIndex]
  if (!gangster || gangster.position === null) return validPositions

  const position = gameState.board.find((pos) => pos.id === gangster.position)
  if (!position) return validPositions

  if (leftValid) {
    validPositions.push(position.leftId)
  }

  if (rightValid) {
    validPositions.push(position.rightId)
  }

  return validPositions
}

// Get valid gun target position for a gangster
export const getValidGunTargetPosition = (
  gameState: GameState,
  playerId: string,
  gangsterIndex: number,
): number | null => {
  const player = gameState.players.find((p) => p.id === playerId)
  if (!player) return null

  const gangster = player.gangsters[gangsterIndex]
  if (!gangster || gangster.position === null) return null

  const position = gameState.board.find((pos) => pos.id === gangster.position)
  if (!position || position.frontId === null) return null

  const targetPosition = gameState.board.find((pos) => pos.id === position.frontId)
  if (!targetPosition || !targetPosition.occupiedBy) return null

  // Check if target is not own gangster
  if (targetPosition.occupiedBy.playerId !== player.id) {
    return position.frontId
  }

  return null
}

// Get valid positions for placing a cake
export const getValidCakePositions = (gameState: GameState): number[] => {
  // A cake can be placed on any position that doesn't already have 2 cakes
  return gameState.board
    .filter((position) => countCakesAtSeat(gameState, position.id) < 2)
    .map((position) => position.id)
}

// Get valid cakes for passing
export const getValidCakesForPassing = (gameState: GameState): string[] => {
  // All cakes on the board are valid for passing
  return gameState.cakes.map((cake) => cake.id)
}

// Get valid directions for passing a cake
export const getValidDirectionsForPassingCake = (gameState: GameState, cakeId: string): ("left" | "right")[] => {
  const cake = gameState.cakes.find((c) => c.id === cakeId)
  if (!cake) return []

  const position = gameState.board.find((pos) => pos.id === cake.seatId)
  if (!position) return []

  const validDirections: ("left" | "right")[] = []

  // Check left direction
  const leftSeatId = position.leftId
  const cakesAtLeftSeat = gameState.cakes.filter((c) => c.seatId === leftSeatId)
  if (cakesAtLeftSeat.length < 2) {
    validDirections.push("left")
  }

  // Check right direction
  const rightSeatId = position.rightId
  const cakesAtRightSeat = gameState.cakes.filter((c) => c.seatId === rightSeatId)
  if (cakesAtRightSeat.length < 2) {
    validDirections.push("right")
  }

  return validDirections
}

// Get valid cakes for exploding
export const getValidCakesForExploding = (gameState: GameState): string[] => {
  return gameState.cakes.map((cake) => cake.id)
}

// Explode a cake bomb
export const explodeCakeBomb = (gameState: GameState, cakeId: string): GameState => {
  const newGameState = JSON.parse(JSON.stringify(gameState)) as GameState

  // Find the cake to explode
  const cakeIndex = newGameState.cakes.findIndex((cake) => cake.id === cakeId)
  if (cakeIndex === -1) return newGameState

  const cake = newGameState.cakes[cakeIndex]

  // Get the seat and adjacent seats
  const position = newGameState.board.find((pos) => pos.id === cake.seatId)
  if (!position) return newGameState

  // Get left and right adjacent seats
  const affectedSeats = [cake.seatId, position.leftId, position.rightId]

  // Eliminate gangsters in affected seats
  for (const seatId of affectedSeats) {
    const seat = newGameState.board.find((pos) => pos.id === seatId)
    if (!seat || !seat.occupiedBy) continue

    // Find the player and gangster
    const player = newGameState.players.find((p) => p.id === seat.occupiedBy?.playerId)
    if (!player) continue

    const gangster = player.gangsters.find((g) => g.id === seat.occupiedBy?.gangsterId)
    if (!gangster) continue

    // Eliminate the gangster
    gangster.position = null
    seat.occupiedBy = null
  }

  // Remove the exploded cake
  newGameState.cakes = newGameState.cakes.filter((c) => c.id !== cake.id)

  return newGameState
}
