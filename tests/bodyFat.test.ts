import { bodyFatSeries, estimateBodyFat } from '../src/calc/bodyFat';

const e = (m: object) => ({ date: '2026-10-30', ...m });

test('male formula', () => {
  const r = estimateBodyFat(e({ waistCm: 90, neckCm: 38 }), 180, 'male');
  expect(r.kind).toBe('ok');
  if (r.kind === 'ok')
    expect(r.percent).toBeCloseTo(495 / (1.0324 - 0.19077 * Math.log10(52) + 0.15456 * Math.log10(180)) - 450, 6);
});
test('female formula uses hips', () => {
  const r = estimateBodyFat(e({ waistCm: 75, neckCm: 33, hipsCm: 100 }), 165, 'female');
  expect(r.kind).toBe('ok');
  if (r.kind === 'ok')
    expect(r.percent).toBeCloseTo(495 / (1.29579 - 0.35004 * Math.log10(142) + 0.221 * Math.log10(165)) - 450, 6);
});
test('lists what is missing', () => {
  expect(estimateBodyFat(e({}), undefined, undefined)).toEqual({
    kind: 'missing',
    fields: ['height', 'sex', 'waist', 'neck'],
  });
  expect(estimateBodyFat(e({ waistCm: 75, neckCm: 33 }), 165, 'female')).toEqual({ kind: 'missing', fields: ['hips'] });
  expect(estimateBodyFat(e({ waistCm: 90, neckCm: 38 }), 180, 'male').kind).toBe('ok'); // hips not needed
});
test('asks to recheck when the log input is not positive or result is out of range', () => {
  expect(estimateBodyFat(e({ waistCm: 30, neckCm: 40 }), 180, 'male')).toEqual({ kind: 'recheck' });
  expect(estimateBodyFat(e({ waistCm: 40, neckCm: 39 }), 180, 'male')).toEqual({ kind: 'recheck' });
});
test('series skips entries that have no estimate', () => {
  const list = [e({ date: '2026-10-23', waistCm: 90 }), e({ waistCm: 90, neckCm: 38 })];
  expect(bodyFatSeries(list, 180, 'male').map((p) => p.date)).toEqual(['2026-10-30']);
});
