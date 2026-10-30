import {
  averageLossPerWeek,
  bmi,
  currentWeight,
  lowestWeight,
  percentToGoal,
  projectGoalDate,
  startingWeight,
  totalLost,
} from '../src/calc/stats';
import { daysBetween } from '../src/lib/dates';
import { dailySeries, w } from './helpers';

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
  const date = projectGoalDate(data, 90)!;
  expect(daysBetween('2026-10-22', date)).toBeGreaterThan(40);
  expect(daysBetween('2026-10-22', date)).toBeLessThan(70);
});
test('projectGoalDate is hidden when too early, trending up, flat or at goal', () => {
  expect(projectGoalDate(dailySeries('2026-10-01', 14, 100, -0.1), 90)).toBeNull(); // spans 13 days
  expect(projectGoalDate(dailySeries('2026-10-01', 30, 100, 0.1), 90)).toBeNull();
  expect(projectGoalDate(dailySeries('2026-10-01', 30, 100, 0), 90)).toBeNull();
  expect(projectGoalDate(dailySeries('2026-10-01', 30, 89, -0.1), 90)).toBeNull();
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
  expect(projectGoalDate([], 80)).toBeNull();
  expect(bmi([], 180)).toBeNull();
});
