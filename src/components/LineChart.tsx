import { useRef, useState } from 'preact/hooks';
import type { Point } from '../calc/trend';
import { formatShortDate } from '../lib/dates';
import { computeChart } from './chartGeometry';

const WIDTH = 340;
const HEIGHT = 220;
const COMPACT_HEIGHT = 120;

interface Props {
  dots?: Point[];
  line?: Point[];
  goal?: number;
  label: string;
  formatValue(value: number): string;
  emptyText: string;
  compact?: boolean;
}

export function LineChart({ dots = [], line = [], goal, label, formatValue, emptyText, compact }: Props) {
  const svg = useRef<SVGSVGElement>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const height = compact ? COMPACT_HEIGHT : HEIGHT;
  const readable = dots.length ? dots : line;

  if (readable.length === 0) return <p class="hint">{emptyText}</p>;

  const chart = computeChart({ dots, line, goal, width: WIDTH, height });
  const marks = dots.length ? chart.dots : chart.line;
  const path = chart.line.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
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
        {chart.yTicks.map((tick) => (
          <g key={tick.y}>
            <line class="grid" x1="40" x2={WIDTH - 12} y1={tick.y} y2={tick.y} />
            <text class="axis" x="34" y={tick.y + 4} text-anchor="end">
              {tick.value.toFixed(1)}
            </text>
          </g>
        ))}
        {chart.xLabels.map((tick, i) => (
          <text
            class="axis"
            key={tick.date}
            x={tick.x}
            y={height - 6}
            text-anchor={chart.xLabels.length === 1 ? 'middle' : i === 0 ? 'start' : 'end'}
          >
            {formatShortDate(tick.date)}
          </text>
        ))}
        {chart.goalY !== null && <line class="goal" x1="40" x2={WIDTH - 12} y1={chart.goalY} y2={chart.goalY} />}
        {index !== null && (
          <line class="crosshair" x1={marks[index].x} x2={marks[index].x} y1="12" y2={height - 24} />
        )}
        {chart.dots.map((p, i) => (
          <circle class="dot" key={i} cx={p.x} cy={p.y} r="3" />
        ))}
        {path && <path class="trend" d={path} />}
        {index !== null && <circle class="picked" cx={marks[index].x} cy={marks[index].y} r="5" />}
      </svg>
      <figcaption class="readout" data-testid="chart-readout" aria-live="polite">
        {index === null
          ? 'Tap the graph to see a day.'
          : `${formatShortDate(readable[index].date)}: ${formatValue(readable[index].value)}`}
      </figcaption>
    </figure>
  );
}
