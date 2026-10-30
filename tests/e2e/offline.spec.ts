import { expect, test } from '@playwright/test';
import { completeSetup, logWeight } from './helpers';

test('the app loads and saves with no network', async ({ page, context }) => {
  await page.goto('./');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await completeSetup(page, { skipGoto: true });
  await logWeight(page, '90');
  await expect(page.getByTestId('summary')).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Weight')).toHaveValue('90.0');
});
