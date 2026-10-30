import { useState } from 'preact/hooks';
import { bodyFatSeries } from '../calc/bodyFat';
import {
  averageLossPerWeek,
  bmi,
  currentWeight,
  lowestWeight,
  percentToGoal,
  projectGoalDate,
  startingWeight,
  totalLost,
} from '../calc/stats';
import { trendSeries, type Point } from '../calc/trend';
import { filterRange, type Range } from '../components/chartGeometry';
import { LineChart } from '../components/LineChart';
import { formatDate } from '../lib/dates';
import { cmToDisplay, formatChange, formatLength, formatWeight, kgToDisplay } from '../lib/units';
import type { ScreenProps } from '../state/useApp';
import { MEASUREMENT_KEYS } from '../types';
import type { AppData, ISODate } from '../types';
import { measurementLabel } from './MeasurementForm';

const RANGES: { id: Range; label: string }[] = [
  { id: '1m', label: '1M' },
  { id: '3m', label: '3M' },
  { id: '6m', label: '6M' },
  { id: 'all', label: 'All' },
];

function Stats({ data, today }: { data: AppData; today: ISODate }) {
  const { settings, weights } = data;
  const unit = settings.weightUnit;
  const average = averageLossPerWeek(weights);
  const percent = percentToGoal(weights, settings.goalKg);
  const projected = projectGoalDate(weights, settings.goalKg, today);
  const bodyMass = settings.heightCm === undefined ? null : bmi(weights, settings.heightCm);

  const rows: [string, string][] = [
    ['Current', formatWeight(currentWeight(weights)!, unit)],
    ['Starting', formatWeight(startingWeight(weights)!, unit)],
    ['Lowest', formatWeight(lowestWeight(weights)!, unit)],
    ['Change since start', formatChange(totalLost(weights)!, unit)],
  ];
  if (percent !== null) rows.push(['To goal', `${Math.round(percent)}% there`]);
  if (average !== null) rows.push(['Average per week', formatChange(average, unit)]);
  if (projected !== null) rows.push(['Projected goal date', formatDate(projected)]);
  if (bodyMass !== null) rows.push(['BMI', bodyMass.toFixed(1)]);

  return (
    <dl class="table" data-testid="stats">
      {rows.map(([name, value]) => (
        <div key={name}>
          <dt>{name}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function changeSince(points: Point[], format: (value: number) => string): string | null {
  if (points.length < 2) return null;
  const change = points[points.length - 1].value - points[0].value;
  return `${change > 0 ? '+' : change < 0 ? '−' : ''}${format(Math.abs(change))} since first entry`;
}

export function Progress({ data, today }: ScreenProps) {
  const { settings, weights, measurements } = data;
  const [range, setRange] = useState<Range>('3m');

  if (weights.length === 0 && measurements.length === 0)
    return (
      <>
        <h1>Progress</h1>
        <p class="lede">Your first weigh-in will start your graph.</p>
      </>
    );

  const unit = settings.weightUnit;
  const lengthUnit = settings.lengthUnit;
  const show = (points: Point[]) => filterRange(points, range, today);
  const toDisplay = (points: Point[]) => points.map((p) => ({ ...p, value: kgToDisplay(p.value, unit) }));
  const formatDisplayWeight = (value: number) => `${value.toFixed(1)} ${unit}`;
  const entries = weights.map((e) => ({ date: e.date, value: e.kg }));
  const fat = bodyFatSeries(measurements, settings.heightCm, settings.sex);
  const percentText = (value: number) => `${value.toFixed(1)}%`;

  return (
    <>
      <h1>Progress</h1>
      <div class="ranges">
        {RANGES.map(({ id, label }) => (
          <button key={id} class="range" aria-pressed={range === id} onClick={() => setRange(id)}>
            {label}
          </button>
        ))}
      </div>

      {weights.length > 0 && (
        <section class="section">
          <LineChart
            dots={show(toDisplay(entries))}
            line={show(toDisplay(trendSeries(weights)))}
            goal={kgToDisplay(settings.goalKg, unit)}
            goalLabel={`Goal ${formatWeight(settings.goalKg, unit)}`}
            label="Weight over time"
            formatValue={formatDisplayWeight}
            emptyText="No entries in this period."
            water
          />
          <ul class="legend">
            <li>
              <span class="key key-dot" />
              Daily weigh-in
            </li>
            <li>
              <span class="key key-trend" />
              Sea level (7-day trend)
            </li>
            <li>
              <span class="key key-goal" />
              Goal
            </li>
          </ul>
          <Stats data={data} today={today} />
        </section>
      )}

      <section class="section">
        <h2>Body fat estimate</h2>
        {fat.length > 0 && <p class="hint">{changeSince(fat, percentText) ?? 'Your first estimate.'}</p>}
        <LineChart
          dots={show(fat)}
          line={show(fat)}
          label="Body fat estimate over time"
          formatValue={percentText}
          emptyText={
            fat.length > 0
              ? 'No entries in this period.'
              : 'Log your waist and neck (plus hips for women), and set your height and sex in Settings.'
          }
          compact
        />
        {fat.length > 0 && <p class="hint">An estimate, usually within 3-4 points of a clinical scan.</p>}
      </section>

      {MEASUREMENT_KEYS.map((key) => {
        const points = measurements.flatMap((m) => {
          const cm = m[key];
          return cm === undefined ? [] : [{ date: m.date, value: cmToDisplay(cm, lengthUnit) }];
        });
        if (points.length === 0) return null;
        const format = (value: number) => `${value.toFixed(1)} ${lengthUnit}`;
        return (
          <section class="section" key={key}>
            <h3>{measurementLabel(key)}</h3>
            <p class="hint">
              {formatLength(measurements.filter((m) => m[key] !== undefined).at(-1)![key]!, lengthUnit)}
              {points.length > 1 && `, ${changeSince(points, format)}`}
            </p>
            <LineChart
              dots={show(points)}
              line={show(points)}
              label={`${measurementLabel(key)} over time`}
              formatValue={format}
              emptyText="No entries in this period."
              compact
            />
          </section>
        );
      })}
    </>
  );
}
