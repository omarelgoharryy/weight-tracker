import type { ISODate } from '../types';

const DAY_MS = 86_400_000;
const pad = (n: number) => String(n).padStart(2, '0');

function toUTC(date: ISODate): number {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function fromUTC(ms: number): ISODate {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function todayISO(now: Date = new Date()): ISODate {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export const addDays = (date: ISODate, n: number): ISODate => fromUTC(toUTC(date) + n * DAY_MS);

export const daysBetween = (a: ISODate, b: ISODate): number => Math.round((toUTC(b) - toUTC(a)) / DAY_MS);

export const weekday = (date: ISODate): number => new Date(toUTC(date)).getUTCDay();

export const formatDate = (date: ISODate): string =>
  new Date(toUTC(date)).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });

export const formatLongDate = (date: ISODate): string =>
  new Date(toUTC(date)).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });

export const formatShortDate = (date: ISODate): string =>
  new Date(toUTC(date)).toLocaleDateString(undefined, { day: 'numeric', month: 'short', timeZone: 'UTC' });
