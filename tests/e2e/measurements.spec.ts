import { expect, test } from '@playwright/test';
import { completeSetup } from './helpers';

const openCard = (page: import('@playwright/test').Page) =>
  page.getByRole('button', { name: /weekly measurements/i }).click();

test('card shows for a new user, then clears once saved', async ({ page }) => {
  await completeSetup(page, { height: '180', sex: 'male' });
  await openCard(page);
  await page.getByLabel('Waist').fill('90');
  await page.getByLabel('Neck').fill('38');
  await page.getByRole('button', { name: /save/i }).click();
  await expect(page.getByTestId('body-fat-result')).toContainText(/estimate/i);
  await page.getByRole('button', { name: /done/i }).click();
  await expect(page.getByTestId('today-date')).toBeVisible();
  await expect(page.getByRole('button', { name: /weekly measurements/i })).toBeHidden();
});
test('says what is missing for a body fat estimate', async ({ page }) => {
  await completeSetup(page);
  await openCard(page);
  await page.getByLabel('Waist').fill('90');
  await page.getByRole('button', { name: /save/i }).click();
  await expect(page.getByTestId('body-fat-result')).toContainText(/height/i);
});
test('asks to recheck impossible proportions', async ({ page }) => {
  await completeSetup(page, { height: '180', sex: 'male' });
  await openCard(page);
  await page.getByLabel('Waist').fill('30');
  await page.getByLabel('Neck').fill('40');
  await page.getByRole('button', { name: /save/i }).click();
  await expect(page.getByTestId('body-fat-result')).toContainText(/check/i);
});
test('an all-blank form is not saved', async ({ page }) => {
  await completeSetup(page);
  await openCard(page);
  await page.getByRole('button', { name: /save/i }).click();
  await expect(page.getByRole('alert')).toBeVisible();
});
test('an out-of-range measurement is rejected', async ({ page }) => {
  await completeSetup(page);
  await openCard(page);
  await page.getByLabel('Waist').fill('2');
  await page.getByRole('button', { name: /save/i }).click();
  await expect(page.getByRole('alert')).toBeVisible();
});
test('a form left open overnight saves under the new day', async ({ page }) => {
  await page.clock.install({ time: new Date(2026, 9, 30, 22, 0) });
  await completeSetup(page);
  await openCard(page);
  await page.clock.setFixedTime(new Date(2026, 9, 31, 8, 0));
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await page.getByLabel('Waist').fill('90');
  await page.getByRole('button', { name: /save/i }).click();
  await page.getByRole('button', { name: /done/i }).click();
  await page.getByRole('tab', { name: 'History' }).click();
  await expect(page.getByTestId('measurement-entry')).toContainText('31');
});
