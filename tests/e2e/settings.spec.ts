import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { completeSetup, daysAgoISO, getCelebrated, logWeight, seedWeights, setCelebrated } from './helpers';

const go = (page: import('@playwright/test').Page, name: string) => page.getByRole('tab', { name }).click();

test('switching units changes display, not data', async ({ page }) => {
  await completeSetup(page);
  await logWeight(page, '90');
  await expect(page.getByTestId('summary')).toBeVisible();
  await go(page, 'Settings');
  await page.getByRole('radio', { name: 'lb' }).click();
  await go(page, 'History');
  await expect(page.getByTestId('weight-entry')).toContainText('198.4 lb');
  await go(page, 'Settings');
  await page.getByRole('radio', { name: 'kg' }).click();
  await go(page, 'History');
  await expect(page.getByTestId('weight-entry')).toContainText('90.0 kg');
});
test('changing the goal clears goal milestones and keeps lost ones', async ({ page }) => {
  await completeSetup(page, { goal: '80' });
  await setCelebrated(page, ['lost-5kg', 'goal-25']);
  await page.reload();
  await go(page, 'Settings');
  await page.getByLabel(/goal weight/i).fill('75');
  await page.getByRole('button', { name: /save goal/i }).click();
  await expect.poll(() => getCelebrated(page)).toEqual(['lost-5kg']);
});
test('an impossible goal is rejected', async ({ page }) => {
  await completeSetup(page);
  await go(page, 'Settings');
  await page.getByLabel(/goal weight/i).fill('5');
  await page.getByRole('button', { name: /save goal/i }).click();
  await expect(page.getByRole('alert')).toBeVisible();
});
test('measurement day can be changed', async ({ page }) => {
  await completeSetup(page);
  await go(page, 'Settings');
  await page.getByLabel(/measurement day/i).selectOption('1');
  await expect(page.getByLabel(/measurement day/i)).toHaveValue('1');
  await page.waitForTimeout(100);
  await page.reload();
  await go(page, 'Settings');
  await expect(page.getByLabel(/measurement day/i)).toHaveValue('1');
});
test('height and sex can be set and cleared', async ({ page }) => {
  await completeSetup(page);
  await go(page, 'Settings');
  await page.getByLabel(/height/i).fill('180');
  await page.getByLabel(/biological sex/i).selectOption('female');
  await page.getByRole('button', { name: /save details/i }).click();
  await page.getByRole('status').waitFor();
  await page.reload();
  await go(page, 'Settings');
  await expect(page.getByLabel(/height/i)).toHaveValue('180.0');
  await page.getByLabel(/height/i).fill('');
  await page.getByRole('button', { name: /save details/i }).click();
  await page.getByRole('status').waitFor();
  await page.reload();
  await go(page, 'Settings');
  await expect(page.getByLabel(/height/i)).toHaveValue('');
});
test('backup round trip restores data after a confirmation', async ({ page }) => {
  await completeSetup(page);
  await logWeight(page, '90');
  await expect(page.getByTestId('summary')).toBeVisible();
  await go(page, 'Settings');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /export/i }).click();
  const file = await (await download).path();
  await expect(page.getByTestId('last-backup')).not.toContainText(/never/i);
  await go(page, 'History');
  await page.getByTestId('weight-entry').getByRole('button', { name: /delete/i }).click();
  await page.getByRole('button', { name: /yes, delete/i }).click();
  await expect(page.getByTestId('weight-entry')).toHaveCount(0);
  await go(page, 'Settings');
  await page
    .getByLabel(/import/i)
    .setInputFiles({ name: 'b.json', mimeType: 'application/json', buffer: await readFile(file) });
  await expect(page.getByRole('dialog')).toContainText('1');
  await page.getByRole('button', { name: /yes, replace/i }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await go(page, 'History');
  await expect(page.getByTestId('weight-entry')).toHaveCount(1);
});
test('an invalid backup changes nothing', async ({ page }) => {
  await completeSetup(page);
  await logWeight(page, '90');
  await expect(page.getByTestId('summary')).toBeVisible();
  await go(page, 'Settings');
  await page
    .getByLabel(/import/i)
    .setInputFiles({ name: 'b.json', mimeType: 'application/json', buffer: Buffer.from('{oops') });
  await expect(page.getByRole('alert')).toBeVisible();
  await go(page, 'History');
  await expect(page.getByTestId('weight-entry')).toHaveCount(1);
});
test('backup nudge leads to Settings', async ({ page }) => {
  await completeSetup(page);
  await seedWeights(page, [{ date: daysAgoISO(40), kg: 90 }]);
  await page.getByRole('button', { name: /back up now/i }).click();
  await expect(page.getByRole('tab', { name: 'Settings' })).toHaveAttribute('aria-selected', 'true');
});
