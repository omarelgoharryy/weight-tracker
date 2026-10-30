import { useEffect, useRef, useState } from 'preact/hooks';
import { reducedMotion } from '../lib/motion';

const DURATION = 800;

export function CountUp({ value, from, format }: { value: number; from?: number; format(value: number): string }) {
  const current = useRef(from ?? value);
  const [shown, setShown] = useState(current.current);

  useEffect(() => {
    if (reducedMotion()) {
      current.current = value;
      setShown(value);
      return;
    }
    const start = current.current;
    const startedAt = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const progress = Math.min(1, (now - startedAt) / DURATION);
      current.current = start + (value - start) * (1 - (1 - progress) ** 4);
      setShown(current.current);
      if (progress < 1) frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{format(shown)}</>;
}
