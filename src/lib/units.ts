import type { LengthUnit, WeightUnit } from '../types';

const KG_PER_LB = 0.45359237;
const CM_PER_IN = 2.54;

export const kgToDisplay = (kg: number, unit: WeightUnit): number => (unit === 'lb' ? kg / KG_PER_LB : kg);
export const displayToKg = (value: number, unit: WeightUnit): number => (unit === 'lb' ? value * KG_PER_LB : value);
export const cmToDisplay = (cm: number, unit: LengthUnit): number => (unit === 'in' ? cm / CM_PER_IN : cm);
export const displayToCm = (value: number, unit: LengthUnit): number => (unit === 'in' ? value * CM_PER_IN : value);

export const formatWeight = (kg: number, unit: WeightUnit): string => `${kgToDisplay(kg, unit).toFixed(1)} ${unit}`;
export const formatLength = (cm: number, unit: LengthUnit): string => `${cmToDisplay(cm, unit).toFixed(1)} ${unit}`;

export function formatChange(lostKg: number, unit: WeightUnit): string {
  const size = formatWeight(Math.abs(lostKg), unit);
  if (size.startsWith('0.0 ')) return size;
  return lostKg > 0 ? `−${size}` : `+${size}`;
}

export function parseDecimal(text: string): number | null {
  const cleaned = text.trim().replace(',', '.');
  return /^\d+(\.\d*)?$|^\.\d+$/.test(cleaned) ? Number(cleaned) : null;
}
