import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock posthog-js before importing analytics
vi.mock('posthog-js', () => ({
  default: {
    init: vi.fn(),
    capture: vi.fn(),
    get_distinct_id: vi.fn(() => 'test-id-123'),
  },
}))

import { track, getDistinctId } from '../lib/analytics'

describe('Analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('track', () => {
    it('should not throw when called before init', () => {
      expect(() => track('test_event')).not.toThrow()
    })

    it('should not throw when called with properties', () => {
      expect(() => track('game_start', { mode: 'multiplayer' })).not.toThrow()
    })
  })

  describe('getDistinctId', () => {
    it('should return null before init', () => {
      const id = getDistinctId()
      expect(id).toBeNull()
    })
  })
})