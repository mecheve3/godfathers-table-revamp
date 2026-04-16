/**
 * Feature flags.
 *
 * AUTH_ENABLED: set to true once backend auth is wired up.
 * When false, Landing redirects straight to the game menu and
 * all auth routes (/login, /signup, /email-confirmation) redirect as well.
 */
export const FEATURES = {
  AUTH_ENABLED: false,
} as const
