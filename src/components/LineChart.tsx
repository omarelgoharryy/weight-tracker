import { useRef, useState } from 'preact/hooks';
import type { Point } from '../calc/trend';
import { formatShortDate } from '../lib/dates';
import { computeChart, PADDING, waterPath, type XY } from './chartGeometry';

const WIDTH = 340;
const HEIGHT = 220;
const GLANCE_HEIGHT = 200;
const COMPACT_HEIGHT = 120;

const toPath = (points: XY[]) => points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

interface Props {
  dots?: Point[];
  line?: Point[];
  goal?: number;
  goalLabel?: string;
  label: string;
  formatValue(value: number): string;
  emptyText: string;
  compact?: boolean;
  /** Tide mode: deep water under the line, with the readings swinging across it. */
  water?: boolean;
  /** A glance at the chart with no reading to tap: the latest reading is marked instead. */
  glance?: boolean;
  /** Changes when a reading is saved, which replays the ripple on the latest reading. */
  dropKey?: string;
}

export function LineChart({ dots = [], line = [], goal, goalLabel, label, formatValue, emptyText, compact, water, glance, dropKey }: Props) {
  const svg = useRef<SVGSVGElement>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const height = glance ? GLANCE_HEIGHT : compact ? COMPACT_HEIGHT : HEIGHT;
  const readable = dots.length ? dots : line;

  if (readable.length === 0) return <p class="hint">{emptyText}</p>;

  const chart = computeChart({ dots, line, goal, width: WIDTH, height, glance });
  const tickDecimals = chart.yTicks.every((tick) => tick.value % 1 === 0) ? 0 : 1;
  const marks = dots.length ? chart.dots : chart.line;
  const index = selected !== null && selected < readable.length ? selected : null;
  const latestMark = marks[marks.length - 1];

  function select(event: PointerEvent) {
    if (event.type === 'pointermove' && event.buttons === 0) return;
    const box = svg.current!.getBoundingClientRect();
    const x = ((event.clientX - box.left) / box.width) * WIDTH;
    let nearest = 0;
    marks.forEach((mark, i) => {
      if (Math.abs(mark.x - x) < Math.abs(marks[nearest].x - x)) nearest = i;
    });
    setSelected(nearest);
  }

  const latest = readable[readable.length - 1];
  return (
    <figure class={glance ? 'chart bleed' : 'chart'}>
      <svg
        ref={svg}
        role="img"
        aria-label={`${label}, ${readable.length} ${readable.length === 1 ? 'entry' : 'entries'}, latest ${formatValue(latest.value)}`}
        viewBox={`0 0 ${WIDTH} ${height}`}
        onPointerDown={glance ? undefined : select}
        onPointerMove={glance ? undefined : select}
      >
        {water && (
          <path
            class="water"
            d={
              glance
                ? waterPath(chart.line, 0, WIDTH, height)
                : waterPath(chart.line, PADDING.left, WIDTH - PADDING.right, height - PADDING.bottom)
            }
          />
        )}
        {!glance &&
          chart.yTicks.map((tick) => (
            <g key={tick.y}>
              <line class="grid" x1="40" x2={WIDTH - 12} y1={tick.y} y2={tick.y} />
              <text class="axis" x="34" y={tick.y + 4} text-anchor="end">
                {tick.value.toFixed(tickDecimals)}
              </text>
            </g>
          ))}
        {!glance &&
          chart.xLabels.map((tick, i) => (
            <text
              class="axis"
              key={tick.date}
              x={tick.x}
              y={height - 6}
              text-anchor={
                chart.xLabels.length === 1 ? 'middle' : i === 0 ? 'start' : i === chart.xLabels.length - 1 ? 'end' : 'middle'
              }
            >
              {formatShortDate(tick.date)}
            </text>
          ))}
        {chart.goalY !== null && (
          <>
            <line class="goal" x1={glance ? 0 : 40} x2={glance ? WIDTH : WIDTH - 12} y1={chart.goalY} y2={chart.goalY} />
            {goalLabel && (
              <text class="goal-label" x={glance ? 20 : 44} y={chart.goalY - 6}>
                {goalLabel}
              </text>
            )}
          </>
        )}
        {index !== null && <line class="crosshair" x1={marks[index].x} x2={marks[index].x} y1="12" y2={height - 24} />}
        {water && <path class="tide" d={toPath(chart.dots)} />}
        {!glance && chart.dots.map((p, i) => <circle class="dot" key={i} cx={p.x} cy={p.y} r="2.5" />)}
        <path class="trend" d={toPath(chart.line)} />
        {index !== null && <circle class="picked" cx={marks[index].x} cy={marks[index].y} r="5" />}
        {glance && (
          <g key={dropKey}>
            <circle class={dropKey ? 'ripple ripple-new' : 'ripple'} cx={latestMark.x} cy={latestMark.y} r="6" />
            <circle class={dropKey ? 'reading reading-new' : 'reading'} cx={latestMark.x} cy={latestMark.y} r="5" />
          </g>
        )}
      </svg>
      {!glance && (
        <figcaption class="readout" data-testid="chart-readout" aria-live="polite">
          {index === null
            ? !compact && 'Tap the graph to see a day.'
            : `${formatShortDate(readable[index].date)}: ${formatValue(readable[index].value)}`}
        </figcaption>
      )}
    </figure>
  );
}
