import { test, expect } from '@playwright/test'

/**
 * Regression guard for the multiplayer feature gate (FEATURES.MULTIPLAYER_ENABLED = false).
 * Create Match / Join Match are hidden on the home screen, and their routes redirect to
 * /menu, without touching the underlying multiplayer code — this suite exists so nobody
 * accidentally re-exposes those flows while the flag is off, and so it's obvious what to
 * re-check when the flag flips back to true.
 */

test('home screen shows Quick Match only — Create/Join are hidden while the flag is off', async ({ page }) => {
  await page.goto('/menu')
  await expect(page.getByText(/quick match|partida r.pida/i).first()).toBeVisible()
  await expect(page.getByText(/create match|crear partida/i)).toHaveCount(0)
  await expect(page.getByText(/^join match$|^unirse$/i)).toHaveCount(0)
})

test('navigating directly to /join redirects to /menu', async ({ page }) => {
  await page.goto('/join')
  await expect(page).toHaveURL(/\/menu$/)
})

test('navigating directly to /lobby redirects to /menu', async ({ page }) => {
  await page.goto('/lobby')
  await expect(page).toHaveURL(/\/menu$/)
})

test('navigating directly to /create with no prior config redirects to /menu', async ({ page }) => {
  await page.goto('/create')
  await expect(page).toHaveURL(/\/menu$/)
})
