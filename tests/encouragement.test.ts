import { milestoneLabel } from '../src/calc/signals';
import { MESSAGES } from '../src/encouragement/messages';
import { classify, messageFor } from '../src/encouragement/select';
import { addDays } from '../src/lib/dates';
import { dailySeries, w } from './helpers';

const today = '2026-10-30';

test('classification rules', () => {
  expect(classify([], today)).toBe('noEntries');
  expect(classify([w('2026-10-29', 90)], today)).toBe('readyToLog');
  expect(classify([w('2026-10-20', 90)], today)).toBe('welcomeBack');
  expect(classify([w(today, 90)], today)).toBe('first');
  expect(classify([w('2026-10-20', 90), w(today, 90)], today)).toBe('welcomeBack');
  expect(classify([w(today, 90)], today, 'goal-25')).toBe('milestone');
});
test('seventh day of a streak', () => expect(classify(dailySeries('2026-10-24', 7, 90, -0.1), today)).toBe('streak'));
test('an up day while the trend is down', () => {
  const data = dailySeries('2026-10-11', 20, 95, -0.3);
  data[data.length - 1] = w(today, 90);
  expect(classify(data, today)).toBe('upDayTrendDown');
});
test('rising trend', () => expect(classify(dailySeries('2026-10-11', 20, 90, 0.1), today)).toBe('upTrend'));
test('plateau needs 14 days of data', () =>
  expect(classify(dailySeries('2026-10-11', 20, 90, 0), today)).toBe('plateau'));
test('down day', () => expect(classify([w('2026-10-29', 90), w(today, 89.5)], today)).toBe('downDay'));
test('up day with too little history', () =>
  expect(classify([w('2026-10-29', 90), w(today, 90.5)], today)).toBe('upDay'));
test('message is stable within a day and varies across days', () => {
  const data = dailySeries('2026-10-24', 7, 90, -0.1);
  expect(messageFor(data, today)).toBe(messageFor(data, today));
  const days = new Set(Array.from({ length: 30 }, (_, i) => messageFor([w('2026-01-01', 90)], addDays('2026-02-01', i))));
  expect(days.size).toBeGreaterThan(1);
});
test('milestone message names the milestone', () =>
  expect(messageFor([w(today, 90)], today, 'goal-50')).toContain(milestoneLabel('goal-50')));
test('every situation has at least 3 kind messages', () => {
  for (const [situation, list] of Object.entries(MESSAGES)) {
    expect(list.length, situation).toBeGreaterThanOrEqual(3);
    for (const m of list)
      expect(m.toLowerCase()).not.toMatch(
        /\b(fail|failed|failure|bad|lazy|cheat|cheated|guilt|guilty|disappoint|should have|shouldn't have|gave up|fell off)/,
      );
  }
});
