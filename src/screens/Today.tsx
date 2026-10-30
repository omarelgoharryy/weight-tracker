import { useState } from 'preact/hooks';
import { backupNudgeDue, healthNoteDue, measurementsDue, newMilestones, pickMilestone, reachedMilestones } from '../calc/signals';
import { needsTypoConfirm, validateWeightKg } from '../calc/validation';
import { BackupNudge } from '../components/BackupNudge';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { MeasurementCard } from '../components/MeasurementCard';
import { SummaryCard } from '../components/SummaryCard';
import { putWeight, saveSettings } from '../db/db';
import { messageFor } from '../encouragement/select';
import { formatLongDate, todayISO } from '../lib/dates';
import { displayToKg, kgToDisplay, parseDecimal } from '../lib/units';
import { MeasurementForm } from './MeasurementForm';
import type { ScreenProps } from '../state/useApp';
import type { Settings, WeightEntry } from '../types';

export function Today({ data, today, refresh, onOpenSettings }: ScreenProps & { onOpenSettings(): void }) {
  const { settings, weights, measurements } = data;
  const [measuring, setMeasuring] = useState(false);
  const [dropKey, setDropKey] = useState<string>();
  const milestoneToday = settings.latestMilestone?.date === today ? settings.latestMilestone.id : undefined;

  if (measuring)
    return (
      <MeasurementForm
        date={today}
        initial={measurements.find((m) => m.date === today)}
        settings={settings}
        onSaved={refresh}
        onDone={() => setMeasuring(false)}
      />
    );

  return (
    <>
      <section class="sea harbour bleed">
        <h1 data-testid="today-date">{formatLongDate(today)}</h1>
        <p class="encouragement" data-testid="encouragement">
          {messageFor(weights, today, milestoneToday)}
        </p>
        <WeighIn key={today} data={data} today={today} refresh={refresh} onSaved={setDropKey} />
      </section>
      <SummaryCard data={data} today={today} dropKey={dropKey} />
      {measurementsDue(measurements, settings.measurementDay, today) && (
        <MeasurementCard onOpen={() => setMeasuring(true)} />
      )}
      {backupNudgeDue(settings, weights, today) && <BackupNudge onOpen={onOpenSettings} />}
      {healthNoteDue(weights, settings.healthNoteDismissedAt, today) && (
        <aside class="note">
          <p>
            You've been losing weight quickly for a few weeks. Going a little slower is often easier to keep up. It may
            be worth easing off or having a chat with your doctor.
          </p>
          <button
            class="secondary"
            onClick={async () => {
              await saveSettings({ ...settings, healthNoteDismissedAt: today });
              await refresh();
            }}
          >
            Dismiss
          </button>
        </aside>
      )}
    </>
  );
}

// The decimal point is about 0.4 of a digit wide; the rest pads the caret.
const digitsWide = (text: string) => Math.max(text.length, 3) - (/[.,]/.test(text || '.') ? 0.6 : 0) + 0.25;

function mergeEntry(weights: WeightEntry[], entry: WeightEntry): WeightEntry[] {
  return [...weights.filter((e) => e.date !== entry.date), entry].sort((a, b) => a.date.localeCompare(b.date));
}

function withMilestones(settings: Settings, weights: WeightEntry[], date: string): Settings | null {
  const fresh = newMilestones(
    reachedMilestones(weights, settings.goalKg, settings.weightUnit),
    settings.celebratedMilestones,
  );
  const id = pickMilestone(fresh);
  if (id === null) return null;
  return {
    ...settings,
    celebratedMilestones: [...settings.celebratedMilestones, ...fresh],
    latestMilestone: { id, date },
  };
}

function WeighIn({ data, today, refresh, onSaved }: ScreenProps & { onSaved(key: string): void }) {
  const { settings, weights } = data;
  const unit = settings.weightUnit;
  const existing = weights.find((e) => e.date === today);
  const [weight, setWeight] = useState(existing ? kgToDisplay(existing.kg, unit).toFixed(1) : '');
  const [note, setNote] = useState(existing?.note ?? '');
  const [error, setError] = useState('');
  const [pendingKg, setPendingKg] = useState<number | null>(null);

  async function save(kg: number) {
    const date = todayISO();
    const trimmed = note.trim();
    const entry: WeightEntry = { date, kg, ...(trimmed && { note: trimmed }) };
    try {
      await putWeight(entry);
      const updated = withMilestones(settings, mergeEntry(weights, entry), date);
      if (updated) await saveSettings(updated);
      await refresh();
      onSaved(`${date}-${kg}`);
    } catch {
      setError('Your entry was not saved. Try again.');
    }
  }

  function submit(event: Event) {
    event.preventDefault();
    setError('');
    const value = parseDecimal(weight);
    if (value === null) return setError('Enter your weight as a number.');
    const kg = displayToKg(value, unit);
    const invalid = validateWeightKg(kg);
    if (invalid) return setError(invalid);
    if (needsTypoConfirm(kg, todayISO(), weights)) return setPendingKg(kg);
    void save(kg);
  }

  return (
    <form class="weigh-in" onSubmit={submit} noValidate>
      <label class="weigh-field">
        <span>Weight</span>
        <span class="weigh-line">
          <input
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.0"
            size={Math.max(weight.length, 4)}
            style={{ width: `${digitsWide(weight)}ch` }}
            value={weight}
            onInput={(e) => setWeight(e.currentTarget.value)}
          />
          <span class="weigh-unit">{unit}</span>
        </span>
      </label>
      <label class="field note-field">
        <span>Note, optional</span>
        <input value={note} onInput={(e) => setNote(e.currentTarget.value)} />
      </label>
      {error && (
        <p class="error" role="alert">
          {error}
        </p>
      )}
      <button class="primary" type="submit">
        {existing ? 'Save changes' : 'Save weight'}
      </button>
      {pendingKg !== null && (
        <ConfirmDialog
          message={`${weight} ${unit} is quite different from your last entry. Is that right?`}
          confirmLabel="Yes, save"
          cancelLabel="Go back"
          onCancel={() => setPendingKg(null)}
          onConfirm={() => {
            const kg = pendingKg;
            setPendingKg(null);
            void save(kg);
          }}
        />
      )}
    </form>
  );
}
