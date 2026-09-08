/**
 * Feature flags.
 *
 * AUTH_ENABLED: set to true once backend auth is wired up.
 * When false, Landing redirects straight to the game menu and
 * all auth routes (/login, /signup, /email-confirmation) redirect as well.
 *
 * MULTIPLAYER_ENABLED: set to true to re-enable multiplayer for testers.
 * When false, Create Match / Join Match are hidden on the home screen and
 * /create (for non-quick modes), /join, and /lobby all redirect to /menu.
 */
export const FEATURES = {
  AUTH_ENABLED: false,
  MULTIPLAYER_ENABLED: false,
} as const
