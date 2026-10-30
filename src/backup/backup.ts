import { validateHeightCm, validateLengthCm, validateWeightKg } from '../calc/validation';
import { addDays } from '../lib/dates';
import { MEASUREMENT_KEYS } from '../types';
import type { AppData, ISODate, MeasurementEntry, Settings, WeightEntry } from '../types';

const VERSION = 1;
const REVOKE_DELAY_MS = 60_000;
const INVALID = "This file doesn't look like a valid Weight Tracker backup.";

export type ParseResult =
  | { ok: true; data: AppData; summary: { weights: number; measurements: number; first?: ISODate; last?: ISODate } }
  | { ok: false; error: string };

export const buildBackup = (data: AppData, nowIso: string): string =>
  JSON.stringify({ version: VERSION, exportedAt: nowIso, ...data }, null, 2);

export const backupFileName = (today: ISODate): string => `weight-tracker-backup-${today}.json`;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isDate = (value: unknown): value is ISODate =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && addDays(value, 0) === value;

const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

const uniqueDates = (entries: { date: ISODate }[]): boolean => new Set(entries.map((e) => e.date)).size === entries.length;

const byDate = (a: { date: ISODate }, b: { date: ISODate }) => a.date.localeCompare(b.date);

function parseWeight(raw: unknown): WeightEntry | null {
  if (!isObject(raw) || !isDate(raw.date) || !isNumber(raw.kg) || validateWeightKg(raw.kg)) return null;
  if (raw.note !== undefined && typeof raw.note !== 'string') return null;
  return { date: raw.date, kg: raw.kg, ...(raw.note !== undefined && { note: raw.note }) };
}

function parseMeasurement(raw: unknown): MeasurementEntry | null {
  if (!isObject(raw) || !isDate(raw.date)) return null;
  const entry: MeasurementEntry = { date: raw.date };
  for (const key of MEASUREMENT_KEYS) {
    const value = raw[key];
    if (value === undefined) continue;
    if (!isNumber(value) || validateLengthCm(value)) return null;
    entry[key] = value;
  }
  return entry;
}

function parseSettings(raw: unknown): Settings | null {
  if (!isObject(raw)) return null;
  const { goalKg, weightUnit, lengthUnit, heightCm, sex, measurementDay, lastBackupAt, celebratedMilestones } = raw;
  const { latestMilestone, healthNoteDismissedAt } = raw;
  if (!isNumber(goalKg) || validateWeightKg(goalKg)) return null;
  if (weightUnit !== 'kg' && weightUnit !== 'lb') return null;
  if (lengthUnit !== 'cm' && lengthUnit !== 'in') return null;
  if (!Number.isInteger(measurementDay) || (measurementDay as number) < 0 || (measurementDay as number) > 6) return null;
  if (!Array.isArray(celebratedMilestones) || !celebratedMilestones.every((id) => typeof id === 'string')) return null;
  if (heightCm !== undefined && (!isNumber(heightCm) || validateHeightCm(heightCm))) return null;
  if (sex !== undefined && sex !== 'male' && sex !== 'female') return null;
  if (lastBackupAt !== undefined && typeof lastBackupAt !== 'string') return null;
  if (healthNoteDismissedAt !== undefined && !isDate(healthNoteDismissedAt)) return null;
  const milestoneValid =
    latestMilestone === undefined ||
    (isObject(latestMilestone) && typeof latestMilestone.id === 'string' && isDate(latestMilestone.date));
  if (!milestoneValid) return null;

  return {
    goalKg,
    weightUnit,
    lengthUnit,
    measurementDay: measurementDay as number,
    celebratedMilestones,
    ...(heightCm !== undefined && { heightCm }),
    ...(sex !== undefined && { sex }),
    ...(lastBackupAt !== undefined && { lastBackupAt }),
    ...(latestMilestone !== undefined && { latestMilestone: latestMilestone as Settings['latestMilestone'] }),
    ...(healthNoteDismissedAt !== undefined && { healthNoteDismissedAt }),
  };
}

function parseAll<T>(raw: unknown, parse: (value: unknown) => T | null): T[] | null {
  if (!Array.isArray(raw)) return null;
  const parsed = raw.map(parse);
  return parsed.every((entry) => entry !== null) ? (parsed as T[]) : null;
}

export function parseBackup(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: INVALID };
  }
  if (!isObject(raw)) return { ok: false, error: INVALID };
  if (isNumber(raw.version) && raw.version > VERSION)
    return { ok: false, error: 'This backup came from a newer version of the app. Update the app and try again.' };
  if (raw.version !== VERSION) return { ok: false, error: INVALID };

  const settings = parseSettings(raw.settings);
  const weights = parseAll(raw.weights, parseWeight);
  const measurements = parseAll(raw.measurements, parseMeasurement);
  if (!settings || !weights || !measurements) return { ok: false, error: INVALID };
  if (!uniqueDates(weights) || !uniqueDates(measurements)) return { ok: false, error: INVALID };

  weights.sort(byDate);
  measurements.sort(byDate);
  return {
    ok: true,
    data: { settings, weights, measurements },
    summary: {
      weights: weights.length,
      measurements: measurements.length,
      first: weights[0]?.date,
      last: weights[weights.length - 1]?.date,
    },
  };
}

function downloadFile(file: File): void {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
}

export type ShareResult = 'saved' | 'downloaded' | 'cancelled' | 'failed';

export async function shareBackup(json: string, fileName: string): Promise<ShareResult> {
  const file = new File([json], fileName, { type: 'application/json' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return 'saved';
    } catch (error) {
      return error instanceof DOMException && error.name === 'AbortError' ? 'cancelled' : 'failed';
    }
  }
  downloadFile(file);
  return 'downloaded';
}
