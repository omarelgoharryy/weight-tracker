import { addDays } from '../lib/dates';
import type { ISODate, WeightEntry } from '../types';

export interface Point {
  date: ISODate;
  value: number;
}

export function trendAt(weights: WeightEntry[], date: ISODate): number | null {
  const from = addDays(date, -6);
  const inWindow = weights.filter((e) => e.date >= from && e.date <= date);
  if (inWindow.length === 0) return null;
  return inWindow.reduce((sum, e) => sum + e.kg, 0) / inWindow.length;
}

export const trendSeries = (weights: WeightEntry[]): Point[] =>
  weights.map((e) => ({ date: e.date, value: trendAt(weights, e.date)! }));
