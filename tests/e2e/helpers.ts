import type { Page } from '@playwright/test';

export interface SetupOptions {
  goal?: string;
  height?: string;
  sex?: 'male' | 'female';
  skipGoto?: boolean;
}

export async function completeSetup(page: Page, options: SetupOptions = {}) {
  if (!options.skipGoto) await page.goto('./');
  await page.getByLabel(/goal weight/i).fill(options.goal ?? '80');
  if (options.height) await page.getByLabel(/height/i).fill(options.height);
  if (options.sex) await page.getByLabel(/biological sex/i).selectOption(options.sex);
  await page.getByRole('button', { name: /get started/i }).click();
  await page.getByRole('tab', { name: 'Today' }).waitFor();
}

export async function logWeight(page: Page, value: string) {
  await page.getByLabel('Weight').fill(value);
  await page.getByRole('button', { name: /save/i }).click();
}

export async function seedWeights(page: Page, entries: { date: string; kg: number }[]) {
  await page.evaluate(
    (rows) =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('weight-tracker');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const tx = open.result.transaction('weights', 'readwrite');
          for (const row of rows) tx.objectStore('weights').put(row);
          tx.oncomplete = () => {
            open.result.close();
            resolve();
          };
        };
      }),
    entries,
  );
  await page.reload();
  await page.getByRole('tab', { name: 'Today' }).waitFor();
}

export const logYesterday = (page: Page, kg: number) => seedWeights(page, [{ date: daysAgoISO(1), kg }]);

export const daysAgoISO =(days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
