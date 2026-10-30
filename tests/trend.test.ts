import { trendAt, trendSeries } from '../src/calc/trend';
import { w } from './helpers';

test('trendAt averages the 7 calendar days ending on the date', () => {
  const data = [w('2026-10-01', 90), w('2026-10-07', 80), w('2026-10-08', 70)];
  expect(trendAt(data, '2026-10-07')).toBe(85);
  expect(trendAt(data, '2026-10-08')).toBe(75); // 10-01 falls outside
});
test('trendAt is null with no data in the window', () => {
  expect(trendAt([w('2026-10-01', 90)], '2026-10-20')).toBeNull();
});
test('trendSeries has one point per logged date', () =>
  expect(trendSeries([w('2026-10-01', 90), w('2026-10-05', 88)]).map((p) => p.date)).toEqual([
    '2026-10-01',
    '2026-10-05',
  ]));
