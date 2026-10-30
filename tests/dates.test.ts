import { addDays, daysBetween, todayISO, weekday } from '../src/lib/dates';

test('todayISO uses the local calendar date', () => {
  expect(todayISO(new Date(2026, 9, 30, 23, 59))).toBe('2026-10-30');
  expect(todayISO(new Date(2026, 9, 31, 0, 1))).toBe('2026-10-31');
});
test('addDays crosses month, year and DST boundaries', () => {
  expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  expect(addDays('2026-03-29', 1)).toBe('2026-03-30');
  expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
});
test('daysBetween counts whole days', () => expect(daysBetween('2026-10-01', '2026-10-30')).toBe(29));
test('weekday: 2026-10-30 is a Friday', () => expect(weekday('2026-10-30')).toBe(5));
