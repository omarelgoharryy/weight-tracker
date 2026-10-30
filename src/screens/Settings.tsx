import { useState } from 'preact/hooks';
import { backupFileName, buildBackup, parseBackup, shareBackup, type ParseResult } from '../backup/backup';
import { celebrateReached, resetGoalMilestones } from '../calc/signals';
import { validateHeightCm, validateWeightKg } from '../calc/validation';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { replaceAll, saveSettings } from '../db/db';
import { formatDate } from '../lib/dates';
import { cmToDisplay, displayToCm, displayToKg, kgToDisplay, parseDecimal } from '../lib/units';
import type { ScreenProps } from '../state/useApp';
import type { LengthUnit, Settings as SettingsData, Sex, WeightUnit } from '../types';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

type ParsedBackup = Extract<ParseResult, { ok: true }>;

function summaryText({ summary }: ParsedBackup): string {
  const range = summary.first ? ` from ${formatDate(summary.first)} to ${formatDate(summary.last!)}` : '';
  return `This backup has ${summary.weights} weigh-ins${range} and ${summary.measurements} sets of measurements. It replaces everything now in the app.`;
}

export function Settings({ data, today, refresh }: ScreenProps) {
  const { settings } = data;
  const [goal, setGoal] = useState(kgToDisplay(settings.goalKg, settings.weightUnit).toFixed(1));
  const [height, setHeight] = useState(
    settings.heightCm === undefined ? '' : cmToDisplay(settings.heightCm, settings.lengthUnit).toFixed(1),
  );
  const [sex, setSex] = useState<Sex | ''>(settings.sex ?? '');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [backup, setBackup] = useState<ParsedBackup | null>(null);
  const [exporting, setExporting] = useState(false);

  async function update(next: SettingsData, done: string) {
    setError('');
    setStatus('');
    try {
      await saveSettings(next);
      await refresh();
      setStatus(done);
    } catch {
      setError('Your changes were not saved. Try again.');
    }
  }

  function changeWeightUnit(unit: WeightUnit) {
    setGoal(kgToDisplay(settings.goalKg, unit).toFixed(1));
    void update(
      {
        ...settings,
        weightUnit: unit,
        celebratedMilestones: celebrateReached(data.weights, settings.goalKg, unit, settings.celebratedMilestones),
      },
      'Units updated.',
    );
  }

  function changeLengthUnit(unit: LengthUnit) {
    if (settings.heightCm !== undefined) setHeight(cmToDisplay(settings.heightCm, unit).toFixed(1));
    void update({ ...settings, lengthUnit: unit }, 'Units updated.');
  }

  function saveGoal() {
    const value = parseDecimal(goal);
    if (value === null) return setError('Enter your goal weight as a number.');
    if (value.toFixed(1) === kgToDisplay(settings.goalKg, settings.weightUnit).toFixed(1)) {
      setError('');
      return setStatus('Goal saved.');
    }
    const goalKg = displayToKg(value, settings.weightUnit);
    const invalid = validateWeightKg(goalKg);
    if (invalid) return setError(invalid);
    void update(
      {
        ...settings,
        goalKg,
        celebratedMilestones: resetGoalMilestones(settings.celebratedMilestones),
      },
      'Goal saved.',
    );
  }

  function saveDetails() {
    const { heightCm: _height, sex: _sex, ...rest } = settings;
    const next: SettingsData = { ...rest, ...(sex && { sex }) };
    if (height.trim()) {
      const value = parseDecimal(height);
      if (value === null) return setError('Enter your height as a number, or leave it blank.');
      next.heightCm = displayToCm(value, settings.lengthUnit);
      const invalid = validateHeightCm(next.heightCm);
      if (invalid) return setError(invalid);
    }
    void update(next, 'Details saved.');
  }

  async function exportBackup() {
    setError('');
    setStatus('');
    setExporting(true);
    const result = await shareBackup(buildBackup(data, new Date().toISOString()), backupFileName(today));
    setExporting(false);
    if (result === 'failed') setError('Your backup was not saved. Try again.');
    if (result === 'saved') await update({ ...settings, lastBackupAt: new Date().toISOString() }, 'Backup saved.');
    if (result === 'downloaded')
      await update(
        { ...settings, lastBackupAt: new Date().toISOString() },
        'Backup downloaded. Check that the file is in your Downloads.',
      );
  }

  async function chooseFile(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    setError('');
    setStatus('');
    const parsed = parseBackup(await file.text());
    if (parsed.ok) setBackup(parsed);
    else setError(parsed.error);
  }

  async function restore(parsed: ParsedBackup) {
    setBackup(null);
    try {
      await replaceAll(parsed.data);
      await refresh();
      const { goalKg, weightUnit, heightCm, lengthUnit, sex: restoredSex } = parsed.data.settings;
      setGoal(kgToDisplay(goalKg, weightUnit).toFixed(1));
      setHeight(heightCm === undefined ? '' : cmToDisplay(heightCm, lengthUnit).toFixed(1));
      setSex(restoredSex ?? '');
      setStatus('Backup restored.');
    } catch {
      setError('The backup was not restored. Your data has not changed.');
    }
  }

  return (
    <>
      <h1>Settings</h1>
      {error && (
        <p class="error" role="alert">
          {error}
        </p>
      )}
      {status && (
        <p class="status" role="status" key={status}>
          {status}
        </p>
      )}

      <section class="section">
        <h2>Goal</h2>
        <div class="panel">
        <label class="field">
          <span>Goal weight ({settings.weightUnit})</span>
          <input inputMode="decimal" value={goal} onInput={(e) => setGoal(e.currentTarget.value)} />
        </label>
        <button class="secondary" onClick={saveGoal}>
          Save goal
        </button>
        </div>
      </section>

      <section class="section">
        <h2>Units</h2>
        <div class="panel">
        <fieldset class="choice">
          <legend>Weight unit</legend>
          {(['kg', 'lb'] as const).map((unit) => (
            <label key={unit}>
              <input
                type="radio"
                name="weight-unit"
                checked={settings.weightUnit === unit}
                onChange={() => changeWeightUnit(unit)}
              />
              <span>{unit}</span>
            </label>
          ))}
        </fieldset>
        <fieldset class="choice">
          <legend>Length unit</legend>
          {(['cm', 'in'] as const).map((unit) => (
            <label key={unit}>
              <input
                type="radio"
                name="length-unit"
                checked={settings.lengthUnit === unit}
                onChange={() => changeLengthUnit(unit)}
              />
              <span>{unit}</span>
            </label>
          ))}
        </fieldset>
        </div>
      </section>

      <section class="section">
        <h2>Your details</h2>
        <div class="panel">
        <label class="field">
          <span>Height, optional ({settings.lengthUnit})</span>
          <input inputMode="decimal" value={height} onInput={(e) => setHeight(e.currentTarget.value)} />
        </label>
        <label class="field">
          <span>Biological sex, optional</span>
          <select value={sex} onChange={(e) => setSex(e.currentTarget.value as Sex | '')}>
            <option value="">Not set</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </label>
        <p class="hint">Used only for BMI and your body fat estimate.</p>
        <button class="secondary" onClick={saveDetails}>
          Save details
        </button>
        </div>
      </section>

      <section class="section">
        <h2>Weekly measurements</h2>
        <div class="panel">
        <label class="field">
          <span>Measurement day</span>
          <select
            value={String(settings.measurementDay)}
            onChange={(e) =>
              void update({ ...settings, measurementDay: Number(e.currentTarget.value) }, 'Measurement day saved.')
            }
          >
            {DAYS.map((day, index) => (
              <option key={day} value={String(index)}>
                {day}
              </option>
            ))}
          </select>
        </label>
        </div>
      </section>

      <section class="section">
        <h2>Backup</h2>
        <div class="panel">
        <p class="hint" data-testid="last-backup">
          Last backup: {settings.lastBackupAt ? formatDate(settings.lastBackupAt.slice(0, 10)) : 'Never'}
        </p>
        <button class="primary" disabled={exporting} onClick={() => void exportBackup()}>
          Export backup
        </button>
        <label class="file-button">
          Import backup
          <input type="file" accept=".json,application/json" onChange={(e) => void chooseFile(e)} />
        </label>
        </div>
      </section>

      <section class="section">
        <h2>Keeping your data safe</h2>
        <div class="panel">
        <p class="hint">
          Your data lives only on this phone. Removing the app's home-screen icon deletes it, so export a backup first.
          iPhone and app updates don't affect your data.
        </p>
        </div>
      </section>

      {backup && (
        <ConfirmDialog
          message={summaryText(backup)}
          confirmLabel="Yes, replace"
          onCancel={() => setBackup(null)}
          onConfirm={() => void restore(backup)}
        />
      )}
    </>
  );
}
