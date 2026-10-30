import { useEffect, useRef, useState } from 'preact/hooks';
import { backupNudgeDue, healthNoteDue, measurementsDue, newMilestones, pickMilestone, reachedMilestones } from '../calc/signals';
import { needsTypoConfirm, validateWeightKg } from '../calc/validation';
import { BackupNudge } from '../components/BackupNudge';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { MeasurementCard } from '../components/MeasurementCard';
import { SummaryCard } from '../components/SummaryCard';
import { putWeight, saveSettings } from '../db/db';
import { messageFor } from '../encouragement/select';
import { formatLongDate, todayISO } from '../lib/dates';
import { burst, nudge, reducedMotion } from '../lib/motion';
import { displayToKg, kgToDisplay, parseDecimal } from '../lib/units';
import { MeasurementForm } from './MeasurementForm';
import type { ScreenProps } from '../state/useApp';
import type { Settings, WeightEntry } from '../types';

const SPARKS = 18;
const MILESTONE_SPARKS = 44;
const STEP = 0.1;

export function Today({ data, today, refresh, onOpenSettings }: ScreenProps & { onOpenSettings(): void }) {
  const { settings, weights, measurements } = data;
  const [measuring, setMeasuring] = useState(false);
  const [savedKey, setSavedKey] = useState<string>();
  const [surge, setSurge] = useState(false);
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

  function celebrate(source: Element, key: string, milestone: boolean) {
    setSavedKey(key);
    burst(source, milestone ? MILESTONE_SPARKS : SPARKS);
    if (milestone && !reducedMotion()) setSurge(true);
  }

  const message = messageFor(weights, today, milestoneToday);

  return (
    <>
      <header class="intro">
        <h1 data-testid="today-date">{formatLongDate(today)}</h1>
        <p class="encouragement" data-testid="encouragement" key={message}>
          {message}
        </p>
      </header>
      <section class="card">
        <WeighIn key={today} data={data} today={today} refresh={refresh} onSaved={celebrate} />
      </section>
      {weights.length === 0 && <p class="card lede">Your first weigh-in starts your week.</p>}
      <SummaryCard data={data} today={today} savedKey={savedKey} />
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
      {surge && (
        <div class="milestone" aria-hidden="true" onAnimationEnd={() => setSurge(false)}>
          Milestone reached
        </div>
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

// The decimal point is about 0.4 of a digit wide; the rest leaves room for the caret.
const digitsWide = (text: string) => Math.max(text.length, 3) - (/[.,]/.test(text) ? 0.6 : 0) + 0.05;

function WeighIn({
  data,
  today,
  refresh,
  onSaved,
}: ScreenProps & { onSaved(source: Element, key: string, milestone: boolean): void }) {
  const { settings, weights } = data;
  const unit = settings.weightUnit;
  const existing = weights.find((e) => e.date === today);
  const last = weights.at(-1);
  const lastShown = last ? kgToDisplay(last.kg, unit).toFixed(1) : '0.0';
  const [weight, setWeight] = useState(existing ? kgToDisplay(existing.kg, unit).toFixed(1) : '');
  const [note, setNote] = useState(existing?.note ?? '');
  const [error, setError] = useState('');
  const [pendingKg, setPendingKg] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => setSaved(false), 1600);
    return () => clearTimeout(timer);
  }, [saved]);

  function step(direction: number) {
    const from = parseDecimal(weight) ?? parseDecimal(lastShown) ?? 0;
    setWeight(Math.max(0, from + direction * STEP).toFixed(1));
    nudge(input.current!, -direction);
  }

  async function save(kg: number) {
    const date = todayISO();
    const trimmed = note.trim();
    const entry: WeightEntry = { date, kg, ...(trimmed && { note: trimmed }) };
    try {
      await putWeight(entry);
      const updated = withMilestones(settings, mergeEntry(weights, entry), date);
      if (updated) await saveSettings(updated);
      await refresh();
      setSaved(true);
      onSaved(button.current!, `${date}-${kg}`, updated !== null);
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
      <div class="weigh-row">
        <label class="weigh-field">
          <span>Weight</span>
          <span class="weigh-line">
            <input
              ref={input}
              inputMode="decimal"
              autoComplete="off"
              placeholder={lastShown}
              size={Math.max(weight.length, 4)}
              style={{ width: `${digitsWide(weight || lastShown)}ch` }}
              value={weight}
              onInput={(e) => setWeight(e.currentTarget.value)}
            />
            <span class="weigh-unit">{unit}</span>
          </span>
        </label>
        <div class="stepper">
          <button type="button" class="step" aria-label="Less by 0.1" onClick={() => step(-1)}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 12h12" />
            </svg>
          </button>
          <button type="button" class="step" aria-label="More by 0.1" onClick={() => step(1)}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 12h12M12 6v12" />
            </svg>
          </button>
        </div>
      </div>
      <label class="note-line">
        <span>Note, optional</span>
        <input value={note} onInput={(e) => setNote(e.currentTarget.value)} />
      </label>
      {error && (
        <p class="error" role="alert">
          {error}
        </p>
      )}
      <button ref={button} class="primary" type="submit">
        <span class="primary-label" key={String(saved)}>
          {saved && (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path pathLength={1} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {saved ? 'Saved' : existing ? 'Save changes' : 'Save today'}
        </span>
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
