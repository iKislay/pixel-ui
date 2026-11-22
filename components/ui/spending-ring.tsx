"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type KeyboardEvent } from "react";
import { animate, useMotionValue, useMotionValueEvent, useReducedMotion, type AnimationPlaybackControls } from "motion/react";
import { arcPath, formatCompact, seriesColor } from "@/lib/chart";
import { ChartTable, chartFocus, useChartNav, useDrawIn, type Format } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export type SpendCategory = {
  label: string;
  value: number;
  budget?: number;
  color?: string;
  children?: Omit<SpendCategory, "children">[];
};

export type SpendingRingProps = Omit<ComponentProps<"figure">, "children"> & {
  data: SpendCategory[];
  label: string;
  format?: Format;
  thickness?: number;
  totalLabel?: string;
};

const C = 100;
const TAU = Math.PI * 2;
// space between tiles along the middle of the ring, in chart units
const GAP = 3.5;
// tiles are drawn this much smaller and stroked back out, which rounds every corner
const SOFT = 4;
const LIFT = 4;
const SHADES = [0, 0.12, -0.12, 0.2, -0.2, 0.06];
const clamp = (n: number) => Math.min(Math.max(n, 0), 1);
const sum = (list: { value: number }[]) => list.reduce((a, d) => a + Math.max(d.value, 0), 0);
// black on light fills, white on dark ones, so amounts read in both themes
const inkOn = (fill: string) => `oklch(from ${fill} calc((0.7 - l) * 100) 0 0)`;

type Tile = { key: string; from: number; to: number; color: string; value: number; budget?: number; opacity: number; width: number; text: number };
type Row = { key: string; label: string; value: number; budget?: number; share: number; parent?: string; opens: boolean };

export function SpendingRing({
  data,
  label,
  format = formatCompact,
  thickness = 34,
  totalLabel = "Spent",
  className,
  ...props
}: SpendingRingProps) {
  const hatch = useId().replace(/[^\w-]/g, "");
  const reduce = useReducedMotion();
  const progress = useDrawIn();
  const [open, setOpen] = useState<string | null>(null);
  // the category whose parts are drawn; it stays while it folds back home
  const [unfolded, setUnfolded] = useState<string | null>(null);
  const spring = useMotionValue(0);
  const [p, setP] = useState(0);
  useMotionValueEvent(spring, "change", setP);
  const run = useRef<{ token: number; controls?: AnimationPlaybackControls }>({ token: 0 });

  const total = sum(data);
  const home = data.find((d) => d.label === unfolded);
  const parts = home?.children ?? [];
  const rows: Row[] =
    open && home && open === unfolded
      ? parts.map((c) => ({ key: `${home.label}/${c.label}`, label: c.label, value: c.value, budget: c.budget, share: sum(parts) ? c.value / sum(parts) : 0, parent: home.label, opens: false }))
      : data.map((d) => ({ key: d.label, label: d.label, value: d.value, budget: d.budget, share: total ? d.value / total : 0, opens: !!d.children?.length }));
  const { active, setActive, handlers } = useChartNav(rows.length);

  const go = async (next: string | null) => {
    const token = ++run.current.token;
    run.current.controls?.stop();
    setActive(null);
    setOpen(next);
    const to = (target: number) => {
      if (reduce) return spring.jump(target);
      run.current.controls = animate(spring, target, { type: "spring", stiffness: 140, damping: 22 });
      return run.current.controls;
    };
    // another category has to fold home before the next one can bloom
    if (unfolded && unfolded !== next && spring.get() > 0.01) await to(0);
    if (token !== run.current.token) return;
    setUnfolded(next);
    if (next) await to(1);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (event: globalThis.KeyboardEvent) => event.key === "Escape" && go(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const R = C - thickness / 2 - LIFT - 2;
  const gap = GAP / R;
  const spans = data.map((d) => (total ? (TAU * Math.max(d.value, 0)) / total : 0) * progress);
  const starts = spans.map((_, i) => spans.slice(0, i).reduce((a, s) => a + s, 0));
  const k = data.findIndex((d) => d.label === unfolded);
  const tiles: Tile[] = [];
  const tile = (d: { label: string; value: number; budget?: number }, key: string, color: string, from: number, to: number, rest: Partial<Tile> = {}) =>
    tiles.push({ key, from, to, color, value: d.value, budget: d.budget, opacity: 1, width: thickness, text: 1, ...rest });

  if (k < 0) {
    data.forEach((d, i) => tile(d, d.label, seriesColor(i % 5, d.color), starts[i] + gap / 2, starts[i] + spans[i] - gap / 2));
  } else {
    // the open tile blooms from its middle to the whole ring and squeezes the others out of what is left
    const span = spans[k] + (TAU - spans[k]) * p;
    const from = starts[k] + spans[k] / 2 - span / 2;
    const squeeze = TAU - spans[k] > 0 ? (TAU - span) / (TAU - spans[k]) : 0;
    let at = from + span;
    for (let step = 1; step < data.length; step++) {
      const i = (k + step) % data.length;
      const len = spans[i] * squeeze;
      const g = gap * (1 - p);
      tile(data[i], data[i].label, seriesColor(i % 5, data[i].color), at + g / 2, at + len - g / 2, { opacity: clamp(1 - p * 1.5), width: thickness * (1 - p / 2), text: clamp(1 - p * 3) });
      at += len;
    }
    const parent = seriesColor(k % 5, data[k].color);
    const split = clamp(p / 0.3);
    const whole = sum(parts);
    let c0 = from;
    parts.forEach((c, j) => {
      const len = whole ? (span * Math.max(c.value, 0)) / whole : 0;
      const g = j === 0 || j === parts.length - 1 ? gap : gap * split;
      const shade = c.color ?? `oklch(from ${parent} calc(l + ${SHADES[j % SHADES.length]}) c h)`;
      tile(c, `${data[k].label}/${c.label}`, split >= 1 ? shade : `color-mix(in oklab, ${shade} ${split * 100}%, ${parent})`, c0 + (j === 0 ? gap : g) / 2, c0 + len - (j === parts.length - 1 ? gap : g) / 2, { text: clamp((p - 0.45) / 0.4) });
      c0 += len;
    });
    // the parent covers its parts until they have pulled apart, hiding the seams
    tile(data[k], data[k].label, parent, from + gap / 2, from + span - gap / 2, { opacity: 1 - split, text: 0 });
  }

  const current = active === null ? null : rows[active];
  const opened = open ? data.find((d) => d.label === open) : undefined;
  const note = (value: number, budget: number | undefined, fallback: string) =>
    budget === undefined ? { text: fallback, over: false } : value > budget ? { text: `${format(value - budget)} over budget`, over: true } : { text: `of ${format(budget)} budget`, over: false };
  const centre = current
    ? { label: current.label, value: current.value, ...note(current.value, current.budget, `${Math.round(current.share * 100)}% of ${current.parent ?? "spending"}`) }
    : opened
      ? { label: opened.label, value: opened.value, ...note(opened.value, opened.budget, `${Math.round((total ? opened.value / total : 0) * 100)}% of spending`) }
      : { label: totalLabel, value: total, text: "", over: false };
  const settled = p < 0.02 || p > 0.98;

  const onKeyDown = (event: KeyboardEvent) => {
    if ((event.key === "Enter" || event.key === " ") && current?.opens) {
      event.preventDefault();
      go(current.key);
    } else handlers.onKeyDown(event);
  };

  return (
    <figure data-slot="spending-ring" className={cn("flex flex-col items-center", className)} {...props}>
      <div
        role="group"
        aria-roledescription="chart"
        aria-label={`${opened ? `${opened.label}, by part` : label}. Use the arrow keys to read each category${opened ? ", Escape to go back" : ", Enter to open one"}.`}
        className={cn("relative aspect-square w-full max-w-[260px] rounded-full", chartFocus)}
        {...handlers}
        onKeyDown={onKeyDown}
      >
        <svg viewBox="0 0 200 200" aria-hidden className="size-full overflow-visible">
          <defs>
            <pattern id={hatch} width={5} height={5} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width={5} height={5} className="fill-red-500 dark:fill-red-400" />
              <rect width={2} height={5} fill="rgb(255 255 255 / 0.55)" />
            </pattern>
          </defs>
          {tiles.map((t) => {
            if (t.to - t.from <= (2 * SOFT) / R || t.opacity <= 0.01) return null;
            const index = rows.findIndex((r) => r.key === t.key);
            const lifted = active !== null && index === active;
            const quiet = active !== null && index !== active;
            const mid = (t.from + t.to) / 2;
            const r0 = R - t.width / 2 + SOFT;
            const r1 = R + t.width / 2 - SOFT;
            const s = SOFT / R;
            const over = t.budget !== undefined && t.value > t.budget ? (t.value - t.budget) / t.value : 0;
            const text = format(t.value);
            const fits = (t.to - t.from) * R >= text.length * 5.6 + 12 && t.width > 24;
            return (
              <g
                key={t.key}
                opacity={t.opacity * (quiet ? 0.35 : 1)}
                transform={lifted ? `translate(${(Math.sin(mid) * LIFT).toFixed(2)} ${(-Math.cos(mid) * LIFT).toFixed(2)})` : undefined}
                onPointerEnter={() => settled && index >= 0 && setActive(index)}
                onClick={() => index >= 0 && rows[index].opens && go(t.key)}
                className={cn("transition-[opacity,transform] duration-200 motion-reduce:transition-none", index >= 0 && rows[index].opens && "cursor-pointer")}
              >
                <path d={arcPath(C, C, r1, r0, t.from + s, t.to - s)} style={{ fill: t.color, stroke: t.color }} strokeWidth={SOFT * 2} strokeLinejoin="round" />
                {over > 0 && (
                  <path
                    d={arcPath(C, C, r1, r0, Math.max(t.to - (t.to - t.from) * over, t.from + s), t.to - s)}
                    fill={`url(#${hatch})`}
                    stroke={`url(#${hatch})`}
                    strokeWidth={SOFT * 2}
                    strokeLinejoin="round"
                  />
                )}
                <text
                  x={(C + R * Math.sin(mid)).toFixed(2)}
                  y={(C - R * Math.cos(mid)).toFixed(2)}
                  textAnchor="middle"
                  dominantBaseline="central"
                  opacity={fits ? t.text : 0}
                  style={{ fill: inkOn(t.color) }}
                  className="pointer-events-none select-none font-mono text-[9.5px] font-semibold tabular-nums"
                >
                  {text}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <button
            type="button"
            tabIndex={-1}
            onClick={() => go(null)}
            aria-hidden
            className={cn(
              "mb-1 rounded-full px-2 py-0.5 text-xs font-semibold text-muted-foreground transition-[opacity,translate] duration-200 hover:bg-muted hover:text-foreground motion-reduce:transition-none",
              opened ? "pointer-events-auto opacity-100" : "-translate-y-1 opacity-0",
            )}
          >
            ‹ All
          </button>
          <span className="max-w-[60%] truncate text-xs font-semibold text-muted-foreground">{centre.label}</span>
          <span className="font-mono text-2xl font-medium tabular-nums">{format(centre.value)}</span>
          <span className={cn("h-4 text-xs", centre.over ? "text-red-600 dark:text-red-400" : "text-muted-foreground")}>{centre.text}</span>
        </div>
        <p aria-live="polite" className="sr-only">
          {current ? `${current.label}: ${format(current.value)}, ${centre.text}` : opened ? `${opened.label} open` : ""}
        </p>
      </div>
      <ChartTable
        caption={label}
        columns={["Category", "Spent", "Budget"]}
        rows={data.flatMap((d) => [
          [d.label, format(d.value), d.budget === undefined ? "" : format(d.budget)],
          ...(d.children ?? []).map((c) => [`${d.label}, ${c.label}`, format(c.value), c.budget === undefined ? "" : format(c.budget)]),
        ])}
      />
    </figure>
  );
}
