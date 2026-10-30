import { useRef, useState } from 'preact/hooks';
import type { Point } from '../calc/trend';
import { formatShortDate } from '../lib/dates';
import { areaPath, computeChart, PADDING, type XY } from './chartGeometry';

const WIDTH = 340;
const HEIGHT = 220;
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
  /** Tints the ground under the line. */
  filled?: boolean;
}

export function LineChart({ dots = [], line = [], goal, goalLabel, label, formatValue, emptyText, compact, filled }: Props) {
  const svg = useRef<SVGSVGElement>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const height = compact ? COMPACT_HEIGHT : HEIGHT;
  const readable = dots.length ? dots : line;

  if (readable.length === 0) return <p class="hint">{emptyText}</p>;

  const chart = computeChart({ dots, line, goal, width: WIDTH, height });
  const tickDecimals = chart.yTicks.every((tick) => tick.value % 1 === 0) ? 0 : 1;
  const marks = dots.length ? chart.dots : chart.line;
  const index = selected !== null && selected < readable.length ? selected : null;

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
    <figure class="chart">
      <svg
        ref={svg}
        role="img"
        aria-label={`${label}, ${readable.length} ${readable.length === 1 ? 'entry' : 'entries'}, latest ${formatValue(latest.value)}`}
        viewBox={`0 0 ${WIDTH} ${height}`}
        onPointerDown={select}
        onPointerMove={select}
      >
        {filled && <path class="area" d={areaPath(chart.line, PADDING.left, WIDTH - PADDING.right, height - PADDING.bottom)} />}
        {chart.yTicks.map((tick) => (
          <g key={tick.y}>
            <line class="grid" x1="40" x2={WIDTH - 12} y1={tick.y} y2={tick.y} />
            <text class="axis" x="34" y={tick.y + 4} text-anchor="end">
              {tick.value.toFixed(tickDecimals)}
            </text>
          </g>
        ))}
        {chart.xLabels.map((tick, i) => (
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
            <line class="goal" x1="40" x2={WIDTH - 12} y1={chart.goalY} y2={chart.goalY} />
            {goalLabel && (
              <text class="goal-label" x="44" y={chart.goalY - 6}>
                {goalLabel}
              </text>
            )}
          </>
        )}
        {index !== null && (
          <line class="crosshair" x1="0" x2="0" y1="12" y2={height - 24} style={{ transform: `translateX(${marks[index].x}px)` }} />
        )}
        <g class="dots">
          {chart.dots.map((p, i) => (
            <circle class="dot" key={i} cx={p.x} cy={p.y} r="2.5" />
          ))}
        </g>
        <path class="trend" pathLength={1} d={toPath(chart.line)} />
        {index !== null && (
          <circle class="picked" r="6" style={{ transform: `translate(${marks[index].x}px, ${marks[index].y}px)` }} />
        )}
      </svg>
      <figcaption class="readout" data-testid="chart-readout" aria-live="polite">
        {index === null
          ? compact
            ? `Latest, ${formatShortDate(latest.date)}: ${formatValue(latest.value)}`
            : 'Tap the graph to see a day.'
          : `${formatShortDate(readable[index].date)}: ${formatValue(readable[index].value)}`}
      </figcaption>
    </figure>
  );
}
