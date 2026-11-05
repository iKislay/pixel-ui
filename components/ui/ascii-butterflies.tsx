"use client";

import { useEffect, useRef, type ComponentProps } from "react";
import { cn } from "@/lib/utils";

const TAU = Math.PI * 2;
const STEP = 1 / 60;
const MAX_STEPS = 4;
const LEVELS = 8;
const RAMP = ".:-=+*#%@";
const EDGE = ".'`:";
const TRAIL = 10;

const PALETTES: [number, number, number][] = [
  [255, 165, 70],
  [120, 190, 255],
  [255, 130, 200],
  [255, 230, 110],
  [185, 150, 255],
];
const MONO: [number, number, number][] = [[228, 228, 228]];

export type AsciiButterfliesVariant = "color" | "mono";

const clamp = (v: number, lo: number, hi: number) =>
  v < lo ? lo : v > hi ? hi : v;
const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};
const angleDiff = (a: number, b: number) => {
  let d = (b - a) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
};
const hash = (x: number, y: number) => {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

const styles = (palette: [number, number, number][]) =>
  palette.map(([r, g, b]) =>
    Array.from({ length: LEVELS }, (_, l) => {
      const hot = smoothstep(LEVELS - 3, LEVELS - 1, l) * 0.35;
      const mix = (c: number) => Math.round(c + (255 - c) * hot);
      return `rgba(${mix(r)},${mix(g)},${mix(b)},${(0.3 + (0.7 * (l + 1)) / LEVELS).toFixed(2)})`;
    }),
  );
const glows = (palette: [number, number, number][]) =>
  palette.map(([r, g, b]) =>
    Array.from(
      { length: LEVELS },
      (_, l) => `rgba(${r},${g},${b},${(0.02 + (0.12 * l) / LEVELS).toFixed(3)})`,
    ),
  );

const STYLES = {
  color: { glyph: styles(PALETTES), glow: glows(PALETTES), trail: "rgb(255,220,170)" },
  mono: { glyph: styles(MONO), glow: glows(MONO), trail: "rgb(215,215,215)" },
};

type Butterfly = {
  x: number;
  y: number;
  heading: number;
  speed: number;
  scale: number;
  size: number;
  depth: number;
  color: number;
  flap: number;
  flapRate: number;
  resting: boolean;
  until: number;
  goalX: number;
  goalY: number;
  retarget: number;
  fright: number;
  wobble: number;
  trail: Float32Array;
  trailAt: number;
  trailHead: number;
};

class Meadow {
  width = 0;
  height = 0;
  time = 0;
  flies: Butterfly[] = [];
  pointer = { x: 0, y: 0, active: false };

  constructor(
    private count: number,
    private shades: number,
  ) {}

  resize(width: number, height: number) {
    const first = this.width === 0;
    this.width = width;
    this.height = height;
    if (first) this.seed();
    const base = clamp(Math.min(width, height) * 0.1, 20, 46);
    for (const b of this.flies) {
      b.size = base * b.scale;
      b.x = clamp(b.x, 0, width);
      b.y = clamp(b.y, 0, height);
    }
  }

  private seed() {
    const { width: W, height: H } = this;
    this.flies = [];
    for (let i = 0; i < this.count; i++) {
      const depth = rand(0.6, 1);
      this.flies.push({
        x: rand(W * 0.1, W * 0.9),
        y: rand(H * 0.1, H * 0.9),
        heading: rand(0, TAU),
        speed: 40,
        scale: 0.7 + depth * 0.45,
        size: 20,
        depth,
        color: i % this.shades,
        flap: rand(0, TAU),
        flapRate: rand(8, 11),
        resting: false,
        until: rand(5, 11),
        goalX: rand(W * 0.1, W * 0.9),
        goalY: rand(H * 0.1, H * 0.9),
        retarget: rand(2, 5),
        fright: 0,
        wobble: rand(0, TAU),
        trail: new Float32Array(TRAIL * 2),
        trailAt: 0,
        trailHead: 0,
      });
    }
    this.flies.sort((a, b) => a.depth - b.depth);
  }

  scare(x: number, y: number) {
    for (const b of this.flies) {
      const d = Math.hypot(b.x - x, b.y - y);
      if (d > 260) continue;
      b.heading = Math.atan2(b.y - y, b.x - x);
      b.fright = 1;
      b.resting = false;
      b.until = this.time + rand(3, 6);
    }
  }

  step(dt: number) {
    this.time += dt;
    const { width: W, height: H, time: t, pointer } = this;
    for (const b of this.flies) {
      b.fright = Math.max(0, b.fright - dt * 0.8);

      if (b.resting) {
        b.speed += (0 - b.speed) * Math.min(1, dt * 4);
        b.flap += dt * 1.6;
        if (t > b.until) {
          b.resting = false;
          b.until = t + rand(6, 12);
          b.heading = rand(0, TAU);
        }
      } else {
        b.flap += dt * b.flapRate * (1 + b.fright * 0.5);
        if (t > b.retarget) {
          b.goalX = rand(W * 0.1, W * 0.9);
          b.goalY = rand(H * 0.1, H * 0.9);
          b.retarget = t + rand(2, 5);
        }
        const toGoal = Math.atan2(b.goalY - b.y, b.goalX - b.x);
        b.wobble += dt * 2.4;
        const flutter = Math.sin(b.wobble) + Math.sin(b.wobble * 2.3 + b.flap * 0.1);
        b.heading +=
          (clamp(angleDiff(b.heading, toGoal), -1, 1) * 0.9 + flutter * 0.9) * dt;

        if (pointer.active) {
          const dx = b.x - pointer.x;
          const dy = b.y - pointer.y;
          const d = Math.hypot(dx, dy);
          if (d < 130) {
            b.heading += angleDiff(b.heading, Math.atan2(dy, dx)) * dt * 5;
            b.fright = Math.max(b.fright, 1 - d / 130);
          }
        }

        const beat = 0.5 + 0.5 * Math.sin(b.flap * 2 - 1);
        const target = (34 + 26 * beat) * (1 + b.fright * 1.6);
        b.speed += (target - b.speed) * Math.min(1, dt * 6);

        if (t > b.until && b.fright === 0 && Math.hypot(b.goalX - b.x, b.goalY - b.y) < 140) {
          b.resting = true;
          b.until = t + rand(2.5, 5);
        }
      }

      b.x += Math.cos(b.heading) * b.speed * dt;
      b.y += Math.sin(b.heading) * b.speed * dt;

      const m = b.size * 1.5;
      if (b.x < m) b.x += (m - b.x) * dt * 2;
      if (b.x > W - m) b.x -= (b.x - (W - m)) * dt * 2;
      if (b.y < m) b.y += (m - b.y) * dt * 2;
      if (b.y > H - m) b.y -= (b.y - (H - m)) * dt * 2;

      if (t > b.trailAt && !b.resting) {
        b.trailAt = t + 0.07;
        b.trailHead = (b.trailHead + 1) % TRAIL;
        b.trail[b.trailHead * 2] = b.x;
        b.trail[b.trailHead * 2 + 1] = b.y;
      }
    }
  }
}

class Painter {
  private ctx: CanvasRenderingContext2D;
  private dpr = 1;
  private width = 0;
  private height = 0;
  private fontFamily = "ui-monospace, Menlo, monospace";
  private fontSize = 12;
  cw = 9;
  ch = 14;
  private cols = 0;
  private rows = 0;
  private glyph = new Uint16Array(0);
  private level = new Uint8Array(0);
  private box = { c0: 0, c1: 0, r0: 0, r1: 0 };

  constructor(
    private canvas: HTMLCanvasElement,
    private variant: AsciiButterfliesVariant,
  ) {
    this.ctx = canvas.getContext("2d")!;
  }

  setFontFamily(family: string) {
    if (family) this.fontFamily = family;
  }

  resize(width: number, height: number, dpr: number) {
    this.width = width;
    this.height = height;
    this.dpr = dpr;
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.fontSize = clamp(Math.round(width / 80), 11, 15);
    this.ctx.font = `600 ${this.fontSize}px ${this.fontFamily}`;
    this.cw = Math.max(5, this.ctx.measureText("M").width);
    this.ch = Math.round(this.fontSize * 1.45);
    this.cols = Math.ceil(width / this.cw);
    this.rows = Math.ceil(height / this.ch);
    this.glyph = new Uint16Array(this.cols * this.rows);
    this.level = new Uint8Array(this.cols * this.rows);
  }

  render(meadow: Meadow) {
    const { ctx, dpr, width, height } = this;
    if (this.cols === 0) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.font = `600 ${this.fontSize}px ${this.fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    this.drawTrails(meadow);
    for (const b of meadow.flies) this.drawButterfly(b);
    ctx.globalAlpha = 1;
  }

  private drawTrails(meadow: Meadow) {
    const { ctx, cw, ch } = this;
    ctx.fillStyle = STYLES[this.variant].trail;
    for (const b of meadow.flies) {
      for (let k = 1; k < TRAIL; k++) {
        const i = (b.trailHead - k + TRAIL) % TRAIL;
        const x = b.trail[i * 2];
        const y = b.trail[i * 2 + 1];
        if (x === 0 && y === 0) continue;
        ctx.globalAlpha = (1 - k / TRAIL) * 0.35 * b.depth;
        ctx.fillText(
          ".",
          Math.floor(x / cw) * cw + cw / 2,
          Math.floor(y / ch) * ch + ch / 2 + 1,
        );
      }
    }
  }

  private put(col: number, row: number, code: number, level: number) {
    if (col < 0 || row < 0 || col >= this.cols || row >= this.rows) return;
    const i = row * this.cols + col;
    this.glyph[i] = code;
    this.level[i] = level;
    const b = this.box;
    if (col < b.c0) b.c0 = col;
    if (col > b.c1) b.c1 = col;
    if (row < b.r0) b.r0 = row;
    if (row > b.r1) b.r1 = row;
  }

  private drawButterfly(b: Butterfly) {
    const { ctx, cw, ch } = this;
    const s = b.size;
    const dirX = Math.cos(b.heading);
    const dirY = Math.sin(b.heading);
    const open = b.resting
      ? 0.55 + 0.45 * Math.cos(b.flap)
      : 0.22 + 0.78 * Math.abs(Math.cos(b.flap));
    const closed = 1 - open;

    this.box = { c0: this.cols, c1: -1, r0: this.rows, r1: -1 };

    const wing = (u: number, v: number) => {
      const w = Math.abs(v) / (s * open);
      const x = u / s;
      const fore = ((x - 0.26) / 0.46) ** 2 + ((w - 0.5) / 0.55) ** 2;
      const hind = ((x + 0.34) / 0.32) ** 2 + ((w - 0.42) / 0.4) ** 2;
      return Math.min(fore, hind);
    };

    const reach = s * 1.4;
    const c0 = Math.floor((b.x - reach) / cw);
    const c1 = Math.ceil((b.x + reach) / cw);
    const r0 = Math.floor((b.y - reach) / ch);
    const r1 = Math.ceil((b.y + reach) / ch);

    for (let row = r0; row <= r1; row++) {
      for (let col = c0; col <= c1; col++) {
        const cx = col * cw + cw / 2;
        const cy = row * ch + ch / 2;
        let hits = 0;
        for (let k = 0; k < 4; k++) {
          const dx = cx + (k & 1 ? 0.25 : -0.25) * cw - b.x;
          const dy = cy + (k & 2 ? 0.25 : -0.25) * ch - b.y;
          const u = dx * dirX + dy * dirY;
          const v = -dx * dirY + dy * dirX;
          if (wing(u, v) <= 1) hits++;
        }
        if (hits === 0) continue;

        const dx = cx - b.x;
        const dy = cy - b.y;
        const u = dx * dirX + dy * dirY;
        const v = -dx * dirY + dy * dirX;
        const e = Math.min(1, Math.sqrt(wing(u, v)));
        const w = Math.abs(v) / (s * open);
        const x = u / s;

        let light = 0.18 + 0.5 * smoothstep(0.7, 1, e) + 0.2 * closed;
        const vein = Math.abs(Math.cos(Math.atan2(w, x + 0.05) * 7)) ** 12;
        light += 0.3 * vein * smoothstep(0.15, 0.8, e);
        const eye = Math.hypot((x - 0.3) / 0.12, (w - 0.55) / 0.12);
        light += 0.6 * Math.exp(-((eye - 0.9) ** 2) * 6);
        light = clamp(light, 0, 1);

        const code =
          hits < 3
            ? EDGE.charCodeAt(Math.floor(hash(col, row) * EDGE.length))
            : RAMP.charCodeAt(Math.floor(light * (RAMP.length - 1)));
        this.put(col, row, code, Math.min(LEVELS - 1, Math.floor(light * LEVELS)));
      }
    }

    // body and antennae sit on top of the wings
    const bodySteps = 14;
    for (let i = 0; i <= bodySteps; i++) {
      const f = i / bodySteps;
      const u = s * (0.5 - f * 0.95);
      const col = Math.floor((b.x + dirX * u) / cw);
      const row = Math.floor((b.y + dirY * u) / ch);
      const code = f < 0.12 ? "@" : f < 0.4 ? "8" : f < 0.75 ? "#" : "%";
      this.put(col, row, code.charCodeAt(0), LEVELS - 1);
    }
    for (const side of [-1, 1]) {
      for (let i = 1; i <= 4; i++) {
        const f = i / 4;
        const u = s * (0.5 + f * 0.32);
        const v = side * s * 0.34 * f * f;
        const col = Math.floor((b.x + dirX * u - dirY * v) / cw);
        const row = Math.floor((b.y + dirY * u + dirX * v) / ch);
        this.put(col, row, (i === 4 ? "o" : "'").charCodeAt(0), LEVELS - 3);
      }
    }

    const { c0: bc0, c1: bc1, r0: br0, r1: br1 } = this.box;
    const glow = STYLES[this.variant].glow[b.color];
    const glyphStyle = STYLES[this.variant].glyph[b.color];
    for (let row = br0; row <= br1; row++) {
      for (let col = bc0; col <= bc1; col++) {
        const i = row * this.cols + col;
        const code = this.glyph[i];
        if (code === 0) continue;
        const lv = this.level[i];
        this.glyph[i] = 0;
        const x = col * cw;
        const y = row * ch;
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = "#000";
        ctx.fillRect(x, y, cw, ch);
        ctx.globalAlpha = 0.6 + 0.4 * b.depth;
        ctx.fillStyle = glow[lv];
        ctx.fillRect(x, y, cw, ch);
        ctx.fillStyle = glyphStyle[lv];
        ctx.fillText(String.fromCharCode(code), x + cw / 2, y + ch / 2 + 1);
      }
    }
  }
}

function AsciiButterflies({
  count = 4,
  variant = "color",
  className,
  ...props
}: ComponentProps<"div"> & { count?: number; variant?: AsciiButterfliesVariant }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const meadow = new Meadow(count, variant === "mono" ? 1 : PALETTES.length);
    const painter = new Painter(canvas, variant);
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;
    let last = 0;
    let acc = 0;
    let visible = true;
    let disposed = false;

    const drawStill = () => {
      if (meadow.time < 4) for (let i = 0; i < 240; i++) meadow.step(STEP);
      painter.render(meadow);
    };

    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      acc += dt;
      let steps = 0;
      while (acc >= STEP && steps < MAX_STEPS) {
        meadow.step(STEP);
        acc -= STEP;
        steps++;
      }
      if (steps === MAX_STEPS) acc = 0;
      painter.render(meadow);
      raf = requestAnimationFrame(frame);
    };

    const schedule = () => {
      cancelAnimationFrame(raf);
      if (disposed || !visible || motion.matches) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      painter.setFontFamily(getComputedStyle(canvas).fontFamily);
      painter.resize(rect.width, rect.height, Math.min(window.devicePixelRatio || 1, 2));
      meadow.resize(rect.width, rect.height);
      if (motion.matches) drawStill();
    };

    const local = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onMove = (e: PointerEvent) => {
      const { x, y } = local(e);
      meadow.pointer.x = x;
      meadow.pointer.y = y;
      meadow.pointer.active = e.pointerType !== "touch";
    };
    const onLeave = () => {
      meadow.pointer.active = false;
    };
    const onDown = (e: PointerEvent) => {
      if (motion.matches) return;
      const { x, y } = local(e);
      meadow.scare(x, y);
    };
    const onMotion = () => {
      if (motion.matches) {
        cancelAnimationFrame(raf);
        drawStill();
      } else {
        schedule();
      }
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      schedule();
    });
    intersection.observe(canvas);
    motion.addEventListener("change", onMotion);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("pointerdown", onDown);

    resize();
    document.fonts?.ready.then(() => {
      if (!disposed) resize();
    });
    schedule();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersection.disconnect();
      motion.removeEventListener("change", onMotion);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("pointerdown", onDown);
    };
  }, [count, variant]);

  return (
    <div
      data-slot="ascii-butterflies"
      className={cn("relative overflow-hidden bg-black font-mono", className)}
      {...props}
    >
      <canvas ref={canvasRef} aria-hidden="true" className="block h-full w-full" />
    </div>
  );
}

export { AsciiButterflies };
