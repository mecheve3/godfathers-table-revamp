/**
 * Sentry helpers — thin wrappers that stay safe to call before init.
 * Sentry.init() is called in main.tsx before anything else runs.
 * All methods no-op gracefully if the SDK is disabled or not yet ready.
 */

import * as Sentry from "@sentry/react"

/** Set persistent context for the active game session. */
export function setGameContext(gameMode: string, playerCount: number): void {
  try {
    Sentry.setTag("game_mode", gameMode)
    Sentry.setTag("player_count", String(playerCount))
    Sentry.setContext("game", { game_mode: gameMode, player_count: playerCount })
  } catch { /* never propagate */ }
}

/** Set the active player identity for error correlation. */
export function setPlayerContext(playerId: string, playerName: string): void {
  try {
    Sentry.setUser({ id: playerId, username: playerName })
  } catch { /* never propagate */ }
}

/** Capture an error with optional game context. */
export function captureError(
  error: unknown,
  context?: {
    player_id?: string
    game_mode?: string
    card_type?: string
    turn_number?: number
  }
): void {
  try {
    Sentry.withScope((scope) => {
      if (context?.player_id)       scope.setTag("player_id",   context.player_id)
      if (context?.game_mode)       scope.setTag("game_mode",   context.game_mode)
      if (context?.card_type)       scope.setTag("card_type",   context.card_type)
      if (context?.turn_number != null) scope.setTag("turn_number", String(context.turn_number))
      Sentry.captureException(error)
    })
  } catch { /* never propagate */ }
}

/**
 * Wrap a synchronous gameplay action in a Sentry performance span.
 * Returns the result of fn(); re-throws if fn throws.
 */
export function trackAction<T>(name: string, attributes: Record<string, string>, fn: () => T): T {
  try {
    return Sentry.startSpan({ name, attributes }, fn)
  } catch {
    return fn()
  }
}
