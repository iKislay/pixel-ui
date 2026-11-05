"use client";

import { useEffect, useRef, type ComponentProps } from "react";
import { cn } from "@/lib/utils";

export type AsciiButterfliesVariant = "color" | "mono";

type RGB = [number, number, number];
type Scheme = "dark" | "light";
type Look = { wing: RGB; edge: RGB; spot: RGB; body: RGB };

const TAU = Math.PI * 2;
const STEP = 1 / 60;
const MAX_STEPS = 4;
const CHARS = Array.from({ length: 128 }, (_, i) => String.fromCharCode(i));
const EDGE_GLYPHS = "@0#@0";
const ELEVATION = 0.5;

const WINGS: Record<Scheme, Record<AsciiButterfliesVariant, RGB[]>> = {
  dark: {
    color: [
      [70, 160, 255],
      [40, 215, 200],
      [255, 110, 185],
      [255, 210, 70],
      [255, 145, 55],
    ],
    mono: [
      [215, 215, 215],
      [180, 180, 180],
    ],
  },
  light: {
    color: [
      [25, 110, 230],
      [0, 160, 150],
      [225, 60, 140],
      [240, 185, 20],
      [240, 120, 20],
    ],
    mono: [
      [120, 120, 120],
      [150, 150, 150],
    ],
  },
};

const look = (scheme: Scheme, variant: AsciiButterfliesVariant, kind: number): Look => {
  const wing = WINGS[scheme][variant][kind];
  if (scheme === "dark") {
    const mix = (k: number) => Math.round(wing[k] + (240 - wing[k]) * 0.55);
    return {
      wing,
      edge: [mix(0), mix(1), mix(2)],
      spot: [250, 250, 250],
      body: [190, 180, 170],
    };
  }
  return {
    wing,
    edge: [38, 32, 28],
    spot: [250, 246, 235],
    body: [55, 48, 42],
  };
};

const clamp = (v: number, lo: number, hi: number) =>
  v < lo ? lo : v > hi ? hi : v;
const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);
const hash = (x: number, y: number) => {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

// wing shapes in wing space: s runs out along the span, f runs forward along the body
const ellipse = (s: number, f: number, cs: number, cf: number, rot: number, a: number, b: number) => {
  const ps = s - cs;
  const pf = f - cf;
  const along = ps * Math.cos(rot) + pf * Math.sin(rot);
  const across = -ps * Math.sin(rot) + pf * Math.cos(rot);
  return (along / a) ** 2 + (across / b) ** 2;
};
const fore = (s: number, f: number) => ellipse(s, f, 0.52, 0.36, 0.55, 0.56, 0.33);
const hind = (s: number, f: number) => ellipse(s, f, 0.38, -0.3, -0.75, 0.42, 0.3);

const stroke = (tx: number, ty: number) => {
  let a = Math.atan2(ty, tx);
  if (a < 0) a += Math.PI;
  const deg = (a * 180) / Math.PI;
  if (deg < 22.5 || deg >= 157.5) return "-";
  if (deg < 67.5) return "\\";
  if (deg < 112.5) return "|";
  return "/";
};

const isDark = (el: Element) => {
  const m = getComputedStyle(el).color.match(/[\d.]+/g);
  if (!m) return true;
  return 0.299 * +m[0] + 0.587 * +m[1] + 0.114 * +m[2] > 128;
};

type Butterfly = {
  x: number;
  y: number;
  heading: number;
  vx: number;
  vy: number;
  scale: number;
  size: number;
  depth: number;
  kind: number;
  flap: number;
  resting: boolean;
  until: number;
  goalX: number;
  goalY: number;
  retarget: number;
  fright: number;
  wobble: number;
  facing: 1 | -1;
  tilt: number;
};

class Meadow {
  width = 0;
  height = 0;
  time = 0;
  flies: Butterfly[] = [];
  pointer = { x: 0, y: 0, active: false };

  constructor(
    private count: number,
    private kinds: number,
  ) {}

  resize(width: number, height: number) {
    const first = this.width === 0;
    this.width = width;
    this.height = height;
    if (first) this.seed();
    const base = clamp(Math.min(width, height) * 0.18, 60, 130);
    for (const b of this.flies) {
      b.size = base * b.scale;
      const r = this.bounds(b);
      b.x = clamp(b.x, r.x0, r.x1);
      b.y = clamp(b.y, r.y0, r.y1);
      this.pickGoal(b);
    }
  }

  private seed() {
    const { width: W, height: H } = this;
    const offset = Math.floor(rand(0, this.kinds));
    this.flies = [];
    for (let i = 0; i < this.count; i++) {
      const depth = rand(0.65, 1);
      const heading = Math.random() < 0.5 ? rand(-0.4, 0.4) : Math.PI + rand(-0.4, 0.4);
      this.flies.push({
        x: ((i + 0.5) / this.count) * W,
        y: rand(H * 0.25, H * 0.75),
        heading,
        vx: Math.cos(heading) * 12,
        vy: Math.sin(heading) * 12,
        scale: 0.75 + depth * 0.35,
        size: 60,
        depth,
        kind: (i + offset) % this.kinds,
        flap: rand(0, TAU),
        resting: false,
        until: rand(5, 11),
        goalX: rand(W * 0.15, W * 0.85),
        goalY: rand(H * 0.2, H * 0.8),
        retarget: rand(2, 5),
        fright: 0,
        wobble: rand(0, TAU),
        facing: Math.cos(heading) >= 0 ? 1 : -1,
        tilt: 0,
      });
    }
    this.flies.sort((a, b) => a.depth - b.depth);
  }

  // keeps the raised wings and antennae inside the container
  private bounds(b: Butterfly) {
    const { width: W, height: H } = this;
    let x0 = b.size * 1.05;
    let x1 = W - b.size * 1.05;
    let y0 = b.size * 1.05;
    let y1 = H - b.size * 0.7;
    if (x0 > x1) x0 = x1 = W / 2;
    if (y0 > y1) y0 = y1 = H / 2;
    return { x0, x1, y0, y1 };
  }

  // far goals give long drifting paths instead of circling in place
  private pickGoal(b: Butterfly) {
    const r = this.bounds(b);
    for (let i = 0; i < 8; i++) {
      b.goalX = rand(r.x0, r.x1);
      b.goalY = rand(r.y0, r.y1);
      if (Math.hypot(b.goalX - b.x, b.goalY - b.y) > Math.min(this.width, this.height) * 0.4) break;
    }
    b.retarget = this.time + rand(10, 18);
  }

  scare(x: number, y: number) {
    for (const b of this.flies) {
      const d = Math.hypot(b.x - x, b.y - y);
      if (d > 260) continue;
      const away = Math.atan2(b.y - y, b.x - x);
      b.vx = Math.cos(away) * 60;
      b.vy = Math.sin(away) * 60;
      b.fright = 1;
      b.resting = false;
      b.until = this.time + rand(4, 7);
    }
  }

  step(dt: number) {
    this.time += dt;
    const { time: t, pointer, flies } = this;
    for (const b of flies) {
      b.fright = Math.max(0, b.fright - dt * 0.6);

      if (b.resting) {
        const stop = Math.exp(-dt * 5);
        b.vx *= stop;
        b.vy *= stop;
        b.flap += dt * 0.7;
        if (t > b.until) {
          b.resting = false;
          b.until = t + rand(8, 14);
          this.pickGoal(b);
        }
      } else {
        b.flap += dt * (7 + b.fright * 8);
        if (t > b.retarget || Math.hypot(b.goalX - b.x, b.goalY - b.y) < b.size) {
          this.pickGoal(b);
        }
        const gx = b.goalX - b.x;
        const gy = b.goalY - b.y;
        const gd = Math.hypot(gx, gy) || 1;
        // a gentle sideways weave on the way to a far goal
        b.wobble += dt * 0.8;
        const weave = Math.sin(b.wobble) * 0.35 + Math.sin(b.wobble * 2.1 + 1) * 0.15;
        const dirX = gx / gd - (gy / gd) * weave;
        const dirY = gy / gd + (gx / gd) * weave;
        const beat = 0.5 + 0.5 * Math.sin(b.flap);
        const speed = (9 + 6 * beat) * (1 + b.fright * 2.5);
        const steer = Math.min(1, dt * (0.9 + b.fright * 2));
        b.vx += (dirX * speed - b.vx) * steer;
        b.vy += (dirY * speed - b.vy) * steer;

        if (pointer.active) {
          const dx = b.x - pointer.x;
          const dy = b.y - pointer.y;
          const d = Math.hypot(dx, dy) || 1;
          if (d < 150) {
            const w = 1 - d / 150;
            b.vx += (dx / d) * 120 * w * dt;
            b.vy += (dy / d) * 120 * w * dt;
            b.fright = Math.max(b.fright, w);
          }
        }
        for (const o of flies) {
          if (o === b) continue;
          const dx = b.x - o.x;
          const dy = b.y - o.y;
          const d = Math.hypot(dx, dy) || 1;
          const reach = (b.size + o.size) * 1.2;
          if (d < reach) {
            b.vx += (dx / d) * 20 * (1 - d / reach) * dt;
            b.vy += (dy / d) * 20 * (1 - d / reach) * dt;
          }
        }

        if (t > b.until && b.fright < 0.05 && gd < b.size * 1.5) {
          b.resting = true;
          b.until = t + rand(3, 6);
        }
      }

      b.x += b.vx * dt;
      b.y += b.vy * dt;
      const bx = this.bounds(b);
      if (b.x < bx.x0) b.vx += (bx.x0 - b.x) * 2 * dt;
      if (b.x > bx.x1) b.vx -= (b.x - bx.x1) * 2 * dt;
      if (b.y < bx.y0) b.vy += (bx.y0 - b.y) * 2 * dt;
      if (b.y > bx.y1) b.vy -= (b.y - bx.y1) * 2 * dt;
      const slack = b.size * 0.15;
      b.x = clamp(b.x, bx.x0 - slack, bx.x1 + slack);
      b.y = clamp(b.y, bx.y0 - slack, bx.y1 + slack);

      if (Math.hypot(b.vx, b.vy) > 1) b.heading = Math.atan2(b.vy, b.vx);
      if (b.vx > 3) b.facing = 1;
      else if (b.vx < -3) b.facing = -1;
      // nose follows the climb or dive
      const lean = b.resting ? 0 : clamp(Math.sin(b.heading) * 0.4 * b.facing, -0.4, 0.4);
      b.tilt += (lean - b.tilt) * Math.min(1, dt * 2);
    }
  }
}

class Painter {
  private ctx: CanvasRenderingContext2D;
  private dpr = 1;
  private width = 0;
  private height = 0;
  private fontFamily = "ui-monospace, Menlo, monospace";
  private fontSize = 8;
  private cw = 5;
  private ch = 9;
  private cols = 0;
  private rows = 0;
  private code = new Uint16Array(0);
  private r = new Uint8Array(0);
  private g = new Uint8Array(0);
  private b = new Uint8Array(0);
  private a = new Float32Array(0);
  private z = new Float32Array(0);
  private owner = new Int32Array(0);
  private spot = new Uint8Array(0);
  private mine: number[] = [];
  private nextOwner = 1;
  private touched = new Int32Array(0);
  private count = 0;
  scheme: Scheme = "dark";

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
    this.fontSize = clamp(Math.round(width / 110), 7, 10);
    this.ctx.font = `700 ${this.fontSize}px ${this.fontFamily}`;
    this.cw = Math.max(4, this.ctx.measureText("M").width);
    this.ch = Math.round(this.fontSize * 1.15);
    this.cols = Math.ceil(width / this.cw);
    this.rows = Math.ceil(height / this.ch);
    const n = this.cols * this.rows;
    this.code = new Uint16Array(n);
    this.r = new Uint8Array(n);
    this.g = new Uint8Array(n);
    this.b = new Uint8Array(n);
    this.a = new Float32Array(n);
    this.z = new Float32Array(n);
    this.owner = new Int32Array(n);
    this.spot = new Uint8Array(n);
    this.touched = new Int32Array(n);
    this.count = 0;
  }

  private set(
    x: number,
    y: number,
    glyph: string,
    rgb: RGB,
    a: number,
    z: number,
    owner = 0,
    spot = false,
  ) {
    const col = Math.floor(x / this.cw);
    const row = Math.floor(y / this.ch);
    if (col < 0 || row < 0 || col >= this.cols || row >= this.rows) return;
    const i = row * this.cols + col;
    if (this.code[i] === 0) this.touched[this.count++] = i;
    else if (this.z[i] > z) return;
    this.code[i] = glyph.charCodeAt(0);
    this.r[i] = rgb[0];
    this.g[i] = rgb[1];
    this.b[i] = rgb[2];
    this.a[i] = a;
    this.z[i] = z;
    this.owner[i] = owner;
    this.spot[i] = spot ? 1 : 0;
    if (owner) this.mine.push(i);
  }

  // a wing cell is edge where it borders empty space or anything behind it
  private outline(look: Look, alpha: number) {
    const { cols, rows, code, owner, z } = this;
    const edges: number[] = [];
    for (const i of this.mine) {
      const o = owner[i];
      if (o <= 0) continue;
      const col = i % cols;
      const row = (i / cols) | 0;
      let edge = false;
      for (const [dc, dr] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const c = col + dc;
        const r = row + dr;
        if (c < 0 || r < 0 || c >= cols || r >= rows) continue;
        const j = r * cols + c;
        if (code[j] === 0 || (owner[j] !== o && z[j] < z[i])) {
          edge = true;
          break;
        }
      }
      if (edge) edges.push(i);
    }
    for (const i of edges) {
      const col = i % cols;
      const row = (i / cols) | 0;
      const spot = this.spot[i] === 1;
      const rgb = spot ? look.spot : look.edge;
      this.code[i] = (spot ? "o" : EDGE_GLYPHS[Math.floor(hash(col, row) * EDGE_GLYPHS.length)]).charCodeAt(0);
      this.r[i] = rgb[0];
      this.g[i] = rgb[1];
      this.b[i] = rgb[2];
      this.a[i] = alpha;
      this.owner[i] = -1;
    }
    this.mine.length = 0;
  }

  render(meadow: Meadow) {
    const { ctx, dpr, width, height, cw, ch } = this;
    if (this.cols === 0) return;
    for (const b of meadow.flies) this.paintButterfly(b);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.font = `700 ${this.fontSize}px ${this.fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let k = 0; k < this.count; k++) {
      const i = this.touched[k];
      const col = i % this.cols;
      const row = (i / this.cols) | 0;
      ctx.fillStyle = `rgba(${this.r[i]},${this.g[i]},${this.b[i]},${this.a[i].toFixed(3)})`;
      ctx.fillText(CHARS[this.code[i]], col * cw + cw / 2, row * ch + ch / 2 + 1);
      this.code[i] = 0;
    }
    this.count = 0;
  }

  private paintButterfly(b: Butterfly) {
    const S = b.size;
    const colors = look(this.scheme, this.variant, b.kind);
    const alpha = 0.65 + 0.35 * b.depth;
    // wing angle above the body plane: flat spread at 0, folded up at about 1.4
    const phi = b.resting ? 1.05 + 0.35 * Math.cos(b.flap) : 0.5 + 0.8 * Math.sin(b.flap);
    const sinP = Math.sin(phi);
    const cosP = Math.cos(phi);
    const sinE = Math.sin(ELEVATION);
    const cosE = Math.cos(ELEVATION);
    const sinT = Math.sin(b.tilt);
    const cosT = Math.cos(b.tilt);
    const bob = b.resting ? 0 : -Math.sin(b.flap) * S * 0.05;
    const facing = b.facing;

    // body space (forward, up, toward viewer) to screen, with the camera a little above
    const put = (
      fx: number,
      uy: number,
      tz: number,
      glyph: string,
      rgb: RGB,
      a: number,
      owner = 0,
      spot = false,
    ) => {
      const lx = (fx + tz * 0.15) * facing;
      const ly = -uy * cosE + tz * sinE;
      const sx = b.x + lx * cosT - ly * sinT;
      const sy = b.y + bob + lx * sinT + ly * cosT;
      this.set(sx, sy, glyph, rgb, a, tz * cosE + uy * sinE, owner, spot);
    };

    const step = (Math.min(this.cw, this.ch) * 0.45) / S;
    const id = this.nextOwner;
    this.nextOwner += 4;
    for (const side of [-1, 1]) {
      const near = side === 1;
      const wingA = alpha * (near ? 1 : 0.8);
      for (let si = 0, s = step; s <= 1.1; s += step, si++) {
        for (let fi = 0, f = -0.75; f <= 0.95; f += step, fi++) {
          const ef = fore(s, f);
          const eh = hind(s, f);
          const e = Math.min(ef, eh);
          if (e > 1) continue;
          const isFore = ef <= 1;
          const en = Math.sqrt(isFore ? ef : eh);
          const h = hash(si * 7 + (near ? 1 : 0), fi);

          const ang = Math.atan2(f - (isFore ? 0.02 : -0.02), s);
          const vein = Math.abs(Math.sin(ang * (isFore ? 5 : 4))) < 0.09 && en > 0.2;
          let glyph: string;
          let rgb: RGB;
          if (vein) {
            glyph = "|";
            rgb = colors.edge;
          } else if (en < 0.14) {
            glyph = "%";
            rgb = colors.edge;
          } else {
            glyph = en > 0.55 ? "o" : "x";
            rgb = colors.wing;
          }
          const tz = s * S * cosP * side;
          const uy = s * S * sinP;
          const owner = id + (near ? 2 : 0) + (isFore ? 1 : 0);
          const spot = isFore && en > 0.85 && f > 0.25 && h < 0.3;
          put(f * S, uy, tz + (isFore ? 0.01 : 0), glyph, rgb, wingA, owner, spot);
        }
      }
    }

    const bodyStep = (Math.min(this.cw, this.ch) * 0.5) / S;
    for (let f = -0.62; f <= 0.3; f += bodyStep) {
      const thick = f < -0.05 ? 0.06 * (1 - ((f + 0.05) / -0.6) ** 2) + 0.02 : 0.075;
      for (let u = -thick; u <= thick; u += bodyStep) {
        put(f * S, u * S, 0.001, Math.abs(u) > thick * 0.6 ? "0" : "@", colors.body, alpha);
      }
    }
    put(0.36 * S, 0.02 * S, 0.002, "O", colors.body, alpha);
    let px = 0.38;
    let py = 0.05;
    for (let i = 1; i <= 7; i++) {
      const k = i / 7;
      const nx = 0.38 + 0.4 * k;
      const ny = 0.05 + 0.42 * k ** 0.8;
      const glyph = i === 7 ? "o" : stroke((nx - px) * facing, -(ny - py) * cosE);
      put(nx * S, ny * S, 0.002, glyph, colors.body, alpha * 0.85);
      px = nx;
      py = ny;
    }
    this.outline(colors, alpha);
  }
}

function AsciiButterflies({
  count = 3,
  variant = "color",
  className,
  ...props
}: ComponentProps<"div"> & { count?: number; variant?: AsciiButterfliesVariant }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const meadow = new Meadow(count, WINGS.dark[variant].length);
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

    const syncScheme = () => {
      painter.scheme = isDark(canvas) ? "dark" : "light";
      if (motion.matches) painter.render(meadow);
    };
    const themeObserver = new MutationObserver(syncScheme);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style", "data-theme"],
    });
    syncScheme();

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
      themeObserver.disconnect();
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
      className={cn("relative overflow-hidden font-mono", className)}
      {...props}
    >
      <canvas ref={canvasRef} aria-hidden="true" className="block h-full w-full" />
    </div>
  );
}

export { AsciiButterflies };
