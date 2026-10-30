import { expect, test } from '@playwright/test';
import { completeSetup, daysAgoISO, logWeight } from './helpers';

const openHistory = async (page: import('@playwright/test').Page) => {
  await expect(page.getByTestId('summary')).toBeVisible();
  await page.getByRole('tab', { name: 'History' }).click();
};

test('edit a weight and its note', async ({ page }) => {
  await completeSetup(page);
  await logWeight(page, '90');
  await openHistory(page);
  await page.getByTestId('weight-entry').getByRole('button', { name: /edit/i }).click();
  await page.getByLabel('Weight').fill('89');
  await page.getByLabel(/note/i).fill('new note');
  await page.getByRole('button', { name: /save/i }).click();
  await expect(page.getByTestId('weight-entry')).toContainText('89.0');
  await expect(page.getByTestId('weight-entry')).toContainText('new note');
});
test('delete asks first', async ({ page }) => {
  await completeSetup(page);
  await logWeight(page, '90');
  await openHistory(page);
  await page.getByTestId('weight-entry').getByRole('button', { name: /delete/i }).click();
  await page.getByRole('button', { name: /cancel/i }).click();
  await expect(page.getByTestId('weight-entry')).toHaveCount(1);
  await page.getByTestId('weight-entry').getByRole('button', { name: /delete/i }).click();
  await page.getByRole('button', { name: /yes, delete/i }).click();
  await expect(page.getByTestId('weight-entry')).toHaveCount(0);
});
test('add a missed day, newest shown first', async ({ page }) => {
  await completeSetup(page);
  await logWeight(page, '90');
  await openHistory(page);
  await page.getByRole('button', { name: /add weight/i }).click();
  await page.getByLabel('Date').fill(daysAgoISO(3));
  await page.getByLabel('Weight').fill('91');
  await page.getByRole('button', { name: /save/i }).click();
  await expect(page.getByTestId('weight-entry')).toHaveCount(2);
  await expect(page.getByTestId('weight-entry').first()).toContainText('90.0');
});
test('a future date is rejected', async ({ page }) => {
  await completeSetup(page);
  await page.getByRole('tab', { name: 'History' }).click();
  await page.getByRole('button', { name: /add weight/i }).click();
  await page.getByLabel('Date').fill(daysAgoISO(-1));
  await page.getByLabel('Weight').fill('91');
  await page.getByRole('button', { name: /save/i }).click();
  await expect(page.getByRole('alert')).toBeVisible();
});
test('adding a date that already has an entry asks before replacing', async ({ page }) => {
  await completeSetup(page);
  await logWeight(page, '90');
  await openHistory(page);
  await page.getByRole('button', { name: /add weight/i }).click();
  await page.getByLabel('Date').fill(daysAgoISO(0));
  await page.getByLabel('Weight').fill('91');
  await page.getByRole('button', { name: /save/i }).click();
  await expect(page.getByRole('dialog')).toContainText(/already/i);
});
test('add measurements for a past date, then edit and delete them', async ({ page }) => {
  await completeSetup(page);
  await page.getByRole('tab', { name: 'History' }).click();
  await page.getByRole('button', { name: /add measurements/i }).click();
  await page.getByLabel('Date').fill(daysAgoISO(7));
  await page.getByRole('button', { name: /continue/i }).click();
  await page.getByLabel('Waist').fill('90');
  await page.getByRole('button', { name: /save/i }).click();
  await page.getByRole('button', { name: /done/i }).click();
  const row = page.getByTestId('measurement-entry');
  await expect(row).toContainText('Waist 90.0 cm');
  await row.getByRole('button', { name: /edit/i }).click();
  await page.getByLabel('Waist').fill('89');
  await page.getByRole('button', { name: /save/i }).click();
  await page.getByRole('button', { name: /done/i }).click();
  await expect(row).toContainText('Waist 89.0 cm');
  await row.getByRole('button', { name: /delete/i }).click();
  await page.getByRole('button', { name: /yes, delete/i }).click();
  await expect(row).toHaveCount(0);
});
