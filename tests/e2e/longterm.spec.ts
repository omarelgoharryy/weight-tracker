import { expect, test } from '@playwright/test';
import { completeSetup, daysAgoISO, seedWeights } from './helpers';

test('sixty days of data renders every screen without NaN', async ({ page }) => {
  await completeSetup(page, { goal: '80', height: '180', sex: 'male' });
  const entries = Array.from({ length: 60 }, (_, i) => ({ date: daysAgoISO(59 - i), kg: 95 - 0.1 * i }));
  await seedWeights(page, entries);
  for (const name of ['Today', 'Progress', 'History', 'Settings']) {
    await page.getByRole('tab', { name }).click();
    await expect(page.locator('body')).not.toContainText('NaN');
    await expect(page.locator('body')).not.toContainText('undefined');
  }
  await page.getByRole('tab', { name: 'Progress' }).click();
  await expect(page.getByTestId('stats')).toContainText(/projected/i);
});
