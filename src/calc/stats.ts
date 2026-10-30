import { addDays, daysBetween } from '../lib/dates';
import type { ISODate, WeightEntry } from '../types';
import { trendAt, trendSeries } from './trend';

const latestTrend = (weights: WeightEntry[]): number | null =>
  weights.length ? trendAt(weights, weights[weights.length - 1].date) : null;

const spanDays = (weights: WeightEntry[]): number =>
  weights.length ? daysBetween(weights[0].date, weights[weights.length - 1].date) : 0;

export const startingWeight = (weights: WeightEntry[]): number | null => (weights.length ? weights[0].kg : null);

export const currentWeight = (weights: WeightEntry[]): number | null =>
  weights.length ? weights[weights.length - 1].kg : null;

export const lowestWeight = (weights: WeightEntry[]): number | null =>
  weights.length ? Math.min(...weights.map((e) => e.kg)) : null;

export function totalLost(weights: WeightEntry[]): number | null {
  const start = startingWeight(weights);
  const trend = latestTrend(weights);
  return start === null || trend === null ? null : start - trend;
}

export function percentToGoal(weights: WeightEntry[], goalKg: number): number | null {
  const start = startingWeight(weights);
  const trend = latestTrend(weights);
  if (start === null || trend === null || goalKg >= start) return null;
  return Math.min(100, Math.max(0, ((start - trend) / (start - goalKg)) * 100));
}

export function averageLossPerWeek(weights: WeightEntry[]): number | null {
  const span = spanDays(weights);
  if (span < 7) return null;
  const first = trendAt(weights, weights[0].date)!;
  return (first - latestTrend(weights)!) / (span / 7);
}

export function projectGoalDate(weights: WeightEntry[], goalKg: number): ISODate | null {
  if (spanDays(weights) < 14) return null;
  const latestDate = weights[weights.length - 1].date;
  if (latestTrend(weights)! <= goalKg) return null;

  const from = addDays(latestDate, -27);
  const points = trendSeries(weights).filter((p) => p.date >= from);
  const xs = points.map((p) => daysBetween(from, p.date));
  const meanX = xs.reduce((a, b) => a + b, 0) / xs.length;
  const meanY = points.reduce((a, p) => a + p.value, 0) / points.length;
  const denominator = xs.reduce((a, x) => a + (x - meanX) ** 2, 0);
  if (denominator === 0) return null;
  const slope = xs.reduce((a, x, i) => a + (x - meanX) * (points[i].value - meanY), 0) / denominator;
  if (slope >= 0) return null;

  const daysFromLatest = Math.ceil((goalKg - meanY) / slope + meanX) - daysBetween(from, latestDate);
  return addDays(latestDate, Math.max(1, daysFromLatest));
}

export function bmi(weights: WeightEntry[], heightCm: number): number | null {
  const trend = latestTrend(weights);
  return trend === null ? null : trend / (heightCm / 100) ** 2;
}
