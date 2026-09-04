import { describe, it, expect } from 'vitest'
import { calculatePaymentBreakdown, computeStandings } from '../app/features/game/game-logic'
import type { Player, Position } from '../app/features/game/types'

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
