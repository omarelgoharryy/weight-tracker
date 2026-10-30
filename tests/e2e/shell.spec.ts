import { expect, test } from '@playwright/test';
import { completeSetup } from './helpers';

test('first run asks for setup, then opens Today', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();
  await page.getByLabel(/goal weight/i).fill('80');
  await page.getByRole('button', { name: /get started/i }).click();
  await expect(page.getByRole('tab', { name: 'Today' })).toHaveAttribute('aria-selected', 'true');
  await page.reload();
  await expect(page.getByRole('tab', { name: 'Today' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /welcome/i })).toBeHidden();
});
test('setup rejects an impossible goal', async ({ page }) => {
  await page.goto('./');
  await page.getByLabel(/goal weight/i).fill('5');
  await page.getByRole('button', { name: /get started/i }).click();
  await expect(page.getByRole('alert')).toBeVisible();
});
test('tabs switch screens', async ({ page }) => {
  await completeSetup(page);
  for (const name of ['Progress', 'History', 'Settings', 'Today']) {
    await page.getByRole('tab', { name }).click();
    await expect(page.getByRole('tab', { name })).toHaveAttribute('aria-selected', 'true');
  }
});
test('install banner shows in a browser tab with instructions', async ({ page }) => {
  await completeSetup(page);
  await expect(page.getByText(/add to home screen/i)).toBeVisible();
});
test('install banner is hidden when installed', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'standalone', { value: true }));
  await completeSetup(page);
  await expect(page.getByText(/add to home screen/i)).toBeHidden();
});
test('today updates when the app returns from the background on a new day', async ({ page }) => {
  await page.clock.install({ time: new Date(2026, 9, 30, 22, 0) });
  await completeSetup(page);
  await expect(page.getByTestId('today-date')).toContainText('30');
  await page.clock.setFixedTime(new Date(2026, 9, 31, 8, 0));
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await expect(page.getByTestId('today-date')).toContainText('31');
});
