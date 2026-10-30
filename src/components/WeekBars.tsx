import { useState } from 'preact/hooks';
import { addDays, formatDayLetter, formatDayName, formatDate } from '../lib/dates';
import { formatChange, formatWeight } from '../lib/units';
import type { AppData, ISODate } from '../types';

const DAYS = 7;
const SHORTEST = 28;

// Heights show the week's shape, so the lightest day is short and the heaviest fills the row.
const heightOf = (kg: number, low: number, high: number) =>
  high === low ? 60 : SHORTEST + ((kg - low) / (high - low)) * (100 - SHORTEST);

interface Props {
  data: AppData;
  today: ISODate;
  week: number | null;
  savedKey?: string;
}

export function WeekBars({ data, today, week, savedKey }: Props) {
  const { settings, weights } = data;
  const unit = settings.weightUnit;
  const days = Array.from({ length: DAYS }, (_, i) => {
    const date = addDays(today, i - (DAYS - 1));
    return { date, entry: weights.find((e) => e.date === date) };
  });
  const logged = days.flatMap(({ entry }) => (entry ? [entry] : []));
  const low = Math.min(...logged.map((e) => e.kg));
  const high = Math.max(...logged.map((e) => e.kg));
  const latest = logged.at(-1)?.date;
  const [picked, setPicked] = useState<ISODate>();
  const selected = logged.find((e) => e.date === picked) ?? logged.at(-1);

  return (
    <div class="card">
      <div class="week-head">
        <h2>This week{week !== null && `, ${formatChange(week, unit)}`}</h2>
        {selected && (
          <p class="week-day" aria-live="polite">
            {formatDayName(selected.date)} <strong>{formatWeight(selected.kg, unit)}</strong>
          </p>
        )}
      </div>
      <div class="bars">
        {days.map(({ date, entry }, index) =>
          entry ? (
            <button
              key={date}
              class="bar"
              type="button"
              aria-pressed={selected?.date === date}
              aria-label={`${formatDate(date)}, ${formatWeight(entry.kg, unit)}`}
              onClick={() => setPicked(date)}
            >
              <span
                key={date === latest ? savedKey : undefined}
                class={date === latest && savedKey ? 'bar-fill lifted' : 'bar-fill'}
                style={{ '--h': `${heightOf(entry.kg, low, high)}%`, '--d': index }}
              />
              {formatDayLetter(date)}
            </button>
          ) : (
            <div key={date} class={date === today ? 'bar-gap is-today' : 'bar-gap'}>
              <span class="bar-stub" />
              {formatDayLetter(date)}
            </div>
          ),
        )}
      </div>
    </div>
  );
}
