export type ISODate = string; // YYYY-MM-DD
export type WeightUnit = 'kg' | 'lb';
export type LengthUnit = 'cm' | 'in';
export type Sex = 'male' | 'female';

export interface WeightEntry {
  date: ISODate;
  kg: number;
  note?: string;
}

export const MEASUREMENT_KEYS = ['neckCm', 'chestCm', 'waistCm', 'hipsCm', 'armCm', 'thighCm'] as const;
export type MeasurementKey = (typeof MEASUREMENT_KEYS)[number];
export type MeasurementEntry = { date: ISODate } & Partial<Record<MeasurementKey, number>>;

export interface Settings {
  goalKg: number;
  weightUnit: WeightUnit;
  lengthUnit: LengthUnit;
  heightCm?: number;
  sex?: Sex;
  measurementDay: number; // 0=Sun..6=Sat, default 5
  lastBackupAt?: string;
  celebratedMilestones: string[];
  latestMilestone?: { id: string; date: ISODate };
  healthNoteDismissedAt?: ISODate;
}

export interface AppData {
  settings: Settings;
  weights: WeightEntry[];
  measurements: MeasurementEntry[];
}
