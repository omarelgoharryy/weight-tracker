import type { Point } from '../calc/trend';
import { addDays, daysBetween } from '../lib/dates';
import type { ISODate } from '../types';

export type Range = '1m' | '3m' | '6m' | 'all';

const RANGE_DAYS: Record<Exclude<Range, 'all'>, number> = { '1m': 30, '3m': 90, '6m': 180 };
export const PADDING = { top: 12, right: 12, bottom: 24, left: 40 };
const Y_TICK_TARGET = 4;
const X_LABELS = 4;
const STEPS = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100];

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
  const low = Math.min(...values);
  const high = Math.max(...values);
  const step = STEPS.find((s) => (high - low) / s <= Y_TICK_TARGET) ?? STEPS[STEPS.length - 1];
  const min = low === high ? low - 1 : Math.floor(low / step) * step;
  // The top tick always clears the highest reading, so the line never touches the plot's edge.
  const max = low === high ? high + 1 : (Math.floor(high / step) + 1) * step;
  const tickStep = low === high ? 1 : step;

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
    yTicks: Array.from({ length: Math.round((max - min) / tickStep) + 1 }, (_, i) => {
      const value = min + i * tickStep;
      return { y: yOf(value), value };
    }),
    xLabels: first === undefined ? [] : labelDates(first, span).map((date) => ({ x: xOf(date), date })),
  };
}

function labelDates(first: ISODate, span: number): ISODate[] {
  if (span === 0) return [first];
  const count = Math.min(X_LABELS, span + 1);
  return Array.from({ length: count }, (_, i) => addDays(first, Math.round((span * i) / (count - 1))));
}

export function areaPath(line: XY[], left: number, right: number, bottom: number): string {
  if (line.length === 0) return '';
  const surface = line.map((p) => `L${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const last = line[line.length - 1];
  return `M${left} ${line[0].y.toFixed(1)} ${surface} L${right} ${last.y.toFixed(1)} L${right} ${bottom} L${left} ${bottom} Z`;
}
