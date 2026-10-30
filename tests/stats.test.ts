import {
  averageLossPerWeek,
  bmi,
  currentWeight,
  lostThisWeek,
  lowestWeight,
  percentToGoal,
  projectGoalDate,
  remainingToGoal,
  startingWeight,
  totalLost,
} from '../src/calc/stats';
import { daysBetween } from '../src/lib/dates';
import { dailySeries, w } from './helpers';

const TODAY = '2026-10-22';

test('starting weight is the earliest date, including a backdated entry', () => {
  const data = [w('2026-10-01', 90), w('2026-10-02', 89)];
  expect(startingWeight(data)).toBe(90);
  expect(startingWeight([w('2026-09-20', 95), ...data])).toBe(95);
});
test('percentToGoal clamps to 0-100 and hides when goal is not below start', () => {
  expect(percentToGoal([w('2026-10-01', 100)], 80)).toBe(0);
  expect(percentToGoal([w('2026-10-01', 100), w('2026-11-01', 90)], 80)).toBe(50);
  expect(percentToGoal([w('2026-10-01', 100), w('2026-11-01', 70)], 80)).toBe(100);
  expect(percentToGoal([w('2026-10-01', 80)], 80)).toBeNull();
  expect(percentToGoal([w('2026-10-01', 80)], 85)).toBeNull();
});
test('averageLossPerWeek needs entries spanning at least 7 days', () => {
  expect(averageLossPerWeek([w('2026-10-01', 90), w('2026-10-07', 89)])).toBeNull();
  expect(averageLossPerWeek([w('2026-10-01', 90), w('2026-10-15', 88)])).toBeCloseTo(1, 5);
});
test('projectGoalDate on a steady 1 kg per week loss', () => {
  const data = dailySeries('2026-10-01', 22, 100, -1 / 7);
  const date = projectGoalDate(data, 90, TODAY)!;
  expect(daysBetween('2026-10-22', date)).toBeGreaterThan(40);
  expect(daysBetween('2026-10-22', date)).toBeLessThan(70);
});
test('projectGoalDate is hidden when too early, trending up, flat or at goal', () => {
  expect(projectGoalDate(dailySeries('2026-10-01', 14, 100, -0.1), 90, TODAY)).toBeNull(); // spans 13 days
  expect(projectGoalDate(dailySeries('2026-10-01', 30, 100, 0.1), 90, TODAY)).toBeNull();
  expect(projectGoalDate(dailySeries('2026-10-01', 30, 100, 0), 90, TODAY)).toBeNull();
  expect(projectGoalDate(dailySeries('2026-10-01', 30, 89, -0.1), 90, TODAY)).toBeNull();
});
test('a flat series never projects a date, whatever the rounding noise', () => {
  for (let tenths = 900; tenths < 1500; tenths++) {
    expect(projectGoalDate(dailySeries('2026-09-01', 30, tenths / 10, 0), 80, '2026-10-22')).toBeNull();
  }
});
test('a projection already in the past is hidden', () => {
  const data = dailySeries('2026-01-01', 60, 100, -0.1);
  expect(projectGoalDate(data, 90, '2026-03-05')).not.toBeNull();
  expect(projectGoalDate(data, 90, '2026-10-30')).toBeNull();
});
test('bmi uses latest trend', () => expect(bmi([w('2026-10-01', 80)], 200)).toBe(20));
test('lowest and current weight', () => {
  const data = [w('2026-10-01', 90), w('2026-10-02', 88), w('2026-10-03', 89)];
  expect(lowestWeight(data)).toBe(88);
  expect(currentWeight(data)).toBe(89);
});
test('stats return null for no entries', () => {
  for (const f of [startingWeight, lowestWeight, currentWeight, totalLost, averageLossPerWeek]) expect(f([])).toBeNull();
  expect(percentToGoal([], 80)).toBeNull();
  expect(projectGoalDate([], 80, TODAY)).toBeNull();
  expect(bmi([], 180)).toBeNull();
});

test('lostThisWeek compares the trend with a week earlier', () => {
  const weights = [
    { date: '2026-10-01', kg: 90 },
    { date: '2026-10-08', kg: 89 },
  ];
  expect(lostThisWeek(weights)).toBeCloseTo(1);
  expect(lostThisWeek(weights.slice(0, 1))).toBeNull();
  expect(lostThisWeek([])).toBeNull();
});

test('remainingToGoal never goes below zero', () => {
  expect(remainingToGoal([{ date: '2026-10-01', kg: 90 }], 80)).toBe(10);
  expect(remainingToGoal([{ date: '2026-10-01', kg: 79 }], 80)).toBe(0);
  expect(remainingToGoal([], 80)).toBeNull();
});
