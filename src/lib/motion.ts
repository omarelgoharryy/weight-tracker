const SPARK_COLOURS = ['#f2542d', '#ffc12e', '#2fb486', '#3b8be0', '#e0559a'];

export const reducedMotion = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Sparks leave the pressed control and fall away. Saving happens once a day, so it can afford the delight.
export function burst(source: Element, count = 18) {
  if (reducedMotion()) return;
  const box = source.getBoundingClientRect();
  const originX = box.left + box.width / 2;
  const originY = box.top + box.height / 2;
  for (let i = 0; i < count; i++) {
    const spark = document.createElement('i');
    spark.className = 'spark';
    spark.style.left = `${originX + (Math.random() - 0.5) * box.width * 0.6}px`;
    spark.style.top = `${originY}px`;
    spark.style.background = SPARK_COLOURS[i % SPARK_COLOURS.length];
    document.body.append(spark);
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
    const reach = 70 + Math.random() * 110;
    const x = Math.cos(angle) * reach;
    const y = Math.sin(angle) * reach;
    const turn = (Math.random() - 0.5) * 540;
    spark
      .animate(
        [
          { transform: 'translate(0, 0) rotate(0) scale(0.7)', opacity: 1 },
          { transform: `translate(${x}px, ${y}px) rotate(${turn / 2}deg) scale(1)`, opacity: 1, offset: 0.55 },
          { transform: `translate(${x * 1.15}px, ${y + 90}px) rotate(${turn}deg) scale(0.8)`, opacity: 0 },
        ],
        { duration: 700 + Math.random() * 350, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
      )
      .finished.finally(() => spark.remove());
  }
}

export function nudge(element: Element, direction: number) {
  if (reducedMotion()) return;
  element.animate(
    [
      { transform: `translateY(${direction * 8}px)`, opacity: 0.45, filter: 'blur(1.5px)' },
      { transform: 'none', opacity: 1, filter: 'blur(0)' },
    ],
    { duration: 180, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
  );
}

// A row folds away before it is removed, so the list closes the gap instead of jumping.
export async function fold(element: Element | null | undefined) {
  if (!element || reducedMotion()) return;
  const { height } = element.getBoundingClientRect();
  await element.animate(
    [
      { height: `${height}px`, opacity: 1, transform: 'none' },
      { height: '0px', opacity: 0, transform: 'translateX(24px)' },
    ],
    { duration: 220, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'forwards' },
  ).finished;
}
