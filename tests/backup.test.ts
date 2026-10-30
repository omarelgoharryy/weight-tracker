import { backupFileName, buildBackup, parseBackup, shareBackup } from '../src/backup/backup';
import type { AppData } from '../src/types';

const data: AppData = {
  settings: { goalKg: 80, weightUnit: 'kg', lengthUnit: 'cm', measurementDay: 5, celebratedMilestones: [] },
  weights: [
    { date: '2026-10-01', kg: 90 },
    { date: '2026-10-30', kg: 88, note: 'hello' },
  ],
  measurements: [{ date: '2026-10-30', waistCm: 90 }],
};

const backupWith = (overrides: object) =>
  JSON.stringify({ version: 1, exportedAt: '2026-10-30T12:00:00Z', ...data, ...overrides });

afterEach(() => vi.unstubAllGlobals());

test('round trip preserves all data', () => {
  const r = parseBackup(buildBackup(data, '2026-10-30T12:00:00Z'));
  expect(r).toMatchObject({
    ok: true,
    data,
    summary: { weights: 2, measurements: 1, first: '2026-10-01', last: '2026-10-30' },
  });
});
test('file name includes the date', () =>
  expect(backupFileName('2026-10-30')).toBe('weight-tracker-backup-2026-10-30.json'));
test.each([
  ['not json', '{oops'],
  ['empty file', ''],
  ['wrong shape', '{"hello":1}'],
  ['null', 'null'],
  ['newer version', backupWith({ version: 2 })],
  ['bad date', backupWith({ weights: [{ date: '30/10/2026', kg: 80 }] })],
  ['impossible weight', backupWith({ weights: [{ date: '2026-10-30', kg: 5000 }] })],
  ['string weight', backupWith({ weights: [{ date: '2026-10-30', kg: '80' }] })],
  ['duplicate dates', backupWith({ weights: [{ date: '2026-10-30', kg: 80 }, { date: '2026-10-30', kg: 81 }] })],
  ['bad measurement', backupWith({ measurements: [{ date: '2026-10-30', waistCm: 1 }] })],
  ['missing settings', backupWith({ settings: undefined })],
  ['bad settings', backupWith({ settings: { goalKg: 'x' } })],
])('rejects %s', (_, text) => {
  const r = parseBackup(text);
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.length).toBeGreaterThan(0);
});
test('entries are returned sorted by date', () => {
  const r = parseBackup(
    backupWith({
      weights: [
        { date: '2026-10-30', kg: 80 },
        { date: '2026-10-01', kg: 90 },
      ],
    }),
  );
  expect(r.ok && r.data.weights[0].date).toBe('2026-10-01');
});
test('shareBackup reports a cancelled share sheet', async () => {
  vi.stubGlobal('navigator', {
    canShare: () => true,
    share: () => Promise.reject(new DOMException('', 'AbortError')),
  });
  expect(await shareBackup('{}', 'a.json')).toBe('cancelled');
});
test('shareBackup reports a completed share', async () => {
  vi.stubGlobal('navigator', { canShare: () => true, share: () => Promise.resolve() });
  expect(await shareBackup('{}', 'a.json')).toBe('saved');
});
