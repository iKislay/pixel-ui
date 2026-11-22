"use client";

import { useEffect, useImperativeHandle, useRef, useState, type ComponentProps, type Ref } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export type TickTapeEvent = {
  value: number;
  error?: boolean;
  label?: string;
  time?: number;
};

export type TickTapeHandle = {
  push: (event: TickTapeEvent | TickTapeEvent[]) => void;
  clear: () => void;
};

export type TickTapeProps = Omit<ComponentProps<"div">, "children" | "ref"> & {
  ref?: Ref<TickTapeHandle>;
  label: string;
  seconds?: number;
  height?: number;
  format?: (value: number) => string;
  color?: string;
};

type Tick = { t: number; v: number; err: boolean; label?: string };

const WINDOW = 30_000;
const CATCH_UP = 2.2;
const RISE = 220;
const BAR = 3;
const HEAD = 10;
const FADE = 0.16;

const ms = (value: number) => `${Math.round(value).toLocaleString("en-US")} ms`;

// steps of 1, 2, 4, 5 keep the halfway gridline a round number too
function niceMax(value: number) {
  if (value <= 0) return 1;
  const step = 10 ** Math.floor(Math.log10(value));
  for (const m of [1, 2, 4, 5, 10]) if (m * step >= value) return m * step;
  return 10 * step;
}

export function TickTape({
  ref,
  label,
  seconds = 12,
  height = 140,
  format = ms,
  color = "var(--brand)",
  className,
  ...props
}: TickTapeProps) {
  const reduce = useReducedMotion() ?? false;
  const [paused, setPaused] = useState(false);
  const [stats, setStats] = useState({ rate: 0, p95: 0, errors: 0 });
  const [picked, setPicked] = useState<{ tick: Tick; age: number } | null>(null);
  const [top, setTop] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const accentRef = useRef<HTMLSpanElement>(null);
  const errorRef = useRef<HTMLSpanElement>(null);
  const inkRef = useRef<HTMLSpanElement>(null);
  const tagRef = useRef<HTMLDivElement>(null);
  const p95Ref = useRef<HTMLSpanElement>(null);
  const engine = useRef({
    ticks: [] as Tick[],
    span: seconds * 1000,
    reduce: false,
    paused: false,
    pointer: null as number | null,
    lag: 0,
    frozen: null as number | null,
    picked: null as Tick | null,
    p95: 0,
    top: 0,
    scale: 0,
    dpr: 1,
    last: 0,
    step: 0,
    frame: 0,
    visible: false,
    accent: "#888",
    error: "#ef4444",
    ink: "#888",
    paint: (now: number) => void now,
    wake: () => {},
  });

  useEffect(() => {
    const e = engine.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    e.paint = (now) => {
      const W = canvas.clientWidth;
      const H = canvas.clientHeight;
      if (!W || !H) return;
      const dt = e.last ? Math.min(now - e.last, 100) : 0;
      e.last = now;

      // held or paused, the tape's clock stops; on release it catches up at an even pace instead of jumping
      const held = e.pointer !== null || e.paused;
      if (held) e.frozen ??= Date.now() - e.lag;
      else {
        if (e.frozen !== null) e.lag = Date.now() - e.frozen;
        e.frozen = null;
        e.lag = Math.max(0, e.lag - dt * (CATCH_UP - 1));
      }
      const view = e.frozen ?? Date.now() - e.lag;
      const span = e.span;
      const plot = H - HEAD;

      let peak = 0;
      for (const k of e.ticks) if (k.t > view - span && k.t <= view && k.v > peak) peak = k.v;
      const target = niceMax(peak * 1.1);
      if (target !== e.top) {
        e.top = target;
        setTop(target);
      }
      e.scale = e.scale ? e.scale + (target - e.scale) * Math.min(1, dt / RISE) : target;
      const yOf = (v: number) => H - (Math.min(v, e.scale) / e.scale) * plot;

      let near: Tick | null = null;
      let nearX = 0;
      if (e.pointer !== null) {
        let best = 10;
        for (const k of e.ticks) {
          const x = W - ((view - k.t) / span) * W;
          const d = Math.abs(x - e.pointer);
          if (k.t <= view && d < best) [best, near, nearX] = [d, k, x];
        }
      }

      ctx.setTransform(e.dpr, 0, 0, e.dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const px = (x: number) => Math.round(x * e.dpr) / e.dpr;

      ctx.fillStyle = e.ink;
      for (const f of [0.5, 1]) {
        ctx.globalAlpha = 0.07;
        ctx.fillRect(0, px(H - (f * target * plot) / e.scale), W, 1);
      }

      for (const k of e.ticks) {
        const age = view - k.t;
        if (age < 0 || age > span + 1000) continue;
        const x = px(W - (age / span) * W - BAR / 2);
        const rise = e.reduce ? 1 : 1 - (1 - Math.min(1, age / RISE)) ** 3;
        const h = Math.max(BAR, (H - yOf(k.v)) * rise);
        const glow = k.err ? 0.55 + 0.45 * Math.exp(-age / 6000) : 0.4 + 0.6 * Math.exp(-age / 3000);
        const fill = k.err ? e.error : e.accent;
        const alpha = near ? (k === near ? 1 : glow * 0.35) : glow;
        // a solid base plus a top-weighted gradient, so tall bars read brightest at their tips
        const shade = ctx.createLinearGradient(0, H - h, 0, H);
        shade.addColorStop(0, fill);
        shade.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.roundRect(x, H - h, BAR, h, [BAR / 2, BAR / 2, 0, 0]);
        ctx.globalAlpha = alpha * 0.5;
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.globalAlpha = alpha * 0.5;
        ctx.fillStyle = shade;
        ctx.fill();
        if (!e.reduce && age < 600) {
          ctx.globalAlpha = (1 - age / 600) * 0.35;
          ctx.fillStyle = fill;
          ctx.beginPath();
          ctx.arc(x + BAR / 2, H - h, 3 + (age / 600) * 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const p95y = yOf(e.p95);
      if (e.p95 > 0) {
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = e.ink;
        for (let x = 0; x < W - 28; x += 6) ctx.fillRect(x, px(p95y), 2, 1);
      }
      if (p95Ref.current) {
        p95Ref.current.style.opacity = e.p95 > 0 ? "1" : "0";
        p95Ref.current.style.transform = `translateY(${p95y}px)`;
      }

      if (near) {
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = e.ink;
        for (let y = 0; y < H; y += 6) ctx.fillRect(px(nearX - 0.5), y, 1, 2);
      }

      // older events melt into the left edge instead of being cut off
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "destination-out";
      const melt = ctx.createLinearGradient(0, 0, W * FADE, 0);
      melt.addColorStop(0, "#000");
      melt.addColorStop(1, "transparent");
      ctx.fillStyle = melt;
      ctx.fillRect(0, 0, W * FADE, H);
      ctx.globalCompositeOperation = "source-over";

      if (near !== e.picked) {
        e.picked = near;
        setPicked(near && { tick: near, age: view - near.t });
      }
      const tag = tagRef.current;
      if (tag) {
        tag.style.opacity = near ? "1" : "0";
        if (near) {
          const half = tag.offsetWidth / 2;
          const x = Math.min(Math.max(nearX - half, 0), W - half * 2);
          tag.style.transform = `translate(${x}px, ${yOf(near.v) - tag.offsetHeight - 12}px)`;
        }
      }

      const oldest = Math.min(view - span, Date.now() - WINDOW) - 1000;
      let drop = 0;
      while (drop < e.ticks.length && e.ticks[drop].t < oldest) drop++;
      if (drop) e.ticks.splice(0, drop);
    };

    const loop = (now: number) => {
      e.frame = 0;
      // reduced motion steps the tape once a second instead of gliding
      if (!e.reduce || now - e.step >= 1000 || e.pointer !== null) {
        e.step = now;
        e.paint(now);
      }
      if (e.visible && e.pointer === null && !e.paused) e.frame = requestAnimationFrame(loop);
    };
    e.wake = () => {
      if (e.frame || !e.visible) return;
      e.last = 0;
      e.frame = requestAnimationFrame(loop);
    };

    const measure = () => {
      e.dpr = Math.min(window.devicePixelRatio || 1, 3);
      canvas.width = Math.round(canvas.clientWidth * e.dpr);
      canvas.height = Math.round(canvas.clientHeight * e.dpr);
      e.paint(performance.now());
    };
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(canvas);

    let onScreen = false;
    const sync = () => {
      e.visible = onScreen && !document.hidden;
      if (e.visible) e.wake();
      else if (e.frame) {
        cancelAnimationFrame(e.frame);
        e.frame = 0;
      }
    };
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      sync();
    });
    io.observe(canvas);
    document.addEventListener("visibilitychange", sync);

    return () => {
      resize.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      cancelAnimationFrame(e.frame);
      e.frame = 0;
      e.visible = false;
    };
  }, []);

  useEffect(() => {
    const e = engine.current;
    e.span = seconds * 1000;
    e.reduce = reduce;
    e.paused = paused;
    e.wake();
  }, [seconds, reduce, paused]);

  // canvas needs resolved colors, so read them off hidden swatches and again whenever the theme flips
  useEffect(() => {
    const e = engine.current;
    const read = () => {
      if (accentRef.current) e.accent = getComputedStyle(accentRef.current).color;
      if (errorRef.current) e.error = getComputedStyle(errorRef.current).color;
      if (inkRef.current) e.ink = getComputedStyle(inkRef.current).color;
      e.paint(performance.now());
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme"] });
    return () => observer.disconnect();
  }, [color]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const e = engine.current;
      if (!e.visible) return;
      const now = Date.now();
      const recent = e.ticks.filter((k) => k.t > now - WINDOW && k.t <= now);
      const rate = recent.filter((k) => k.t > now - 5000).length / 5;
      const sorted = recent.map((k) => k.v).sort((a, b) => a - b);
      const p95 = sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] : 0;
      const errors = recent.length ? recent.filter((k) => k.err).length / recent.length : 0;
      e.p95 = p95;
      setStats((s) => (s.rate === rate && s.p95 === p95 && s.errors === errors ? s : { rate, p95, errors }));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      push(input) {
        const e = engine.current;
        const list = Array.isArray(input) ? input : [input];
        const now = Date.now();
        for (const ev of list) e.ticks.push({ t: ev.time ?? now, v: Math.max(0, ev.value), err: !!ev.error, label: ev.label });
        if (list.some((ev) => ev.time !== undefined)) e.ticks.sort((a, b) => a.t - b.t);
        e.wake();
      },
      clear() {
        engine.current.ticks = [];
        engine.current.wake();
      },
    }),
    [],
  );

  const hold = (x: number | null) => {
    const e = engine.current;
    e.pointer = x;
    if (e.frame) return;
    if (x === null) e.wake();
    else e.paint(performance.now());
  };

  const figures = [
    { label: "per second", value: stats.rate.toLocaleString("en-US", { maximumFractionDigits: 1 }) },
    { label: "p95", value: format(stats.p95) },
    { label: "errors", value: stats.errors.toLocaleString("en-US", { style: "percent", maximumFractionDigits: 1 }), warn: stats.errors > 0 },
  ];
  const marks = [seconds, (seconds * 2) / 3, seconds / 3].map((s) => `${Math.round(s * 10) / 10}s`);

  return (
    <div
      data-slot="tick-tape"
      className={cn("@container flex w-full flex-col gap-5 rounded-[28px] bg-card p-5 [corner-shape:squircle] sm:p-6", className)}
      {...props}
    >
      <span ref={accentRef} aria-hidden className="hidden" style={{ color }} />
      <span ref={errorRef} aria-hidden className="hidden text-red-500 dark:text-red-400" />
      <span ref={inkRef} aria-hidden className="hidden text-foreground" />

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
        <button
          type="button"
          aria-pressed={paused}
          onClick={() => setPaused((p) => !p)}
          className={cn(
            "-my-1 inline-flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
            paused ? "bg-foreground/[0.06] text-muted-foreground hover:text-foreground" : "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
          )}
        >
          <span aria-hidden className="relative flex size-2">
            {!paused && !reduce && <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/60" />}
            <span className={cn("relative size-2 rounded-full transition-colors", paused ? "bg-foreground/30" : "bg-emerald-500")} />
          </span>
          {paused ? "Paused" : "Live"}
        </button>
      </div>

      <dl className="grid grid-cols-3 divide-x divide-foreground/[0.08]">
        {figures.map((f) => (
          <div key={f.label} className="flex min-w-0 flex-col-reverse gap-0.5 px-2 first:pl-0 last:pr-0 @sm:px-4">
            <dt className="flex items-center gap-1.5 truncate text-xs font-semibold text-muted-foreground">
              {f.warn && <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-red-500" />}
              {f.label}
            </dt>
            <dd className={cn("truncate font-mono text-base font-medium @xs:text-xl @sm:text-2xl tracking-tight tabular-nums", f.warn && "text-red-600 dark:text-red-400")}>
              {f.value}
            </dd>
          </div>
        ))}
      </dl>

      <div>
        <div
          role="img"
          aria-label={`${label}: the last ${seconds} seconds of events, newest on the right. Point at the tape to hold it and read an event.`}
          onPointerMove={(ev) => hold(ev.clientX - ev.currentTarget.getBoundingClientRect().left)}
          onPointerLeave={() => hold(null)}
          onPointerCancel={() => hold(null)}
          className="relative cursor-crosshair touch-pan-y border-b border-foreground/15 select-none"
        >
          <canvas ref={canvasRef} aria-hidden className="block w-full" style={{ height }} />
          {top > 0 && (
            <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 font-mono text-[10px] text-muted-foreground tabular-nums" style={{ top: HEAD }}>
              <span className="absolute top-0 left-0 -translate-y-full pb-0.5">{format(top)}</span>
              <span className="absolute top-1/2 left-0 -translate-y-full pb-0.5">{format(top / 2)}</span>
            </div>
          )}
          <span
            ref={p95Ref}
            aria-hidden
            className="pointer-events-none absolute top-0 right-0 -mt-[7px] font-mono text-[10px] font-medium text-muted-foreground transition-opacity"
            style={{ opacity: 0 }}
          >
            p95
          </span>
          <div
            ref={tagRef}
            aria-hidden
            className="pointer-events-none absolute top-0 left-0 z-10 rounded-[16px] border border-foreground/[0.06] bg-background/90 px-3 py-2 text-xs whitespace-nowrap shadow-lg backdrop-blur-md transition-opacity [corner-shape:squircle]"
            style={{ opacity: 0 }}
          >
            <p className="flex items-center gap-2">
              <span className="size-2 rounded-full" style={{ background: picked?.tick.err ? "var(--color-red-500)" : color }} />
              <span className="font-mono font-medium tabular-nums">{picked ? format(picked.tick.v) : ""}</span>
              <span className="ml-auto pl-3 text-muted-foreground">{picked ? `${(picked.age / 1000).toFixed(1)}s ago` : ""}</span>
            </p>
            {picked?.tick.label && <p className="mt-1 text-muted-foreground">{picked.tick.label}</p>}
          </div>
        </div>
        <div aria-hidden className="relative mt-2 h-3 font-mono text-[10px] text-muted-foreground tabular-nums">
          {marks.map((m, i) => (
            <span key={m} className={cn("absolute", i && "-translate-x-1/2")} style={{ left: `${(i / 3) * 100}%` }}>
              {m}
            </span>
          ))}
          <span className="absolute right-0">now</span>
        </div>
      </div>
    </div>
  );
}
