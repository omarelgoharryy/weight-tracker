import {
  needsTypoConfirm,
  validateDate,
  validateHeightCm,
  validateLengthCm,
  validateWeightKg,
} from '../src/calc/validation';
import { w } from './helpers';

test.each([
  [19.9, false],
  [20, true],
  [400, true],
  [400.1, false],
])('weight %d valid=%s', (v, ok) => expect(validateWeightKg(v) === null).toBe(ok));
test.each([
  [9.9, false],
  [10, true],
  [250, true],
  [250.1, false],
])('length %d valid=%s', (v, ok) => expect(validateLengthCm(v) === null).toBe(ok));
test.each([
  [99, false],
  [100, true],
  [250, true],
  [251, false],
])('height %d valid=%s', (v, ok) => expect(validateHeightCm(v) === null).toBe(ok));
test('future dates are rejected', () => {
  expect(validateDate('2026-10-31', '2026-10-30')).not.toBeNull();
  expect(validateDate('2026-10-30', '2026-10-30')).toBeNull();
});
test('typo check compares with the nearest earlier entry', () => {
  const data = [w('2026-10-01', 100), w('2026-10-20', 80)];
  expect(needsTypoConfirm(85, '2026-10-21', data)).toBe(true);
  expect(needsTypoConfirm(84.9, '2026-10-21', data)).toBe(false);
  expect(needsTypoConfirm(99, '2026-10-10', data)).toBe(false); // backdated: compares with 100
  expect(needsTypoConfirm(80, '2026-09-01', data)).toBe(false); // nothing earlier
  expect(needsTypoConfirm(80, '2026-10-20', data)).toBe(true); // editing: ignores own date
});
