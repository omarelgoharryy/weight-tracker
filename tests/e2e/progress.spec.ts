import { expect, test } from '@playwright/test';
import { completeSetup, daysAgoISO, logWeight, seedWeights } from './helpers';

const openProgress = (page: import('@playwright/test').Page) => page.getByRole('tab', { name: 'Progress' }).click();

test('empty state with no entries', async ({ page }) => {
  await completeSetup(page);
  await openProgress(page);
  await expect(page.getByText(/first weigh-in/i)).toBeVisible();
  await expect(page.locator('body')).not.toContainText('NaN');
});
test('one entry renders a chart without NaN', async ({ page }) => {
  await completeSetup(page);
  await logWeight(page, '90');
  await expect(page.getByTestId('summary')).toBeVisible();
  await openProgress(page);
  await expect(page.getByRole('img', { name: /weight/i })).toBeVisible();
  await expect(page.locator('body')).not.toContainText('NaN');
});
test('stats show, and BMI appears only with a height', async ({ page }) => {
  await completeSetup(page, { goal: '80' });
  await logWeight(page, '90');
  await expect(page.getByTestId('summary')).toBeVisible();
  await openProgress(page);
  await expect(page.getByTestId('stats')).toContainText(/current/i);
  await expect(page.getByTestId('stats')).not.toContainText('BMI');
});
test('BMI shows when height is set', async ({ page }) => {
  await completeSetup(page, { goal: '80', height: '180' });
  await logWeight(page, '90');
  await expect(page.getByTestId('summary')).toBeVisible();
  await openProgress(page);
  await expect(page.getByTestId('stats')).toContainText('BMI');
});
test('range buttons change the selection', async ({ page }) => {
  await completeSetup(page);
  await logWeight(page, '90');
  await expect(page.getByTestId('summary')).toBeVisible();
  await openProgress(page);
  await page.getByRole('button', { name: '3M' }).click();
  await expect(page.getByRole('button', { name: '3M' })).toHaveAttribute('aria-pressed', 'true');
});
test('a range with no entries explains itself', async ({ page }) => {
  await completeSetup(page);
  await seedWeights(page, [{ date: daysAgoISO(100), kg: 90 }]);
  await openProgress(page);
  await page.getByRole('button', { name: '1M' }).click();
  await expect(page.getByText(/no entries in this period/i)).toBeVisible();
});
test('tapping the chart shows that day', async ({ page }) => {
  await completeSetup(page);
  await seedWeights(page, [
    { date: daysAgoISO(5), kg: 91 },
    { date: daysAgoISO(1), kg: 90 },
  ]);
  await openProgress(page);
  await page.getByRole('img', { name: /weight/i }).click({ position: { x: 300, y: 80 } });
  await expect(page.getByTestId('chart-readout')).toContainText('90.0 kg');
});
test('body fat chart is labelled an estimate', async ({ page }) => {
  await completeSetup(page, { height: '180', sex: 'male' });
  await page.getByRole('button', { name: /weekly measurements/i }).click();
  await page.getByLabel('Waist').fill('90');
  await page.getByLabel('Neck').fill('38');
  await page.getByRole('button', { name: /save/i }).click();
  await page.getByRole('button', { name: /done/i }).click();
  await openProgress(page);
  await expect(page.getByRole('heading', { name: /body fat estimate/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Waist' })).toBeVisible();
});
