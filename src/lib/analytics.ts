/**
 * Analytics wrapper around PostHog.
 *
 * All calls are fire-and-forget — they never throw or block gameplay.
 * Disabled automatically when VITE_ANALYTICS_ENABLED=false (set in .env.local for dev).
 */

import type { PostHog } from "posthog-js"

const POSTHOG_KEY  = import.meta.env.VITE_POSTHOG_KEY  ?? ""
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST ?? "https://us.i.posthog.com"
const ENABLED =
  typeof window !== "undefined" &&
  !!POSTHOG_KEY &&
  import.meta.env.VITE_ANALYTICS_ENABLED !== "false"

let ph: PostHog | null = null

/** Call once on app init (client-side only). */
export async function initAnalytics(): Promise<void> {
  if (!ENABLED || ph) return
  try {
    const posthog = (await import("posthog-js")).default
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      person_profiles: "never",   // anonymous only — no PII stored
      capture_pageview: false,    // SPA — we fire events manually
      autocapture: false,         // manual events only
      loaded: (instance) => { ph = instance as unknown as PostHog },
    })
  } catch {
    // silently ignore — analytics must never break the game
  }
}

/** Fire an analytics event. Safe to call before init (events are dropped silently). */
export function track(event: string, properties?: Record<string, unknown>): void {
  if (!ph) return
  try {
    ph.capture(event, properties)
  } catch {
    // never propagate
  }
}

/** Returns the PostHog anonymous distinct_id (useful for Sentry correlation). */
export function getDistinctId(): string | null {
  return ph?.get_distinct_id() ?? null
}
