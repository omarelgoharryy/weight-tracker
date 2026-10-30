import { lostThisWeek, percentToGoal, remainingToGoal, totalLost } from '../calc/stats';
import { streak } from '../calc/signals';
import { trendAt, trendSeries } from '../calc/trend';
import { formatChange, formatWeight, kgToDisplay } from '../lib/units';
import type { AppData, ISODate } from '../types';
import { filterRange } from './chartGeometry';
import { LineChart } from './LineChart';

export function SummaryCard({ data, today, dropKey }: { data: AppData; today: ISODate; dropKey?: string }) {
  const { settings, weights } = data;
  const unit = settings.weightUnit;
  const lost = totalLost(weights);
  if (lost === null) return null;

  const percent = percentToGoal(weights, settings.goalKg);
  const week = lostThisWeek(weights);
  const days = streak(weights, today);
  const level = trendAt(weights, weights[weights.length - 1].date)!;
  const remaining = remainingToGoal(weights, settings.goalKg)!;
  const toDisplay = (date: string, kg: number) => ({ date, value: kgToDisplay(kg, unit) });
  const shown = {
    dots: filterRange(weights.map((e) => toDisplay(e.date, e.kg)), '1m', today),
    line: filterRange(trendSeries(weights).map((p) => toDisplay(p.date, p.value)), '1m', today),
  };

  return (
    <section data-testid="summary" class="summary" aria-label="Your progress">
      {shown.dots.length > 1 ? (
        <LineChart
          {...shown}
          goal={kgToDisplay(settings.goalKg, unit)}
          goalLabel={`Goal ${formatWeight(settings.goalKg, unit)}`}
          label="Daily readings around the seven-day level"
          formatValue={(value) => `${value.toFixed(1)} ${unit}`}
          emptyText=""
          water
          glance
          dropKey={dropKey}
        />
      ) : (
        <p class="hint">Your chart starts with your next weigh-in.</p>
      )}
      <dl class="table">
        <div>
          <dt>Sea level (7-day trend)</dt>
          <dd>{formatWeight(level, unit)}</dd>
        </div>
        <div>
          <dt>This week</dt>
          <dd>{week === null ? '—' : formatChange(week, unit)}</dd>
        </div>
        <div>
          <dt>Change since start</dt>
          <dd>{formatChange(lost, unit)}</dd>
        </div>
        {percent !== null && (
          <div>
            <dt>To goal</dt>
            <dd>
              {formatWeight(remaining, unit)}, {Math.round(percent)}% there
            </dd>
          </div>
        )}
        <div>
          <dt>Logging streak</dt>
          <dd>
            {days} {days === 1 ? 'day' : 'days'}
          </dd>
        </div>
      </dl>
    </section>
  );
}
