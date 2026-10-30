import { useState } from 'preact/hooks';
import { healthNoteDue, newMilestones, pickMilestone, reachedMilestones } from '../calc/signals';
import { needsTypoConfirm, validateWeightKg } from '../calc/validation';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { SummaryCard } from '../components/SummaryCard';
import { putWeight, saveSettings } from '../db/db';
import { messageFor } from '../encouragement/select';
import { formatDate, todayISO } from '../lib/dates';
import { displayToKg, kgToDisplay, parseDecimal } from '../lib/units';
import type { ScreenProps } from '../state/useApp';
import type { Settings, WeightEntry } from '../types';

export function Today({ data, today, refresh }: ScreenProps) {
  const { settings, weights } = data;
  const milestoneToday = settings.latestMilestone?.date === today ? settings.latestMilestone.id : undefined;

  return (
    <>
      <h1 data-testid="today-date">{formatDate(today)}</h1>
      <p class="encouragement" data-testid="encouragement">
        {messageFor(weights, today, milestoneToday)}
      </p>
      <WeighIn key={today} data={data} today={today} refresh={refresh} />
      <SummaryCard data={data} today={today} />
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

function WeighIn({ data, today, refresh }: ScreenProps) {
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
        <span>Weight ({unit})</span>
        <input
          inputMode="decimal"
          autoComplete="off"
          placeholder="0.0"
          value={weight}
          onInput={(e) => setWeight(e.currentTarget.value)}
        />
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
