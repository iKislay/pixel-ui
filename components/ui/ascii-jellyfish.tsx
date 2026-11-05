"use client";

import { useEffect, useRef, type ComponentProps } from "react";
import { cn } from "@/lib/utils";

const TAU = Math.PI * 2;
const STEP = 1 / 60;
const MAX_STEPS = 4;
const SEGMENTS = 16;
const LEVELS = 8;
const RAMP = ".:-=+*#%@";
const EDGE = ".'`:";
const PULSE_SHARE = 0.3;

const PALETTES: [number, number, number][] = [
  [110, 220, 255],
  [255, 120, 215],
  [165, 140, 255],
  [105, 255, 200],
  [255, 170, 115],
];

const TENTACLE_ROOTS = [-0.9, -0.675, -0.45, -0.225, 0, 0.225, 0.45, 0.675, 0.9];
const ARM_ROOTS = [-0.28, 0, 0.28];
const CHAINS = TENTACLE_ROOTS.length + ARM_ROOTS.length;

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

// 0 at rest, 1 fully contracted: a fast squeeze, then a slow recovery
const contraction = (clock: number) => {
  const p = clock - Math.floor(clock);
  return p < PULSE_SHARE
    ? Math.sin((p / PULSE_SHARE) * (Math.PI / 2))
    : (1 - (p - PULSE_SHARE) / (1 - PULSE_SHARE)) ** 2;
};

type Jelly = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  heading: number;
  axis: number;
  scale: number;
  size: number;
  depth: number;
  color: number;
  period: number;
  clock: number;
  goalX: number;
  goalY: number;
  retarget: number;
  pos: Float32Array;
  prev: Float32Array;
};

type Ring = { x: number; y: number; r: number; age: number; depth: number };
type Plankton = { x: number; y: number; vx: number; vy: number; phase: number };

export type AsciiJellyfishVariant = "color" | "mono";

const MONO: [number, number, number][] = [[225, 225, 225]];

const glyphStyles = (palette: [number, number, number][]) =>
  palette.map(([r, g, b]) =>
    Array.from({ length: LEVELS }, (_, l) => {
      const hot = smoothstep(LEVELS - 3, LEVELS - 1, l) * 0.4;
      const mix = (c: number) => Math.round(c + (255 - c) * hot);
      return `rgba(${mix(r)},${mix(g)},${mix(b)},${(0.3 + (0.7 * (l + 1)) / LEVELS).toFixed(2)})`;
    }),
  );
const glowStyles = (palette: [number, number, number][]) =>
  palette.map(([r, g, b]) =>
    Array.from(
      { length: LEVELS },
      (_, l) => `rgba(${r},${g},${b},${(0.02 + (0.13 * l) / LEVELS).toFixed(3)})`,
    ),
  );

const STYLES = {
  color: { glyph: glyphStyles(PALETTES), glow: glowStyles(PALETTES), plankton: "rgb(150,235,255)", ring: "rgb(190,240,255)" },
  mono: { glyph: glyphStyles(MONO), glow: glowStyles(MONO), plankton: "rgb(210,210,210)", ring: "rgb(235,235,235)" },
};

class Sea {
  width = 0;
  height = 0;
  time = 0;
  jellies: Jelly[] = [];
  rings: Ring[] = [];
  plankton: Plankton[] = [];
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
    const base = clamp(Math.min(width, height) * 0.075, 16, 40);
    for (const j of this.jellies) {
      j.size = base * j.scale;
      j.x = clamp(j.x, 0, width);
      j.y = clamp(j.y, 0, height);
      this.hang(j);
    }
    const planktonCount = clamp(Math.round((width * height) / 9000), 24, 120);
    while (this.plankton.length < planktonCount) {
      this.plankton.push({
        x: rand(0, width),
        y: rand(0, height),
        vx: 0,
        vy: 0,
        phase: rand(0, TAU),
      });
    }
    this.plankton.length = planktonCount;
  }

  private seed() {
    const { width: W, height: H } = this;
    this.jellies = [];
    for (let i = 0; i < this.count; i++) {
      const depth = rand(0.5, 1);
      this.jellies.push({
        x: rand(W * 0.15, W * 0.85),
        y: rand(H * 0.2, H * 0.8),
        vx: 0,
        vy: 0,
        heading: rand(0, TAU),
        axis: -Math.PI / 2,
        scale: 0.65 + depth * 0.5,
        size: 30,
        depth,
        color: i % this.shades,
        period: rand(2.4, 3.6),
        clock: rand(0, 1),
        goalX: rand(W * 0.12, W * 0.88),
        goalY: rand(H * 0.15, H * 0.85),
        retarget: rand(4, 9),
        pos: new Float32Array(CHAINS * SEGMENTS * 2),
        prev: new Float32Array(CHAINS * SEGMENTS * 2),
      });
    }
    this.jellies.sort((a, b) => a.depth - b.depth);
  }

  chainLength(j: Jelly, k: number) {
    return j.size * (k < TENTACLE_ROOTS.length ? 2.8 : 1.8);
  }

  rootOf(j: Jelly, k: number, out: { x: number; y: number }) {
    const c = contraction(j.clock);
    const rw = j.size * (1 - 0.3 * c);
    const f =
      k < TENTACLE_ROOTS.length
        ? TENTACLE_ROOTS[k]
        : ARM_ROOTS[k - TENTACLE_ROOTS.length] * 0.6;
    const dx = Math.cos(j.axis);
    const dy = Math.sin(j.axis);
    out.x = j.x - dy * f * rw - dx * j.size * 0.2;
    out.y = j.y + dx * f * rw - dy * j.size * 0.2;
  }

  // lay every chain straight behind the bell
  private hang(j: Jelly) {
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
    this.rings.push({ x, y, r: 4, age: 0, depth: 1 });
    for (const j of this.jellies) {
      const dx = j.x - x;
      const dy = j.y - y;
      const d = Math.hypot(dx, dy) || 1;
      if (d > 300) continue;
      const k = 1 - d / 300;
      j.vx += (dx / d) * 170 * k;
      j.vy += (dy / d) * 170 * k;
      if (j.clock - Math.floor(j.clock) > PULSE_SHARE) {
        j.clock = Math.floor(j.clock) + 1;
        this.emit(j);
      }
    }
    for (const p of this.plankton) {
      const dx = p.x - x;
      const dy = p.y - y;
      const d = Math.hypot(dx, dy) || 1;
      if (d > 260) continue;
      const k = (1 - d / 260) * 200;
      p.vx += (dx / d) * k;
      p.vy += (dy / d) * k;
    }
  }

  private emit(j: Jelly) {
    this.rings.push({ x: j.x, y: j.y, r: j.size * 0.8, age: 0, depth: j.depth });
    if (this.rings.length > 24) this.rings.shift();
  }

  step(dt: number) {
    this.time += dt;
    this.stepJellies(dt);
    this.stepPlankton(dt);
    for (const r of this.rings) {
      r.age += dt;
      r.r += 70 * dt;
    }
    this.rings = this.rings.filter((r) => r.age < 1.6);
  }

  private stepJellies(dt: number) {
    const { width: W, height: H, time: t, pointer, jellies } = this;
    const root = { x: 0, y: 0 };
    for (const j of jellies) {
      const before = j.clock - Math.floor(j.clock);
      let speedUp = 1;

      if (t > j.retarget || Math.hypot(j.goalX - j.x, j.goalY - j.y) < j.size * 1.5) {
        j.goalX = rand(W * 0.12, W * 0.88);
        j.goalY = rand(H * 0.15, H * 0.85);
        j.retarget = t + rand(7, 12);
      }
      const toGoal = Math.atan2(j.goalY - j.y, j.goalX - j.x);
      j.heading += clamp(angleDiff(j.heading, toGoal), -1, 1) * dt * 0.9;
      const lean = clamp(angleDiff(-Math.PI / 2, j.heading), -1.1, 1.1);
      j.axis += angleDiff(j.axis, -Math.PI / 2 + lean) * Math.min(1, dt * 2);

      if (pointer.active) {
        const dx = j.x - pointer.x;
        const dy = j.y - pointer.y;
        const d = Math.hypot(dx, dy) || 1;
        const reach = j.size * 3 + 70;
        if (d < reach) {
          const w = 1 - d / reach;
          j.vx += (dx / d) * 150 * w * dt;
          j.vy += (dy / d) * 150 * w * dt;
          speedUp += w * 0.9;
        }
      }

      for (const o of jellies) {
        if (o === j) continue;
        const dx = j.x - o.x;
        const dy = j.y - o.y;
        const d = Math.hypot(dx, dy) || 1;
        const reach = (j.size + o.size) * 1.5;
        if (d < reach) {
          const w = 1 - d / reach;
          j.vx += (dx / d) * 60 * w * dt;
          j.vy += (dy / d) * 60 * w * dt;
        }
      }

      j.clock += (dt / j.period) * speedUp;
      const p = j.clock - Math.floor(j.clock);
      if (p < before) this.emit(j);
      if (p < PULSE_SHARE) {
        j.vx += Math.cos(j.axis) * 130 * dt;
        j.vy += Math.sin(j.axis) * 130 * dt;
      }
      j.vy += 5 * dt;
      const drag = Math.exp(-dt * 1.5);
      j.vx *= drag;
      j.vy *= drag;
      j.x += j.vx * dt;
      j.y += j.vy * dt;
      j.x = clamp(j.x, -j.size, W + j.size);
      j.y = clamp(j.y, -j.size, H + j.size);

      this.stepChains(j, dt, root);
    }
  }

  private stepChains(j: Jelly, dt: number, root: { x: number; y: number }) {
    const dx = Math.cos(j.axis);
    const dy = Math.sin(j.axis);
    const c = contraction(j.clock);
    const t = this.time;
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
        const sway = Math.sin(t * 2.2 + i * 0.55 + k * 1.7) * 45 * along;
        const pull = (40 + 90 * c) * along;
        const ax = -dx * pull - dy * sway;
        const ay = 16 - dy * pull + dx * sway;
        j.pos[o] = x + (x - j.prev[o]) * 0.96 + ax * dt * dt;
        j.pos[o + 1] = y + (y - j.prev[o + 1]) * 0.96 + ay * dt * dt;
        j.prev[o] = x;
        j.prev[o + 1] = y;
      }
      for (let pass = 0; pass < 2; pass++) {
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

  private stepPlankton(dt: number) {
    const { time: t, pointer, jellies, width: W, height: H } = this;
    const damp = Math.exp(-dt * 1.2);
    for (const p of this.plankton) {
      p.vx += Math.sin(p.y * 0.012 + t * 0.3) * 6 * dt;
      p.vy += Math.cos(p.x * 0.01 + t * 0.25) * 4 * dt - 2 * dt;
      for (const j of jellies) {
        const dx = p.x - j.x;
        const dy = p.y - j.y;
        const reach = j.size * 3.2;
        const d2 = dx * dx + dy * dy;
        if (d2 > reach * reach || d2 < 1) continue;
        const d = Math.sqrt(d2);
        const k = contraction(j.clock) * (1 - d / reach) * 120 * dt;
        p.vx += (dx / d) * k;
        p.vy += (dy / d) * k;
      }
      if (pointer.active) {
        const dx = p.x - pointer.x;
        const dy = p.y - pointer.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d < 90) {
          const k = (1 - d / 90) * 220 * dt;
          p.vx += (dx / d) * k;
          p.vy += (dy / d) * k;
        }
      }
      p.vx *= damp;
      p.vy *= damp;
      p.x = (p.x + p.vx * dt + W) % W;
      p.y = (p.y + p.vy * dt + H) % H;
    }
  }
}

class Painter {
  private ctx: CanvasRenderingContext2D;
  private dpr = 1;
  private width = 0;
  private height = 0;
  private fontFamily = "ui-monospace, Menlo, monospace";
  cw = 9;
  ch = 14;
  private cols = 0;
  private rows = 0;
  private glyph = new Uint16Array(0);
  private level = new Uint8Array(0);
  private box = { c0: 0, c1: 0, r0: 0, r1: 0 };

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
    const fs = clamp(Math.round(width / 80), 11, 15);
    this.ctx.font = `600 ${fs}px ${this.fontFamily}`;
    this.cw = Math.max(5, this.ctx.measureText("M").width);
    this.ch = Math.round(fs * 1.45);
    this.cols = Math.ceil(width / this.cw);
    this.rows = Math.ceil(height / this.ch);
    this.glyph = new Uint16Array(this.cols * this.rows);
    this.level = new Uint8Array(this.cols * this.rows);
  }

  render(sea: Sea) {
    const { ctx, dpr, width, height, ch } = this;
    if (this.cols === 0) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.font = `600 ${Math.round(ch / 1.45)}px ${this.fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    this.drawPlankton(sea);
    this.drawRings(sea);
    for (const j of sea.jellies) this.drawJelly(sea, j);
    ctx.globalAlpha = 1;
  }

  private drawPlankton(sea: Sea) {
    const { ctx, cw, ch } = this;
    ctx.fillStyle = STYLES[this.variant].plankton;
    for (const p of sea.plankton) {
      const speed = Math.hypot(p.vx, p.vy);
      const tw = 0.5 + 0.5 * Math.sin(sea.time * 1.4 + p.phase);
      ctx.globalAlpha = clamp(0.12 + 0.3 * tw + speed * 0.006, 0, 0.8);
      const col = Math.floor(p.x / cw);
      const row = Math.floor(p.y / ch);
      ctx.fillText(speed > 14 ? "o" : ".", col * cw + cw / 2, row * ch + ch / 2 + 1);
    }
  }

  private drawRings(sea: Sea) {
    const { ctx, cw, ch } = this;
    ctx.fillStyle = STYLES[this.variant].ring;
    for (const ring of sea.rings) {
      const fade = 1 - ring.age / 1.6;
      ctx.globalAlpha = fade * fade * 0.5 * ring.depth;
      const steps = clamp(Math.ceil((TAU * ring.r) / cw), 12, 140);
      for (let s = 0; s < steps; s++) {
        const a = (s / steps) * TAU;
        const col = Math.floor((ring.x + Math.cos(a) * ring.r) / cw);
        const row = Math.floor((ring.y + Math.sin(a) * ring.r) / ch);
        if (col < 0 || row < 0 || col >= this.cols || row >= this.rows) continue;
        ctx.fillText(s % 2 ? "." : "'", col * cw + cw / 2, row * ch + ch / 2 + 1);
      }
    }
  }

  private put(col: number, row: number, code: number, level: number, overwrite: boolean) {
    if (col < 0 || row < 0 || col >= this.cols || row >= this.rows) return;
    const i = row * this.cols + col;
    if (!overwrite && this.glyph[i] !== 0) return;
    this.glyph[i] = code;
    this.level[i] = level;
    const b = this.box;
    if (col < b.c0) b.c0 = col;
    if (col > b.c1) b.c1 = col;
    if (row < b.r0) b.r0 = row;
    if (row > b.r1) b.r1 = row;
  }

  private drawJelly(sea: Sea, j: Jelly) {
    const { ctx, cw, ch } = this;
    const t = sea.time;
    const c = contraction(j.clock);
    const p = j.clock - Math.floor(j.clock);
    const dirX = Math.cos(j.axis);
    const dirY = Math.sin(j.axis);
    const rw = j.size * (1 - 0.3 * c);
    const hh = j.size * (0.85 + 0.25 * c);
    const skirt = j.size * 0.2;
    const flare = 0.07 * (1 - c);
    const wave = clamp(p / 0.55, 0, 1);

    this.box = { c0: this.cols, c1: -1, r0: this.rows, r1: -1 };

    const inside = (dx: number, dy: number) => {
      const u = dx * dirX + dy * dirY;
      const v = -dx * dirY + dy * dirX;
      if (u >= 0) {
        const a = u / hh;
        const b = v / rw;
        return a * a + b * b <= 1;
      }
      const scallop = 0.72 + 0.28 * Math.abs(Math.sin((v / rw) * Math.PI * 3.5));
      const edge = -skirt * scallop + Math.sin(v * 0.3 + t * 5) * j.size * 0.03;
      return u >= edge && Math.abs(v) <= rw * (1 + (flare * -u) / skirt);
    };

    const reach = Math.max(rw, hh) + skirt + 2;
    const c0 = Math.floor((j.x - reach) / cw);
    const c1 = Math.ceil((j.x + reach) / cw);
    const r0 = Math.floor((j.y - reach) / ch);
    const r1 = Math.ceil((j.y + reach) / ch);

    for (let row = r0; row <= r1; row++) {
      for (let col = c0; col <= c1; col++) {
        const cx = col * cw + cw / 2;
        const cy = row * ch + ch / 2;
        let hits = 0;
        for (let s = 0; s < 4; s++) {
          const ox = (s & 1 ? 0.25 : -0.25) * cw;
          const oy = (s & 2 ? 0.25 : -0.25) * ch;
          if (inside(cx + ox - j.x, cy + oy - j.y)) hits++;
        }
        if (hits === 0) continue;

        const dx = cx - j.x;
        const dy = cy - j.y;
        const u = dx * dirX + dy * dirY;
        const v = -dx * dirY + dy * dirX;
        const a = u / hh;
        const b = v / rw;
        const rr = u >= 0 ? Math.min(1, Math.sqrt(a * a + b * b)) : 1;

        let light = 0.1 + 0.55 * smoothstep(0.62, 1, rr) + 0.15 * c;
        if (u >= 0) {
          const canal = Math.abs(Math.cos(Math.atan2(b, a) * 5)) ** 14;
          light += 0.35 * canal * smoothstep(0.2, 0.9, rr);
          light += 0.45 * Math.exp(-(((rr - 0.45) / 0.09) ** 2));
          if (p < 0.6) light += 0.5 * Math.exp(-(((rr - wave) / 0.16) ** 2));
        } else {
          light = 0.85;
        }
        light = clamp(light, 0, 1);

        const level = Math.min(LEVELS - 1, Math.floor(light * LEVELS));
        const code =
          hits < 3
            ? EDGE.charCodeAt(Math.floor(hash(col, row) * EDGE.length))
            : RAMP.charCodeAt(Math.floor(light * (RAMP.length - 1)));
        this.put(col, row, code, level, true);
      }
    }

    const root = { x: 0, y: 0 };
    for (let k = 0; k < CHAINS; k++) {
      const arm = k >= TENTACLE_ROOTS.length;
      const base = k * SEGMENTS * 2;
      sea.rootOf(j, k, root);
      for (let i = 1; i < SEGMENTS; i++) {
        const o = base + i * 2;
        const x0 = j.pos[o - 2];
        const y0 = j.pos[o - 1];
        const x1 = j.pos[o];
        const y1 = j.pos[o + 1];
        const len = Math.hypot(x1 - x0, y1 - y0);
        const along = i / SEGMENTS;
        const ang = Math.atan2(y1 - y0, x1 - x0);
        const sx = Math.abs(Math.cos(ang));
        const sy = Math.abs(Math.sin(ang));
        const glow = 0.5 + 0.5 * Math.sin(i * 0.7 - t * 3 + k);
        const lv = clamp(
          Math.floor((1 - along * 0.75) * (arm ? 0.9 : 0.6) * LEVELS + glow * 2),
          0,
          LEVELS - 1,
        );
        let ch2: string;
        if (arm) ch2 = "%8S"[(i + k) % 3];
        else if (along > 0.82) ch2 = i % 2 ? ":" : ".";
        else if (sy > 0.85) ch2 = i % 3 ? "|" : "!";
        else if (sx > 0.85) ch2 = "-";
        else ch2 = (x1 - x0) * (y1 - y0) > 0 ? "\\" : "/";
        const steps = Math.max(1, Math.ceil(len / (cw * 0.6)));
        for (let s = 1; s <= steps; s++) {
          const f = s / steps;
          const col = Math.floor((x0 + (x1 - x0) * f) / cw);
          const row = Math.floor((y0 + (y1 - y0) * f) / ch);
          this.put(col, row, ch2.charCodeAt(0), lv, false);
        }
      }
    }

    const { c0: bc0, c1: bc1, r0: br0, r1: br1 } = this.box;
    const glows = STYLES[this.variant].glow[j.color];
    const styles = STYLES[this.variant].glyph[j.color];
    for (let row = br0; row <= br1; row++) {
      for (let col = bc0; col <= bc1; col++) {
        const i = row * this.cols + col;
        const code = this.glyph[i];
        if (code === 0) continue;
        const lv = this.level[i];
        this.glyph[i] = 0;
        const x = col * cw;
        const y = row * ch;
        ctx.globalAlpha = 0.78;
        ctx.fillStyle = "#000";
        ctx.fillRect(x, y, cw, ch);
        ctx.globalAlpha = 0.55 + 0.45 * j.depth;
        ctx.fillStyle = glows[lv];
        ctx.fillRect(x, y, cw, ch);
        ctx.fillStyle = styles[lv];
        ctx.fillText(String.fromCharCode(code), x + cw / 2, y + ch / 2 + 1);
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

    const sea = new Sea(count, variant === "mono" ? 1 : PALETTES.length);
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
      data-slot="ascii-jellyfish"
      className={cn("relative overflow-hidden bg-black font-mono", className)}
      {...props}
    >
      <canvas ref={canvasRef} aria-hidden="true" className="block h-full w-full" />
    </div>
  );
}

export { AsciiJellyfish };
