# Weight Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an installable, offline iPhone web app for logging weight and weekly measurements, with graphs, stats, a body fat estimate, kind encouragement and file backups.

**Architecture:** A static Preact PWA with no server. Pure logic (`calc`, `encouragement`, `backup`) is separated from IndexedDB access (`db`) and from the UI (`screens`, `components`), and the UI holds no calculation logic. Weights are stored in kg, lengths in cm, and dates as local `YYYY-MM-DD` strings.

**Tech Stack:** TypeScript, Preact, Vite, vite-plugin-pwa, idb, Vitest, fake-indexeddb, Playwright, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-10-30-weight-tracker-design.md`

## Global Constraints

- Node 24 and npm 11, on Windows. Commands must work in Git Bash and PowerShell.
- All data stays on the phone. No analytics, external fonts, CDN assets or network calls at runtime.
- UI files contain no calculation logic. All IndexedDB access goes through `src/db/db.ts`.
- Weights are stored in kg, lengths in cm, with no rounding on save. One decimal place on display.
- Dates are local calendar `YYYY-MM-DD` strings. Day arithmetic goes through `src/lib/dates.ts`.
- Encouragement is always kind, never shaming, and never mentions missed days negatively.
- Body fat is always labelled as an estimate.
- Text inputs use a font size of at least 16px (iOS zooms otherwise), and numeric fields use `inputmode="decimal"`.
- Follow iPhone light and dark mode with `prefers-color-scheme`, and respect safe-area insets.
- UI tasks use the `frontend-design` skill. Chart work uses the `dataviz` skill.
- Work on a `build-app` branch, created in Task 1.
- Repository name is `weight-tracker`, so the Vite `base` is `/weight-tracker/`.

## Review Focus

1. **App left open overnight:** on returning to the app the next morning, a new entry saves under today's date, not yesterday's. Tested in Task 9.
2. **Comma decimals:** the iPhone decimal keypad shows `,` in some regions, so `82,5` means 82.5. Tested in Task 1.
3. **Backdated or deleted entries:** adding an earlier entry changes the starting weight and all stats; the typo check compares against the nearest earlier entry, not the newest. Tested in Tasks 2 and 5.
4. **Unit switching:** a value shown in lb, then re-saved unchanged, shows the same value afterwards, and milestones already earned do not produce a burst of celebrations. Tested in Tasks 1 and 4.
5. **Changed goal, and empty or thin data:** a new goal restarts the goal-based milestones, and screens with zero or one entry render without errors or `NaN`. Tested in Tasks 4, 12 and 15.

---

### Task 1: Project scaffold, shared types, dates and units

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `.gitignore`, `src/main.tsx`, `src/app.tsx`, `src/types.ts`, `src/lib/dates.ts`, `src/lib/units.ts`
- Test: `tests/helpers.ts`, `tests/dates.test.ts`, `tests/units.test.ts`

**Interfaces:**
- Produces, in `src/types.ts`:
  ```ts
  export type ISODate = string; // YYYY-MM-DD
  export type WeightUnit = 'kg' | 'lb';
  export type LengthUnit = 'cm' | 'in';
  export type Sex = 'male' | 'female';
  export interface WeightEntry { date: ISODate; kg: number; note?: string }
  export const MEASUREMENT_KEYS = ['neckCm','chestCm','waistCm','hipsCm','armCm','thighCm'] as const;
  export type MeasurementKey = typeof MEASUREMENT_KEYS[number];
  export type MeasurementEntry = { date: ISODate } & Partial<Record<MeasurementKey, number>>;
  export interface Settings {
    goalKg: number; weightUnit: WeightUnit; lengthUnit: LengthUnit;
    heightCm?: number; sex?: Sex; measurementDay: number; // 0=Sun..6=Sat, default 5
    lastBackupAt?: string; celebratedMilestones: string[];
    latestMilestone?: { id: string; date: ISODate };
    healthNoteDismissedAt?: ISODate;
  }
  export interface AppData { settings: Settings; weights: WeightEntry[]; measurements: MeasurementEntry[] }
  ```
  `latestMilestone` extends the spec's model so a milestone message stays stable for the day. Entry arrays are always sorted by date ascending.
- Produces, in `src/lib/dates.ts`: `todayISO(now?: Date): ISODate`, `addDays(date: ISODate, n: number): ISODate`, `daysBetween(a: ISODate, b: ISODate): number` (b minus a), `weekday(date: ISODate): number`, `formatDate(date: ISODate): string`.
- Produces, in `tests/helpers.ts`, for all unit tests: `w(date: ISODate, kg: number): WeightEntry` and `dailySeries(startDate: ISODate, days: number, startKg: number, perDay: number): WeightEntry[]`, one entry per consecutive day.
- Produces, in `src/lib/units.ts`: `kgToDisplay(kg, unit): number`, `displayToKg(value, unit): number`, `cmToDisplay(cm, unit): number`, `displayToCm(value, unit): number`, `formatWeight(kg, unit): string`, `formatLength(cm, unit): string`, `parseDecimal(text: string): number | null`.

- [ ] **Step 1: Create the branch and scaffold**

Run `git switch -c build-app`. Install `preact`, `idb`; dev dependencies `typescript`, `vite`, `@preact/preset-vite`, `vitest`, `fake-indexeddb`, `@playwright/test`, `vite-plugin-pwa`, `workbox-build`, `workbox-window`, `@vite-pwa/assets-generator`. Set scripts `dev`, `build` (`tsc --noEmit && vite build`), `preview`, `test` (`vitest run`), `test:e2e` (`playwright test`). Set `base: '/weight-tracker/'` in `vite.config.ts`. `.gitignore` covers `node_modules`, `dist`, `dev-dist`, `test-results`, `playwright-report`. `src/app.tsx` renders the app name only for now.

- [ ] **Step 2: Write the failing tests**

```ts
// tests/dates.test.ts
test('todayISO uses the local calendar date', () => {
  expect(todayISO(new Date(2026, 9, 30, 23, 59))).toBe('2026-10-30');
  expect(todayISO(new Date(2026, 9, 31, 0, 1))).toBe('2026-10-31');
});
test('addDays crosses month, year and DST boundaries', () => {
  expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  expect(addDays('2026-03-29', 1)).toBe('2026-03-30');
  expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
});
test('daysBetween counts whole days', () => expect(daysBetween('2026-10-01', '2026-10-30')).toBe(29));
test('weekday: 2026-10-30 is a Friday', () => expect(weekday('2026-10-30')).toBe(5));

// tests/units.test.ts
test('parseDecimal accepts dot and comma, rejects junk', () => {
  expect(parseDecimal('82.5')).toBe(82.5);
  expect(parseDecimal('82,5')).toBe(82.5);
  expect(parseDecimal(' 82 ')).toBe(82);
  expect(parseDecimal('')).toBeNull();
  expect(parseDecimal('abc')).toBeNull();
  expect(parseDecimal('1.2.3')).toBeNull();
});
test('every 0.1 lb value survives a round trip to the same displayed value', () => {
  for (let tenths = 440; tenths <= 8800; tenths++) {
    const shown = (tenths / 10).toFixed(1);
    const kg = displayToKg(Number(shown), 'lb');
    expect(kgToDisplay(kg, 'lb').toFixed(1)).toBe(shown);
  }
});
test('conversions use exact factors', () => {
  expect(displayToKg(1, 'lb')).toBeCloseTo(0.45359237, 8);
  expect(displayToCm(1, 'in')).toBe(2.54);
});
test('formatWeight shows one decimal and the unit', () => expect(formatWeight(81.65, 'kg')).toBe('81.7 kg'));
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run tests/dates.test.ts tests/units.test.ts`
Expected: FAIL, modules not found.

- [ ] **Step 4: Implement `src/types.ts`, `src/lib/dates.ts`, `src/lib/units.ts`**

Date arithmetic parses to `Date.UTC` so DST cannot shift a day. `todayISO` reads local getters. `addDays` and `daysBetween` never call `new Date(string)` in local time.

- [ ] **Step 5: Run tests and build**

Run: `npx vitest run && npm run build`
Expected: tests PASS, build succeeds and produces `dist/`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: scaffold project with types, dates and units"
```

### Task 2: Trend and progress stats

**Files:**
- Create: `src/calc/trend.ts`, `src/calc/stats.ts`
- Test: `tests/trend.test.ts`, `tests/stats.test.ts`

**Interfaces:**
- Consumes: `WeightEntry`, `addDays`, `daysBetween`.
- Produces, in `trend.ts`: `trendAt(weights, date): number | null` (mean of weights in the 7 calendar days ending on `date`, null if none), `trendSeries(weights): { date: ISODate; value: number }[]`.
- Produces, in `stats.ts`: `startingWeight(weights): number | null`, `lowestWeight(weights): number | null`, `currentWeight(weights): number | null`, `totalLost(weights): number | null` (start minus latest trend), `percentToGoal(weights, goalKg): number | null`, `averageLossPerWeek(weights): number | null`, `projectGoalDate(weights, goalKg): ISODate | null`, `bmi(weights, heightCm): number | null`.

- [ ] **Step 1: Write the failing tests**

Use a helper `w(date, kg)` for entries.

```ts
test('trendAt averages the 7 calendar days ending on the date', () => {
  const data = [w('2026-10-01', 90), w('2026-10-07', 80), w('2026-10-08', 70)];
  expect(trendAt(data, '2026-10-07')).toBe(85);
  expect(trendAt(data, '2026-10-08')).toBe(75); // 10-01 falls outside
});
test('trendSeries has one point per logged date', () =>
  expect(trendSeries([w('2026-10-01', 90), w('2026-10-05', 88)]).map(p => p.date))
    .toEqual(['2026-10-01', '2026-10-05']));
test('starting weight is the earliest date, including a backdated entry', () => {
  const data = [w('2026-10-01', 90), w('2026-10-02', 89)];
  expect(startingWeight(data)).toBe(90);
  expect(startingWeight([w('2026-09-20', 95), ...data])).toBe(95);
});
test('percentToGoal clamps to 0-100 and hides when goal is not below start', () => {
  expect(percentToGoal([w('2026-10-01', 100)], 80)).toBe(0);
  expect(percentToGoal([w('2026-10-01', 100), w('2026-11-01', 90)], 80)).toBe(50);
  expect(percentToGoal([w('2026-10-01', 100), w('2026-11-01', 70)], 80)).toBe(100);
  expect(percentToGoal([w('2026-10-01', 80)], 80)).toBeNull();
  expect(percentToGoal([w('2026-10-01', 80)], 85)).toBeNull();
});
test('averageLossPerWeek needs entries spanning at least 7 days', () => {
  expect(averageLossPerWeek([w('2026-10-01', 90), w('2026-10-07', 89)])).toBeNull();
  expect(averageLossPerWeek([w('2026-10-01', 90), w('2026-10-15', 88)])).toBeCloseTo(1, 5);
});
test('projectGoalDate on a steady 1 kg per week loss', () => {
  const data = dailySeries('2026-10-01', 22, 100, -1 / 7); // 22 days from 100 kg
  const date = projectGoalDate(data, 90)!;
  expect(daysBetween('2026-10-22', date)).toBeGreaterThan(40);
  expect(daysBetween('2026-10-22', date)).toBeLessThan(70);
});
test('projectGoalDate is hidden when too early, trending up, flat or at goal', () => {
  expect(projectGoalDate(dailySeries('2026-10-01', 14, 100, -0.1), 90)).toBeNull(); // spans 13 days
  expect(projectGoalDate(dailySeries('2026-10-01', 30, 100, 0.1), 90)).toBeNull();
  expect(projectGoalDate(dailySeries('2026-10-01', 30, 100, 0), 90)).toBeNull();
  expect(projectGoalDate(dailySeries('2026-10-01', 30, 89, -0.1), 90)).toBeNull();
});
test('bmi uses latest trend', () => expect(bmi([w('2026-10-01', 80)], 200)).toBe(20));
test('stats return null for no entries', () => {
  for (const f of [startingWeight, lowestWeight, currentWeight, totalLost, averageLossPerWeek])
    expect(f([])).toBeNull();
  expect(percentToGoal([], 80)).toBeNull();
  expect(projectGoalDate([], 80)).toBeNull();
  expect(bmi([], 180)).toBeNull();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/trend.test.ts tests/stats.test.ts`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement both files**

`projectGoalDate`: fit least squares through `trendSeries` points within the last 28 days of the latest entry (x = days since the first of those points). Return null unless the span is at least 14 days, slope is below 0, and latest trend is above goal. Solve for x at the goal, and return that date, no earlier than the day after the latest entry.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/trend.test.ts tests/stats.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/calc tests/trend.test.ts tests/stats.test.ts
git commit -m "feat: add trend and progress stats"
```

### Task 3: Body fat estimate

**Files:**
- Create: `src/calc/bodyFat.ts`
- Test: `tests/bodyFat.test.ts`

**Interfaces:**
- Consumes: `MeasurementEntry`, `Sex`.
- Produces: `type BodyFatResult = { kind: 'ok'; percent: number } | { kind: 'missing'; fields: ('height'|'sex'|'waist'|'neck'|'hips')[] } | { kind: 'recheck' }`, and `estimateBodyFat(entry: MeasurementEntry, heightCm: number | undefined, sex: Sex | undefined): BodyFatResult`, and `bodyFatSeries(measurements, heightCm, sex): { date: ISODate; value: number }[]`.

- [ ] **Step 1: Write the failing tests**

```ts
const e = (m: object) => ({ date: '2026-10-30', ...m });
test('male formula', () => {
  const r = estimateBodyFat(e({ waistCm: 90, neckCm: 38 }), 180, 'male');
  expect(r.kind).toBe('ok');
  if (r.kind === 'ok') expect(r.percent).toBeCloseTo(495 / (1.0324 - 0.19077 * Math.log10(52) + 0.15456 * Math.log10(180)) - 450, 6);
});
test('female formula uses hips', () => {
  const r = estimateBodyFat(e({ waistCm: 75, neckCm: 33, hipsCm: 100 }), 165, 'female');
  expect(r.kind).toBe('ok');
  if (r.kind === 'ok') expect(r.percent).toBeCloseTo(495 / (1.29579 - 0.35004 * Math.log10(142) + 0.221 * Math.log10(165)) - 450, 6);
});
test('lists what is missing', () => {
  expect(estimateBodyFat(e({}), undefined, undefined)).toEqual({ kind: 'missing', fields: ['height','sex','waist','neck'] });
  expect(estimateBodyFat(e({ waistCm: 75, neckCm: 33 }), 165, 'female')).toEqual({ kind: 'missing', fields: ['hips'] });
  expect(estimateBodyFat(e({ waistCm: 90, neckCm: 38 }), 180, 'male').kind).toBe('ok'); // hips not needed
});
test('asks to recheck when the log input is not positive or result is out of range', () => {
  expect(estimateBodyFat(e({ waistCm: 30, neckCm: 40 }), 180, 'male')).toEqual({ kind: 'recheck' });
  expect(estimateBodyFat(e({ waistCm: 40, neckCm: 39 }), 180, 'male')).toEqual({ kind: 'recheck' });
});
test('series skips entries that have no estimate', () => {
  const list = [e({ date: '2026-10-23', waistCm: 90 }), e({ waistCm: 90, neckCm: 38 })];
  expect(bodyFatSeries(list, 180, 'male').map(p => p.date)).toEqual(['2026-10-30']);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/bodyFat.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `src/calc/bodyFat.ts`**

Copy the formulas from the spec's Calculations section. The valid result range is 2-70 inclusive.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/bodyFat.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/calc/bodyFat.ts tests/bodyFat.test.ts
git commit -m "feat: add US Navy body fat estimate"
```

### Task 4: Streak, milestones, health note and due checks

**Files:**
- Create: `src/calc/signals.ts`
- Test: `tests/signals.test.ts`

**Interfaces:**
- Consumes: `trendAt`, `trendSeries`, `startingWeight`, `percentToGoal`, date helpers, `Settings`.
- Produces:
  - `streak(weights, today): number`
  - `reachedMilestones(weights, goalKg, unit: WeightUnit): string[]`, returning ids `lost-5kg`, `lost-10kg`, `lost-10lb`, `lost-20lb`, `goal-25`, `goal-50`, `goal-75`, `goal-reached`
  - `newMilestones(reached: string[], celebrated: string[]): string[]`
  - `pickMilestone(ids: string[]): string | null`, the most significant id: `goal-reached`, then highest `goal-*`, then highest `lost-*`
  - `resetGoalMilestones(celebrated: string[]): string[]`, which removes `goal-*` ids and keeps `lost-*`
  - `milestoneLabel(id: string): string`
  - `measurementsDue(measurements, measurementDay, today): boolean`
  - `healthNoteDue(weights, dismissedAt: ISODate | undefined, today): boolean`
  - `backupNudgeDue(settings, weights, today): boolean`

- [ ] **Step 1: Write the failing tests**

```ts
test('streak counts back from today or yesterday', () => {
  const data = [w('2026-10-27', 90), w('2026-10-28', 90), w('2026-10-29', 90)];
  expect(streak(data, '2026-10-29')).toBe(3);
  expect(streak(data, '2026-10-30')).toBe(3);
  expect(streak(data, '2026-10-31')).toBe(0);
  expect(streak([], '2026-10-30')).toBe(0);
});
test('lost milestones follow the display unit and are trend-based', () => {
  const data = dailySeries('2026-09-01', 60, 100, -0.1); // ends near 94 kg
  expect(reachedMilestones(data, 50, 'kg')).toContain('lost-5kg');
  expect(reachedMilestones(data, 50, 'kg')).not.toContain('lost-10kg');
  expect(reachedMilestones(data, 50, 'lb')).toContain('lost-10lb');
});
test('one low reading does not trigger a milestone', () => {
  const data = [...dailySeries('2026-10-01', 10, 100, 0), w('2026-10-11', 90)];
  expect(reachedMilestones(data, 50, 'kg')).not.toContain('lost-5kg');
});
test('goal milestones and goal reached', () => {
  const data = [w('2026-01-01', 100), w('2026-06-01', 79)];
  expect(reachedMilestones(data, 80, 'kg')).toEqual(expect.arrayContaining(['goal-25', 'goal-50', 'goal-75', 'goal-reached']));
});
test('newMilestones excludes those celebrated, even after regaining weight', () => {
  expect(newMilestones(['lost-5kg', 'goal-25'], ['lost-5kg'])).toEqual(['goal-25']);
  expect(newMilestones(['goal-25'], ['lost-5kg', 'goal-25', 'goal-50'])).toEqual([]);
});
test('several new milestones produce one celebration', () => {
  expect(pickMilestone(newMilestones(['lost-10lb', 'lost-20lb', 'goal-25'], []))).toBe('goal-25');
  expect(pickMilestone(['lost-10lb', 'lost-20lb'])).toBe('lost-20lb');
  expect(pickMilestone([])).toBeNull();
});
test('changing the goal resets only goal milestones', () =>
  expect(resetGoalMilestones(['lost-5kg', 'goal-25', 'goal-reached'])).toEqual(['lost-5kg']));
test('measurement card stays until logged after the measurement day', () => {
  const friday = 5;
  expect(measurementsDue([], friday, '2026-10-28')).toBe(true); // baseline for a new user
  const m = [{ date: '2026-10-23' }];
  expect(measurementsDue(m, friday, '2026-10-29')).toBe(false); // Thursday
  expect(measurementsDue(m, friday, '2026-10-30')).toBe(true);  // Friday
  expect(measurementsDue(m, friday, '2026-11-02')).toBe(true);  // missed, still showing
  expect(measurementsDue([{ date: '2026-10-30' }], friday, '2026-10-30')).toBe(false);
  expect(measurementsDue([{ date: '2026-10-31' }], friday, '2026-11-02')).toBe(false);
});
test('health note needs 3 straight weeks above 1% per week', () => {
  const fast = dailySeries('2026-09-01', 40, 100, -0.3);
  const safe = dailySeries('2026-09-01', 40, 100, -0.05);
  const today = '2026-10-10';
  expect(healthNoteDue(fast, undefined, today)).toBe(true);
  expect(healthNoteDue(safe, undefined, today)).toBe(false);
  expect(healthNoteDue(dailySeries('2026-09-25', 14, 100, -0.3), undefined, today)).toBe(false);
});
test('dismissed health note returns after a week', () => {
  const fast = dailySeries('2026-09-01', 40, 100, -0.3);
  expect(healthNoteDue(fast, '2026-10-05', '2026-10-10')).toBe(false);
  expect(healthNoteDue(fast, '2026-10-03', '2026-10-10')).toBe(true);
});
test('backup nudge at more than 30 days', () => {
  const s = (lastBackupAt?: string) => ({ lastBackupAt }) as Settings;
  const first = [w('2026-09-01', 90)];
  expect(backupNudgeDue(s(), [], '2026-10-30')).toBe(false);
  expect(backupNudgeDue(s(), [w('2026-10-01', 90)], '2026-10-30')).toBe(false); // 29 days
  expect(backupNudgeDue(s(), first, '2026-10-30')).toBe(true);
  expect(backupNudgeDue(s('2026-10-01T12:00:00Z'), first, '2026-10-30')).toBe(false);
  expect(backupNudgeDue(s('2026-09-01T12:00:00Z'), first, '2026-10-30')).toBe(true);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/signals.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `src/calc/signals.ts`**

`healthNoteDue`: from the latest entry date T, for k = 0, 1, 2 require `(trendAt(T-7(k+1)) - trendAt(T-7k)) / trendAt(T-7(k+1)) > 0.01`. Null trends or a history shorter than 21 days return false. Lost-milestone steps are 5 kg, or 10 lb converted with `displayToKg`, and each reached step produces an id. Milestones use start minus latest trend, or `percentToGoal`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/signals.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/calc/signals.ts tests/signals.test.ts
git commit -m "feat: add streak, milestones, health note and due checks"
```

### Task 5: Input validation

**Files:**
- Create: `src/calc/validation.ts`
- Test: `tests/validation.test.ts`

**Interfaces:**
- Produces: `validateWeightKg(kg: number): string | null`, `validateLengthCm(cm: number): string | null`, `validateHeightCm(cm: number): string | null`, `validateDate(date, today): string | null` (each returns an error message or null), `needsTypoConfirm(kg, date, weights): boolean`.

- [ ] **Step 1: Write the failing tests**

```ts
test.each([[19.9, false], [20, true], [400, true], [400.1, false]])('weight %d valid=%s', (v, ok) =>
  expect(validateWeightKg(v) === null).toBe(ok));
test.each([[9.9, false], [10, true], [250, true], [250.1, false]])('length %d valid=%s', (v, ok) =>
  expect(validateLengthCm(v) === null).toBe(ok));
test.each([[99, false], [100, true], [250, true], [251, false]])('height %d valid=%s', (v, ok) =>
  expect(validateHeightCm(v) === null).toBe(ok));
test('future dates are rejected', () => {
  expect(validateDate('2026-10-31', '2026-10-30')).not.toBeNull();
  expect(validateDate('2026-10-30', '2026-10-30')).toBeNull();
});
test('typo check compares with the nearest earlier entry', () => {
  const data = [w('2026-10-01', 100), w('2026-10-20', 80)];
  expect(needsTypoConfirm(85, '2026-10-21', data)).toBe(true);
  expect(needsTypoConfirm(84.9, '2026-10-21', data)).toBe(false);
  expect(needsTypoConfirm(99, '2026-10-10', data)).toBe(false); // backdated: compares with 100
  expect(needsTypoConfirm(80, '2026-09-01', data)).toBe(false); // nothing earlier
  expect(needsTypoConfirm(80, '2026-10-20', data)).toBe(true);  // editing: ignores own date
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/validation.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `src/calc/validation.ts`**

Messages are plain and friendly, and state the allowed range.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/validation.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/calc/validation.ts tests/validation.test.ts
git commit -m "feat: add input validation"
```

### Task 6: Encouragement

**Files:**
- Create: `src/encouragement/select.ts`, `src/encouragement/messages.ts`
- Test: `tests/encouragement.test.ts`

**Interfaces:**
- Consumes: `trendAt`, `streak`, `milestoneLabel`, date helpers.
- Produces:
  - `type Situation = 'noEntries'|'readyToLog'|'welcomeBack'|'first'|'streak'|'upDayTrendDown'|'upTrend'|'plateau'|'downDay'|'upDay'|'milestone'`
  - `classify(weights, today, milestoneToday?: string): Situation`
  - `messageFor(weights, today, milestoneToday?: string): string`
  - `MESSAGES: Record<Situation, string[]>`, with `milestone` templates using `{milestone}`

- [ ] **Step 1: Write the failing tests**

```ts
const today = '2026-10-30';
test('classification rules', () => {
  expect(classify([], today)).toBe('noEntries');
  expect(classify([w('2026-10-29', 90)], today)).toBe('readyToLog');
  expect(classify([w('2026-10-20', 90)], today)).toBe('welcomeBack');
  expect(classify([w(today, 90)], today)).toBe('first');
  expect(classify([w('2026-10-20', 90), w(today, 90)], today)).toBe('welcomeBack');
  expect(classify([w(today, 90)], today, 'goal-25')).toBe('milestone');
});
test('seventh day of a streak', () =>
  expect(classify(dailySeries('2026-10-24', 7, 90, -0.1), today)).toBe('streak'));
test('an up day while the trend is down', () => {
  const data = dailySeries('2026-10-11', 20, 95, -0.3);
  data[data.length - 1] = w(today, 90);
  expect(classify(data, today)).toBe('upDayTrendDown');
});
test('rising trend', () => expect(classify(dailySeries('2026-10-11', 20, 90, 0.1), today)).toBe('upTrend'));
test('plateau needs 14 days of data', () =>
  expect(classify(dailySeries('2026-10-11', 20, 90, 0), today)).toBe('plateau'));
test('down day', () => expect(classify([w('2026-10-29', 90), w(today, 89.5)], today)).toBe('downDay'));
test('up day with too little history', () => expect(classify([w('2026-10-29', 90), w(today, 90.5)], today)).toBe('upDay'));
test('message is stable within a day and varies across days', () => {
  const data = dailySeries('2026-10-24', 7, 90, -0.1);
  expect(messageFor(data, today)).toBe(messageFor(data, today));
  const days = new Set(Array.from({ length: 30 }, (_, i) => messageFor([w('2026-01-01', 90)], addDays('2026-02-01', i))));
  expect(days.size).toBeGreaterThan(1);
});
test('milestone message names the milestone', () =>
  expect(messageFor([w(today, 90)], today, 'goal-50')).toContain(milestoneLabel('goal-50')));
test('every situation has at least 3 kind messages', () => {
  for (const [situation, list] of Object.entries(MESSAGES)) {
    expect(list.length, situation).toBeGreaterThanOrEqual(3);
    for (const m of list)
      expect(m.toLowerCase()).not.toMatch(/\b(fail|failed|failure|bad|lazy|cheat|cheated|guilt|guilty|disappoint|should have|shouldn't have|gave up|fell off)/);
  }
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/encouragement.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `classify`, `messageFor` and `MESSAGES`**

`classify`, in priority order:

1. `noEntries` if there are no entries.
2. `milestone` if `milestoneToday` is set.
3. If the latest entry is not today: `welcomeBack` when the gap is at least 3 days, otherwise `readyToLog`.
4. `first` if there is one entry.
5. `welcomeBack` if the gap between the last two entries is at least 3 days.
6. `streak` if the streak is a multiple of 7.
7. With `change = trendAt(today) - trendAt(today - 7)` (null if there is no earlier data):
   - `upDayTrendDown` if the day's change is above 0 and `change < -0.2`
   - `upTrend` if `change >= 0.2`
   - `plateau` if entries span at least 14 days and `|change| < 0.2`
   - `downDay` if the day's change is 0 or below
   - otherwise `upDay`

`messageFor` picks `hash(today + situation) % list.length` with a simple string hash. Write at least 3 warm, plain messages per situation. `upDayTrendDown` includes: "One day is water, not fat; your trend is still down."

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/encouragement.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/encouragement tests/encouragement.test.ts
git commit -m "feat: add data-aware encouragement messages"
```

### Task 7: Database

**Files:**
- Create: `src/db/db.ts`
- Test: `tests/db.test.ts`

**Interfaces:**
- Consumes: types from `src/types.ts`.
- Produces: `loadAll(): Promise<{ settings: Settings | null; weights: WeightEntry[]; measurements: MeasurementEntry[] }>`, `putWeight(entry)`, `deleteWeight(date)`, `putMeasurement(entry)`, `deleteMeasurement(date)`, `saveSettings(settings)`, `replaceAll(data: AppData)`, `requestPersistence(): Promise<void>`, all async.

- [ ] **Step 1: Write the failing tests**

Import `fake-indexeddb/auto`. Clear the database in `beforeEach` by calling `replaceAll` with empty arrays.

```ts
test('fresh database has no settings', async () => expect((await loadAll()).settings).toBeNull());
test('same date overwrites and results are sorted', async () => {
  await putWeight({ date: '2026-10-30', kg: 90 });
  await putWeight({ date: '2026-10-01', kg: 95 });
  await putWeight({ date: '2026-10-30', kg: 89, note: 'x' });
  expect((await loadAll()).weights).toEqual([{ date: '2026-10-01', kg: 95 }, { date: '2026-10-30', kg: 89, note: 'x' }]);
});
test('delete removes one entry', async () => {
  await putMeasurement({ date: '2026-10-30', waistCm: 90 });
  await deleteMeasurement('2026-10-30');
  expect((await loadAll()).measurements).toEqual([]);
});
test('replaceAll swaps everything at once', async () => {
  await putWeight({ date: '2026-01-01', kg: 100 });
  await replaceAll({ settings, weights: [{ date: '2026-10-30', kg: 80 }], measurements: [] });
  const all = await loadAll();
  expect(all.weights).toEqual([{ date: '2026-10-30', kg: 80 }]);
  expect(all.settings).toEqual(settings);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/db.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `src/db/db.ts`**

Use `idb`. Database `weight-tracker`, version 1, stores `weights` and `measurements` keyed by `date`, and `settings` holding one record under key `app`. `replaceAll` uses a single transaction across all three stores. `requestPersistence` calls `navigator.storage?.persist?.()` and ignores failures.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/db.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/db tests/db.test.ts
git commit -m "feat: add IndexedDB storage"
```

### Task 8: Backup

**Files:**
- Create: `src/backup/backup.ts`
- Test: `tests/backup.test.ts`

**Interfaces:**
- Consumes: `AppData`, validation functions.
- Produces:
  - `buildBackup(data: AppData, nowIso: string): string` (pretty JSON)
  - `backupFileName(today: ISODate): string`, returning `weight-tracker-backup-YYYY-MM-DD.json`
  - `type ParseResult = { ok: true; data: AppData; summary: { weights: number; measurements: number; first?: ISODate; last?: ISODate } } | { ok: false; error: string }`
  - `parseBackup(text: string): ParseResult`
  - `shareBackup(json: string, fileName: string): Promise<'saved' | 'cancelled'>`

- [ ] **Step 1: Write the failing tests**

```ts
test('round trip preserves all data', () => {
  const r = parseBackup(buildBackup(data, '2026-10-30T12:00:00Z'));
  expect(r).toMatchObject({ ok: true, data, summary: { weights: 2, measurements: 1, first: '2026-10-01', last: '2026-10-30' } });
});
test.each([
  ['not json', '{oops'],
  ['empty file', ''],
  ['wrong shape', '{"hello":1}'],
  ['newer version', backupWith({ version: 2 })],
  ['bad date', backupWith({ weights: [{ date: '30/10/2026', kg: 80 }] })],
  ['impossible weight', backupWith({ weights: [{ date: '2026-10-30', kg: 5000 }] })],
  ['string weight', backupWith({ weights: [{ date: '2026-10-30', kg: '80' }] })],
  ['duplicate dates', backupWith({ weights: [{ date: '2026-10-30', kg: 80 }, { date: '2026-10-30', kg: 81 }] })],
  ['bad measurement', backupWith({ measurements: [{ date: '2026-10-30', waistCm: 1 }] })],
  ['missing settings', backupWith({ settings: undefined })],
])('rejects %s', (_, text) => {
  const r = parseBackup(text);
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.length).toBeGreaterThan(0);
});
test('entries are returned sorted by date', () => {
  const r = parseBackup(backupWith({ weights: [{ date: '2026-10-30', kg: 80 }, { date: '2026-10-01', kg: 90 }] }));
  expect(r.ok && r.data.weights[0].date).toBe('2026-10-01');
});
test('shareBackup reports a cancelled share sheet', async () => {
  vi.stubGlobal('navigator', {
    canShare: () => true,
    share: () => Promise.reject(new DOMException('', 'AbortError')),
  });
  expect(await shareBackup('{}', 'a.json')).toBe('cancelled');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/backup.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `src/backup/backup.ts`**

The file holds `version: 1`, `exportedAt`, `settings`, `weights`, `measurements`. `shareBackup` uses `navigator.share` with a `File` when `canShare({ files })` is true, and otherwise falls back to an anchor download. Only a resolved share counts as `saved`, so a cancelled sheet never updates `lastBackupAt`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/backup.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/backup tests/backup.test.ts
git commit -m "feat: add backup export and import"
```

### Task 9: App shell, first-run setup and PWA install

**Files:**
- Create: `src/state/useApp.ts`, `src/screens/Setup.tsx`, `src/components/TabBar.tsx`, `src/components/InstallBanner.tsx`, `src/styles.css`, `playwright.config.ts`, `public/icon.svg`, `pwa-assets.config.ts`, `tests/e2e/helpers.ts`, `tests/e2e/shell.spec.ts`
- Modify: `src/app.tsx`, `src/main.tsx`, `vite.config.ts`, `index.html`, `package.json`

**Interfaces:**
- Consumes: `db`, `todayISO`, `Settings`.
- Produces:
  - `useApp()` returning `{ loading, loadError, data: AppData | null, today: ISODate, refresh(): Promise<void> }`
  - `today` recalculates on `visibilitychange` and `pageshow`. Save handlers call `todayISO()` at the moment of saving, never a value from render.
  - `src/app.tsx` exposes a `Tab` union of `'today'|'progress'|'history'|'settings'` and renders the screen for the current tab
  - `tests/e2e/helpers.ts` exports `completeSetup(page, options?)`

- [ ] **Step 1: Configure PWA and Playwright**

`vite-plugin-pwa` with `registerType: 'autoUpdate'`, manifest name `Weight Tracker`, `display: 'standalone'`, `start_url` and `scope` of `/weight-tracker/`, icons at 192 and 512. Use `@vite-pwa/assets-generator` to create icons from `public/icon.svg` and link an `apple-touch-icon` in `index.html`. Add `viewport-fit=cover` to the viewport meta tag.

Playwright runs `npm run build && npm run preview` as `webServer`, with base URL `http://localhost:4173/weight-tracker/`. Two projects: `iphone` (`devices['iPhone 15']`, WebKit) and `offline` (Chromium, matching `offline.spec.ts` only). Install browsers with `npx playwright install webkit chromium`.

- [ ] **Step 2: Write the failing e2e tests**

```ts
test('first run asks for setup, then opens Today', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();
  await page.getByLabel(/goal weight/i).fill('80');
  await page.getByRole('button', { name: /get started/i }).click();
  await expect(page.getByRole('tab', { name: 'Today' })).toHaveAttribute('aria-selected', 'true');
  await page.reload();
  await expect(page.getByRole('heading', { name: /welcome/i })).toBeHidden();
});
test('setup rejects an impossible goal', async ({ page }) => {
  await page.goto('./');
  await page.getByLabel(/goal weight/i).fill('5');
  await page.getByRole('button', { name: /get started/i }).click();
  await expect(page.getByRole('alert')).toBeVisible();
});
test('tabs switch screens', async ({ page }) => {
  await completeSetup(page);
  for (const name of ['Progress', 'History', 'Settings', 'Today']) {
    await page.getByRole('tab', { name }).click();
    await expect(page.getByRole('tab', { name })).toHaveAttribute('aria-selected', 'true');
  }
});
test('install banner shows in a browser tab with instructions', async ({ page }) => {
  await completeSetup(page);
  await expect(page.getByText(/add to home screen/i)).toBeVisible();
});
test('install banner is hidden when installed', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'standalone', { value: true }));
  await completeSetup(page);
  await expect(page.getByText(/add to home screen/i)).toBeHidden();
});
test('today updates when the app returns from the background on a new day', async ({ page }) => {
  await page.clock.install({ time: new Date(2026, 9, 30, 22, 0) });
  await completeSetup(page);
  await page.clock.setFixedTime(new Date(2026, 9, 31, 8, 0));
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await expect(page.getByTestId('today-date')).toContainText('31');
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm run test:e2e -- tests/e2e/shell.spec.ts`
Expected: FAIL, no setup screen.

- [ ] **Step 4: Implement the shell**

Build `useApp`, `Setup`, `TabBar` (with `role="tab"`), `InstallBanner` and the base stylesheet. Setup fields are goal weight, weight unit, length unit, and optional height and sex. It saves with `measurementDay: 5` and empty `celebratedMilestones`, and calls `requestPersistence`. The Today tab renders a heading with `data-testid="today-date"`, using `formatDate(today)`; other tabs are empty placeholders until their tasks. `InstallBanner` shows when neither `navigator.standalone` nor `matchMedia('(display-mode: standalone)')` is true. A failed `loadAll` shows a message telling the user their data was not changed, with a retry button.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm run test:e2e -- tests/e2e/shell.spec.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add app shell, first-run setup and PWA install"
```

### Task 10: Today screen

**Files:**
- Create: `src/screens/Today.tsx`, `src/components/ConfirmDialog.tsx`, `src/components/SummaryCard.tsx`, `tests/e2e/today.spec.ts`
- Modify: `src/app.tsx`, `src/styles.css`

**Interfaces:**
- Consumes: `useApp`, `putWeight`, `saveSettings`, `parseDecimal`, `displayToKg`, `formatWeight`, `validateWeightKg`, `needsTypoConfirm`, `messageFor`, `reachedMilestones`, `newMilestones`, `pickMilestone`, `streak`, `totalLost`, `percentToGoal`, `healthNoteDue`.
- Produces: `ConfirmDialog` with props `{ message: string; confirmLabel: string; onConfirm(): void; onCancel(): void }`.

- [ ] **Step 1: Write the failing e2e tests**

```ts
test('logging saves and shows in the summary', async ({ page }) => {
  await completeSetup(page, { goal: '80' });
  await page.getByLabel('Weight').fill('90');
  await page.getByLabel(/note/i).fill('started today');
  await page.getByRole('button', { name: /save/i }).click();
  await expect(page.getByTestId('encouragement')).not.toBeEmpty();
  await page.reload();
  await expect(page.getByLabel('Weight')).toHaveValue('90.0');
  await expect(page.getByLabel(/note/i)).toHaveValue('started today');
});
test('saving again updates the same day', async ({ page }) => {
  await completeSetup(page);
  await logWeight(page, '90');
  await logWeight(page, '89.5');
  await page.getByRole('tab', { name: 'History' }).click();
  await expect(page.getByTestId('weight-entry')).toHaveCount(1);
});
test('comma decimals are accepted', async ({ page }) => {
  await completeSetup(page);
  await logWeight(page, '82,5');
  await page.reload();
  await expect(page.getByLabel('Weight')).toHaveValue('82.5');
});
test('an impossible weight is rejected', async ({ page }) => {
  await completeSetup(page);
  await logWeight(page, '5');
  await expect(page.getByRole('alert')).toContainText(/20/);
});
test('a likely typo asks for confirmation', async ({ page }) => {
  await completeSetup(page);
  await logYesterday(page, '90');
  await page.getByLabel('Weight').fill('70');
  await page.getByRole('button', { name: /save/i }).click();
  await page.getByRole('button', { name: /go back/i }).click();
  await expect(page.getByLabel('Weight')).toHaveValue('70');
  await page.getByRole('button', { name: /save/i }).click();
  await page.getByRole('button', { name: /yes, save/i }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
});
test('a failed save keeps the input and says so', async ({ page }) => {
  await completeSetup(page);
  await page.evaluate(() => { IDBObjectStore.prototype.put = () => { throw new Error('quota'); }; });
  await logWeight(page, '90');
  await expect(page.getByRole('alert')).toContainText(/not saved/i);
  await expect(page.getByLabel('Weight')).toHaveValue('90');
});
```

Add `logWeight` and `logYesterday` to `tests/e2e/helpers.ts`. `logYesterday` adds the entry through History in Task 13, so until then it writes directly to IndexedDB in `page.evaluate`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:e2e -- tests/e2e/today.spec.ts`
Expected: FAIL, weight field not found.

- [ ] **Step 3: Implement `Today.tsx`**

The form prefills from today's entry if one exists. Save parses, validates, runs the typo check, then writes under `todayISO()` read at save time. After saving, compute `newMilestones`. If any exist, append all to `celebratedMilestones` and set `latestMilestone` from `pickMilestone`, so a burst of new ids gives a single celebration. Pass `latestMilestone.id` to `messageFor` only when its date is today. Summary shows change since start, percent to goal when not null, and streak. Show the health note, dismissible, when `healthNoteDue` is true; dismissing writes `healthNoteDismissedAt`. Failures show an `alert` that the entry was not saved, and input is kept.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:e2e -- tests/e2e/today.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Today screen with logging and encouragement"
```

### Task 11: Weekly measurements

**Files:**
- Create: `src/screens/MeasurementForm.tsx`, `src/components/MeasurementCard.tsx`, `tests/e2e/measurements.spec.ts`
- Modify: `src/screens/Today.tsx`, `src/styles.css`

**Interfaces:**
- Consumes: `measurementsDue`, `putMeasurement`, `MEASUREMENT_KEYS`, `validateLengthCm`, `parseDecimal`, `displayToCm`, `estimateBodyFat`.
- Produces: `MeasurementForm` with props `{ date: ISODate; initial?: MeasurementEntry; onDone(): void }`, reused by History in Task 13.

- [ ] **Step 1: Write the failing e2e tests**

```ts
test('card shows for a new user, then clears once saved', async ({ page }) => {
  await completeSetup(page, { height: '180', sex: 'male' });
  await page.getByRole('button', { name: /weekly measurements/i }).click();
  await page.getByLabel('Waist').fill('90');
  await page.getByLabel('Neck').fill('38');
  await page.getByRole('button', { name: /save/i }).click();
  await expect(page.getByTestId('body-fat-result')).toContainText(/estimate/i);
  await page.getByRole('button', { name: /done/i }).click();
  await expect(page.getByRole('button', { name: /weekly measurements/i })).toBeHidden();
});
test('says what is missing for a body fat estimate', async ({ page }) => {
  await completeSetup(page);
  await page.getByRole('button', { name: /weekly measurements/i }).click();
  await page.getByLabel('Waist').fill('90');
  await page.getByRole('button', { name: /save/i }).click();
  await expect(page.getByTestId('body-fat-result')).toContainText(/height/i);
});
test('an all-blank form is not saved', async ({ page }) => {
  await completeSetup(page);
  await page.getByRole('button', { name: /weekly measurements/i }).click();
  await page.getByRole('button', { name: /save/i }).click();
  await expect(page.getByRole('alert')).toBeVisible();
});
test('an out-of-range measurement is rejected', async ({ page }) => {
  await completeSetup(page);
  await page.getByRole('button', { name: /weekly measurements/i }).click();
  await page.getByLabel('Waist').fill('2');
  await page.getByRole('button', { name: /save/i }).click();
  await expect(page.getByRole('alert')).toBeVisible();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:e2e -- tests/e2e/measurements.spec.ts`
Expected: FAIL, card not found.

- [ ] **Step 3: Implement the card and form**

The card appears on Today when `measurementsDue` is true. The form replaces the Today content while open, so the two Save buttons are never on screen together. It has six labelled optional fields in the current length unit, and it is dated today unless a `date` is passed. On save, the form stays open and shows the body fat result: the estimate with its label and the "within 3-4 points" note, the missing fields, or the recheck message. A Done button closes it.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:e2e -- tests/e2e/measurements.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add weekly measurements and body fat result"
```

### Task 12: Charts and Progress screen

**Files:**
- Create: `src/components/chartGeometry.ts`, `src/components/LineChart.tsx`, `src/screens/Progress.tsx`, `tests/chartGeometry.test.ts`, `tests/e2e/progress.spec.ts`
- Modify: `src/app.tsx`, `src/styles.css`

**Interfaces:**
- Consumes: stats, `trendSeries`, `bodyFatSeries`, `kgToDisplay`, `cmToDisplay`.
- Produces:
  - `type Point = { date: ISODate; value: number }`, `type Range = '1m'|'3m'|'6m'|'all'`
  - `filterRange(points: Point[], range: Range, today: ISODate): Point[]`
  - `computeChart({ dots, line, goal, width, height }): { dots: {x,y}[]; line: {x,y}[]; goalY: number | null; yTicks: { y: number; value: number }[]; xLabels: { x: number; label: string }[] }`
  - `LineChart` with props `{ dots?: Point[]; line?: Point[]; goal?: number; label: string; formatValue(v: number): string; emptyText: string; compact?: boolean }`

- [ ] **Step 1: Write the failing tests**

```ts
test('filterRange keeps points inside the window', () => {
  const pts = [p('2026-01-01'), p('2026-10-15')];
  expect(filterRange(pts, '1m', '2026-10-30')).toEqual([pts[1]]);
  expect(filterRange(pts, 'all', '2026-10-30')).toEqual(pts);
});
test('a single point and identical values produce finite coordinates', () => {
  const one = computeChart({ dots: [p('2026-10-30', 90)], width: 300, height: 200 });
  const flat = computeChart({ dots: [p('2026-10-29', 90), p('2026-10-30', 90)], width: 300, height: 200 });
  for (const c of [...one.dots, ...flat.dots]) {
    expect(Number.isFinite(c.x)).toBe(true);
    expect(Number.isFinite(c.y)).toBe(true);
  }
});
test('the y axis extends to include the goal', () => {
  const c = computeChart({ dots: [p('2026-10-30', 90)], goal: 70, width: 300, height: 200 });
  expect(c.goalY).toBeGreaterThanOrEqual(0);
  expect(c.goalY).toBeLessThanOrEqual(200);
});
```

```ts
// tests/e2e/progress.spec.ts
test('empty state with no entries', async ({ page }) => {
  await completeSetup(page);
  await page.getByRole('tab', { name: 'Progress' }).click();
  await expect(page.getByText(/first weigh-in/i)).toBeVisible();
  await expect(page.locator('body')).not.toContainText('NaN');
});
test('one entry renders a chart without NaN', async ({ page }) => {
  await completeSetup(page);
  await logWeight(page, '90');
  await page.getByRole('tab', { name: 'Progress' }).click();
  await expect(page.getByRole('img', { name: /weight/i })).toBeVisible();
  await expect(page.locator('body')).not.toContainText('NaN');
});
test('stats show, and BMI appears only with a height', async ({ page }) => {
  await completeSetup(page, { goal: '80' });
  await logWeight(page, '90');
  await page.getByRole('tab', { name: 'Progress' }).click();
  await expect(page.getByTestId('stats')).toContainText(/current/i);
  await expect(page.getByTestId('stats')).not.toContainText('BMI');
});
test('range buttons change the selection', async ({ page }) => {
  await completeSetup(page);
  await logWeight(page, '90');
  await page.getByRole('tab', { name: 'Progress' }).click();
  await page.getByRole('button', { name: '3M' }).click();
  await expect(page.getByRole('button', { name: '3M' })).toHaveAttribute('aria-pressed', 'true');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/chartGeometry.test.ts && npm run test:e2e -- tests/e2e/progress.spec.ts`
Expected: FAIL, modules and screen not found.

- [ ] **Step 3: Implement geometry, `LineChart` and `Progress`**

`LineChart` is inline SVG with `role="img"` and an `aria-label`. Compute the trend from all data before applying the range, so the line is correct at the left edge. Main graph: dots for weigh-ins, trend line, dashed goal. Stats, each hidden when null: current, starting, lowest, total lost, percent to goal, average loss per week, projected goal date, BMI. Then the body fat graph, with "Estimate" in its title and change since the first estimate, and a compact graph for each measurement with data showing change since first entry. Body fat shows a short note on what's needed when it has no data.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/chartGeometry.test.ts && npm run test:e2e -- tests/e2e/progress.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Progress screen with charts and stats"
```

### Task 13: History screen

**Files:**
- Create: `src/screens/History.tsx`, `tests/e2e/history.spec.ts`
- Modify: `src/app.tsx`, `src/styles.css`, `tests/e2e/helpers.ts`

**Interfaces:**
- Consumes: `MeasurementForm`, `ConfirmDialog`, `putWeight`, `deleteWeight`, `deleteMeasurement`, validation functions.

- [ ] **Step 1: Write the failing e2e tests**

```ts
test('edit a weight and its note', async ({ page }) => {
  await completeSetup(page);
  await logWeight(page, '90');
  await page.getByRole('tab', { name: 'History' }).click();
  await page.getByTestId('weight-entry').getByRole('button', { name: /edit/i }).click();
  await page.getByLabel('Weight').fill('89');
  await page.getByRole('button', { name: /save/i }).click();
  await expect(page.getByTestId('weight-entry')).toContainText('89.0');
});
test('delete asks first', async ({ page }) => {
  await completeSetup(page);
  await logWeight(page, '90');
  await page.getByRole('tab', { name: 'History' }).click();
  await page.getByTestId('weight-entry').getByRole('button', { name: /delete/i }).click();
  await page.getByRole('button', { name: /cancel/i }).click();
  await expect(page.getByTestId('weight-entry')).toHaveCount(1);
  await page.getByTestId('weight-entry').getByRole('button', { name: /delete/i }).click();
  await page.getByRole('button', { name: /yes, delete/i }).click();
  await expect(page.getByTestId('weight-entry')).toHaveCount(0);
});
test('add a missed day, newest shown first', async ({ page }) => {
  await completeSetup(page);
  await logWeight(page, '90');
  await page.getByRole('tab', { name: 'History' }).click();
  await page.getByRole('button', { name: /add/i }).click();
  await page.getByLabel('Date').fill(daysAgoISO(3));
  await page.getByLabel('Weight').fill('91');
  await page.getByRole('button', { name: /save/i }).click();
  await expect(page.getByTestId('weight-entry').first()).toContainText('90.0');
});
test('a future date is rejected', async ({ page }) => {
  await completeSetup(page);
  await page.getByRole('tab', { name: 'History' }).click();
  await page.getByRole('button', { name: /add/i }).click();
  await page.getByLabel('Date').fill(daysAgoISO(-1));
  await page.getByLabel('Weight').fill('91');
  await page.getByRole('button', { name: /save/i }).click();
  await expect(page.getByRole('alert')).toBeVisible();
});
test('adding a date that already has an entry asks before replacing', async ({ page }) => {
  await completeSetup(page);
  await logWeight(page, '90');
  await page.getByRole('tab', { name: 'History' }).click();
  await page.getByRole('button', { name: /add/i }).click();
  await page.getByLabel('Date').fill(daysAgoISO(0));
  await page.getByLabel('Weight').fill('91');
  await page.getByRole('button', { name: /save/i }).click();
  await expect(page.getByRole('dialog')).toContainText(/already/i);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:e2e -- tests/e2e/history.spec.ts`
Expected: FAIL, no entries shown.

- [ ] **Step 3: Implement `History.tsx`**

Two sections, weights and measurements, each newest first, with `data-testid="weight-entry"` on weight rows. Edits keep the entry's date. Adding reuses the validation and typo check from Today. Measurement rows use `MeasurementForm` for editing. The list is hidden while an add or edit form is open. Update `logYesterday` in `tests/e2e/helpers.ts` to use the Add flow.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:e2e -- tests/e2e/history.spec.ts tests/e2e/today.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add History screen"
```

### Task 14: Settings and backup UI

**Files:**
- Create: `src/screens/Settings.tsx`, `src/components/BackupNudge.tsx`, `tests/e2e/settings.spec.ts`
- Modify: `src/app.tsx`, `src/screens/Today.tsx`, `src/styles.css`

**Interfaces:**
- Consumes: `saveSettings`, `resetGoalMilestones`, `buildBackup`, `backupFileName`, `shareBackup`, `parseBackup`, `replaceAll`, `backupNudgeDue`, `validateWeightKg`, `validateHeightCm`.

- [ ] **Step 1: Write the failing e2e tests**

```ts
test('switching units changes display, not data', async ({ page }) => {
  await completeSetup(page);
  await logWeight(page, '90');
  await page.getByRole('tab', { name: 'Settings' }).click();
  await page.getByRole('radio', { name: 'lb' }).click();
  await page.getByRole('tab', { name: 'History' }).click();
  await expect(page.getByTestId('weight-entry')).toContainText('198.4 lb');
  await page.getByRole('tab', { name: 'Settings' }).click();
  await page.getByRole('radio', { name: 'kg' }).click();
  await page.getByRole('tab', { name: 'History' }).click();
  await expect(page.getByTestId('weight-entry')).toContainText('90.0 kg');
});
test('changing the goal clears goal milestones and keeps lost ones', async ({ page }) => {
  await completeSetup(page, { goal: '80' });
  await setCelebrated(page, ['lost-5kg', 'goal-25']);
  await page.getByRole('tab', { name: 'Settings' }).click();
  await page.getByLabel(/goal weight/i).fill('75');
  await page.getByRole('button', { name: /save goal/i }).click();
  await expect.poll(() => getCelebrated(page)).toEqual(['lost-5kg']);
});
test('measurement day can be changed', async ({ page }) => {
  await completeSetup(page);
  await page.getByRole('tab', { name: 'Settings' }).click();
  await page.getByLabel(/measurement day/i).selectOption('1');
  await page.reload();
  await page.getByRole('tab', { name: 'Settings' }).click();
  await expect(page.getByLabel(/measurement day/i)).toHaveValue('1');
});
test('backup round trip restores data after a confirmation', async ({ page }) => {
  await completeSetup(page);
  await logWeight(page, '90');
  await page.getByRole('tab', { name: 'Settings' }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /export/i }).click();
  const file = await (await download).path();
  await expect(page.getByTestId('last-backup')).not.toContainText(/never/i);
  await page.getByRole('tab', { name: 'History' }).click();
  await page.getByTestId('weight-entry').getByRole('button', { name: /delete/i }).click();
  await page.getByRole('button', { name: /yes, delete/i }).click();
  await page.getByRole('tab', { name: 'Settings' }).click();
  await page.getByLabel(/import/i).setInputFiles({ name: 'b.json', mimeType: 'application/json', buffer: await readFile(file) });
  await expect(page.getByRole('dialog')).toContainText('1');
  await page.getByRole('button', { name: /yes, replace/i }).click();
  await page.getByRole('tab', { name: 'History' }).click();
  await expect(page.getByTestId('weight-entry')).toHaveCount(1);
});
test('an invalid backup changes nothing', async ({ page }) => {
  await completeSetup(page);
  await logWeight(page, '90');
  await page.getByRole('tab', { name: 'Settings' }).click();
  await page.getByLabel(/import/i).setInputFiles({ name: 'b.json', mimeType: 'application/json', buffer: Buffer.from('{oops') });
  await expect(page.getByRole('alert')).toBeVisible();
  await page.getByRole('tab', { name: 'History' }).click();
  await expect(page.getByTestId('weight-entry')).toHaveCount(1);
});
```

Add `setCelebrated` and `getCelebrated` to `tests/e2e/helpers.ts`, reading and writing the settings record through `page.evaluate`. In WebKit `canShare` may be false, so the download fallback is what this test exercises. The share path has unit coverage in Task 8.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:e2e -- tests/e2e/settings.spec.ts`
Expected: FAIL, controls not found.

- [ ] **Step 3: Implement `Settings.tsx` and `BackupNudge.tsx`**

Fields for goal, units, height, sex and measurement day. A goal change also calls `resetGoalMilestones`. Show the last backup date or "Never". Export sets `lastBackupAt` only when `shareBackup` returns `saved`. The Import file input is labelled "Import backup" and resets after each use, so the same file can be chosen again. Show the summary in `ConfirmDialog`, with the warning that it replaces everything now in the app. Add a short section explaining the two iPhone behaviours from the spec. `BackupNudge` shows on Today when `backupNudgeDue` is true and links to Settings.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:e2e -- tests/e2e/settings.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Settings and backup UI"
```

### Task 15: Offline check, deployment and full verification

**Files:**
- Create: `tests/e2e/offline.spec.ts`, `tests/e2e/longterm.spec.ts`, `.github/workflows/deploy.yml`, `README.md`

**Interfaces:**
- Consumes: the complete app.

- [ ] **Step 1: Write the offline and full-journey tests**

```ts
// tests/e2e/offline.spec.ts (Chromium project)
test('the app loads and saves with no network', async ({ page, context }) => {
  await page.goto('./');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await completeSetup(page, { skipGoto: true });
  await logWeight(page, '90');
  await page.reload();
  await expect(page.getByLabel('Weight')).toHaveValue('90.0');
});

// tests/e2e/longterm.spec.ts (iPhone project)
test('sixty days of data renders every screen without NaN', async ({ page }) => {
  await completeSetup(page, { goal: '80', height: '180', sex: 'male' });
  await seedDays(page, 60, 95, -0.1);
  await page.reload();
  for (const name of ['Today', 'Progress', 'History', 'Settings']) {
    await page.getByRole('tab', { name }).click();
    await expect(page.locator('body')).not.toContainText('NaN');
    await expect(page.locator('body')).not.toContainText('undefined');
  }
  await page.getByRole('tab', { name: 'Progress' }).click();
  await expect(page.getByTestId('stats')).toContainText(/projected/i);
});
```

Add `seedDays` to `tests/e2e/helpers.ts`, writing entries directly to IndexedDB, and a `skipGoto` option on `completeSetup`.

- [ ] **Step 2: Run them, then fix anything they find**

Run: `npm run test:e2e -- tests/e2e/offline.spec.ts tests/e2e/longterm.spec.ts`
Expected: PASS after any fixes.

- [ ] **Step 3: Add the deployment workflow and README**

`.github/workflows/deploy.yml` runs on pushes to `main`: `npm ci`, `npm test`, `npm run build`, then deploys `dist/` with `actions/upload-pages-artifact` and `actions/deploy-pages`, using current major versions. The README covers running, testing and deployment, plus iPhone install steps: open the link in Safari, tap Share, tap Add to Home Screen.

- [ ] **Step 4: Run the full verification**

Run: `npm test && npm run build && npm run test:e2e`
Expected: everything passes.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add offline tests, deploy workflow and README"
```

- [ ] **Step 6: Get the user's approval, then publish**

Publishing is public and outward-facing, so stop and confirm with the user first. Once approved, merge `build-app` into `main`, create the public GitHub repository `weight-tracker` with `gh repo create`, enable Pages with GitHub Actions as the source, and push. Confirm the workflow succeeds with `gh run watch` and the live URL loads.

- [ ] **Step 7: Hand over the iPhone check**

Give the user the live URL and this checklist for their iPhone: install from Safari, complete setup, log a weight, turn on Airplane Mode and reopen the app, export a backup to Files, and import it again. This is the only step that cannot be automated.
