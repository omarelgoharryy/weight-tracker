import { useState } from 'preact/hooks';
import { estimateBodyFat, type BodyFatResult } from '../calc/bodyFat';
import { validateLengthCm } from '../calc/validation';
import { putMeasurement } from '../db/db';
import { formatDate } from '../lib/dates';
import { cmToDisplay, displayToCm, parseDecimal } from '../lib/units';
import { MEASUREMENT_KEYS } from '../types';
import type { ISODate, MeasurementEntry, MeasurementKey, Settings } from '../types';

const LABELS: Record<MeasurementKey, string> = {
  neckCm: 'Neck',
  chestCm: 'Chest',
  waistCm: 'Waist',
  hipsCm: 'Hips',
  armCm: 'Arm',
  thighCm: 'Thigh',
};

export function measurementLabel(key: MeasurementKey): string {
  return LABELS[key];
}

function BodyFatMessage({ result }: { result: BodyFatResult }) {
  if (result.kind === 'ok')
    return (
      <>
        <strong>Body fat estimate: {result.percent.toFixed(1)}%</strong>
        <p class="hint">Usually within 3-4 points of a clinical scan. The trend over time matters most.</p>
      </>
    );
  if (result.kind === 'missing')
    return <p class="hint">To estimate body fat, add your {result.fields.join(', ')}. Height and sex are in Settings.</p>;
  return <p>These numbers don't give a usable body fat estimate. Check your waist, neck and hips.</p>;
}

interface Props {
  date: ISODate;
  initial?: MeasurementEntry;
  settings: Settings;
  onSaved(): Promise<void>;
  onDone(): void;
}

export function MeasurementForm({ date, initial, settings, onSaved, onDone }: Props) {
  const unit = settings.lengthUnit;
  const [values, setValues] = useState<Partial<Record<MeasurementKey, string>>>(() =>
    Object.fromEntries(
      MEASUREMENT_KEYS.flatMap((key) => {
        const cm = initial?.[key];
        return cm === undefined ? [] : [[key, cmToDisplay(cm, unit).toFixed(1)]];
      }),
    ),
  );
  const [error, setError] = useState('');
  const [result, setResult] = useState<BodyFatResult | null>(null);

  async function submit(event: Event) {
    event.preventDefault();
    setError('');
    const entry: MeasurementEntry = { date };
    for (const key of MEASUREMENT_KEYS) {
      const text = values[key]?.trim();
      if (!text) continue;
      const value = parseDecimal(text);
      if (value === null) return setError(`Enter ${LABELS[key].toLowerCase()} as a number, or leave it blank.`);
      const cm = displayToCm(value, unit);
      const invalid = validateLengthCm(cm);
      if (invalid) return setError(invalid);
      entry[key] = cm;
    }
    if (Object.keys(entry).length === 1) return setError('Enter at least one measurement.');

    try {
      await putMeasurement(entry);
      setResult(estimateBodyFat(entry, settings.heightCm, settings.sex));
      await onSaved();
    } catch {
      setError('Your measurements were not saved. Try again.');
    }
  }

  return (
    <form class="form" onSubmit={submit} noValidate>
      <h1>Measurements</h1>
      <p class="lede">{formatDate(date)}. Every field is optional. Measure the same way each time.</p>
      <div class="measure-grid">
        {MEASUREMENT_KEYS.map((key) => (
          <label class="field" key={key}>
            <span>
              {LABELS[key]} ({unit})
            </span>
            <input
              inputMode="decimal"
              value={values[key] ?? ''}
              onInput={(e) => setValues({ ...values, [key]: e.currentTarget.value })}
            />
          </label>
        ))}
      </div>
      {error && (
        <p class="error" role="alert">
          {error}
        </p>
      )}
      {result && (
        <div class="note" data-testid="body-fat-result">
          <BodyFatMessage result={result} />
        </div>
      )}
      <button class="primary" type="submit">
        Save measurements
      </button>
      <button class="secondary" type="button" onClick={onDone}>
        {result ? 'Done' : 'Cancel'}
      </button>
    </form>
  );
}
