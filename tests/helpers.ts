import { addDays } from '../src/lib/dates';
import type { ISODate, WeightEntry } from '../src/types';

export const w = (date: ISODate, kg: number): WeightEntry => ({ date, kg });

export const dailySeries = (startDate: ISODate, days: number, startKg: number, perDay: number): WeightEntry[] =>
  Array.from({ length: days }, (_, i) => w(addDays(startDate, i), startKg + perDay * i));
