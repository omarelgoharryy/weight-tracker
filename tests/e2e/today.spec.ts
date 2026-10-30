import { expect, test } from '@playwright/test';
import { completeSetup, logWeight, logYesterday } from './helpers';

test('logging saves and shows in the summary', async ({ page }) => {
  await completeSetup(page, { goal: '80' });
  await page.getByLabel('Weight').fill('90');
  await page.getByLabel(/note/i).fill('started today');
  await page.getByRole('button', { name: /save/i }).click();
  await expect(page.getByTestId('summary')).toContainText('0.0 kg');
  await expect(page.getByTestId('encouragement')).not.toBeEmpty();
  await page.reload();
  await expect(page.getByLabel('Weight')).toHaveValue('90.0');
  await expect(page.getByLabel(/note/i)).toHaveValue('started today');
});
test('saving again updates the same day', async ({ page }) => {
  await completeSetup(page);
  await logWeight(page, '90');
  await logWeight(page, '89.5');
  await page.reload();
  await expect(page.getByLabel('Weight')).toHaveValue('89.5');
});
test('comma decimals are accepted', async ({ page }) => {
  await completeSetup(page);
  await logWeight(page, '82,5');
  await page.reload();
  await expect(page.getByLabel('Weight')).toHaveValue('82.5');
});
test('an impossible weight is rejected', async ({ page }) => {
  await completeSetup(page);
  await logWeight(page, '5');
  await expect(page.getByRole('alert')).toContainText(/20/);
});
test('a likely typo asks for confirmation', async ({ page }) => {
  await completeSetup(page);
  await logYesterday(page, 90);
  await page.getByLabel('Weight').fill('70');
  await page.getByRole('button', { name: /save/i }).click();
  await page.getByRole('button', { name: /go back/i }).click();
  await expect(page.getByLabel('Weight')).toHaveValue('70');
  await page.getByRole('button', { name: /save/i }).click();
  await page.getByRole('button', { name: /yes, save/i }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await page.reload();
  await expect(page.getByLabel('Weight')).toHaveValue('70.0');
});
test('a failed save keeps the input and says so', async ({ page }) => {
  await completeSetup(page);
  await page.evaluate(() => {
    IDBObjectStore.prototype.put = () => {
      throw new Error('quota');
    };
  });
  await logWeight(page, '90');
  await expect(page.getByRole('alert')).toContainText(/not saved/i);
  await expect(page.getByLabel('Weight')).toHaveValue('90');
});
test('a new entry saves under the current day after the app stays open overnight', async ({ page }) => {
  await page.clock.install({ time: new Date(2026, 9, 30, 22, 0) });
  await completeSetup(page);
  await page.clock.setFixedTime(new Date(2026, 9, 31, 8, 0));
  await logWeight(page, '90');
  await expect.poll(() => storedDates(page)).toEqual(['2026-10-31']);
});
test('milestone is celebrated once and survives a reload the same day', async ({ page }) => {
  await completeSetup(page, { goal: '50' });
  await logYesterday(page, 100);
  await page.getByLabel('Weight').fill('88');
  await page.getByRole('button', { name: /save/i }).click();
  await page.getByRole('button', { name: /yes, save/i }).click();
  await expect(page.getByTestId('encouragement')).toContainText(/lost/);
  await page.reload();
  await expect(page.getByTestId('encouragement')).toContainText(/lost/);
});

const storedDates = (page: import('@playwright/test').Page) =>
  page.evaluate(
    () =>
      new Promise<string[]>((resolve) => {
        const open = indexedDB.open('weight-tracker');
        open.onsuccess = () => {
          const get = open.result.transaction('weights').objectStore('weights').getAllKeys();
          get.onsuccess = () => resolve(get.result as string[]);
        };
      }),
  );
