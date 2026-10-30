import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { AppData, ISODate, MeasurementEntry, Settings, WeightEntry } from '../types';

interface TrackerDB extends DBSchema {
  weights: { key: string; value: WeightEntry };
  measurements: { key: string; value: MeasurementEntry };
  settings: { key: string; value: Settings };
}

const SETTINGS_KEY = 'app';

let connection: Promise<IDBPDatabase<TrackerDB>> | undefined;

function db(): Promise<IDBPDatabase<TrackerDB>> {
  connection ??= openDB<TrackerDB>('weight-tracker', 1, {
    upgrade(database) {
      database.createObjectStore('weights', { keyPath: 'date' });
      database.createObjectStore('measurements', { keyPath: 'date' });
      database.createObjectStore('settings');
    },
  });
  return connection;
}

export async function loadAll(): Promise<{
  settings: Settings | null;
  weights: WeightEntry[];
  measurements: MeasurementEntry[];
}> {
  const database = await db();
  const [settings, weights, measurements] = await Promise.all([
    database.get('settings', SETTINGS_KEY),
    database.getAll('weights'),
    database.getAll('measurements'),
  ]);
  return { settings: settings ?? null, weights, measurements };
}

export async function putWeight(entry: WeightEntry): Promise<void> {
  await (await db()).put('weights', entry);
}

export async function deleteWeight(date: ISODate): Promise<void> {
  await (await db()).delete('weights', date);
}

export async function putMeasurement(entry: MeasurementEntry): Promise<void> {
  await (await db()).put('measurements', entry);
}

export async function deleteMeasurement(date: ISODate): Promise<void> {
  await (await db()).delete('measurements', date);
}

export async function saveSettings(settings: Settings): Promise<void> {
  await (await db()).put('settings', settings, SETTINGS_KEY);
}

export async function replaceAll(data: AppData): Promise<void> {
  const tx = (await db()).transaction(['weights', 'measurements', 'settings'], 'readwrite');
  const weights = tx.objectStore('weights');
  const measurements = tx.objectStore('measurements');
  const writes: Promise<unknown>[] = [
    weights.clear(),
    measurements.clear(),
    tx.objectStore('settings').put(data.settings, SETTINGS_KEY),
    ...data.weights.map((entry) => weights.put(entry)),
    ...data.measurements.map((entry) => measurements.put(entry)),
  ];
  await Promise.all([...writes, tx.done]);
}

export async function requestPersistence(): Promise<void> {
  try {
    await navigator.storage?.persist?.();
  } catch {
    // Persistence is best effort; the app works without it.
  }
}
