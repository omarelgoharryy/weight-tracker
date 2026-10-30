import { useState } from 'preact/hooks';
import { validateHeightCm, validateWeightKg } from '../calc/validation';
import { requestPersistence, saveSettings } from '../db/db';
import { displayToCm, displayToKg, parseDecimal } from '../lib/units';
import type { LengthUnit, Sex, WeightUnit } from '../types';

export function Setup({ onDone }: { onDone(): Promise<void> }) {
  const [goal, setGoal] = useState('');
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('kg');
  const [lengthUnit, setLengthUnit] = useState<LengthUnit>('cm');
  const [height, setHeight] = useState('');
  const [sex, setSex] = useState<Sex | ''>('');
  const [error, setError] = useState('');

  async function submit(event: Event) {
    event.preventDefault();
    const goalValue = parseDecimal(goal);
    const goalKg = goalValue === null ? null : displayToKg(goalValue, weightUnit);
    if (goalKg === null) return setError('Enter your goal weight as a number.');
    const goalError = validateWeightKg(goalKg);
    if (goalError) return setError(goalError);

    let heightCm: number | undefined;
    if (height.trim()) {
      const heightValue = parseDecimal(height);
      if (heightValue === null) return setError('Enter your height as a number, or leave it blank.');
      heightCm = displayToCm(heightValue, lengthUnit);
      const heightError = validateHeightCm(heightCm);
      if (heightError) return setError(heightError);
    }

    try {
      await saveSettings({
        goalKg,
        weightUnit,
        lengthUnit,
        measurementDay: 5,
        celebratedMilestones: [],
        ...(heightCm !== undefined && { heightCm }),
        ...(sex && { sex }),
      });
      await requestPersistence();
      await onDone();
    } catch {
      setError('Your setup was not saved. Try again.');
    }
  }

  return (
    <main class="screen">
      <h1>Welcome</h1>
      <p class="lede">A few details first. You can change any of them later in Settings.</p>
      <form class="form" onSubmit={submit} noValidate>
        <fieldset class="choice">
          <legend>Weight unit</legend>
          {(['kg', 'lb'] as const).map((unit) => (
            <label key={unit}>
              <input type="radio" name="weight-unit" checked={weightUnit === unit} onChange={() => setWeightUnit(unit)} />
              <span>{unit}</span>
            </label>
          ))}
        </fieldset>
        <label class="field">
          <span>Goal weight ({weightUnit})</span>
          <input inputMode="decimal" value={goal} onInput={(e) => setGoal(e.currentTarget.value)} />
        </label>
        <fieldset class="choice">
          <legend>Length unit</legend>
          {(['cm', 'in'] as const).map((unit) => (
            <label key={unit}>
              <input type="radio" name="length-unit" checked={lengthUnit === unit} onChange={() => setLengthUnit(unit)} />
              <span>{unit}</span>
            </label>
          ))}
        </fieldset>
        <label class="field">
          <span>Height, optional ({lengthUnit})</span>
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
        <p class="hint">Height and sex are only used for BMI and your body fat estimate.</p>
        {error && (
          <p class="error" role="alert">
            {error}
          </p>
        )}
        <button class="primary" type="submit">
          Get started
        </button>
      </form>
    </main>
  );
}
