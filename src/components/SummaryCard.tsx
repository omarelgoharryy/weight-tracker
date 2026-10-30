import { percentToGoal, startingWeight, totalLost } from '../calc/stats';
import { streak } from '../calc/signals';
import { formatChange, formatWeight } from '../lib/units';
import type { AppData, ISODate } from '../types';

export function SummaryCard({ data, today }: { data: AppData; today: ISODate }) {
  const { settings, weights } = data;
  const lost = totalLost(weights);
  if (lost === null) return null;

  const start = startingWeight(weights)!;
  const percent = percentToGoal(weights, settings.goalKg);
  const days = streak(weights, today);

  return (
    <section data-testid="summary" class="summary" aria-label="Your progress">
      {percent !== null && (
        <div class="tape-block">
          <div class="tape" role="img" aria-label={`${Math.round(percent)}% of the way to your goal`}>
            <div class="tape-marker" style={{ left: `${percent}%` }} />
          </div>
          <div class="tape-ends">
            <span>{formatWeight(start, settings.weightUnit)}</span>
            <strong>{Math.round(percent)}% there</strong>
            <span>{formatWeight(settings.goalKg, settings.weightUnit)}</span>
          </div>
        </div>
      )}
      <dl class="stats">
        <div>
          <dt>Change since start</dt>
          <dd>{formatChange(lost, settings.weightUnit)}</dd>
        </div>
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
