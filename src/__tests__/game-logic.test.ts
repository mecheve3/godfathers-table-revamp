import { describe, it, expect } from 'vitest'
import { calculatePaymentBreakdown, computeStandings, advanceRoundCounter, placeCakeBomb, checkCakeExplosions } from '../app/features/game/game-logic'
import type { GameState, Player, Position } from '../app/features/game/types'

function makePosition(overrides: Partial<Position> & { id: number }): Position {
  return {
    item: null,
    rightId: overrides.id + 1,
    leftId: overrides.id - 1,
    frontId: null,
    tableSide: 'A',
    occupiedBy: null,
    ...overrides,
  }
}

function makePlayer(overrides: Partial<Player> & { id: string }): Player {
  return { name: overrides.id, money: 0, gangsters: [], hand: [], ...overrides }
}

function makeGameState(overrides: Partial<GameState> = {}): GameState {
  const board: Position[] = [
    makePosition({ id: 1 }),
    makePosition({ id: 2 }),
    makePosition({ id: 3 }),
  ]
  return {
    players: [makePlayer({ id: 'player1' }), makePlayer({ id: 'player2' })],
    board,
    bankMoney: 0,
    turn: 1,
    deck: [],
    discardPile: [],
    currentPhase: 'SELECT_CARD',
    cakes: [],
    removedCards: [],
    ...overrides,
  }
}

describe('computeStandings', () => {
  it('ranks players by money, descending', () => {
    const players = [
      makePlayer({ id: 'p1', money: 1000 }),
      makePlayer({ id: 'p2', money: 5000 }),
      makePlayer({ id: 'p3', money: 2000 }),
    ]
    const ranked = computeStandings(players)
    expect(ranked.map((r) => r.player.id)).toEqual(['p2', 'p3', 'p1'])
    expect(ranked.map((r) => r.rank)).toEqual([1, 2, 3])
  })

  it('breaks a tie for 1st place by count of gangsters still on the board', () => {
    const players = [
      makePlayer({
        id: 'fewer-alive',
        money: 5000,
        gangsters: [
          { id: 'g1', type: 'THUG', position: 1 },
          { id: 'g2', type: 'THUG', position: null },
        ],
      }),
      makePlayer({
        id: 'more-alive',
        money: 5000,
        gangsters: [
          { id: 'g3', type: 'THUG', position: 2 },
          { id: 'g4', type: 'THUG', position: 3 },
        ],
      }),
    ]
    const ranked = computeStandings(players)
    // Same money — the player with more surviving gangsters wins the tie-break for 1st.
    expect(ranked.map((r) => r.player.id)).toEqual(['more-alive', 'fewer-alive'])
    expect(ranked.map((r) => r.rank)).toEqual([1, 2])
  })

  it('does not reorder players with distinct money even if a lower tie exists', () => {
    const players = [
      makePlayer({ id: 'leader', money: 9000 }),
      makePlayer({ id: 'tied-a', money: 1000, gangsters: [{ id: 'g1', type: 'THUG', position: 1 }] }),
      makePlayer({ id: 'tied-b', money: 1000, gangsters: [] }),
    ]
    const ranked = computeStandings(players)
    expect(ranked[0].player.id).toBe('leader')
    expect(ranked[0].rank).toBe(1)
  })
})

describe('calculatePaymentBreakdown business counts', () => {
  const board: Position[] = [
    makePosition({ id: 1, item: 'BAR' }),
    makePosition({ id: 2, item: 'BAR' }),
    makePosition({ id: 3, item: null }),
  ]

  it('reports 0 held and $0 income when no seat is occupied', () => {
    const player = makePlayer({ id: 'p1', gangsters: [] })
    const { businessCounts, bar, monopolyBonus, total } = calculatePaymentBreakdown(player, board)
    expect(businessCounts.BAR).toBe(0)
    expect(bar).toBe(0)
    expect(monopolyBonus).toBe(0)
    expect(total).toBe(0)
  })

  it('reports 1 held and $1,000 income for a single seated bar gangster', () => {
    const player = makePlayer({ id: 'p1', gangsters: [{ id: 'g1', type: 'THUG', position: 1 }] })
    const { businessCounts, bar, monopolyBonus, total } = calculatePaymentBreakdown(player, board)
    expect(businessCounts.BAR).toBe(1)
    expect(bar).toBe(1000)
    expect(monopolyBonus).toBe(0)
    expect(total).toBe(1000)
  })

  it('reports 2 held (monopoly) and $4,000 flat income for both bar seats', () => {
    const player = makePlayer({
      id: 'p1',
      gangsters: [
        { id: 'g1', type: 'THUG', position: 1 },
        { id: 'g2', type: 'THUG', position: 2 },
      ],
    })
    const { businessCounts, bar, monopolyBonus, total } = calculatePaymentBreakdown(player, board)
    expect(businessCounts.BAR).toBe(2)
    // Monopoly replaces the per-slot income, it doesn't stack with it.
    expect(bar).toBe(0)
    expect(monopolyBonus).toBe(4000)
    expect(total).toBe(4000)
  })

  it('does not count a sleeping gangster toward business holdings', () => {
    const player = makePlayer({
      id: 'p1',
      gangsters: [{ id: 'g1', type: 'THUG', position: 1, status: 'sleeping' }],
    })
    const { businessCounts, total } = calculatePaymentBreakdown(player, board)
    expect(businessCounts.BAR).toBe(0)
    expect(total).toBe(0)
  })
})

describe('advanceRoundCounter', () => {
  it('does not advance the round when the next player has not wrapped past the current one', () => {
    expect(advanceRoundCounter(1, 0, 1)).toBe(1)
  })

  it('advances the round when control wraps back to (or before) the current player', () => {
    expect(advanceRoundCounter(1, 1, 0)).toBe(2)
    expect(advanceRoundCounter(3, 2, 2)).toBe(4)
  })
})

describe('cake timing across a Police Raid re-seat (regression)', () => {
  // Reproduces a bug where a cake placed just before a Police Raid waited an extra
  // round to explode: the raid's re-seating hand-off skipped the same "did a lap
  // complete" round-increment that every normal turn end performs, leaving `turn`
  // one lap behind and delaying every roundPlaced comparison from then on.
  it("explodes on the owner's very next turn even when a Police Raid is played in between", () => {
    let state = makeGameState({ turn: 1 })
    // Player 0 places a cake on their own turn (turn 1).
    state = placeCakeBomb(state, 'player1', 1)
    expect(state.cakes[0].roundPlaced).toBe(1)

    // Turn passes to player 1 (index 1) — no lap completed yet.
    state = { ...state, turn: advanceRoundCounter(state.turn, 0, 1) }
    expect(state.turn).toBe(1)

    // Player 1 plays Police Raid instead of a normal action. The re-seating flow
    // hands control back to player 0 (index 0) — this IS a completed lap (0 <= 1),
    // so the round counter must advance here exactly like a normal turn end would.
    state = { ...state, turn: advanceRoundCounter(state.turn, 1, 0) }
    expect(state.turn).toBe(2)

    // It's player 0's very next turn — the cake placed on turn 1 should explode now,
    // not wait for an additional round.
    state = checkCakeExplosions(state, 'player1')
    expect(state.cakes).toHaveLength(0)
  })

  it('does not explode early when the owner plays the Police Raid themself before their own next turn', () => {
    let state = makeGameState({ turn: 1 })
    state = placeCakeBomb(state, 'player1', 1)

    // Player 0 immediately plays Police Raid on the same turn they placed the cake.
    // Re-seating hands control to player 1 (index 1) — not a completed lap (1 > 0).
    state = { ...state, turn: advanceRoundCounter(state.turn, 0, 1) }
    expect(state.turn).toBe(1)

    // Cake must not explode on player 1's turn — it was placed this same round.
    state = checkCakeExplosions(state, 'player2')
    expect(state.cakes).toHaveLength(1)

    // Play wraps back to player 0 — now a lap has completed and the cake should go off.
    state = { ...state, turn: advanceRoundCounter(state.turn, 1, 0) }
    expect(state.turn).toBe(2)
    state = checkCakeExplosions(state, 'player1')
    expect(state.cakes).toHaveLength(0)
  })

  it('a cake placed the same turn a Police Raid is played by someone else explodes on the correct subsequent turn, not immediately', () => {
    let state = makeGameState({ turn: 3 })
    // Player 0 places a cake on turn 3.
    state = placeCakeBomb(state, 'player1', 1)
    expect(state.cakes[0].roundPlaced).toBe(3)

    // Player 1 plays Police Raid right after, on the same round. Re-seating hands
    // control back to player 0 (index 0) — a completed lap (0 <= 1) — so the round
    // counter advances to 4, same as if a normal turn had ended.
    state = { ...state, turn: advanceRoundCounter(state.turn, 1, 0) }
    expect(state.turn).toBe(4)

    // Cake explodes now — on the very next time it's player 0's turn — not before.
    state = checkCakeExplosions(state, 'player1')
    expect(state.cakes).toHaveLength(0)
  })
})
