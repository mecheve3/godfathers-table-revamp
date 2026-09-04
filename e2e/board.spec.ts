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

/**
 * Regression guard for a bug where board-relative element sizes (gangster sprites,
 * item markers, cakes, etc.) were pinned to viewport-width breakpoints instead of the
 * board container's own rendered width. Because the sidebar appears/disappears at the
 * `lg` breakpoint independently of any sprite's own breakpoints, viewport width and
 * board width diverge — most sharply right around 1024px, historically the worst
 * offender — so a fixed breakpoint could look right at one width and wrong at another.
 * The fix uses CSS container query units (cqw) so sprite size is always a constant
 * percentage of the board's actual width, at every viewport size, with no re-tuning.
 */
test('gangster sprite size stays a constant proportion of the board width across viewports', async ({ page }) => {
  await page.goto('/')
  await page.getByText(/quick match/i).first().click()
  await page.getByText('4', { exact: true }).click()
  await page.getByRole('button', { name: /next/i }).click()
  await page.getByText(/automatic|preset/i).first().click()
  await page.getByRole('button', { name: /next/i }).click()
  await page.getByRole('button', { name: /start/i }).click()
  await page.getByRole('button', { name: /^skip$/i }).click()

  const measureRatio = async () => {
    const board = page.locator('div[style*="game-board-background"]')
    const hitArea = page.locator('.group.absolute.cursor-pointer').first()
    const boardBox = await board.boundingBox()
    const hitBox = await hitArea.boundingBox()
    if (!boardBox || !hitBox) throw new Error('board or hit-area not found')
    return hitBox.width / boardBox.width
  }

  // 1024px is where the sidebar (lg breakpoint) appears, shrinking the board — the
  // exact condition that used to make sprites read as oversized there.
  await page.setViewportSize({ width: 1024, height: 768 })
  const ratioAtSidebarBreakpoint = await measureRatio()

  await page.setViewportSize({ width: 900, height: 650 })
  const ratioBelowSidebarBreakpoint = await measureRatio()

  await page.setViewportSize({ width: 1440, height: 900 })
  const ratioDesktop = await measureRatio()

  expect(ratioAtSidebarBreakpoint).toBeCloseTo(ratioBelowSidebarBreakpoint, 2)
  expect(ratioAtSidebarBreakpoint).toBeCloseTo(ratioDesktop, 2)
})
