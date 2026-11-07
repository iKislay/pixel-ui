"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type SwarmRevealProps = React.HTMLAttributes<HTMLDivElement> & {
  cursors?: number;
  variant?: "color" | "mono";
  status?: boolean;
};

type Kind = "block" | "text" | "image" | "carry";
type Cursor = { el: HTMLDivElement; trail: HTMLDivElement; color: string; x: number; y: number };
type Box = { x0: number; y0: number; x1: number; y1: number };

const ACCENT = "#4785FF";
const COLORS = ["#ff5f57", "#ff9f0a", "#ffd60a", "#30d158", "#40c8e0", "#0a84ff", "#5e5ce6", "#bf5af2", "#ff375f", "#64d2ff"];
const MONO = ["#f5f5f5", "#a3a3a3", "#737373", "#404040", "#d4d4d4", "#171717"];
const ARROW = "M1 1 L1 15.5 L5 11.8 L7.6 17.6 L10.2 16.5 L7.7 10.8 L13 10.8 Z";

const rand = (a: number, b: number) => a + Math.random() * (b - a);

function kindOf(el: HTMLElement): Kind {
  const v = el.dataset.swarm;
  if (v === "text" || v === "image" || v === "carry") return v;
  return /^(IMG|PICTURE|VIDEO|SVG|CANVAS)$/i.test(el.tagName) ? "image" : "block";
}

export function SwarmReveal({ cursors = 24, variant = "color", status = true, className, children, ...props }: SwarmRevealProps) {
  const palette = variant === "mono" ? MONO : COLORS;
  const rootRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLDivElement>(null);
  const layerRef = React.useRef<HTMLDivElement>(null);
  const [phase, setPhase] = React.useState<"idle" | "build" | "done">("idle");
  const [agents, setAgents] = React.useState(0);
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const root = rootRef.current!;
    const canvas = canvasRef.current!;
    const layer = layerRef.current!;
    const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-swarm]:not([data-swarm-done])"));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      targets.forEach((t) => (t.dataset.swarmDone = ""));
      return;
    }

    const abort = new AbortController();
    const { signal } = abort;
    const sleep = (ms: number) =>
      new Promise<void>((resolve, reject) => {
        const id = setTimeout(resolve, ms);
        signal.addEventListener("abort", () => (clearTimeout(id), reject(signal.reason)), { once: true });
      });
    const done = (a: Animation) => a.finished.then(() => signal.throwIfAborted());

    const add = (cls: string, style: Partial<CSSStyleDeclaration> = {}, parent: HTMLElement = layer) => {
      const el = document.createElement("div");
      el.className = cls;
      Object.assign(el.style, style);
      parent.appendChild(el);
      return el;
    };

    const rectOf = (el: Element) => {
      const r = el.getBoundingClientRect();
      const o = root.getBoundingClientRect();
      return { x: r.left - o.left, y: r.top - o.top, w: r.width, h: r.height };
    };

    // the part of the wrapper actually on screen, clipped by every scrolling ancestor
    const visible = (): Box => {
      const o = root.getBoundingClientRect();
      let b = { x0: o.left, y0: o.top, x1: o.right, y1: o.bottom };
      const clip = (r: { left: number; top: number; right: number; bottom: number }) =>
        (b = { x0: Math.max(b.x0, r.left), y0: Math.max(b.y0, r.top), x1: Math.min(b.x1, r.right), y1: Math.min(b.y1, r.bottom) });
      for (let p = root.parentElement; p; p = p.parentElement) {
        if (getComputedStyle(p).overflow !== "visible") clip(p.getBoundingClientRect());
      }
      clip({ left: 0, top: 0, right: innerWidth, bottom: innerHeight });
      return { x0: b.x0 - o.left, y0: b.y0 - o.top, x1: b.x1 - o.left, y1: b.y1 - o.top };
    };

    const place = (c: Cursor) => (c.el.style.transform = `translate(${c.x}px, ${c.y}px)`);

    const move = async (c: Cursor, x: number, y: number, duration: number, easing = "cubic-bezier(.45,0,.2,1)") => {
      const dist = Math.hypot(x - c.x, y - c.y);
      const from = `translate(${c.x}px, ${c.y}px)`;
      if (dist > 160) {
        c.trail.style.width = `${Math.min(dist * 0.4, 140)}px`;
        c.trail.style.rotate = `${Math.atan2(c.y - y, c.x - x)}rad`;
        c.trail.animate({ opacity: [0, 0.9, 0] }, { duration, easing: "ease-out" });
      }
      c.x = x;
      c.y = y;
      const a = c.el.animate({ transform: [from, `translate(${x}px, ${y}px)`] }, { duration, easing });
      await done(a);
      place(c);
    };

    const sparkle = (x: number, y: number, color: string) => {
      for (let i = 0; i < 3; i++) {
        const s = add("absolute font-mono text-[13px] leading-none font-bold", { left: `${x}px`, top: `${y}px`, color });
        s.textContent = "+";
        const dx = rand(-22, 22);
        const dy = rand(-22, 22);
        s.animate(
          {
            transform: ["translate(-50%,-50%) scale(0)", `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1)`],
            opacity: [1, 0],
          },
          { duration: 650, delay: i * 60, easing: "ease-out", fill: "both" },
        ).finished.then(() => s.remove());
      }
    };

    const spawn = (i: number, x: number, y: number): Cursor => {
      const color = palette[i % palette.length];
      const el = add("absolute left-0 top-0 will-change-transform");
      const trail = add(
        "absolute left-1 top-1 h-[3px] origin-left rounded-full opacity-0",
        {
          background: `linear-gradient(90deg, ${color}, transparent)`,
        },
        el,
      );
      el.insertAdjacentHTML(
        "beforeend",
        `<svg width="18" height="20" viewBox="0 0 18 20" class="relative drop-shadow-[0_1px_1px_rgba(0,0,0,.35)]"><path d="${ARROW}" fill="${color}" stroke="white" stroke-width="1.4" stroke-linejoin="round"/></svg>`,
      );
      const c = { el, trail, color, x, y };
      place(c);
      return c;
    };

    const build = async (c: Cursor, t: HTMLElement) => {
      const kind = kindOf(t);
      const r = rectOf(t);

      if (kind === "carry") {
        const v = visible();
        const fromLeft = r.x + r.w / 2 < (v.x0 + v.x1) / 2;
        const dx = fromLeft ? v.x0 - r.x - r.w - 24 : v.x1 - r.x + 24;
        const gx = r.x + r.w * 0.5;
        const gy = r.y + r.h * 0.35;
        await move(c, gx + dx, gy, 650);
        t.dataset.swarmDone = "";
        const glow = `0 0 0 1.5px ${ACCENT}, 0 0 32px 4px ${ACCENT}88`;
        const fly = t.animate(
          {
            transform: [`translateX(${dx}px) rotate(${fromLeft ? -4 : 4}deg)`, "none"],
            boxShadow: [glow, glow, "0 0 0 0 transparent"],
            offset: [0, 0.85, 1],
          } as PropertyIndexedKeyframes,
          { duration: 1000, easing: "cubic-bezier(.3,.7,.2,1)" },
        );
        await Promise.all([move(c, gx, gy, 1000, "cubic-bezier(.3,.7,.2,1)"), done(fly)]);
        sparkle(r.x + r.w, r.y, c.color);
        return;
      }

      await move(c, r.x, r.y, rand(450, 700));
      const box = add("absolute rounded-[2px]", {
        left: `${r.x}px`,
        top: `${r.y}px`,
        border: `1.5px solid ${ACCENT}`,
        background: `${ACCENT}0d`,
      });
      for (const [px, py] of [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
      ]) {
        add(
          "absolute size-[7px] -translate-x-1/2 -translate-y-1/2 bg-white",
          { left: `${px * 100}%`, top: `${py * 100}%`, border: `1.5px solid ${ACCENT}` },
          box,
        );
      }
      const label = add(
        "absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-[3px] px-1 py-px font-mono text-[9px] leading-tight text-white",
        { background: ACCENT },
        box,
      );
      label.textContent = `${Math.round(r.w)} × ${Math.round(r.h)}`;
      const drag = Math.min(380 + (r.w + r.h) * 0.4, 900);
      box.animate(
        { width: ["0px", `${r.w}px`], height: ["0px", `${r.h}px`] },
        { duration: drag, easing: "cubic-bezier(.45,0,.2,1)", fill: "forwards" },
      );
      await move(c, r.x + r.w, r.y + r.h, drag);

      t.dataset.swarmDone = "";
      if (kind === "text") {
        const cs = getComputedStyle(t);
        const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.4;
        const lines = Math.max(1, Math.round(r.h / lh));
        const type = t.animate(
          { clipPath: ["inset(0 0 100% 0)", "inset(0 0 0% 0)"] },
          { duration: Math.min(lines * 140, 1400), easing: `steps(${lines}, jump-start)` },
        );
        await Promise.all([done(type), move(c, r.x + r.w, r.y + r.h + 4, Math.min(lines * 140, 1400), "linear")]);
      } else if (kind === "image") {
        await done(
          t.animate(
            {
              filter: ["contrast(0) blur(0px)", "contrast(0) blur(0px)", "contrast(1) blur(8px)", "contrast(1) blur(0px)"],
              offset: [0, 0.35, 0.65, 1],
            } as PropertyIndexedKeyframes,
            { duration: 1100, easing: "ease-out" },
          ),
        );
      } else {
        await done(
          t.animate({ opacity: [0, 1], transform: ["scale(.96)", "none"] }, { duration: 320, easing: "cubic-bezier(.2,.8,.2,1)" }),
        );
      }
      sparkle(r.x + r.w, r.y + r.h, c.color);
      box.animate({ opacity: [1, 0] }, { duration: 400, fill: "forwards" }).finished.then(() => box.remove());
    };

    const ready = new Set<HTMLElement>();
    const waiting: (() => void)[] = [];
    let built = 0;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          ready.add(e.target as HTMLElement);
          io.unobserve(e.target);
        }
        waiting.splice(0).forEach((wake) => wake());
      },
      { rootMargin: "0px 0px -8% 0px" },
    );

    const take = () => {
      const t = targets.find((x) => ready.has(x));
      if (t) ready.delete(t);
      return t;
    };

    // a point just past the nearest edge of what is on screen
    const offscreen = (x: number, y: number, v: Box) => {
      const gaps = [x - v.x0, v.x1 - x, y - v.y0, v.y1 - y];
      const side = gaps.indexOf(Math.min(...gaps));
      return side === 0 ? [v.x0 - 40, y] : side === 1 ? [v.x1 + 40, y] : side === 2 ? [x, v.y0 - 40] : [x, v.y1 + 40];
    };

    const wave = async () => {
      const v = visible();
      Object.assign(canvas.style, { top: `${v.y0}px`, height: `${v.y1 - v.y0}px` });
      canvas.replaceChildren();
      const xs = new Set<number>();
      for (const t of ready) {
        const r = rectOf(t);
        xs.add(Math.round(r.x / 4) * 4).add(Math.round((r.x + r.w) / 4) * 4);
      }
      [...xs].slice(0, 12).forEach((x) => add("absolute inset-y-0 w-px", { left: `${x}px`, background: `${ACCENT}40` }, canvas));
      canvas.animate({ opacity: [0, 1] }, { duration: 300, fill: "forwards" });

      const n = Math.min(cursors, ready.size);
      setAgents(n);
      setPhase("build");
      const crowd = Array.from({ length: n }, (_, i) => {
        const a = rand(0, Math.PI * 2);
        const reach = Math.hypot(v.x1 - v.x0, v.y1 - v.y0) / 2 + 40;
        return spawn(i, (v.x0 + v.x1) / 2 + Math.cos(a) * reach, (v.y0 + v.y1) / 2 + Math.sin(a) * reach);
      });
      let working = n;
      await Promise.all(
        crowd.map(async (c, i) => {
          await sleep(i * 40);
          for (let t = take(); t; t = take()) {
            await build(c, t);
            setProgress(++built / targets.length);
          }
          if (--working === 0) {
            setPhase(built === targets.length ? "done" : "idle");
            canvas.animate({ opacity: [1, 0] }, { duration: 400, fill: "forwards" });
          }
          // each cursor leaves the moment it runs out of work, not when the whole wave ends
          const [x, y] = offscreen(c.x, c.y, visible());
          await move(c, x, y, rand(300, 450), "cubic-bezier(.4,0,1,1)");
          c.el.remove();
        }),
      );
    };

    const run = async () => {
      targets.forEach((t) => io.observe(t));
      while (built < targets.length) {
        if (!ready.size) await new Promise<void>((wake) => waiting.push(wake));
        signal.throwIfAborted();
        if (ready.size) await wave();
      }
      io.disconnect();
    };

    run().catch(() => {});
    return () => {
      abort.abort();
      io.disconnect();
      waiting.splice(0).forEach((wake) => wake());
      layer.replaceChildren();
      canvas.replaceChildren();
    };
  }, [cursors, palette]);

  const label = phase === "done" ? "Page built" : `${agents} agents building`;

  return (
    <div
      ref={rootRef}
      data-slot="swarm-reveal"
      className={cn(
        "relative isolate overflow-x-clip",
        phase !== "done" && "motion-safe:[&_[data-swarm]:not([data-swarm-done])]:opacity-0",
        className,
      )}
      {...props}
    >
      <div
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -z-10 opacity-0"
        style={{
          backgroundColor: "color-mix(in srgb, currentColor 4%, transparent)",
          backgroundImage: `radial-gradient(color-mix(in srgb, ${ACCENT} 35%, transparent) 1px, transparent 1px)`,
          backgroundSize: "18px 18px",
        }}
      />
      {children}
      <div ref={layerRef} aria-hidden className="pointer-events-none absolute inset-0 z-10 overflow-hidden" />
      {status && (
        <div aria-live="polite" className="pointer-events-none sticky bottom-4 z-20 flex h-0 justify-center motion-reduce:hidden">
          <div
            className={cn(
              "flex -translate-y-full items-center gap-2 rounded-full border border-black/[0.08] bg-white/85 px-3 py-1.5 text-[11px] font-medium text-neutral-600 shadow-sm backdrop-blur-md transition-opacity duration-500 dark:border-white/10 dark:bg-neutral-900/85 dark:text-white/70",
              phase === "idle" && "opacity-0",
              phase === "done" && "opacity-0 delay-700",
            )}
          >
            <span className="flex -space-x-1">
              {palette.slice(0, 4).map((c) => (
                <span key={c} className="size-2 rounded-full ring-2 ring-white dark:ring-neutral-900" style={{ background: c }} />
              ))}
            </span>
            <span className="tabular-nums">{label}</span>
            <span className="h-1 w-14 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
              <span
                className="block h-full rounded-full transition-[width] duration-300"
                style={{ width: `${progress * 100}%`, background: ACCENT }}
              />
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
