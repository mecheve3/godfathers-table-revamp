import { test, expect } from '@playwright/test'

test('homepage loads', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Godfather's Table/)
})

test('homepage is visible', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('body')).toBeVisible()
})