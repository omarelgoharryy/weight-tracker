import {
  backupNudgeDue,
  celebrateReached,
  healthNoteDue,
  measurementsDue,
  milestoneLabel,
  newMilestones,
  pickMilestone,
  reachedMilestones,
  resetGoalMilestones,
  streak,
} from '../src/calc/signals';
import type { Settings } from '../src/types';
import { dailySeries, w } from './helpers';

test('streak counts back from today or yesterday', () => {
  const data = [w('2026-10-27', 90), w('2026-10-28', 90), w('2026-10-29', 90)];
  expect(streak(data, '2026-10-29')).toBe(3);
  expect(streak(data, '2026-10-30')).toBe(3);
  expect(streak(data, '2026-10-31')).toBe(0);
  expect(streak([], '2026-10-30')).toBe(0);
});
test('lost milestones follow the display unit and are trend-based', () => {
  const data = dailySeries('2026-09-01', 60, 100, -0.1); // ends near 94 kg
  expect(reachedMilestones(data, 50, 'kg')).toContain('lost-5kg');
  expect(reachedMilestones(data, 50, 'kg')).not.toContain('lost-10kg');
  expect(reachedMilestones(data, 50, 'lb')).toContain('lost-10lb');
});
test('one low reading does not trigger a milestone', () => {
  const data = [...dailySeries('2026-10-01', 10, 100, 0), w('2026-10-11', 90)];
  expect(reachedMilestones(data, 50, 'kg')).not.toContain('lost-5kg');
});
test('goal milestones and goal reached', () => {
  const data = [w('2026-01-01', 100), w('2026-06-01', 79)];
  expect(reachedMilestones(data, 80, 'kg')).toEqual(
    expect.arrayContaining(['goal-25', 'goal-50', 'goal-75', 'goal-reached']),
  );
});
test('no milestones without entries, or when the goal is not below the start', () => {
  expect(reachedMilestones([], 80, 'kg')).toEqual([]);
  expect(reachedMilestones([w('2026-01-01', 80)], 85, 'kg')).toEqual([]);
});
test('newMilestones excludes those celebrated, even after regaining weight', () => {
  expect(newMilestones(['lost-5kg', 'goal-25'], ['lost-5kg'])).toEqual(['goal-25']);
  expect(newMilestones(['goal-25'], ['lost-5kg', 'goal-25', 'goal-50'])).toEqual([]);
});
test('several new milestones produce one celebration', () => {
  expect(pickMilestone(newMilestones(['lost-10lb', 'lost-20lb', 'goal-25'], []))).toBe('goal-25');
  expect(pickMilestone(['lost-10lb', 'lost-20lb'])).toBe('lost-20lb');
  expect(pickMilestone(['lost-5kg', 'lost-10kg', 'goal-50', 'goal-75', 'goal-reached'])).toBe('goal-reached');
  expect(pickMilestone([])).toBeNull();
});
test('milestones have readable labels', () => {
  expect(milestoneLabel('lost-5kg')).toBe('5 kg lost');
  expect(milestoneLabel('lost-20lb')).toBe('20 lb lost');
  expect(milestoneLabel('goal-25')).toBe('25% of the way to your goal');
  expect(milestoneLabel('goal-reached')).toBe('your goal weight');
});
test('a unit switch quietly marks what was already earned in the new unit', () => {
  const data = dailySeries('2026-01-01', 100, 100, -0.1); // about 9.6 kg lost
  const celebrated = celebrateReached(data, 50, 'lb', ['lost-5kg']);
  expect(celebrated).toEqual(expect.arrayContaining(['lost-5kg', 'lost-10lb', 'lost-20lb']));
  expect(newMilestones(reachedMilestones(data, 50, 'lb'), celebrated)).toEqual([]);
});
test('changing the goal resets only goal milestones', () =>
  expect(resetGoalMilestones(['lost-5kg', 'goal-25', 'goal-reached'])).toEqual(['lost-5kg']));
test('measurement card stays until logged after the measurement day', () => {
  const friday = 5;
  expect(measurementsDue([], friday, '2026-10-28')).toBe(true); // baseline for a new user
  const m = [{ date: '2026-10-23' }];
  expect(measurementsDue(m, friday, '2026-10-29')).toBe(false); // Thursday
  expect(measurementsDue(m, friday, '2026-10-30')).toBe(true); // Friday
  expect(measurementsDue(m, friday, '2026-11-02')).toBe(true); // missed, still showing
  expect(measurementsDue([{ date: '2026-10-30' }], friday, '2026-10-30')).toBe(false);
  expect(measurementsDue([{ date: '2026-10-31' }], friday, '2026-11-02')).toBe(false);
});
test('health note needs 3 straight weeks above 1% per week', () => {
  const fast = dailySeries('2026-09-01', 40, 100, -0.3);
  const safe = dailySeries('2026-09-01', 40, 100, -0.05);
  const today = '2026-10-10';
  expect(healthNoteDue(fast, undefined, today)).toBe(true);
  expect(healthNoteDue(safe, undefined, today)).toBe(false);
  expect(healthNoteDue(dailySeries('2026-09-25', 14, 100, -0.3), undefined, today)).toBe(false);
  expect(healthNoteDue([], undefined, today)).toBe(false);
});
test('dismissed health note returns after a week', () => {
  const fast = dailySeries('2026-09-01', 40, 100, -0.3);
  expect(healthNoteDue(fast, '2026-10-05', '2026-10-10')).toBe(false);
  expect(healthNoteDue(fast, '2026-10-03', '2026-10-10')).toBe(true);
});
test('backup nudge at more than 30 days', () => {
  const s = (lastBackupAt?: string) => ({ lastBackupAt }) as Settings;
  const first = [w('2026-09-01', 90)];
  expect(backupNudgeDue(s(), [], '2026-10-30')).toBe(false);
  expect(backupNudgeDue(s(), [w('2026-10-01', 90)], '2026-10-30')).toBe(false); // 29 days
  expect(backupNudgeDue(s(), first, '2026-10-30')).toBe(true);
  expect(backupNudgeDue(s('2026-10-01T12:00:00Z'), first, '2026-10-30')).toBe(false);
  expect(backupNudgeDue(s('2026-09-01T12:00:00Z'), first, '2026-10-30')).toBe(true);
});
