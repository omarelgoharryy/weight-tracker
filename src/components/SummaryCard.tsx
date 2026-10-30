import { lostThisWeek, percentToGoal, remainingToGoal, totalLost } from '../calc/stats';
import { streak } from '../calc/signals';
import { trendAt } from '../calc/trend';
import { formatChange, formatWeight } from '../lib/units';
import type { AppData, ISODate } from '../types';
import { CountUp } from './CountUp';
import { WeekBars } from './WeekBars';

export function SummaryCard({ data, today, savedKey }: { data: AppData; today: ISODate; savedKey?: string }) {
  const { settings, weights } = data;
  const unit = settings.weightUnit;
  const lost = totalLost(weights);
  if (lost === null) return null;

  const percent = percentToGoal(weights, settings.goalKg);
  const days = streak(weights, today);
  const level = trendAt(weights, weights[weights.length - 1].date)!;
  const remaining = remainingToGoal(weights, settings.goalKg)!;

  return (
    <section data-testid="summary" class="stack" aria-label="Your progress">
      <WeekBars data={data} today={today} week={lostThisWeek(weights)} savedKey={savedKey} />
      <div class="card">
        <h2 class="goal-head">Going to {formatWeight(settings.goalKg, unit)}</h2>
        {percent !== null && (
          <>
            <div
              class="track"
              role="progressbar"
              aria-label="Progress to your goal"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(percent)}
            >
              <i style={{ '--p': `${Math.min(100, percent)}%` }} />
            </div>
            <p class="track-ends">
              <span>
                <CountUp value={percent} from={0} format={(value) => `${Math.round(value)}% there`} />
              </span>
              <span>{formatWeight(remaining, unit)} to go</span>
            </p>
          </>
        )}
        <dl class="table">
          <div>
            <dt>7-day trend</dt>
            <dd>
              <CountUp value={level} format={(kg) => formatWeight(kg, unit)} />
            </dd>
          </div>
          <div>
            <dt>Change since start</dt>
            <dd>{formatChange(lost, unit)}</dd>
          </div>
          <div>
            <dt>Logging streak</dt>
            <dd>
              {days} {days === 1 ? 'day' : 'days'}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
