"use client";

import { useEffect, useRef, type ComponentProps } from "react";
import { cn } from "@/lib/utils";

export type AsciiJellyfishVariant = "color" | "mono";

type RGB = [number, number, number];

const TAU = Math.PI * 2;
const UP = -Math.PI / 2;
const STEP = 1 / 60;
const MAX_STEPS = 4;
const SEGMENTS = 22;
const PULSE = 0.35;
const RAMP = ".:-=+*#%@";
const TENTACLES = [-0.8, -0.52, -0.22, 0.22, 0.52, 0.8];
const ARMS = [-0.1, 0.1];
const CHAINS = TENTACLES.length + ARMS.length;
const CHARS = Array.from({ length: 128 }, (_, i) => String.fromCharCode(i));

type Scheme = "dark" | "light";
type Palette = { tints: RGB[]; hi: RGB; mote: RGB };

// on dark pages the rim glows pale; on light pages it inks in deep blue
const PALETTES: Record<Scheme, Record<AsciiJellyfishVariant, Palette>> = {
  dark: {
    color: {
      tints: [
        [150, 205, 255],
        [95, 145, 255],
        [195, 222, 255],
        [120, 195, 245],
      ],
      hi: [236, 245, 255],
      mote: [150, 195, 255],
    },
    mono: {
      tints: [
        [200, 200, 200],
        [170, 170, 170],
        [220, 220, 220],
      ],
      hi: [245, 245, 245],
      mote: [200, 200, 200],
    },
  },
  light: {
    color: {
      tints: [
        [60, 120, 210],
        [40, 80, 200],
        [80, 130, 190],
        [40, 125, 185],
      ],
      hi: [15, 35, 95],
      mote: [70, 120, 200],
    },
    mono: {
      tints: [
        [90, 90, 90],
        [70, 70, 70],
        [110, 110, 110],
      ],
      hi: [20, 20, 20],
      mote: [110, 110, 110],
    },
  },
};

// ascii stroke for an outline whose outward normal is (nx, ny)
const outline = (nx: number, ny: number) => {
  const deg = (Math.atan2(ny, nx) * 180) / Math.PI;
  if (deg < -67.5 && deg > -112.5) return "-";
  if (deg > 67.5 && deg < 112.5) return "_";
  if (Math.abs(deg) <= 22.5) return ")";
  if (Math.abs(deg) >= 157.5) return "(";
  return (deg < 0) === (Math.abs(deg) < 90) ? "\\" : "/";
};

const isDark = (el: Element) => {
  const m = getComputedStyle(el).color.match(/[\d.]+/g);
  if (!m) return true;
  return 0.299 * +m[0] + 0.587 * +m[1] + 0.114 * +m[2] > 128;
};

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
const ramp = (deep: RGB, tint: RGB, hi: RGB, t: number, k: 0 | 1 | 2) =>
  t < 0.5
    ? deep[k] + (tint[k] - deep[k]) * t * 2
    : tint[k] + (hi[k] - tint[k]) * (t - 0.5) * 2;

// eased squeeze and slow cosine release, so the bell never snaps
const contraction = (clock: number) => {
  const p = clock - Math.floor(clock);
  return p < PULSE
    ? smoothstep(0, 1, p / PULSE)
    : 0.5 + 0.5 * Math.cos((Math.PI * (p - PULSE)) / (1 - PULSE));
};

type Jelly = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  axis: number;
  scale: number;
  size: number;
  depth: number;
  tint: number;
  period: number;
  clock: number;
  c: number;
  squeeze: number;
  rush: number;
  goalX: number;
  goalY: number;
  retarget: number;
  pos: Float32Array;
  prev: Float32Array;
};

type Ring = { x: number; y: number; r: number; age: number };
type Mote = { x: number; y: number; vx: number; vy: number; phase: number };

class Sea {
  width = 0;
  height = 0;
  time = 0;
  jellies: Jelly[] = [];
  rings: Ring[] = [];
  motes: Mote[] = [];
  pointer = { x: 0, y: 0, active: false };

  constructor(
    private count: number,
    private tints: number,
  ) {}

  resize(width: number, height: number) {
    const first = this.width === 0;
    this.width = width;
    this.height = height;
    if (first) this.seed();
    const base = clamp(Math.min(width, height) * 0.09, 30, 70);
    for (const j of this.jellies) {
      j.size = base * j.scale;
      j.x = clamp(j.x, 0, width);
      j.y = clamp(j.y, 0, height);
      this.hang(j);
    }
    const motes = clamp(Math.round((width * height) / 7000), 30, 140);
    while (this.motes.length < motes) {
      this.motes.push({
        x: rand(0, width),
        y: rand(0, height),
        vx: 0,
        vy: 0,
        phase: rand(0, TAU),
      });
    }
    this.motes.length = motes;
  }

  private seed() {
    const { width: W, height: H } = this;
    this.jellies = [];
    for (let i = 0; i < this.count; i++) {
      const depth = rand(0.55, 1);
      this.jellies.push({
        x: ((i + 0.5) / this.count) * W + rand(-0.08, 0.08) * W,
        y: rand(H * 0.3, H * 0.85),
        vx: 0,
        vy: 0,
        axis: UP + rand(-0.3, 0.3),
        scale: 0.7 + depth * 0.4,
        size: 40,
        depth,
        tint: i % this.tints,
        period: rand(3.2, 4.4),
        clock: rand(0, 1),
        c: 0,
        squeeze: 0,
        rush: 0,
        goalX: rand(W * 0.15, W * 0.85),
        goalY: rand(H * 0.1, H * 0.9),
        retarget: rand(4, 9),
        pos: new Float32Array(CHAINS * SEGMENTS * 2),
        prev: new Float32Array(CHAINS * SEGMENTS * 2),
      });
    }
    this.jellies.sort((a, b) => a.depth - b.depth);
  }

  chainLength(j: Jelly, k: number) {
    return k < TENTACLES.length ? j.size * (2.4 + 0.25 * ((k * 7) % 3)) : j.size * 1.3;
  }

  rootOf(j: Jelly, k: number, out: { x: number; y: number }) {
    const rw = j.size * (1 - 0.22 * j.c);
    const dx = Math.cos(j.axis);
    const dy = Math.sin(j.axis);
    const tentacle = k < TENTACLES.length;
    const f = tentacle ? TENTACLES[k] * 0.95 : ARMS[k - TENTACLES.length];
    const back = tentacle ? j.size * 0.12 : j.size * 0.02;
    out.x = j.x - dy * f * rw - dx * back;
    out.y = j.y + dx * f * rw - dy * back;
  }

  private hang(j: Jelly) {
    j.c = contraction(j.clock);
    const dx = Math.cos(j.axis);
    const dy = Math.sin(j.axis);
    const root = { x: 0, y: 0 };
    for (let k = 0; k < CHAINS; k++) {
      this.rootOf(j, k, root);
      const seg = this.chainLength(j, k) / (SEGMENTS - 1);
      for (let i = 0; i < SEGMENTS; i++) {
        const o = (k * SEGMENTS + i) * 2;
        j.pos[o] = j.prev[o] = root.x - dx * seg * i;
        j.pos[o + 1] = j.prev[o + 1] = root.y - dy * seg * i;
      }
    }
  }

  startle(x: number, y: number) {
    this.rings.push({ x, y, r: 4, age: 0 });
    if (this.rings.length > 6) this.rings.shift();
    for (const j of this.jellies) {
      const dx = j.x - x;
      const dy = j.y - y;
      const d = Math.hypot(dx, dy) || 1;
      if (d > 280) continue;
      const k = 1 - d / 280;
      j.vx += (dx / d) * 60 * k;
      j.vy += (dy / d) * 60 * k;
      j.rush = 1;
    }
    for (const m of this.motes) {
      const dx = m.x - x;
      const dy = m.y - y;
      const d = Math.hypot(dx, dy) || 1;
      if (d > 220) continue;
      const k = (1 - d / 220) * 120;
      m.vx += (dx / d) * k;
      m.vy += (dy / d) * k;
    }
  }

  step(dt: number) {
    this.time += dt;
    this.stepJellies(dt);
    this.stepMotes(dt);
    for (const r of this.rings) {
      r.age += dt;
      r.r += 110 * dt;
    }
    this.rings = this.rings.filter((r) => r.age < 1.4);
  }

  private stepJellies(dt: number) {
    const { width: W, height: H, time: t, pointer, jellies } = this;
    const root = { x: 0, y: 0 };
    for (const j of jellies) {
      if (t > j.retarget || Math.hypot(j.goalX - j.x, j.goalY - j.y) < j.size) {
        j.goalX = rand(W * 0.15, W * 0.85);
        j.goalY = rand(H * 0.1, H * 0.9);
        j.retarget = t + rand(8, 14);
      }
      const toGoal = Math.atan2(j.goalY - j.y, j.goalX - j.x);
      let lean = clamp(angleDiff(UP, toGoal), -0.7, 0.7);
      let speedUp = 1 + j.rush * 3;

      if (pointer.active) {
        const dx = j.x - pointer.x;
        const dy = j.y - pointer.y;
        const d = Math.hypot(dx, dy) || 1;
        const reach = j.size * 2.5 + 60;
        if (d < reach) {
          const w = 1 - d / reach;
          j.vx += (dx / d) * 50 * w * dt;
          j.vy += (dy / d) * 50 * w * dt;
          lean = clamp(angleDiff(UP, Math.atan2(dy, dx)), -0.8, 0.8);
          speedUp += w * 1.2;
        }
      }
      j.axis += angleDiff(j.axis, UP + lean) * Math.min(1, dt * 0.8);

      for (const o of jellies) {
        if (o === j) continue;
        const dx = j.x - o.x;
        const dy = j.y - o.y;
        const d = Math.hypot(dx, dy) || 1;
        const reach = (j.size + o.size) * 1.4;
        if (d < reach) {
          const w = 1 - d / reach;
          j.vx += (dx / d) * 30 * w * dt;
          j.vy += (dy / d) * 30 * w * dt;
        }
      }

      const before = j.clock - Math.floor(j.clock);
      j.clock += (dt / j.period) * speedUp;
      if (j.clock - Math.floor(j.clock) < before) j.rush = 0;
      const c = contraction(j.clock);
      j.squeeze = Math.max(0, c - j.c) / dt;
      j.c = c;

      const thrust = j.squeeze * j.size * 0.9;
      j.vx += Math.cos(j.axis) * thrust * dt;
      j.vy += Math.sin(j.axis) * thrust * dt + 4 * dt;
      const drag = Math.exp(-dt * 1.2);
      j.vx *= drag;
      j.vy *= drag;
      j.x += j.vx * dt;
      j.y += j.vy * dt;

      if (j.x < j.size) j.vx += (j.size - j.x) * dt;
      if (j.x > W - j.size) j.vx -= (j.x - (W - j.size)) * dt;
      if (j.y > H + j.size) j.vy -= (j.y - (H + j.size)) * dt;
      // drifted out the top: come back up from below
      if (j.y < -j.size * 4) {
        j.y = H + j.size * 1.2;
        j.x = rand(W * 0.15, W * 0.85);
        j.vx = j.vy = 0;
        this.hang(j);
      }

      this.stepChains(j, dt, root);
    }
  }

  private stepChains(j: Jelly, dt: number, root: { x: number; y: number }) {
    const dx = Math.cos(j.axis);
    const dy = Math.sin(j.axis);
    const t = this.time;
    const dt2 = dt * dt;
    for (let k = 0; k < CHAINS; k++) {
      const base = k * SEGMENTS * 2;
      const seg = this.chainLength(j, k) / (SEGMENTS - 1);
      this.rootOf(j, k, root);
      j.pos[base] = j.prev[base] = root.x;
      j.pos[base + 1] = j.prev[base + 1] = root.y;
      for (let i = 1; i < SEGMENTS; i++) {
        const o = base + i * 2;
        const along = i / SEGMENTS;
        const x = j.pos[o];
        const y = j.pos[o + 1];
        // a wave travels from root to tip
        const sway = Math.sin(t * 1.6 - i * 0.35 + k * 1.3) * 30 * along;
        const pull = (18 + 30 * j.c) * along;
        const ax = -dx * pull - dy * sway;
        const ay = -dy * pull + dx * sway + 25;
        j.pos[o] = x + (x - j.prev[o]) * 0.94 + ax * dt2;
        j.pos[o + 1] = y + (y - j.prev[o + 1]) * 0.94 + ay * dt2;
        j.prev[o] = x;
        j.prev[o + 1] = y;
      }
      for (let pass = 0; pass < 3; pass++) {
        for (let i = 1; i < SEGMENTS; i++) {
          const o = base + i * 2;
          const ex = j.pos[o] - j.pos[o - 2];
          const ey = j.pos[o + 1] - j.pos[o - 1];
          const d = Math.hypot(ex, ey) || 1;
          j.pos[o] = j.pos[o - 2] + (ex / d) * seg;
          j.pos[o + 1] = j.pos[o - 1] + (ey / d) * seg;
        }
      }
    }
  }

  private stepMotes(dt: number) {
    const { time: t, pointer, jellies, width: W, height: H } = this;
    const damp = Math.exp(-dt * 1.4);
    for (const m of this.motes) {
      m.vx += Math.sin(m.y * 0.01 + t * 0.2) * 3 * dt;
      m.vy += (Math.cos(m.x * 0.008 + t * 0.15) * 2 - 1.5) * dt;
      for (const j of jellies) {
        if (j.squeeze <= 0) continue;
        const dx = m.x - j.x;
        const dy = m.y - j.y;
        const reach = j.size * 2.4;
        const d2 = dx * dx + dy * dy;
        if (d2 > reach * reach || d2 < 1) continue;
        const d = Math.sqrt(d2);
        const k = j.squeeze * (1 - d / reach) * 40 * dt;
        m.vx += (dx / d) * k;
        m.vy += (dy / d) * k;
      }
      if (pointer.active) {
        const dx = m.x - pointer.x;
        const dy = m.y - pointer.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d < 80) {
          const k = (1 - d / 80) * 120 * dt;
          m.vx += (dx / d) * k;
          m.vy += (dy / d) * k;
        }
      }
      m.vx *= damp;
      m.vy *= damp;
      m.x = (m.x + m.vx * dt + W) % W;
      m.y = (m.y + m.vy * dt + H) % H;
    }
  }
}

class Painter {
  private ctx: CanvasRenderingContext2D;
  private dpr = 1;
  private width = 0;
  private height = 0;
  private fontFamily = "ui-monospace, Menlo, monospace";
  private fontSize = 11;
  private cw = 7;
  private ch = 13;
  private cols = 0;
  private rows = 0;
  private code = new Uint16Array(0);
  private r = new Uint8Array(0);
  private g = new Uint8Array(0);
  private b = new Uint8Array(0);
  private a = new Float32Array(0);
  private touched = new Int32Array(0);
  private count = 0;
  scheme: Scheme = "dark";

  constructor(
    private canvas: HTMLCanvasElement,
    private variant: AsciiJellyfishVariant,
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
    this.fontSize = clamp(Math.round(width / 75), 10, 13);
    this.ctx.font = `600 ${this.fontSize}px ${this.fontFamily}`;
    this.cw = Math.max(5, this.ctx.measureText("M").width);
    this.ch = Math.round(this.fontSize * 1.2);
    this.cols = Math.ceil(width / this.cw);
    this.rows = Math.ceil(height / this.ch);
    const n = this.cols * this.rows;
    this.code = new Uint16Array(n);
    this.r = new Uint8Array(n);
    this.g = new Uint8Array(n);
    this.b = new Uint8Array(n);
    this.a = new Float32Array(n);
    this.touched = new Int32Array(n);
    this.count = 0;
  }

  private set(
    x: number,
    y: number,
    glyph: string,
    r: number,
    g: number,
    b: number,
    a: number,
    force: boolean,
  ) {
    const col = Math.floor(x / this.cw);
    const row = Math.floor(y / this.ch);
    if (col < 0 || row < 0 || col >= this.cols || row >= this.rows || a < 0.03) return;
    const i = row * this.cols + col;
    if (this.code[i] === 0) this.touched[this.count++] = i;
    else if (!force && this.a[i] >= a) return;
    this.code[i] = glyph.charCodeAt(0);
    this.r[i] = r;
    this.g[i] = g;
    this.b[i] = b;
    this.a[i] = a;
  }

  render(sea: Sea) {
    const { ctx, dpr, width, height, cw, ch } = this;
    if (this.cols === 0) return;

    this.paintMotes(sea);
    this.paintRings(sea);
    for (const j of sea.jellies) this.paintJelly(sea, j);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.font = `600 ${this.fontSize}px ${this.fontFamily}`;
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

  private paintMotes(sea: Sea) {
    const [r, g, b] = PALETTES[this.scheme][this.variant].mote;
    for (const m of sea.motes) {
      const tw = 0.5 + 0.5 * Math.sin(sea.time * 0.9 + m.phase);
      const a = 0.08 + 0.22 * tw + Math.min(0.3, Math.hypot(m.vx, m.vy) * 0.01);
      this.set(m.x, m.y, ".", r, g, b, a, false);
    }
  }

  private paintRings(sea: Sea) {
    const [r, g, b] = PALETTES[this.scheme][this.variant].hi;
    for (const ring of sea.rings) {
      const fade = 1 - ring.age / 1.4;
      const steps = clamp(Math.ceil((TAU * ring.r) / this.cw), 12, 160);
      for (let s = 0; s < steps; s++) {
        const ang = (s / steps) * TAU;
        const x = ring.x + Math.cos(ang) * ring.r;
        const y = ring.y + Math.sin(ang) * ring.r * 0.9;
        this.set(x, y, ".", r, g, b, fade * fade * 0.5, false);
      }
    }
  }

  private paintJelly(sea: Sea, j: Jelly) {
    const { cw, ch } = this;
    const t = sea.time;
    const palette = PALETTES[this.scheme][this.variant];
    const tint = palette.tints[j.tint];
    const hi = palette.hi;
    const deep: RGB =
      this.scheme === "dark"
        ? [tint[0] * 0.4, tint[1] * 0.45, tint[2] * 0.55]
        : [tint[0] + (255 - tint[0]) * 0.2, tint[1] + (255 - tint[1]) * 0.2, tint[2] + (255 - tint[2]) * 0.15];
    // clear jelly needs more ink to show on a light page
    const depthA = (0.45 + 0.55 * j.depth) * (this.scheme === "dark" ? 1 : 1.5);
    const c = j.c;
    const dirX = Math.cos(j.axis);
    const dirY = Math.sin(j.axis);
    const rw = j.size * (1 - 0.22 * c);
    const hh = j.size * (0.72 + 0.2 * c);
    const skirt = j.size * 0.16;
    const flare = 0.07 * (1 - c);
    const spacing = Math.min(cw, ch) * 0.5;

    for (let k = 0; k < CHAINS; k++) {
      const arm = k >= TENTACLES.length;
      const base = k * SEGMENTS * 2;
      for (let i = 1; i < SEGMENTS; i++) {
        const o = base + i * 2;
        const x0 = j.pos[o - 2];
        const y0 = j.pos[o - 1];
        const x1 = j.pos[o];
        const y1 = j.pos[o + 1];
        const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / spacing));
        const wave = Math.sin(t * 1.6 - i * 0.35 + k * 1.3);
        for (let s = 1; s <= steps; s++) {
          const f = s / steps;
          const along = (i - 1 + f) / (SEGMENTS - 1);
          const x = x0 + (x1 - x0) * f;
          const y = y0 + (y1 - y0) * f;
          if (arm) {
            const a = 0.55 * (1 - along * 0.75) * depthA;
            const m = 0.6 + 0.2 * wave;
            this.set(
              x,
              y,
              wave > 0 ? ")" : "(",
              ramp(deep, tint, hi, m, 0),
              ramp(deep, tint, hi, m, 1),
              ramp(deep, tint, hi, m, 2),
              a,
              false,
            );
          } else {
            const a = (1 - along) ** 0.9 * 0.7 * depthA;
            const m = 0.35 + 0.3 * (1 - along);
            this.set(
              x,
              y,
              along > 0.8 ? "." : ":",
              ramp(deep, tint, hi, m, 0),
              ramp(deep, tint, hi, m, 1),
              ramp(deep, tint, hi, m, 2),
              a,
              false,
            );
          }
        }
      }
    }

    const fringe = Math.max(6, Math.round((rw * 2) / cw));
    for (let m = 0; m < fringe; m++) {
      const f = -1 + (2 * m) / (fringe - 1);
      const bx = j.x - dirY * f * rw * (1 + flare) - dirX * skirt * 0.7;
      const by = j.y + dirX * f * rw * (1 + flare) - dirY * skirt * 0.7;
      const drift = Math.sin(t * 2 + m) * 2;
      for (let s = 1; s <= 2; s++) {
        this.set(
          bx - dirX * s * ch * 0.8 - dirY * drift,
          by - dirY * s * ch * 0.8 + dirX * drift,
          "'",
          tint[0],
          tint[1],
          tint[2],
          (0.35 - s * 0.1) * depthA,
          false,
        );
      }
    }

    // < 1 inside the bell, > 1 outside
    const field = (dx: number, dy: number) => {
      const u = dx * dirX + dy * dirY;
      const v = -dx * dirY + dy * dirX;
      if (u >= 0) {
        const a = u / hh;
        const b = v / rw;
        // the bell wall ripples like liquid
        const wobble = 1 + 0.035 * Math.sin(Math.atan2(b, a) * 4 + t * 2.4 + j.tint);
        return (a * a + b * b) / (wobble * wobble);
      }
      const scallop = 0.6 + 0.4 * Math.abs(Math.sin((v / rw) * Math.PI * 4));
      const side = Math.abs(v) / (rw * (1 + (flare * -u) / skirt));
      return Math.max(side, -u / (skirt * scallop)) ** 2;
    };

    const reach = Math.max(rw * (1 + flare), hh) + skirt + ch;
    const c0 = Math.floor((j.x - reach) / cw);
    const c1 = Math.ceil((j.x + reach) / cw);
    const r0 = Math.floor((j.y - reach) / ch);
    const r1 = Math.ceil((j.y + reach) / ch);
    const e = 0.5;

    for (let row = r0; row <= r1; row++) {
      for (let col = c0; col <= c1; col++) {
        const cx = col * cw + cw / 2;
        const cy = row * ch + ch / 2;
        let hits = 0;
        for (let sy = -1; sy <= 1; sy++) {
          for (let sx = -1; sx <= 1; sx++) {
            if (field(cx + sx * cw * 0.4 - j.x, cy + sy * ch * 0.4 - j.y) <= 1) hits++;
          }
        }
        if (hits === 0) continue;

        const dx = cx - j.x;
        const dy = cy - j.y;
        const u = dx * dirX + dy * dirY;
        const v = -dx * dirY + dy * dirX;

        // cells barely touching the edge are dropped so the outline stays one cell thick
        if (hits < 3) continue;
        if (hits < 9) {
          const gx = field(dx + e, dy) - field(dx - e, dy);
          const gy = field(dx, dy + e) - field(dx, dy - e);
          const glyph = u < -skirt * 0.2 ? "~" : outline(gx, gy);
          const light = u < 0 ? 0.7 : 0.9;
          this.set(
            cx,
            cy,
            glyph,
            ramp(deep, tint, hi, light, 0),
            ramp(deep, tint, hi, light, 1),
            ramp(deep, tint, hi, light, 2),
            (u < 0 ? 0.7 : 0.9) * depthA,
            true,
          );
          continue;
        }

        let light: number;
        let solid: number;
        if (u >= 0) {
          const rr = Math.min(1, Math.hypot(u / hh, v / rw));
          // slow caustics drifting through the clear jelly
          const flow =
            Math.sin(u * 0.11 + t * 1.3 + Math.sin(v * 0.07 - t * 0.9 + j.tint) * 2) *
            Math.sin(v * 0.09 - t * 1.1 + Math.sin(u * 0.06 + t * 0.7) * 2);
          const caustic = smoothstep(0.35, 0.95, flow);
          const gonads = Math.exp(-(((rr - 0.4) / 0.09) ** 2));
          const wall = smoothstep(0.82, 1, rr);
          light = clamp(0.12 + 0.3 * wall + 0.35 * gonads + 0.45 * caustic + 0.12 * c, 0, 1);
          solid = clamp(0.06 + 0.25 * wall + 0.35 * gonads + 0.5 * caustic, 0, 1);
        } else {
          light = 0.4;
          solid = 0.3;
        }
        this.set(
          cx,
          cy,
          RAMP[Math.floor(light * (RAMP.length - 1))],
          ramp(deep, tint, hi, light, 0),
          ramp(deep, tint, hi, light, 1),
          ramp(deep, tint, hi, light, 2),
          solid * depthA,
          true,
        );
      }
    }
  }
}

function AsciiJellyfish({
  count = 4,
  variant = "color",
  className,
  ...props
}: ComponentProps<"div"> & { count?: number; variant?: AsciiJellyfishVariant }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const sea = new Sea(count, PALETTES.dark[variant].tints.length);
    const painter = new Painter(canvas, variant);
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;
    let last = 0;
    let acc = 0;
    let visible = true;
    let disposed = false;

    const drawStill = () => {
      if (sea.time < 4) for (let i = 0; i < 240; i++) sea.step(STEP);
      painter.render(sea);
    };

    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      acc += dt;
      let steps = 0;
      while (acc >= STEP && steps < MAX_STEPS) {
        sea.step(STEP);
        acc -= STEP;
        steps++;
      }
      if (steps === MAX_STEPS) acc = 0;
      painter.render(sea);
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
      sea.resize(rect.width, rect.height);
      if (motion.matches) drawStill();
    };

    const local = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onMove = (e: PointerEvent) => {
      const { x, y } = local(e);
      sea.pointer.x = x;
      sea.pointer.y = y;
      sea.pointer.active = e.pointerType !== "touch";
    };
    const onLeave = () => {
      sea.pointer.active = false;
    };
    const onDown = (e: PointerEvent) => {
      if (motion.matches) return;
      const { x, y } = local(e);
      sea.startle(x, y);
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
      if (motion.matches) painter.render(sea);
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
      data-slot="ascii-jellyfish"
      className={cn("relative overflow-hidden font-mono", className)}
      {...props}
    >
      <canvas ref={canvasRef} aria-hidden="true" className="block h-full w-full" />
    </div>
  );
}

export { AsciiJellyfish };
