import { displayToCm, displayToKg, formatWeight, kgToDisplay, parseDecimal } from '../src/lib/units';

test('parseDecimal accepts dot and comma, rejects junk', () => {
  expect(parseDecimal('82.5')).toBe(82.5);
  expect(parseDecimal('82,5')).toBe(82.5);
  expect(parseDecimal(' 82 ')).toBe(82);
  expect(parseDecimal('')).toBeNull();
  expect(parseDecimal('abc')).toBeNull();
  expect(parseDecimal('1.2.3')).toBeNull();
});
test('every 0.1 lb value survives a round trip to the same displayed value', () => {
  for (let tenths = 440; tenths <= 8800; tenths++) {
    const shown = (tenths / 10).toFixed(1);
    const kg = displayToKg(Number(shown), 'lb');
    expect(kgToDisplay(kg, 'lb').toFixed(1)).toBe(shown);
  }
});
test('conversions use exact factors', () => {
  expect(displayToKg(1, 'lb')).toBeCloseTo(0.45359237, 8);
  expect(displayToCm(1, 'in')).toBe(2.54);
});
test('formatWeight shows one decimal and the unit', () => expect(formatWeight(81.65, 'kg')).toBe('81.7 kg'));
