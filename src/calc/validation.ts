import type { ISODate, WeightEntry } from '../types';

const TYPO_THRESHOLD_KG = 5;

const inRange = (value: number, min: number, max: number, message: string): string | null =>
  value >= min && value <= max ? null : message;

export const validateWeightKg = (kg: number): string | null =>
  inRange(kg, 20, 400, 'Weight needs to be between 20 and 400 kg (44-882 lb).');

export const validateLengthCm = (cm: number): string | null =>
  inRange(cm, 10, 250, 'Measurements need to be between 10 and 250 cm (4-98 in).');

export const validateHeightCm = (cm: number): string | null =>
  inRange(cm, 100, 250, 'Height needs to be between 100 and 250 cm (39-98 in).');

export const validateDate = (date: ISODate, today: ISODate): string | null =>
  date > today ? "That date is in the future. Pick today or an earlier day." : null;

export function needsTypoConfirm(kg: number, date: ISODate, weights: WeightEntry[]): boolean {
  const earlier = weights.filter((e) => e.date < date);
  if (earlier.length === 0) return false;
  return Math.abs(kg - earlier[earlier.length - 1].kg) >= TYPO_THRESHOLD_KG;
}
