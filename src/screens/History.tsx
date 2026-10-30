import { useState } from 'preact/hooks';
import { needsTypoConfirm, validateDate, validateWeightKg } from '../calc/validation';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { deleteMeasurement, deleteWeight, putWeight } from '../db/db';
import { formatDate } from '../lib/dates';
import { displayToKg, formatLength, formatWeight, kgToDisplay, parseDecimal } from '../lib/units';
import type { ScreenProps } from '../state/useApp';
import { MEASUREMENT_KEYS } from '../types';
import type { ISODate, MeasurementEntry, WeightEntry } from '../types';
import { MeasurementForm, measurementLabel } from './MeasurementForm';

type View =
  | { kind: 'list' }
  | { kind: 'weight'; entry?: WeightEntry }
  | { kind: 'measurement-date' }
  | { kind: 'measurement'; date: ISODate };

type Deleting = { kind: 'weight' | 'measurement'; date: ISODate };

function WeightForm({ data, today, refresh, entry, onDone }: ScreenProps & { entry?: WeightEntry; onDone(): void }) {
  const unit = data.settings.weightUnit;
  const [date, setDate] = useState(entry?.date ?? today);
  const [weight, setWeight] = useState(entry ? kgToDisplay(entry.kg, unit).toFixed(1) : '');
  const [note, setNote] = useState(entry?.note ?? '');
  const [error, setError] = useState('');
  const [pending, setPending] = useState<{ kg: number; message: string } | null>(null);

  async function save(kg: number) {
    const trimmed = note.trim();
    try {
      await putWeight({ date, kg, ...(trimmed && { note: trimmed }) });
      await refresh();
      onDone();
    } catch {
      setError('Your entry was not saved. Try again.');
    }
  }

  function submit(event: Event) {
    event.preventDefault();
    setError('');
    const invalidDate = date ? validateDate(date, today) : 'Pick a date.';
    if (invalidDate) return setError(invalidDate);
    const value = parseDecimal(weight);
    if (value === null) return setError('Enter your weight as a number.');
    const kg = displayToKg(value, unit);
    const invalid = validateWeightKg(kg);
    if (invalid) return setError(invalid);

    if (!entry && data.weights.some((e) => e.date === date))
      return setPending({ kg, message: `There's already an entry for ${formatDate(date)}. Replace it?` });
    if (needsTypoConfirm(kg, date, data.weights))
      return setPending({ kg, message: `${weight} ${unit} is quite different from the entry before it. Is that right?` });
    void save(kg);
  }

  return (
    <form class="form" onSubmit={submit} noValidate>
      <h1>{entry ? 'Edit entry' : 'Add weight'}</h1>
      <label class="field">
        <span>Date</span>
        <input type="date" max={today} disabled={!!entry} value={date} onInput={(e) => setDate(e.currentTarget.value)} />
      </label>
      <label class="field">
        <span>Weight ({unit})</span>
        <input inputMode="decimal" value={weight} onInput={(e) => setWeight(e.currentTarget.value)} />
      </label>
      <label class="field">
        <span>Note, optional</span>
        <input value={note} onInput={(e) => setNote(e.currentTarget.value)} />
      </label>
      {error && (
        <p class="error" role="alert">
          {error}
        </p>
      )}
      <button class="primary" type="submit">
        Save entry
      </button>
      <button class="secondary" type="button" onClick={onDone}>
        Cancel
      </button>
      {pending && (
        <ConfirmDialog
          message={pending.message}
          confirmLabel="Yes, save"
          cancelLabel="Go back"
          onCancel={() => setPending(null)}
          onConfirm={() => {
            const { kg } = pending;
            setPending(null);
            void save(kg);
          }}
        />
      )}
    </form>
  );
}

function MeasurementDatePicker({ today, onPick, onCancel }: { today: ISODate; onPick(date: ISODate): void; onCancel(): void }) {
  const [date, setDate] = useState(today);
  const [error, setError] = useState('');

  function submit(event: Event) {
    event.preventDefault();
    const invalid = date ? validateDate(date, today) : 'Pick a date.';
    if (invalid) return setError(invalid);
    onPick(date);
  }

  return (
    <form class="form" onSubmit={submit} noValidate>
      <h1>Add measurements</h1>
      <label class="field">
        <span>Date</span>
        <input type="date" max={today} value={date} onInput={(e) => setDate(e.currentTarget.value)} />
      </label>
      {error && (
        <p class="error" role="alert">
          {error}
        </p>
      )}
      <button class="primary" type="submit">
        Continue
      </button>
      <button class="secondary" type="button" onClick={onCancel}>
        Cancel
      </button>
    </form>
  );
}

function describeMeasurements(entry: MeasurementEntry, unit: 'cm' | 'in'): string {
  return MEASUREMENT_KEYS.flatMap((key) => {
    const cm = entry[key];
    return cm === undefined ? [] : [`${measurementLabel(key)} ${formatLength(cm, unit)}`];
  }).join(', ');
}

export function History({ data, today, refresh }: ScreenProps) {
  const { settings, weights, measurements } = data;
  const [view, setView] = useState<View>({ kind: 'list' });
  const [deleting, setDeleting] = useState<Deleting | null>(null);
  const [error, setError] = useState('');
  const toList = () => setView({ kind: 'list' });

  if (view.kind === 'weight')
    return <WeightForm data={data} today={today} refresh={refresh} entry={view.entry} onDone={toList} />;
  if (view.kind === 'measurement-date')
    return (
      <MeasurementDatePicker
        today={today}
        onPick={(date) => setView({ kind: 'measurement', date })}
        onCancel={toList}
      />
    );
  if (view.kind === 'measurement')
    return (
      <MeasurementForm
        date={view.date}
        initial={measurements.find((m) => m.date === view.date)}
        settings={settings}
        onSaved={refresh}
        onDone={toList}
      />
    );

  async function confirmDelete(target: Deleting) {
    setDeleting(null);
    try {
      await (target.kind === 'weight' ? deleteWeight(target.date) : deleteMeasurement(target.date));
      await refresh();
    } catch {
      setError('That entry was not deleted. Try again.');
    }
  }

  return (
    <>
      <h1>History</h1>
      {error && (
        <p class="error" role="alert">
          {error}
        </p>
      )}
      <section class="section">
        <div class="section-head">
          <h2>Weight</h2>
          <button class="secondary" onClick={() => setView({ kind: 'weight' })}>
            Add weight
          </button>
        </div>
        {weights.length === 0 && <p class="hint">No weigh-ins yet.</p>}
        <ul class="entries">
          {[...weights].reverse().map((entry) => (
            <li key={entry.date} data-testid="weight-entry">
              <div>
                <strong>{formatWeight(entry.kg, settings.weightUnit)}</strong>
                <span class="hint">{formatDate(entry.date)}</span>
                {entry.note && <p>{entry.note}</p>}
              </div>
              <div class="entry-actions">
                <button class="secondary" onClick={() => setView({ kind: 'weight', entry })}>
                  Edit
                </button>
                <button class="secondary" onClick={() => setDeleting({ kind: 'weight', date: entry.date })}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section class="section">
        <div class="section-head">
          <h2>Measurements</h2>
          <button class="secondary" onClick={() => setView({ kind: 'measurement-date' })}>
            Add measurements
          </button>
        </div>
        {measurements.length === 0 && <p class="hint">No measurements yet.</p>}
        <ul class="entries">
          {[...measurements].reverse().map((entry) => (
            <li key={entry.date} data-testid="measurement-entry">
              <div>
                <strong>{formatDate(entry.date)}</strong>
                <p>{describeMeasurements(entry, settings.lengthUnit)}</p>
              </div>
              <div class="entry-actions">
                <button class="secondary" onClick={() => setView({ kind: 'measurement', date: entry.date })}>
                  Edit
                </button>
                <button class="secondary" onClick={() => setDeleting({ kind: 'measurement', date: entry.date })}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
      {deleting && (
        <ConfirmDialog
          message={`Delete this entry from ${formatDate(deleting.date)}? This can't be undone.`}
          confirmLabel="Yes, delete"
          onCancel={() => setDeleting(null)}
          onConfirm={() => void confirmDelete(deleting)}
        />
      )}
    </>
  );
}
