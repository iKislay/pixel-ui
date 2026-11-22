"use client";

import { useEffect, useMemo, useRef, useState, type ComponentProps, type KeyboardEvent } from "react";
import { useReducedMotion } from "motion/react";
import { formatCompact, lensEdges } from "@/lib/chart";
import { ChartTable, chartFocus, useChartWidth, type Format, EffectDefs, type ChartEffect } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export type LensBarsProps = Omit<ComponentProps<"figure">, "children"> & {
  data: { date: string; value: number }[];
  label: string;
  height?: number;
  format?: Format;
  color?: string;
  effect?: ChartEffect;
};

const LENS = 16;
const TOP = 40;
const TICKS = 22;

const clamp01 = (t: number) => Math.min(Math.max(t, 0), 1);
const easeOut = (t: number) => 1 - (1 - t) ** 3;
// share of a one device pixel tent filter left of x, so squeezed bars blend into columns instead of flickering
const tent = (x: number) => (x <= -1 ? 0 : x >= 1 ? 1 : x <= 0 ? (x + 1) ** 2 / 2 : 1 - (1 - x) ** 2 / 2);

const pretty = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
const month = (date: string) => new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });

export function LensBars({ data, label, height = 200, format = formatCompact, color = "var(--brand)", effect, className, ...props }: LensBarsProps) {
  const [ref, width] = useChartWidth<HTMLDivElement>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const probeRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const stemRef = useRef<HTMLDivElement>(null);
  const ticksRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion() ?? false;
  const [active, setActive] = useState<number | null>(null);
  const [shown, setShown] = useState<number | null>(null);
  const n = data.length;
  const top = useMemo(() => Math.max(0, ...data.map((d) => d.value)) || 1, [data]);
  const ticks = useMemo(() => data.flatMap((d, i) => (d.date.slice(8, 10) === "01" ? [{ i, label: month(d.date) }] : [])), [data]);
  const table = useMemo(
    () => <ChartTable caption={label} columns={["Date", label]} rows={data.map((d) => [pretty(d.date), format(d.value)])} />,
    [data, label, format],
  );

  // pointer moves only touch this ref and the frame loop, never a react render
  const engine = useRef({ focus: 0, target: 0, open: 0, aim: 0, active: null as number | null, born: 0, last: 0, frame: 0, kick: () => {} });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const probe = probeRef.current;
    const tip = tipRef.current;
    const stem = stemRef.current;
    const labels = ticksRef.current?.children;
    if (!canvas || !ctx || !probe || !tip || !stem || !labels || !width || !n) return;
    const e = engine.current;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const cols = Math.ceil(width * dpr);
    const colH = new Float32Array(cols);
    const colA = new Float32Array(cols);
    const colCov = new Float32Array(cols);
    const slot = width / n;
    const plot = height - TOP;
    let fill = getComputedStyle(probe).color;
    if (!e.born) e.born = performance.now();

    const draw = (now: number) => {
      e.frame = 0;
      const dt = e.last ? Math.min(now - e.last, 64) : 16;
      e.last = now;
      e.focus += (e.target - e.focus) * (reduce ? 1 : 1 - Math.exp(-dt / 40));
      e.open += (e.aim - e.open) * (reduce ? 1 : 1 - Math.exp(-dt / 90));
      const age = reduce ? Infinity : now - e.born;
      let busy = age < 1100;
      if (Math.abs(e.target - e.focus) > 0.05 || Math.abs(e.aim - e.open) > 0.002) busy = true;
      else Object.assign(e, { focus: e.target, open: e.aim });

      const tipW = tip.offsetWidth;
      const { edges, near } = lensEdges(n, width, e.focus, e.open, Math.max(1, LENS / slot));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = fill;
      colH.fill(0);
      colA.fill(0);
      colCov.fill(0);
      let tipTop = height;

      for (let i = 0; i < n; i++) {
        const grow = easeOut(clamp01((age - (i / n) * 500) / 600));
        const h = (Math.max(0, data[i].value) / top) * plot * grow;
        const alpha = 1 - 0.6 * e.open * (1 - near[i]);
        if (i === e.active) tipTop = height - (Math.max(0, data[i].value) / top) * plot;
        const x0 = edges[i];
        const span = edges[i + 1] - x0;
        if (span < 3) {
          const a = x0 * dpr;
          const b = a + span * dpr;
          const end = Math.min(cols - 1, Math.ceil(b + 1));
          for (let c = Math.max(0, Math.floor(a - 1)); c <= end; c++) {
            const cover = tent(b - c - 0.5) - tent(a - c - 0.5);
            if (cover <= 0) continue;
            colH[c] += h * cover;
            colA[c] += alpha * cover;
            colCov[c] += cover;
          }
          continue;
        }
        if (h <= 0) continue;
        // the gap opens from nothing as a bar leaves the squeeze, so no bar pops
        const gap = Math.min(2, (span - 3) * 0.3);
        const w = span - gap;
        const r = Math.min(3, w / 2, h);
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.roundRect(x0 + gap / 2, height - h, w, h, [r, r, 0, 0]);
        ctx.fill();
      }
      for (let c = 0; c < cols; c++) {
        const cov = colCov[c];
        if (cov < 0.01) continue;
        const h = colH[c] / cov;
        if (h <= 0) continue;
        ctx.globalAlpha = (colA[c] / cov) * Math.min(1, cov);
        ctx.fillRect(c / dpr, height - h, 1 / dpr, h);
      }
      ctx.globalAlpha = 1;

      if (e.active !== null) {
        const cx = (edges[e.active] + edges[e.active + 1]) / 2;
        const x = Math.min(Math.max(cx - tipW / 2, 0), width - tipW);
        tip.style.transform = `translate3d(${x}px,0,0)`;
        stem.style.transform = `translate3d(${cx - 0.5}px,32px,0) scaleY(${Math.max(0, tipTop - 36)})`;
      }
      tip.style.opacity = String(e.open);
      stem.style.opacity = String(e.open);

      let prev = -Infinity;
      ticks.forEach(({ i }, t) => {
        const x = Math.min(Math.max((edges[i] + edges[i + 1]) / 2, 12), width - 12);
        const el = labels[t] as HTMLElement;
        el.style.transform = `translate3d(${x}px,0,0) translateX(-50%)`;
        // labels crowded onto a neighbour by the squeeze fade out instead of overlapping
        el.style.opacity = String(clamp01((x - prev - 26) / 12));
        prev = x;
      });

      if (busy) e.frame = requestAnimationFrame(draw);
      else e.last = 0;
    };

    e.kick = () => {
      if (!e.frame) e.frame = requestAnimationFrame(draw);
    };
    const theme = new MutationObserver(() => {
      fill = getComputedStyle(probe).color;
      e.kick();
    });
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme"] });
    draw(performance.now());
    return () => {
      theme.disconnect();
      cancelAnimationFrame(e.frame);
      e.frame = 0;
      e.last = 0;
    };
  }, [data, top, ticks, width, height, reduce, color, n]);

  const aim = (index: number | null, x = 0) => {
    const e = engine.current;
    if (index === null) e.aim = 0;
    else {
      // a lens opening from shut starts where it is aimed instead of sliding in from the last spot
      if (e.open < 0.05) e.focus = x;
      e.target = x;
      e.aim = 1;
      e.active = index;
      setShown(index);
    }
    setActive(index);
    e.kick();
  };

  const aimAt = (clientX: number) => {
    const box = ref.current?.getBoundingClientRect();
    if (!box || !n) return;
    const x = Math.min(Math.max(clientX - box.left, 0), box.width - 0.01);
    aim(Math.floor((x / box.width) * n), x);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (!n) return;
    if (event.key === "Escape") return aim(null);
    const from = active ?? n - 1;
    const step = event.shiftKey ? 7 : 1;
    const next = { ArrowLeft: from - step, ArrowRight: from + step, Home: 0, End: n - 1 }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const i = Math.min(Math.max(active === null ? from : next, 0), n - 1);
    aim(i, (i + 0.5) * (width / n));
  };

  const day = shown === null ? null : data[shown];

  return (
    <figure data-slot="lens-bars" className={cn("flex w-full flex-col gap-3", className)} {...props}>
      <div
        ref={ref}
        role="group"
        tabIndex={0}
        aria-roledescription="chart"
        aria-label={`${label}, ${n} days. Use the arrow keys to read each day, Shift to move a week.`}
        className={cn("relative w-full cursor-crosshair touch-pan-y select-none", chartFocus)}
        style={{ height: height + TICKS }}
        onPointerMove={(event) => {
          if (event.pointerType !== "touch" || event.buttons) aimAt(event.clientX);
        }}
        onPointerDown={(event) => aimAt(event.clientX)}
        onPointerLeave={() => aim(null)}
        onBlur={() => aim(null)}
        onKeyDown={onKeyDown}
      >
        <span ref={probeRef} aria-hidden className="hidden" style={{ color }} />
        <EffectDefs effect={effect} />
        <canvas ref={canvasRef} aria-hidden className="block w-full" style={{ height, filter: effect?.filter }} />
        <div aria-hidden className="absolute inset-x-0 border-t border-border" style={{ top: height }} />
        <div ref={ticksRef} aria-hidden className="absolute inset-x-0 overflow-hidden" style={{ top: height + 4, height: TICKS - 4 }}>
          {ticks.map((t) => (
            <span key={t.i} className="absolute left-0 top-0 whitespace-nowrap text-[11px] font-medium text-muted-foreground">
              {t.label}
            </span>
          ))}
        </div>
        <div ref={stemRef} aria-hidden className="pointer-events-none absolute left-0 top-0 h-px w-px origin-top bg-foreground/30" style={{ opacity: 0 }} />
        <div
          ref={tipRef}
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 z-10 flex h-7 items-center gap-2 whitespace-nowrap rounded-full border border-foreground/[0.06] bg-background/90 px-3 text-xs shadow-lg backdrop-blur-md"
          style={{ opacity: 0 }}
        >
          <span className="size-2 rounded-full" style={{ background: color }} />
          <span className="font-medium text-muted-foreground">{day ? pretty(day.date) : ""}</span>
          <span className="font-mono font-medium tabular-nums text-foreground">{day ? format(day.value) : ""}</span>
        </div>
      </div>
      {table}
    </figure>
  );
}
