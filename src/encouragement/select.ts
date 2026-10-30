import { milestoneLabel, streak } from '../calc/signals';
import { trendAt } from '../calc/trend';
import { addDays, daysBetween } from '../lib/dates';
import type { ISODate, WeightEntry } from '../types';
import { MESSAGES } from './messages';

export type Situation =
  | 'noEntries'
  | 'readyToLog'
  | 'welcomeBack'
  | 'first'
  | 'streak'
  | 'upDayTrendDown'
  | 'upTrend'
  | 'plateau'
  | 'downDay'
  | 'upDay'
  | 'milestone';

const RETURN_GAP_DAYS = 3;
const TREND_CHANGE_KG = 0.2;
const PLATEAU_MIN_DAYS = 14;

export function classify(weights: WeightEntry[], today: ISODate, milestoneToday?: string): Situation {
  if (weights.length === 0) return 'noEntries';
  if (milestoneToday) return 'milestone';

  const latest = weights[weights.length - 1];
  if (latest.date !== today) return daysBetween(latest.date, today) >= RETURN_GAP_DAYS ? 'welcomeBack' : 'readyToLog';
  if (weights.length === 1) return 'first';

  const previous = weights[weights.length - 2];
  if (daysBetween(previous.date, today) >= RETURN_GAP_DAYS) return 'welcomeBack';

  const days = streak(weights, today);
  if (days > 0 && days % 7 === 0) return 'streak';

  const dayChange = latest.kg - previous.kg;
  const weekAgo = trendAt(weights, addDays(today, -7));
  const change = weekAgo === null ? null : trendAt(weights, today)! - weekAgo;
  if (change !== null) {
    if (dayChange > 0 && change < -TREND_CHANGE_KG) return 'upDayTrendDown';
    if (change >= TREND_CHANGE_KG) return 'upTrend';
    if (daysBetween(weights[0].date, today) >= PLATEAU_MIN_DAYS && Math.abs(change) < TREND_CHANGE_KG) return 'plateau';
  }
  return dayChange <= 0 ? 'downDay' : 'upDay';
}

function hash(text: string): number {
  let value = 0;
  for (let i = 0; i < text.length; i += 1) value = (value * 31 + text.charCodeAt(i)) >>> 0;
  return value;
}

export function messageFor(weights: WeightEntry[], today: ISODate, milestoneToday?: string): string {
  const situation = classify(weights, today, milestoneToday);
  const list = MESSAGES[situation];
  const message = list[hash(today + situation) % list.length];
  return milestoneToday ? message.replace('{milestone}', milestoneLabel(milestoneToday)) : message;
}
