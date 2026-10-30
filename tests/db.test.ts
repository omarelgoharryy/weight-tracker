import 'fake-indexeddb/auto';
import { deleteMeasurement, deleteWeight, loadAll, putMeasurement, putWeight, replaceAll, saveSettings } from '../src/db/db';
import type { Settings } from '../src/types';

const settings: Settings = {
  goalKg: 80,
  weightUnit: 'kg',
  lengthUnit: 'cm',
  measurementDay: 5,
  celebratedMilestones: [],
};

beforeEach(async () => {
  await clearAll();
});

async function clearAll() {
  await replaceAll({ settings, weights: [], measurements: [] });
}

test('saved settings load back', async () => {
  await saveSettings({ ...settings, goalKg: 70 });
  expect((await loadAll()).settings?.goalKg).toBe(70);
});
test('same date overwrites and results are sorted', async () => {
  await putWeight({ date: '2026-10-30', kg: 90 });
  await putWeight({ date: '2026-10-01', kg: 95 });
  await putWeight({ date: '2026-10-30', kg: 89, note: 'x' });
  expect((await loadAll()).weights).toEqual([
    { date: '2026-10-01', kg: 95 },
    { date: '2026-10-30', kg: 89, note: 'x' },
  ]);
});
test('delete removes one entry', async () => {
  await putMeasurement({ date: '2026-10-30', waistCm: 90 });
  await putWeight({ date: '2026-10-30', kg: 90 });
  await deleteMeasurement('2026-10-30');
  await deleteWeight('2026-10-30');
  const all = await loadAll();
  expect(all.measurements).toEqual([]);
  expect(all.weights).toEqual([]);
});
test('replaceAll swaps everything at once', async () => {
  await putWeight({ date: '2026-01-01', kg: 100 });
  await replaceAll({ settings, weights: [{ date: '2026-10-30', kg: 80 }], measurements: [] });
  const all = await loadAll();
  expect(all.weights).toEqual([{ date: '2026-10-30', kg: 80 }]);
  expect(all.settings).toEqual(settings);
});
