export type Point = [x: number, y: number];

export const CHART_COLORS = [
  "var(--chart-1, #4785ff)",
  "var(--chart-2, #2ba597)",
  "var(--chart-3, #e59a2f)",
  "var(--chart-4, #de5f86)",
  "var(--chart-5, #8b6cf0)",
];

// hues are assigned by series position and never cycled; a sixth series reuses gray
export const seriesColor = (index: number, color?: string) =>
  color ?? CHART_COLORS[index] ?? "var(--muted-foreground)";

export function niceTicks(min: number, max: number, count = 4): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0];
  if (min === max) {
    if (min === 0) return [0, 1];
    min = Math.min(0, min);
    max = Math.max(0, max);
  }
  const rough = (max - min) / Math.max(count, 1);
  const power = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * power).find((s) => s >= rough)!;
  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= end + step / 2; v += step) ticks.push(+v.toPrecision(12));
  return ticks;
}

export function scaleLinear([d0, d1]: [number, number], [r0, r1]: [number, number]) {
  const span = d1 - d0 || 1;
  return (value: number) => r0 + ((value - d0) / span) * (r1 - r0);
}

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

export const formatCompact = (value: number) => compact.format(value);

const round = (n: number) => +n.toFixed(2);

export function linePath(points: Point[]): string {
  return points.map(([x, y], i) => `${i ? "L" : "M"}${round(x)},${round(y)}`).join("");
}

// a closed polygon whose corners are eased into curves, the corner cut never past half an edge
export function roundedPolygon(points: Point[], radius: number): string {
  const n = points.length;
  if (n < 3) return linePath(points);
  const toward = ([x0, y0]: Point, [x1, y1]: Point, distance: number): Point => {
    const length = Math.hypot(x1 - x0, y1 - y0) || 1;
    const t = Math.min(distance / length, 0.5);
    return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t];
  };
  const corners = points.map((p, i) => {
    const before = toward(p, points[(i - 1 + n) % n], radius);
    const after = toward(p, points[(i + 1) % n], radius);
    return { before, p, after };
  });
  const [sx, sy] = corners[0].after;
  let d = `M${round(sx)},${round(sy)}`;
  for (let i = 1; i <= n; i++) {
    const { before, p, after } = corners[i % n];
    d += `L${round(before[0])},${round(before[1])}Q${round(p[0])},${round(p[1])} ${round(after[0])},${round(after[1])}`;
  }
  return `${d}Z`;
}

// monotone cubic (fritsch-carlson) so the curve never overshoots a data point
export function smoothPath(points: Point[]): string {
  const n = points.length;
  if (n < 3) return linePath(points);
  const dx = points.slice(1).map(([x], i) => x - points[i][0]);
  const slope = points.slice(1).map(([, y], i) => (y - points[i][1]) / (dx[i] || 1));
  const tangent = points.map((_, i) => {
    if (i === 0) return slope[0];
    if (i === n - 1) return slope[n - 2];
    const a = slope[i - 1];
    const b = slope[i];
    return a * b <= 0 ? 0 : (3 * (dx[i - 1] + dx[i])) / ((2 * dx[i] + dx[i - 1]) / a + (dx[i] + 2 * dx[i - 1]) / b);
  });
  let d = `M${round(points[0][0])},${round(points[0][1])}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const h = dx[i] / 3;
    d += `C${round(x0 + h)},${round(y0 + h * tangent[i])} ${round(x1 - h)},${round(y1 - h * tangent[i + 1])} ${round(x1)},${round(y1)}`;
  }
  return d;
}

// splits whole cells by share so the counts always add up to the total (largest remainder)
export function allocate(values: number[], cells: number): number[] {
  const sum = values.reduce((a, v) => a + Math.max(v, 0), 0);
  if (sum === 0) return values.map(() => 0);
  const exact = values.map((v) => (Math.max(v, 0) / sum) * cells);
  const counts = exact.map(Math.floor);
  const order = exact.map((e, i) => [e - counts[i], i]).sort((a, b) => b[0] - a[0]);
  const left = cells - counts.reduce((a, c) => a + c, 0);
  for (let k = 0; k < left; k++) counts[order[k][1]]++;
  return counts;
}

export type CalendarCell = { date: string; value: number; week: number; day: number };

const DAY = 86_400_000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// lays iso dates out in week columns starting on monday, with a month label where each month begins
export function calendarCells(data: { date: string; value: number }[]) {
  const days = data
    .map((d) => ({ ...d, time: Date.parse(`${d.date.slice(0, 10)}T00:00:00Z`) }))
    .filter((d) => Number.isFinite(d.time))
    .sort((a, b) => a.time - b.time);
  if (days.length === 0) return { weeks: 0, cells: [] as CalendarCell[], months: [] as { week: number; label: string }[] };
  const first = days[0].time;
  const monday = first - ((new Date(first).getUTCDay() + 6) % 7) * DAY;
  const cells = days.map((d) => {
    const offset = Math.round((d.time - monday) / DAY);
    return { date: d.date.slice(0, 10), value: d.value, week: Math.floor(offset / 7), day: offset % 7 };
  });
  const months: { week: number; label: string }[] = [];
  for (const cell of cells) {
    const month = MONTHS[Number(cell.date.slice(5, 7)) - 1];
    if (months.at(-1)?.label === month || (cell.date.slice(8) !== "01" && months.length > 0)) continue;
    // a partial first month too close to the next label gives way to it
    if (months.length === 1 && months[0].week > cell.week - 3) months.pop();
    months.push({ week: cell.week, label: month });
  }
  return { weeks: cells.at(-1)!.week + 1, cells, months };
}

// a bar from the baseline to its value end, rounding only the value end
export function barPath(x: number, base: number, width: number, end: number, radius: number): string {
  const height = Math.abs(base - end);
  if (height === 0 || width <= 0) return "";
  const r = Math.min(radius, width / 2, height);
  const dir = end < base ? 1 : -1;
  const xr = x + width;
  return [
    `M${round(x)},${round(base)}`,
    `L${round(x)},${round(end + dir * r)}`,
    `Q${round(x)},${round(end)} ${round(x + r)},${round(end)}`,
    `L${round(xr - r)},${round(end)}`,
    `Q${round(xr)},${round(end)} ${round(xr)},${round(end + dir * r)}`,
    `L${round(xr)},${round(base)}Z`,
  ].join("");
}

const polar =(cx: number, cy: number, r: number, angle: number): Point => [
  cx + r * Math.sin(angle),
  cy - r * Math.cos(angle),
];

// an open arc along one radius, for stroking with round caps
export function arcLine(cx: number, cy: number, r: number, start: number, end: number): string {
  const sweep = Math.min(end - start, Math.PI * 2 - 1e-4);
  if (sweep <= 0) return "";
  const [x0, y0] = polar(cx, cy, r, start);
  const [x1, y1] = polar(cx, cy, r, start + sweep);
  return `M${round(x0)},${round(y0)}A${r},${r} 0 ${sweep > Math.PI ? 1 : 0} 1 ${round(x1)},${round(y1)}`;
}

// angles in radians, clockwise from twelve o'clock
export function arcPath(cx: number, cy: number, outer: number, inner: number, start: number, end: number): string {
  const sweep = Math.min(end - start, Math.PI * 2 - 1e-4);
  const stop = start + sweep;
  const large = sweep > Math.PI ? 1 : 0;
  const [ox0, oy0] = polar(cx, cy, outer, start);
  const [ox1, oy1] = polar(cx, cy, outer, stop);
  const [ix1, iy1] = polar(cx, cy, inner, stop);
  const [ix0, iy0] = polar(cx, cy, inner, start);
  return [
    `M${round(ox0)},${round(oy0)}`,
    `A${outer},${outer} 0 ${large} 1 ${round(ox1)},${round(oy1)}`,
    inner > 0 ? `L${round(ix1)},${round(iy1)}A${inner},${inner} 0 ${large} 0 ${round(ix0)},${round(iy0)}` : `L${cx},${cy}`,
    "Z",
  ].join("");
}
