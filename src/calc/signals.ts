import { addDays, daysBetween, weekday } from '../lib/dates';
import { displayToKg } from '../lib/units';
import type { ISODate, MeasurementEntry, Settings, WeightEntry, WeightUnit } from '../types';
import { percentToGoal, totalLost } from './stats';
import { trendAt } from './trend';

const HEALTH_RATE_PER_WEEK = 0.01;
const HEALTH_WEEKS = 3;
const NOTE_REPEAT_DAYS = 7;
const BACKUP_NUDGE_DAYS = 30;
const GOAL_STEPS = [25, 50, 75];

export function streak(weights: WeightEntry[], today: ISODate): number {
  const dates = new Set(weights.map((e) => e.date));
  let day = dates.has(today) ? today : addDays(today, -1);
  let count = 0;
  while (dates.has(day)) {
    count += 1;
    day = addDays(day, -1);
  }
  return count;
}

export function reachedMilestones(weights: WeightEntry[], goalKg: number, unit: WeightUnit): string[] {
  const reached: string[] = [];
  const lost = totalLost(weights) ?? 0;
  const stepSize = unit === 'kg' ? 5 : 10;
  const steps = Math.floor(lost / displayToKg(stepSize, unit));
  for (let n = 1; n <= steps; n += 1) reached.push(`lost-${n * stepSize}${unit}`);

  const percent = percentToGoal(weights, goalKg);
  if (percent !== null) {
    for (const step of GOAL_STEPS) if (percent >= step) reached.push(`goal-${step}`);
    if (percent >= 100) reached.push('goal-reached');
  }
  return reached;
}

export const newMilestones = (reached: string[], celebrated: string[]): string[] =>
  reached.filter((id) => !celebrated.includes(id));

export const resetGoalMilestones = (celebrated: string[]): string[] => celebrated.filter((id) => !id.startsWith('goal-'));

const milestoneRank = (id: string): number => {
  if (id === 'goal-reached') return 100_000;
  const value = Number.parseInt(id.replace(/^\D+/, ''), 10);
  return id.startsWith('goal-') ? 10_000 + value : value;
};

export function pickMilestone(ids: string[]): string | null {
  if (ids.length === 0) return null;
  return ids.reduce((best, id) => (milestoneRank(id) > milestoneRank(best) ? id : best));
}

export function milestoneLabel(id: string): string {
  if (id === 'goal-reached') return 'your goal weight';
  const goal = id.match(/^goal-(\d+)$/);
  if (goal) return `${goal[1]}% of the way to your goal`;
  const lost = id.match(/^lost-(\d+)(kg|lb)$/);
  return lost ? `${lost[1]} ${lost[2]} lost` : id;
}

export function measurementsDue(measurements: MeasurementEntry[], measurementDay: number, today: ISODate): boolean {
  const lastDay = addDays(today, -((weekday(today) - measurementDay + 7) % 7));
  return !measurements.some((m) => m.date >= lastDay);
}

export function healthNoteDue(weights: WeightEntry[], dismissedAt: ISODate | undefined, today: ISODate): boolean {
  if (dismissedAt !== undefined && daysBetween(dismissedAt, today) < NOTE_REPEAT_DAYS) return false;
  if (weights.length === 0) return false;
  const latest = weights[weights.length - 1].date;
  if (daysBetween(weights[0].date, latest) < HEALTH_WEEKS * 7) return false;

  for (let week = 0; week < HEALTH_WEEKS; week += 1) {
    const end = trendAt(weights, addDays(latest, -7 * week));
    const start = trendAt(weights, addDays(latest, -7 * (week + 1)));
    if (end === null || start === null || (start - end) / start <= HEALTH_RATE_PER_WEEK) return false;
  }
  return true;
}

export function backupNudgeDue(settings: Settings, weights: WeightEntry[], today: ISODate): boolean {
  if (weights.length === 0) return false;
  const since = settings.lastBackupAt ? settings.lastBackupAt.slice(0, 10) : weights[0].date;
  return daysBetween(since, today) > BACKUP_NUDGE_DAYS;
}
