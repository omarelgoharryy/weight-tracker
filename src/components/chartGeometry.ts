import type { Point } from '../calc/trend';
import { addDays, daysBetween } from '../lib/dates';
import type { ISODate } from '../types';

export type Range = '1m' | '3m' | '6m' | 'all';

const RANGE_DAYS: Record<Exclude<Range, 'all'>, number> = { '1m': 30, '3m': 90, '6m': 180 };
const PADDING = { top: 12, right: 12, bottom: 24, left: 40 };
const Y_TICKS = 4;

export function filterRange(points: Point[], range: Range, today: ISODate): Point[] {
  if (range === 'all') return points;
  const from = addDays(today, -RANGE_DAYS[range]);
  return points.filter((p) => p.date >= from);
}

export interface ChartInput {
  dots?: Point[];
  line?: Point[];
  goal?: number;
  width: number;
  height: number;
}

export interface XY {
  x: number;
  y: number;
}

export interface ChartLayout {
  dots: XY[];
  line: XY[];
  goalY: number | null;
  yTicks: { y: number; value: number }[];
  xLabels: { x: number; date: ISODate }[];
}

export function computeChart({ dots = [], line = [], goal, width, height }: ChartInput): ChartLayout {
  const points = [...dots, ...line];
  const dates = points.map((p) => p.date).sort();
  const first = dates[0];
  const last = dates[dates.length - 1];
  const span = first === undefined ? 0 : daysBetween(first, last);

  const values = points.map((p) => p.value);
  if (goal !== undefined) values.push(goal);
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) {
    min -= 1;
    max += 1;
  } else {
    const margin = (max - min) * 0.05;
    min -= margin;
    max += margin;
  }

  const plotWidth = width - PADDING.left - PADDING.right;
  const plotHeight = height - PADDING.top - PADDING.bottom;
  const xOf = (date: ISODate) =>
    PADDING.left + (span === 0 ? plotWidth / 2 : (daysBetween(first, date) / span) * plotWidth);
  const yOf = (value: number) => PADDING.top + ((max - value) / (max - min)) * plotHeight;
  const place = (p: Point): XY => ({ x: xOf(p.date), y: yOf(p.value) });

  return {
    dots: dots.map(place),
    line: line.map(place),
    goalY: goal === undefined ? null : yOf(goal),
    yTicks: Array.from({ length: Y_TICKS }, (_, i) => {
      const value = min + ((max - min) * (i + 0.5)) / Y_TICKS;
      return { y: yOf(value), value };
    }),
    xLabels: first === undefined ? [] : (span === 0 ? [first] : [first, last]).map((date) => ({ x: xOf(date), date })),
  };
}
