import { test, expect } from '@playwright/test'

/**
 * Regression guard for a bug where the game board collapsed to zero height
 * on any viewport narrower than the `lg` (1024px) breakpoint — the column-flex
 * board wrapper had no flex-grow, so the aspect-ratio board container inside it
 * measured 0×0 and every seat became invisible and unclickable.
 */
test('game board renders visibly below the lg breakpoint (tablet/phone landscape)', async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 600 })
  await page.goto('/')

  await page.getByText(/quick match/i).first().click()
  await page.getByText('4', { exact: true }).click()
  await page.getByRole('button', { name: /next/i }).click()
  await page.getByText(/automatic|preset/i).first().click()
  await page.getByRole('button', { name: /next/i }).click()
  await page.getByRole('button', { name: /start/i }).click()
  await page.getByRole('button', { name: /^skip$/i }).click()

  // The board is rendered as a div with the table background image — it must
  // have real, non-zero pixel dimensions, not just exist in the DOM.
  const board = page.locator('div[style*="game-board-background"]')
  await expect(board).toBeVisible()
  const box = await board.boundingBox()
  expect(box?.width ?? 0).toBeGreaterThan(100)
  expect(box?.height ?? 0).toBeGreaterThan(100)

  // At least one seated gangster image should be visible on the board.
  await expect(page.locator('img[alt="GODFATHER"], img[alt="GUNMAN"], img[alt="BLADESLINGER"], img[alt="THUG"]').first()).toBeVisible()
})
