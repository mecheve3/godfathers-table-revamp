/**
 * Error monitoring wrapper around Sentry.
 *
 * Uses @sentry/browser (works with Vite static builds).
 * All methods are safe to call before init — they no-op gracefully.
 */

import type * as SentryType from "@sentry/browser"

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN ?? ""
const ENABLED =
  typeof window !== "undefined" &&
  !!SENTRY_DSN &&
  import.meta.env.VITE_ANALYTICS_ENABLED !== "false"

let Sentry: typeof SentryType | null = null

/** Call once on app init (client-side only). */
export async function initMonitoring(): Promise<void> {
  if (!ENABLED || Sentry) return
  try {
    Sentry = await import("@sentry/browser")
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: import.meta.env.MODE,
      release: import.meta.env.VITE_APP_VERSION,
      tracesSampleRate: 0.2,
      ignoreErrors: [
        "ResizeObserver loop limit exceeded",
        "Non-Error promise rejection captured",
        "Network request failed",
      ],
    })
  } catch {
    // never break the game
  }
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
  if (!Sentry) return
  try {
    Sentry.withScope((scope) => {
      if (context?.player_id)  scope.setTag("player_id",  context.player_id)
      if (context?.game_mode)  scope.setTag("game_mode",  context.game_mode)
      if (context?.card_type)  scope.setTag("card_type",  context.card_type)
      if (context?.turn_number != null) scope.setTag("turn_number", String(context.turn_number))
      Sentry!.captureException(error)
    })
  } catch {
    // never propagate
  }
}

/** Set persistent context for the active game session. */
export function setGameContext(gameMode: string, playerCount: number): void {
  if (!Sentry) return
  try {
    Sentry.setTag("game_mode", gameMode)
    Sentry.setTag("player_count", String(playerCount))
    Sentry.setContext("game", { game_mode: gameMode, player_count: playerCount })
  } catch {
    // never propagate
  }
}

/** Set the active player identity for error correlation. */
export function setPlayerContext(playerId: string, playerName: string): void {
  if (!Sentry) return
  try {
    Sentry.setUser({ id: playerId, username: playerName })
  } catch {
    // never propagate
  }
}

/**
 * Wrap a synchronous gameplay action in a Sentry performance span.
 * Returns the result of fn(); re-throws if fn throws.
 */
export function trackAction<T>(name: string, attributes: Record<string, string>, fn: () => T): T {
  if (!Sentry) return fn()
  return Sentry.startSpan({ name, attributes }, fn)
}
