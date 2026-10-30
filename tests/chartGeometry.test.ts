import { computeChart, filterRange } from '../src/components/chartGeometry';

const p = (date: string, value = 0) => ({ date, value });

test('filterRange keeps points inside the window', () => {
  const pts = [p('2026-01-01'), p('2026-10-15')];
  expect(filterRange(pts, '1m', '2026-10-30')).toEqual([pts[1]]);
  expect(filterRange(pts, 'all', '2026-10-30')).toEqual(pts);
});
test('a single point and identical values produce finite coordinates', () => {
  const one = computeChart({ dots: [p('2026-10-30', 90)], width: 300, height: 200 });
  const flat = computeChart({ dots: [p('2026-10-29', 90), p('2026-10-30', 90)], width: 300, height: 200 });
  for (const c of [...one.dots, ...flat.dots]) {
    expect(Number.isFinite(c.x)).toBe(true);
    expect(Number.isFinite(c.y)).toBe(true);
  }
});
test('the y axis extends to include the goal', () => {
  const c = computeChart({ dots: [p('2026-10-30', 90)], goal: 70, width: 300, height: 200 });
  expect(c.goalY).toBeGreaterThanOrEqual(0);
  expect(c.goalY).toBeLessThanOrEqual(200);
});
test('higher values sit higher on the chart and later dates further right', () => {
  const c = computeChart({ dots: [p('2026-10-01', 90), p('2026-10-30', 80)], width: 300, height: 200 });
  expect(c.dots[0].y).toBeLessThan(c.dots[1].y);
  expect(c.dots[0].x).toBeLessThan(c.dots[1].x);
});
test('the line shares the dots scale', () => {
  const c = computeChart({
    dots: [p('2026-10-01', 90), p('2026-10-30', 80)],
    line: [p('2026-10-01', 90)],
    width: 300,
    height: 200,
  });
  expect(c.line[0]).toEqual(c.dots[0]);
});
test('no goal gives no goal line', () => {
  expect(computeChart({ dots: [p('2026-10-30', 90)], width: 300, height: 200 }).goalY).toBeNull();
});
