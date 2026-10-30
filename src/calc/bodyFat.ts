import type { MeasurementEntry, Sex } from '../types';
import type { Point } from './trend';

export type BodyFatField = 'height' | 'sex' | 'waist' | 'neck' | 'hips';
export type BodyFatResult =
  | { kind: 'ok'; percent: number }
  | { kind: 'missing'; fields: BodyFatField[] }
  | { kind: 'recheck' };

const MIN_PERCENT = 2;
const MAX_PERCENT = 70;

export function estimateBodyFat(
  entry: MeasurementEntry,
  heightCm: number | undefined,
  sex: Sex | undefined,
): BodyFatResult {
  const { waistCm, neckCm, hipsCm } = entry;
  const fields: BodyFatField[] = [];
  if (heightCm === undefined) fields.push('height');
  if (sex === undefined) fields.push('sex');
  if (waistCm === undefined) fields.push('waist');
  if (neckCm === undefined) fields.push('neck');
  if (sex === 'female' && hipsCm === undefined) fields.push('hips');
  if (fields.length > 0) return { kind: 'missing', fields };

  const logInput = sex === 'male' ? waistCm! - neckCm! : waistCm! + hipsCm! - neckCm!;
  if (logInput <= 0) return { kind: 'recheck' };

  const density =
    sex === 'male'
      ? 1.0324 - 0.19077 * Math.log10(logInput) + 0.15456 * Math.log10(heightCm!)
      : 1.29579 - 0.35004 * Math.log10(logInput) + 0.221 * Math.log10(heightCm!);
  const percent = 495 / density - 450;
  return percent >= MIN_PERCENT && percent <= MAX_PERCENT ? { kind: 'ok', percent } : { kind: 'recheck' };
}

export function bodyFatSeries(
  measurements: MeasurementEntry[],
  heightCm: number | undefined,
  sex: Sex | undefined,
): Point[] {
  return measurements.flatMap((entry) => {
    const result = estimateBodyFat(entry, heightCm, sex);
    return result.kind === 'ok' ? [{ date: entry.date, value: result.percent }] : [];
  });
}
