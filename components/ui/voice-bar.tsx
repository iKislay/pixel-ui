"use client";

import * as React from "react";
import { ArrowUp, Mic, MicOff, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type VoiceBarState = "idle" | "listening" | "thinking" | "speaking";

export type VoiceBarPulse = {
  kind?: "ripple" | "wipe" | "tick";
  origin?: number | HTMLElement | null;
  strength?: number;
};

export type VoiceBarHandle = { pulse: (pulse?: VoiceBarPulse) => void };

export type VoiceBarProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onSubmit" | "defaultValue"
> & {
  ref?: React.Ref<VoiceBarHandle>;
  state?: VoiceBarState;
  defaultState?: VoiceBarState;
  onStateChange?: (state: VoiceBarState) => void;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onSubmit?: (value: string) => unknown;
  onVoiceStart?: () => void;
  onCancel?: () => void;
  muted?: boolean;
  defaultMuted?: boolean;
  onMutedChange?: (muted: boolean) => void;
  transcript?: string;
  attachments?: React.ReactNode;
  error?: React.ReactNode;
  getLevel?: () => number;
  getSpectrum?: () => ArrayLike<number>;
  leading?: React.ReactNode;
  onAttach?: () => void;
  placeholder?: string;
  disabled?: boolean;
};

type Rgb = [number, number, number];

const BANDS = 8;
const CELL = 3;
// only the bottom share of the wave carries the spectrum; the rest is a near white or near black accent tint
const COLOR_BAND = 0.3;
const ACCENT: Rgb = [110, 120, 255];
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

const SPECTRUM_DARK: Rgb[] = [
  [255, 140, 40],
  [255, 64, 120],
  [214, 80, 250],
  [110, 120, 255],
  [40, 190, 255],
  [40, 230, 180],
  [245, 205, 60],
];
const SPECTRUM_LIGHT: Rgb[] = [
  [220, 96, 20],
  [214, 36, 96],
  [168, 44, 210],
  [72, 84, 226],
  [10, 136, 214],
  [12, 156, 112],
  [200, 140, 14],
];
const THINK_DARK: Rgb[] = [
  [40, 220, 250],
  [90, 180, 255],
  [140, 150, 255],
  [196, 120, 250],
  [90, 180, 255],
];
const THINK_LIGHT: Rgb[] = [
  [8, 150, 184],
  [30, 118, 220],
  [90, 90, 224],
  [150, 64, 212],
  [30, 118, 220],
];

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const approach = (x: number, target: number, rate: number, dt: number) =>
  x + (target - x) * (1 - Math.exp(-rate * dt));

function sample(stops: Rgb[], pos: number, out: Rgb) {
  const p = (((pos % 1) + 1) % 1) * stops.length;
  const a = stops[Math.floor(p) % stops.length];
  const b = stops[(Math.floor(p) + 1) % stops.length];
  const f = p - Math.floor(p);
  for (let i = 0; i < 3; i++) out[i] = lerp(a[i], b[i], f);
  return out;
}

const bez = (a: number, c: number, b: number, t: number) =>
  (1 - t) * (1 - t) * a + 2 * (1 - t) * t * c + t * t * b;

const STAGE_W = 84;
const STAGE_H = 38;
const R = 18;
const CY = 19;
const CX = 65;
const SPLIT = 46;
const SNAP = 43;
const f2 = (n: number) => Math.round(n * 100) / 100;
const circle = (cx: number) =>
  `M${f2(cx - R)} ${CY}a${R} ${R} 0 1 0 ${R * 2} 0a${R} ${R} 0 1 0 ${-R * 2} 0Z`;

export function blobPath(distance: number) {
  if (distance < 0.35) return circle(CX);
  const a = CX - distance;
  if (distance >= SNAP) return circle(a) + circle(CX);
  const neck = R * (1 - 0.88 * Math.pow(smoothstep(0.14, 1, distance / SNAP), 1.3));
  const m = (a + CX) / 2;
  const p = (m - a) * 0.56;
  const top = CY - R;
  const bot = CY + R;
  const nt = f2(CY - neck);
  const nb = f2(CY + neck);
  return (
    `M${f2(a)} ${top}C${f2(a + p)} ${top} ${f2(m - p)} ${nt} ${f2(m)} ${nt}` +
    `C${f2(m + p)} ${nt} ${f2(CX - p)} ${top} ${CX} ${top}A${R} ${R} 0 0 1 ${CX} ${bot}` +
    `C${f2(CX - p)} ${bot} ${f2(m + p)} ${nb} ${f2(m)} ${nb}` +
    `C${f2(m - p)} ${nb} ${f2(a + p)} ${bot} ${f2(a)} ${bot}A${R} ${R} 0 0 1 ${f2(a)} ${top}Z`
  );
}

type FieldInput = {
  state: VoiceBarState;
  muted: boolean;
  reduced: boolean;
  getLevel?: () => number;
  getSpectrum?: () => ArrayLike<number>;
};

type Comet = {
  sx: number;
  sy: number;
  cx: number;
  cy: number;
  ex: number;
  ey: number;
  age: number;
  delay: number;
  life: number;
  out: boolean;
  rgb: Rgb;
};

type Grain = {
  col: number;
  row: number;
  sx: number;
  sy: number;
  cx: number;
  cy: number;
  age: number;
  delay: number;
  fly: number;
  rgb: Rgb;
};

type Wave = { kind: "ripple" | "wipe" | "tick"; u: number; age: number; life: number; s: number };

function createField(
  canvas: HTMLCanvasElement,
  root: HTMLElement,
  origin: () => HTMLElement | null,
  input: { current: FieldInput },
) {
  const ctx = canvas.getContext("2d")!;
  const grid = document.createElement("canvas");
  const gctx = grid.getContext("2d")!;
  const swatch = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!;
  const dots = document.createElement("canvas");
  const dctx = dots.getContext("2d")!;
  const blob = document.createElement("canvas");
  blob.width = blob.height = 64;
  const bctx = blob.getContext("2d")!;
  const falloff = bctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  falloff.addColorStop(0, "#000");
  falloff.addColorStop(0.45, "#000");
  falloff.addColorStop(1, "rgba(0,0,0,0)");
  bctx.fillStyle = falloff;
  bctx.fillRect(0, 0, 64, 64);
  let img = gctx.createImageData(1, 1);
  let glow = new Float32Array(0);
  let w = 0;
  let h = 0;
  let dpr = 1;
  let cols = 0;
  let rows = 0;
  let cellPx = 3;
  let cellCss = CELL;
  let offY = 0;
  let dark = true;
  let heights = new Float32Array(0);
  let boosts = new Float32Array(0);

  const startIdle = input.current.state === "idle";
  const weight = {
    act: startIdle ? 0 : 1,
    listen: input.current.state === "listening" ? 1 : 0,
    think: input.current.state === "thinking" ? 1 : 0,
    speak: input.current.state === "speaking" ? 1 : 0,
    mute: input.current.muted ? 1 : 0,
  };
  let ignite = startIdle ? 0 : 1;
  let igniteU = 0.9;
  let level = 0;
  let recent = 0;
  let lastOnset = -9;
  let time = 2;
  let hue = 0.4;
  let scan = 0.6;
  const bands = new Float32Array(BANDS);
  const fake = new Float32Array(BANDS);
  let waves: Wave[] = [];
  let comets: Comet[] = [];
  let grains: Grain[] = [];
  const color: Rgb = [0, 0, 0];
  const tmp: Rgb = [0, 0, 0];
  const mixed: Rgb = [0, 0, 0];
  const tint: Rgb = [0, 0, 0];

  const toRgb = (css: string): Rgb => {
    swatch.clearRect(0, 0, 1, 1);
    swatch.fillStyle = "#000";
    swatch.fillStyle = css;
    swatch.fillRect(0, 0, 1, 1);
    const d = swatch.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2]];
  };
  const refreshTheme = () => {
    const [r, g, b] = toRgb(getComputedStyle(root).color);
    dark = 0.2126 * r + 0.7152 * g + 0.0722 * b > 130;
    for (let i = 0; i < 3; i++) tint[i] = dark ? lerp(ACCENT[i], 255, 0.86) : lerp(ACCENT[i], 0, 0.82);
  };
  const stops = () => (dark ? SPECTRUM_DARK : SPECTRUM_LIGHT);
  const thinkStops = () => (dark ? THINK_DARK : THINK_LIGHT);

  // offset sizes, not screen rects, so a scaled parent doesn't skew positions
  const scale = () => root.getBoundingClientRect().width / (root.offsetWidth || 1) || 1;
  const boxOf = (el: HTMLElement) => {
    const a = el.getBoundingClientRect();
    const b = canvas.getBoundingClientRect();
    const s = scale();
    return { x: (a.left - b.left) / s, y: (a.top - b.top) / s, w: a.width / s, h: a.height / s };
  };
  const originPoint = () => {
    const el = origin();
    if (!el) return { x: w - 34, y: h - 32 };
    const b = boxOf(el);
    return { x: clamp(b.x + b.w / 2, 12, w - 12), y: clamp(b.y + b.h / 2, 12, h - 12) };
  };

  const colAt = (x: number) => Math.floor((x * dpr) / cellPx);
  const rowAt = (y: number) => Math.floor((y * dpr - offY) / cellPx);
  const plot = (col: number, row: number, rgb: Rgb, a: number) => {
    if (col < 0 || row < 0 || col >= cols || row >= rows) return;
    const i = (row * cols + col) * 4;
    img.data[i] = rgb[0];
    img.data[i + 1] = rgb[1];
    img.data[i + 2] = rgb[2];
    img.data[i + 3] = a * 255;
    glow[row * cols + col] = Math.max(glow[row * cols + col], a);
  };
  const hot = (rgb: Rgb, k: number): Rgb =>
    dark
      ? [lerp(rgb[0], 255, k), lerp(rgb[1], 255, k), lerp(rgb[2], 255, k)]
      : [rgb[0] * (1 - k * 0.4), rgb[1] * (1 - k * 0.4), rgb[2] * (1 - k * 0.4)];

  const liveColor = (u: number, scanU: number) => {
    sample(stops(), u * 1.45 - hue * 0.22 + 0.05 * Math.sin(u * 7.5 + time * 0.6), color);
    if (weight.think > 0.01) {
      sample(thinkStops(), (u - scanU) * 0.9 + 0.35 - hue * 0.12, tmp);
      for (let i = 0; i < 3; i++) color[i] = lerp(color[i], tmp[i], weight.think);
    }
    return color;
  };

  function fakeSpeech(t: number) {
    const phrase = 0.5 + 0.5 * Math.sin(t * 0.95 + Math.sin(t * 0.37) * 1.3);
    const syllable = Math.pow(Math.max(0, Math.sin(t * 5.3 + Math.sin(t * 1.7) * 2)), 1.4);
    const lv = clamp((phrase < 0.15 ? 0.25 : 1) * (0.3 + 0.6 * syllable * (0.55 + 0.45 * phrase)));
    const formant = 2.5 + Math.sin(t * 2) * 1.5;
    for (let b = 0; b < BANDS; b++) {
      fake[b] = clamp(
        lv * (0.5 + 0.7 * Math.exp(-((b - formant) ** 2) / 4)) * (0.65 + 0.35 * Math.sin(t * 4 + b * 1.3)),
      );
    }
    return lv;
  }

  function frame(dt: number) {
    if (w <= 0 || h <= 0) return false;
    const { state, muted, reduced, getLevel, getSpectrum } = input.current;
    const active = state !== "idle";

    if (reduced) {
      weight.act = active ? 1 : 0;
      weight.listen = state === "listening" ? 1 : 0;
      weight.think = state === "thinking" ? 1 : 0;
      weight.speak = state === "speaking" ? 1 : 0;
      weight.mute = muted ? 1 : 0;
      ignite = 1;
      level = 0.6;
      bands.fill(0.5);
      waves = [];
      comets = [];
      grains = [];
    } else {
      weight.act = approach(weight.act, active ? 1 : 0, active ? 6 : 9, dt);
      weight.listen = approach(weight.listen, state === "listening" ? 1 : 0, 5, dt);
      weight.think = approach(weight.think, state === "thinking" ? 1 : 0, 5, dt);
      weight.speak = approach(weight.speak, state === "speaking" ? 1 : 0, 5, dt);
      weight.mute = approach(weight.mute, muted ? 1 : 0, 5, dt);
      time += dt;
      hue += dt * (0.42 + 0.38 * weight.listen + 0.52 * weight.speak + 0.72 * weight.think);
      scan += dt * (1.8 + weight.think);
      if (active) ignite = Math.min(1, ignite + dt / 0.5);

      const voiced = (state === "listening" && !muted) || state === "speaking";
      let target = 0;
      if (voiced) target = getLevel ? clamp(getLevel()) : fakeSpeech(time + (state === "speaking" ? 2.4 : 0));
      level = approach(level, target, 14, dt);
      if (voiced && level - recent > 0.16 && level > 0.42 && time - lastOnset > 0.65) {
        lastOnset = time;
        waves.push({ kind: "wipe", u: 0.5 + (Math.random() - 0.5) * 0.24, age: 0, life: 0.68, s: 0.42 });
      }
      recent = approach(recent, level, 4.5, dt);
      const spectrum = voiced && getSpectrum ? getSpectrum() : null;
      for (let b = 0; b < BANDS; b++) {
        let v = 0;
        if (spectrum) v = clamp(spectrum[Math.floor((b * spectrum.length) / BANDS)] ?? 0);
        else if (voiced && !getLevel) v = fake[b];
        else if (voiced) v = clamp(level * (0.55 + 0.45 * Math.sin(time * 4.8 + b * 1.5)));
        bands[b] = approach(bands[b], v, v > bands[b] ? 12 : 3.4, dt);
      }
      for (const wv of waves) wv.age += dt;
      waves = waves.filter((wv) => wv.age < wv.life);
    }

    img.data.fill(0);
    glow.fill(0);
    const maxH = Math.min(h * 0.56, 62);
    const scanU = 0.5 + 0.44 * Math.sin(scan);
    const scanDir = Math.cos(scan) >= 0 ? 1 : -1;
    const muteMix = weight.mute * weight.listen;
    const muteRow = cellCss * (1.5 + 0.4 * Math.sin(time * 1.6));
    const t = time;

    if (weight.act > 0.004 || waves.length) {
      for (let c = 0; c < cols; c++) {
        const u = (c + 0.5) / cols;
        const taper = Math.pow(Math.sin(Math.PI * u), 0.52);
        const dist = Math.abs(u - igniteU);
        const lit = smoothstep(dist - 0.14, dist + 0.08, ignite * 1.18);

        let extra = 0;
        let boost = 0;
        for (const wv of waves) {
          const k = wv.age / wv.life;
          const env = Math.sin(Math.PI * Math.pow(k, 0.65)) * wv.s;
          if (wv.kind === "tick") {
            const d = (u - wv.u) / (0.065 + 0.12 * k);
            const g = Math.exp(-d * d) * env;
            extra += g * 16;
            boost += g * 0.55;
          } else {
            const d = (Math.abs(u - wv.u) - k * 1.05) / (wv.kind === "wipe" ? 0.11 : 0.085);
            const ring = Math.exp(-d * d) * env;
            extra += ring * (wv.kind === "ripple" ? 26 : 16);
            boost += ring * 0.6;
          }
        }
        boosts[c] = boost;

        let base = 0;
        if (weight.act > 0.004) {
          const band = bands[clamp(Math.floor(Math.abs(u - 0.5) * 2 * (BANDS - 1)), 0, BANDS - 1)];
          const dome = Math.exp(-((u - 0.5) ** 2) / 0.105);
          const left = Math.exp(-((u - 0.31 - 0.11 * Math.sin(t * 0.9)) ** 2) / 0.022);
          const right = Math.exp(-((u - 0.65 - 0.1 * Math.cos(t * 0.78)) ** 2) / 0.024);
          const ripple = 0.5 + 0.5 * Math.sin(u * 14 - t * 3.1) * Math.cos(u * 7.5 + t * 2.1);
          const listen = lerp(
            (0.18 + 0.46 * dome + 0.24 * left + 0.22 * right + 0.16 * ripple) *
              (0.45 + 0.7 * (0.55 * level + 0.45 * band)),
            muteRow / maxH,
            weight.mute,
          );
          const dx = u - scanU;
          const behind = -dx * scanDir;
          const think = clamp(
            (0.11 + 0.05 * (0.5 + 0.5 * Math.sin(u * 22 - t * 3.8)) +
              0.54 * Math.tanh(Math.exp(-(dx * dx) / 0.07) * 1.45) +
              (behind > 0 ? Math.exp(-behind / 0.36) * 0.34 : 0)) * 0.86,
          );
          const speak = clamp(
            (0.2 + 0.74 * Math.exp(-((u - 0.5) ** 2) / 0.082) + 0.13 * (0.5 + 0.5 * Math.sin(u * 16 + t * 3.8))) *
              (0.48 + 0.65 * (0.6 * level + 0.4 * band)),
          );
          const sum = Math.max(0.001, weight.listen + weight.think + weight.speak);
          const shape = (listen * weight.listen + think * weight.think + speak * weight.speak) / sum;
          // a muted row spans the full width so it reads as a dotted line, not a hump
          base = clamp(shape, 0, 1.14) * maxH * lerp(taper, 1, muteMix) * weight.act * lit;
        }
        heights[c] = Math.min(maxH * 1.3, base + extra * (0.35 + 0.65 * taper));
      }

      const breath = 0.75 + 0.1 * Math.sin(t * 1.6);
      for (let c = 0; c < cols; c++) {
        const ch = heights[c];
        if (ch < 1.2) continue;
        const u = (c + 0.5) / cols;
        liveColor(u, scanU);
        const boost = boosts[c];
        const glint = weight.think > 0.01 ? weight.think * Math.exp(-((u - scanU) ** 2) / 0.012) : 0;
        const top = Math.min(rows, Math.ceil((ch + cellCss) / cellCss));
        for (let r = 0; r < top; r++) {
          const v = ((r + 0.35) * cellCss) / Math.max(cellCss, ch);
          if (v >= 1.04) break;
          const fall = Math.pow(clamp(1 - v), 1.22);
          const shimmer = 0.035 * Math.sin(c * 0.65 + r * 1.15 - t * 5.6);
          let e = clamp(fall + boost * 0.22 * (1 - v * 0.4) + glint * 0.18 * (1 - v) + shimmer * (1 - fall * 0.6));
          if (muteMix > 0.01) e = lerp(e, r === 0 ? breath + boost * 0.3 : 0, muteMix);
          if (e <= 0.01) continue;
          const toTint = smoothstep(COLOR_BAND * 0.6, COLOR_BAND * 1.5, v);
          for (let i = 0; i < 3; i++) mixed[i] = lerp(color[i], tint[i], toTint);
          plot(c, rows - 1 - r, mixed, Math.pow(e, 0.8));
        }
      }
    }

    if (grains.length) {
      for (const g of grains) {
        g.age += dt;
        const tl = g.age - g.delay;
        if (tl < 0) continue;
        if (tl < g.fly) {
          const k = 1 - Math.pow(1 - tl / g.fly, 3);
          const tx = ((g.col + 0.5) * cellPx) / dpr;
          const ty = ((g.row + 0.5) * cellPx + offY) / dpr;
          const k2 = Math.max(0, k - 0.12);
          plot(colAt(bez(g.sx, g.cx, tx, k2)), rowAt(bez(g.sy, g.cy, ty, k2)), g.rgb, 0.45);
          plot(colAt(bez(g.sx, g.cx, tx, k)), rowAt(bez(g.sy, g.cy, ty, k)), hot(g.rgb, 0.6), 1);
          continue;
        }
        const after = tl - g.fly;
        const fade = after < 0.16 ? 0 : (after - 0.16) / 0.34;
        if (fade < 1) plot(g.col, g.row, g.rgb, 1 - fade);
      }
      grains = grains.filter((g) => g.age - g.delay < g.fly + 0.5);
    }

    gctx.putImageData(img, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.filter = `blur(${6 * dpr}px)`;
    ctx.globalAlpha = dark ? 0.55 : 0.28;
    ctx.globalCompositeOperation = dark ? "lighter" : "source-over";
    ctx.drawImage(grid, 0, offY, cols * cellPx, rows * cellPx);
    ctx.restore();
    // soft blobs that swell with brightness and overlap into one liquid mass, then take the wave's color
    dctx.globalCompositeOperation = "source-over";
    dctx.clearRect(0, 0, dots.width, dots.height);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const lv = glow[row * cols + col];
        if (lv < 0.02) continue;
        const d = cellPx * (0.55 + 1.05 * Math.sqrt(lv));
        dctx.drawImage(blob, (col + 0.5) * cellPx - d / 2, offY + (row + 0.5) * cellPx - d / 2, d, d);
      }
    }
    dctx.globalCompositeOperation = "source-in";
    dctx.imageSmoothingEnabled = true;
    dctx.drawImage(grid, 0, offY, cols * cellPx, rows * cellPx);
    ctx.drawImage(dots, 0, 0);

    if (comets.length) {
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (dark) ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";
      for (const cm of comets) {
        cm.age += dt;
        const k = (cm.age - cm.delay) / cm.life;
        if (k < 0 || k >= 1) continue;
        const head = cm.out ? 1 - Math.pow(1 - k, 2.7) : Math.pow(k, 2.35);
        const tail = cm.out ? 1 - Math.pow(1 - Math.max(0, k - 0.14), 2.7) : Math.pow(Math.max(0, k - 0.17), 2.35);
        const hx = bez(cm.sx, cm.cx, cm.ex, head);
        const hy = bez(cm.sy, cm.cy, cm.ey, head);
        const tx = bez(cm.sx, cm.cx, cm.ex, tail);
        const ty = bez(cm.sy, cm.cy, cm.ey, tail);
        const a = cm.out ? Math.sin(Math.PI * Math.min(1, k * 1.05)) : smoothstep(0, 0.12, k) * (1 - smoothstep(0.84, 1, k));
        const [r, g, b] = cm.rgb.map((v) => v | 0);
        const streak = ctx.createLinearGradient(tx, ty, hx, hy);
        streak.addColorStop(0, `rgba(${r},${g},${b},0)`);
        streak.addColorStop(1, `rgba(${r},${g},${b},${(a * 0.9).toFixed(3)})`);
        ctx.strokeStyle = streak;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(hx, hy);
        ctx.stroke();
        const size = 3 * (1 - 0.25 * k);
        const [hr, hg, hb] = hot(cm.rgb, 0.3);
        ctx.globalAlpha = a;
        ctx.fillStyle = `rgb(${hr | 0},${hg | 0},${hb | 0})`;
        ctx.beginPath();
        ctx.arc(hx, hy, size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      comets = comets.filter((cm) => cm.age - cm.delay < cm.life);
      ctx.restore();
    }

    if (reduced) return false;
    return (
      active ||
      weight.act > 0.004 ||
      waves.length > 0 ||
      comets.length > 0 ||
      grains.length > 0
    );
  }

  let raf = 0;
  let last = 0;
  const loop = (now: number) => {
    const dt = last ? Math.min(1 / 24, (now - last) / 1000) : 1 / 60;
    last = now;
    if (frame(dt)) raf = requestAnimationFrame(loop);
    else {
      raf = 0;
      last = 0;
    }
  };
  const wake = () => {
    if (input.current.reduced) frame(0);
    else if (!raf) raf = requestAnimationFrame(loop);
  };

  const resize = () => {
    const nw = canvas.offsetWidth;
    const nh = canvas.offsetHeight;
    if (!nw || !nh) return;
    w = nw;
    h = nh;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    cellPx = Math.max(2, Math.round(CELL * dpr));
    cellCss = cellPx / dpr;
    cols = Math.ceil(canvas.width / cellPx);
    rows = Math.ceil(canvas.height / cellPx);
    offY = canvas.height - rows * cellPx;
    grid.width = cols;
    grid.height = rows;
    img = gctx.createImageData(cols, rows);
    dots.width = canvas.width;
    dots.height = canvas.height;
    glow = new Float32Array(cols * rows);
    heights = new Float32Array(cols);
    boosts = new Float32Array(cols);
    refreshTheme();
    frame(0);
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  const mo = new MutationObserver(() => {
    refreshTheme();
    frame(0);
  });
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme"] });
  if (input.current.state !== "idle") wake();

  return {
    wake,
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mo.disconnect();
    },
    transition(prev: VoiceBarState, next: VoiceBarState) {
      if (input.current.reduced || !w) return wake();
      const o = originPoint();
      const ou = clamp(o.x / w);
      if (prev === "idle" && next !== "idle") {
        ignite = 0;
        igniteU = ou;
        const count = clamp(Math.round(w / 20), 16, 28);
        const palette = next === "thinking" ? thinkStops() : stops();
        comets = [];
        for (let i = 0; i < count; i++) {
          const u = clamp(0.05 + ((i + 0.3 + Math.random() * 0.4) / count) * 0.88, 0.04, 0.95);
          const ex = u * w;
          const sx = o.x + (Math.random() - 0.5) * 12;
          comets.push({
            sx,
            sy: o.y + (Math.random() - 0.5) * 10,
            cx: lerp(sx, ex, 0.34) - (sx - ex) * 0.06,
            cy: h - 1 + Math.random() * 4,
            ex,
            ey: h - 2 - Math.random() * 12,
            age: 0,
            delay: (1 - u) * 0.08 + Math.random() * 0.06,
            life: 0.34 + Math.abs(ou - u) * 0.26 + Math.random() * 0.07,
            out: true,
            rgb: sample(palette, u * 1.35 - hue * 0.22, [0, 0, 0]),
          });
        }
      }
      if (prev !== "idle" && next === "idle") {
        grains = [];
        const count = clamp(Math.round(w / 17), 18, 32);
        const palette = weight.think > 0.5 ? thinkStops() : stops();
        const peak = Math.min(h * 0.42, 46);
        comets = [];
        for (let i = 0; i < count; i++) {
          const u = clamp(0.06 + (i / (count - 1)) * 0.8 + (Math.random() - 0.5) * 0.05, 0.04, 0.9);
          const sx = u * w;
          const ex = o.x + (Math.random() - 0.5) * 8;
          comets.push({
            sx,
            sy: h - 2.5 - Math.random() * peak * (0.25 + 0.75 * Math.sin(Math.PI * u)),
            cx: lerp(sx, ex, 0.75),
            cy: h - 2 - Math.random() * 7,
            ex,
            ey: o.y + (Math.random() - 0.5) * 8,
            age: 0,
            delay: (1 - u) * 0.055 + Math.random() * 0.075,
            life: 0.34 + (1 - u) * 0.2 + Math.random() * 0.07,
            out: false,
            rgb: sample(palette, u * 1.35 - hue * 0.22, [0, 0, 0]),
          });
        }
      }
      wake();
    },
    pulse({ kind = "ripple", origin: from, strength = 0.85 }: VoiceBarPulse = {}) {
      if (input.current.reduced || !w) return;
      let u = 0.5;
      let ox = w / 2;
      let oy = h - 24;
      if (typeof from === "number") {
        u = clamp(from);
        ox = u * w;
        oy = h - 6;
      } else if (from) {
        const b = boxOf(from);
        ox = clamp(b.x + b.w / 2, 10, w - 10);
        oy = clamp(b.y + b.h / 2, 10, h - 10);
        u = ox / w;
      }
      if (waves.length > 10) waves.shift();
      waves.push({ kind, u, age: 0, life: kind === "tick" ? 0.34 : kind === "wipe" ? 0.55 : 0.72, s: clamp(strength, 0.2, 1.4) });
      if (kind === "ripple") {
        const dir = u < 0.5 ? 1 : -1;
        for (let i = 0; i < 7; i++) {
          const tu = clamp(u + (0.14 + (i / 6) * 0.42 + Math.random() * 0.08) * dir, 0.05, 0.95);
          const sx = ox + (Math.random() - 0.5) * 10;
          const ex = tu * w;
          comets.push({
            sx,
            sy: oy + (Math.random() - 0.5) * 8,
            cx: lerp(sx, ex, 0.38),
            cy: h - 1,
            ex,
            ey: h - 2 - Math.random() * 10,
            age: 0,
            delay: i * 0.015,
            life: 0.28 + Math.random() * 0.16,
            out: true,
            rgb: sample(stops(), tu * 1.4 - hue * 0.22, [0, 0, 0]),
          });
        }
      }
      wake();
    },
    condense(el: HTMLElement) {
      const text = el.textContent?.trim();
      if (input.current.reduced || !w || !cols || !text) return 0;
      const b = boxOf(el);
      if (b.w <= 0) return 0;
      const c0 = colAt(b.x);
      const r0 = rowAt(b.y);
      const mw = colAt(b.x + b.w) - c0 + 2;
      const mh = rowAt(b.y + b.h) - r0 + 2;
      const mask = document.createElement("canvas");
      mask.width = mw;
      mask.height = mh;
      const m = mask.getContext("2d", { willReadFrequently: true });
      if (!m) return 0;
      // one mask pixel per lattice cell, so the word lands on the same grid as the wave
      const cs = getComputedStyle(el);
      m.font = `${cs.fontStyle} ${cs.fontWeight} ${parseFloat(cs.fontSize) / cellCss}px ${cs.fontFamily}`;
      m.textBaseline = "middle";
      m.fillText(text, (b.x * dpr) / cellPx - c0, (b.y * dpr - offY) / cellPx - r0 + b.h / cellCss / 2);
      const data = m.getImageData(0, 0, mw, mh).data;
      const added: Grain[] = [];
      for (let y = 0; y < mh; y++) {
        for (let x = 0; x < mw; x++) {
          if (data[(y * mw + x) * 4 + 3] < 96) continue;
          const col = c0 + x;
          const row = r0 + y;
          const tx = ((col + 0.5) * cellPx) / dpr;
          const ty = ((row + 0.5) * cellPx + offY) / dpr;
          const sx = clamp(tx + (Math.random() - 0.5) * 64, 4, w - 4);
          const sy = h - 3 - Math.random() * Math.min(26, h * 0.25);
          added.push({
            col,
            row,
            sx,
            sy,
            cx: lerp(sx, tx, 0.7),
            cy: Math.min(sy, ty) - 14 - Math.random() * 18,
            age: 0,
            delay: (x / mw) * 0.16 + Math.random() * 0.05,
            fly: 0.42 * (0.8 + Math.random() * 0.4),
            rgb: sample(stops(), (sx / w) * 1.45 - hue * 0.22, [0, 0, 0]),
          });
        }
      }
      grains = grains.concat(added).slice(-1400);
      wake();
      return 380;
    },
  };
}

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
function useReducedMotion() {
  return React.useSyncExternalStore(
    (onChange) => {
      const q = window.matchMedia(REDUCED_QUERY);
      q.addEventListener("change", onChange);
      return () => q.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false,
  );
}

function useControllable<T>(value: T | undefined, initial: T, onChange?: (v: T) => void) {
  const [own, setOwn] = React.useState(initial);
  const set = React.useCallback(
    (next: T) => {
      if (value === undefined) setOwn(next);
      onChange?.(next);
    },
    [value, onChange],
  );
  return [value ?? own, set] as const;
}

const reveal = (el: HTMLElement, delay = 0) =>
  el.animate(
    [
      { opacity: 0, filter: "blur(4px)", transform: "translateY(3px)" },
      { opacity: 1, filter: "blur(0px)", transform: "none" },
    ],
    { duration: 340, delay, easing: EASE, fill: "backwards" },
  );

function Transcript({
  text,
  reduced,
  onWord,
}: {
  text: string;
  reduced: boolean;
  onWord?: (el: HTMLElement) => number;
}) {
  const ref = React.useRef<HTMLParagraphElement>(null);
  const shown = React.useRef(0);
  const words = text.trim().split(/\s+/).filter(Boolean);

  React.useLayoutEffect(() => {
    const spans = Array.from(ref.current?.children ?? []) as HTMLElement[];
    const fresh = spans.slice(Math.min(shown.current, spans.length));
    shown.current = spans.length;
    if (reduced) return;
    for (const el of fresh) reveal(el, onWord?.(el) ?? 0);
  }, [text, reduced, onWord]);

  return (
    <p ref={ref} className="text-[15px] leading-[1.45] tracking-[-0.01em] text-foreground">
      {words.map((word, i) => (
        <React.Fragment key={i}>
          <span className="inline-block">{word}</span>{" "}
        </React.Fragment>
      ))}
    </p>
  );
}

function Status({ text, thinking, reduced }: { text: string; thinking: boolean; reduced: boolean }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    reveal(el);
    if (!thinking) return;
    const sheen = el.animate([{ backgroundPosition: "100% 0" }, { backgroundPosition: "-100% 0" }], {
      duration: 1600,
      iterations: Infinity,
    });
    return () => sheen.cancel();
  }, [text, thinking, reduced]);
  return (
    <span
      ref={ref}
      className={cn(
        "inline-block text-[15px] tracking-[-0.01em] text-muted-foreground",
        thinking &&
          !reduced &&
          "bg-[linear-gradient(90deg,var(--muted-foreground)_35%,var(--foreground)_50%,var(--muted-foreground)_65%)] bg-[length:200%_100%] bg-clip-text text-transparent",
      )}
    >
      {text}
    </span>
  );
}

function Fold({ show, reduced, children }: { show: boolean; reduced: boolean; children: React.ReactNode }) {
  const [kept, setKept] = React.useState(children);
  if (show && children !== kept) setKept(children);
  return (
    <div
      aria-hidden={!show || undefined}
      inert={!show || undefined}
      className="grid"
      style={{
        gridTemplateRows: show ? "1fr" : "0fr",
        opacity: show ? 1 : 0,
        transition: reduced ? "none" : `grid-template-rows 340ms ${EASE}, opacity ${show ? 260 : 140}ms ${EASE}`,
      }}
    >
      <div className="min-h-0 overflow-hidden">{show ? children : kept}</div>
    </div>
  );
}

function WaveformIcon() {
  return (
    <svg viewBox="0 0 18 18" fill="currentColor" aria-hidden="true" className="size-[17px]">
      <rect x="2.25" y="7" width="1.9" height="4" rx="0.95" />
      <rect x="6.05" y="4.5" width="1.9" height="9" rx="0.95" />
      <rect x="9.85" y="2.75" width="1.9" height="12.5" rx="0.95" />
      <rect x="13.65" y="6" width="1.9" height="6" rx="0.95" />
    </svg>
  );
}

function Icon({ on, reduced, turn, children }: { on: boolean; reduced: boolean; turn?: boolean; children: React.ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className="absolute inset-0 flex items-center justify-center"
      style={{
        opacity: on ? 1 : 0,
        filter: on ? "blur(0px)" : "blur(3px)",
        transform: on ? "none" : turn ? "rotate(-45deg) scale(0.6)" : "scale(0.6)",
        transition: reduced ? "none" : `opacity 200ms ${EASE}, filter 200ms ${EASE}, transform 260ms ${EASE}`,
      }}
    >
      {children}
    </span>
  );
}

const PRESS =
  "transition-transform duration-150 active:scale-[0.94] motion-reduce:transition-none outline-none focus-visible:ring-2 focus-visible:ring-ring/60";

function SplitControls({
  active,
  canSend,
  muted,
  disabled,
  reduced,
  primaryRef,
  micRef,
  onPrimary,
  onMic,
}: {
  active: boolean;
  canSend: boolean;
  muted: boolean;
  disabled: boolean;
  reduced: boolean;
  primaryRef: React.RefObject<HTMLButtonElement | null>;
  micRef: React.RefObject<HTMLButtonElement | null>;
  onPrimary: () => void;
  onMic: () => void;
}) {
  const pathRef = React.useRef<SVGPathElement>(null);
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const spring = React.useRef({ x: active ? SPLIT : 0, v: 0, raf: 0 });
  const [initial] = React.useState(() => blobPath(active ? SPLIT : 0));

  React.useLayoutEffect(() => {
    const paint = (d: number) => {
      pathRef.current?.setAttribute("d", blobPath(clamp(d, 0, SPLIT + 4)));
      const wrap = wrapRef.current;
      if (!wrap) return;
      const p = clamp(d / SPLIT);
      wrap.style.transform = `translate3d(${f2(SPLIT - d)}px,0,0) scale(${f2(0.7 + 0.3 * p)})`;
      wrap.style.opacity = `${f2(smoothstep(0.18, 0.72, p))}`;
    };
    const s = spring.current;
    const target = active ? SPLIT : 0;
    cancelAnimationFrame(s.raf);
    if (reduced) {
      s.x = target;
      s.v = 0;
      return paint(target);
    }
    let last = 0;
    const step = (now: number) => {
      const dt = last ? Math.min(1 / 30, (now - last) / 1000) : 1 / 60;
      last = now;
      s.v += (-195 * (s.x - target) - 23 * s.v) * dt;
      s.x += s.v * dt;
      if (Math.abs(s.x - target) < 0.06 && Math.abs(s.v) < 0.06) {
        s.x = target;
        s.v = 0;
        return paint(target);
      }
      paint(s.x);
      s.raf = requestAnimationFrame(step);
    };
    paint(s.x);
    s.raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(s.raf);
  }, [active, reduced]);

  const send = !active && canSend;

  return (
    <div className="relative shrink-0 select-none" style={{ width: STAGE_W, height: STAGE_H }}>
      <svg viewBox={`0 0 ${STAGE_W} ${STAGE_H}`} aria-hidden="true" className="pointer-events-none absolute inset-0 size-full overflow-visible">
        <path
          ref={pathRef}
          d={initial}
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
          className={cn(
            "transition-[fill,stroke] duration-200 motion-reduce:transition-none",
            send ? "fill-primary stroke-transparent" : "fill-muted stroke-border",
          )}
        />
      </svg>
      <div ref={wrapRef} className={cn("absolute top-px left-px size-9", !active && "pointer-events-none")}>
        <button
          ref={micRef}
          type="button"
          inert={!active || undefined}
          disabled={disabled}
          aria-label={muted ? "Unmute microphone" : "Mute microphone"}
          aria-pressed={muted}
          onClick={onMic}
          className={cn(
            "relative flex size-full cursor-pointer items-center justify-center rounded-full hover:bg-foreground/[0.06] disabled:cursor-default disabled:opacity-45",
            muted ? "text-muted-foreground" : "text-foreground",
            PRESS,
          )}
        >
          <Icon on={!muted} reduced={reduced}>
            <Mic className="size-4" strokeWidth={1.9} />
          </Icon>
          <Icon on={muted} reduced={reduced}>
            <MicOff className="size-4" strokeWidth={1.9} />
          </Icon>
        </button>
      </div>
      <button
        ref={primaryRef}
        type="button"
        disabled={disabled}
        aria-label={active ? "End voice mode" : canSend ? "Send prompt" : "Start voice mode"}
        onClick={onPrimary}
        className={cn(
          "absolute top-px right-px flex size-9 cursor-pointer items-center justify-center rounded-full disabled:cursor-default disabled:opacity-45",
          send ? "text-primary-foreground hover:bg-white/10" : "text-foreground hover:bg-foreground/[0.06]",
          PRESS,
        )}
      >
        <Icon on={!active && !canSend} reduced={reduced}>
          <WaveformIcon />
        </Icon>
        <Icon on={send} reduced={reduced}>
          <ArrowUp className="size-4" strokeWidth={2.2} />
        </Icon>
        <Icon on={active} reduced={reduced} turn>
          <X className="size-4" strokeWidth={2.1} />
        </Icon>
      </button>
    </div>
  );
}

const crossfade = (on: boolean, reduced: boolean): React.CSSProperties => ({
  opacity: on ? 1 : 0,
  filter: on ? "blur(0px)" : "blur(4px)",
  transform: on ? "none" : "translateY(3px)",
  transition: reduced
    ? "none"
    : on
      ? `opacity 300ms ${EASE} 70ms, filter 300ms ${EASE} 70ms, transform 320ms ${EASE} 70ms`
      : "opacity 140ms ease-out, filter 140ms ease-out, transform 140ms ease-out",
});

export function VoiceBar({
  ref,
  state: stateProp,
  defaultState = "idle",
  onStateChange,
  value: valueProp,
  defaultValue = "",
  onValueChange,
  onSubmit,
  onVoiceStart,
  onCancel,
  muted: mutedProp,
  defaultMuted = false,
  onMutedChange,
  transcript,
  attachments,
  error,
  getLevel,
  getSpectrum,
  leading,
  onAttach,
  placeholder = "Ask me anything...",
  disabled = false,
  className,
  onKeyDown,
  ...props
}: VoiceBarProps) {
  const reduced = useReducedMotion();
  const [state, setState] = useControllable(stateProp, defaultState, onStateChange);
  const [text, setText] = useControllable(valueProp, defaultValue, onValueChange);
  const [muted, setMuted] = useControllable(mutedProp, defaultMuted, onMutedChange);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const shownError = error ?? submitError;

  const rootRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const primaryRef = React.useRef<HTMLButtonElement>(null);
  const micRef = React.useRef<HTMLButtonElement>(null);
  const attachRef = React.useRef<HTMLButtonElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const fieldRef = React.useRef<ReturnType<typeof createField> | null>(null);
  const fieldInput = React.useRef<FieldInput>({ state, muted, reduced, getLevel, getSpectrum });
  const lastState = React.useRef(state);

  React.useLayoutEffect(() => {
    fieldInput.current = { state, muted, reduced, getLevel, getSpectrum };
  });

  React.useEffect(() => {
    const field = createField(canvasRef.current!, rootRef.current!, () => primaryRef.current, fieldInput);
    fieldRef.current = field;
    return () => {
      field.destroy();
      fieldRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    const prev = lastState.current;
    lastState.current = state;
    if (prev !== state) fieldRef.current?.transition(prev, state);
    else fieldRef.current?.wake();
  }, [state, muted, reduced]);

  React.useImperativeHandle(ref, () => ({ pulse: (p) => fieldRef.current?.pulse(p) }), []);

  const active = state !== "idle";
  const canSend = !active && text.trim().length > 0;

  const end = () => {
    setMuted(false);
    setState("idle");
    onCancel?.();
  };

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    setSubmitError(null);
    const result = onSubmit?.(trimmed);
    setText("");
    if (!(result instanceof Promise)) return;
    setState("thinking");
    const uncontrolled = stateProp === undefined;
    result.then(
      () => uncontrolled && setState("idle"),
      (err: unknown) => {
        // give the prompt back so a failed request never loses what was typed
        setText(trimmed);
        setSubmitError(err instanceof Error && err.message ? err.message : "Something went wrong. Try again.");
        if (uncontrolled) setState("idle");
      },
    );
  };

  const onPrimary = () => {
    if (disabled) return;
    setSubmitError(null);
    if (active) return end();
    if (canSend) return submit();
    setMuted(false);
    setState("listening");
    onVoiceStart?.();
  };

  const onMic = () => {
    if (disabled || !active) return;
    fieldRef.current?.pulse({ kind: "wipe", origin: micRef.current, strength: 0.72 });
    if (state === "thinking" || state === "speaking") {
      setMuted(false);
      setState("listening");
    } else setMuted(!muted);
  };

  const onType = (next: string) => {
    if (submitError) setSubmitError(null);
    setText(next);
    if (active || !next) return;
    const line = next.slice(0, inputRef.current?.selectionStart ?? next.length).split("\n").pop() ?? "";
    fieldRef.current?.pulse({ kind: "tick", origin: clamp(0.07 + line.length * 0.018, 0.08, 0.78), strength: 0.55 });
  };

  const status =
    state === "thinking"
      ? "Thinking..."
      : state === "speaking"
        ? "Speaking..."
        : muted
          ? "Muted"
          : "Listening...";

  const condense = React.useCallback((el: HTMLElement) => fieldRef.current?.condense(el) ?? 0, []);
  const showTranscript = active && Boolean(transcript?.trim());

  return (
    <div
      ref={rootRef}
      data-slot="voice-bar"
      data-state={state}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || event.key !== "Escape" || !active) return;
        event.preventDefault();
        end();
        primaryRef.current?.focus();
      }}
      className={cn(
        "relative isolate flex min-h-[112px] w-full flex-col justify-between overflow-clip rounded-[26px] border border-border bg-card text-card-foreground shadow-[inset_0_0.5px_0_rgb(255_255_255/0.8)] dark:shadow-[inset_0_0.5px_0_rgb(255_255_255/0.07)]",
        className,
      )}
      {...props}
    >
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 size-full" />

      <Fold show={Boolean(attachments)} reduced={reduced}>
        <div className="relative z-10 flex flex-wrap items-center gap-1.5 px-4 pt-3.5">{attachments}</div>
      </Fold>

      <div className={cn("relative z-10 grid min-w-0 px-4 pb-1.5", attachments ? "pt-2" : "pt-3.5")}>
        <div
          aria-hidden={active || undefined}
          inert={active || undefined}
          className={cn("w-full [grid-area:1/1]", active && "pointer-events-none")}
          style={crossfade(!active, reduced)}
        >
          {/* an invisible copy of the text sizes the cell, so the prompt grows line by line up to six lines */}
          <div className="grid w-full text-[16px] leading-[1.45] tracking-[-0.01em] sm:text-[15px]">
            <span aria-hidden="true" className="invisible max-h-[8.7em] overflow-hidden whitespace-pre-wrap [overflow-wrap:anywhere] [grid-area:1/1]">
              {text + "​"}
            </span>
            <textarea
              ref={inputRef}
              rows={1}
              value={text}
              disabled={disabled}
              placeholder={placeholder}
              aria-label={placeholder}
              onChange={(e) => onType(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return;
                e.preventDefault();
                submit();
              }}
              className="max-h-[8.7em] w-full resize-none overflow-y-auto bg-transparent p-0 text-foreground outline-none [overflow-wrap:anywhere] [scrollbar-width:thin] [grid-area:1/1] placeholder:text-muted-foreground/80 disabled:opacity-50"
              style={{ font: "inherit", letterSpacing: "inherit" }}
            />
          </div>
        </div>

        <div
          aria-hidden={!active || undefined}
          className={cn("w-full [grid-area:1/1]", !active && "pointer-events-none")}
          style={crossfade(active, reduced)}
        >
          {showTranscript ? (
            <Transcript
              text={transcript!}
              reduced={reduced}
              onWord={state === "listening" || state === "speaking" ? condense : undefined}
            />
          ) : (
            <Status key={status} text={status} thinking={state === "thinking"} reduced={reduced} />
          )}
        </div>
      </div>

      <Fold show={Boolean(shownError)} reduced={reduced}>
        <p role="alert" className="relative z-10 px-4 pb-1 text-[12.5px] leading-5 text-red-600 dark:text-red-400">
          {shownError}
        </p>
      </Fold>

      <div className="relative z-10 flex items-center justify-between gap-2 px-3 pt-1.5 pb-3">
        <div className="flex min-w-0 items-center gap-2">
          {leading !== undefined ? (
            leading
          ) : (
            <button
              ref={attachRef}
              type="button"
              disabled={disabled}
              aria-label="Add attachment"
              onClick={() => {
                if (disabled) return;
                fieldRef.current?.pulse({ kind: "ripple", origin: attachRef.current, strength: 0.85 });
                onAttach?.();
              }}
              className={cn(
                "flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-muted text-foreground hover:bg-accent disabled:cursor-default disabled:opacity-45",
                PRESS,
              )}
            >
              <Plus className="size-[17px]" strokeWidth={1.9} />
            </button>
          )}
        </div>
        <SplitControls
          active={active}
          canSend={canSend}
          muted={muted}
          disabled={disabled}
          reduced={reduced}
          primaryRef={primaryRef}
          micRef={micRef}
          onPrimary={onPrimary}
          onMic={onMic}
        />
      </div>

      <span className="sr-only" role="status" aria-live="polite">
        {active ? status : ""}
      </span>
    </div>
  );
}

const SILENT = new Float32Array(BANDS);

export function useVoiceAudio(stream: MediaStream | null | undefined) {
  const meter = React.useRef<{ level: () => number; spectrum: () => Float32Array } | null>(null);

  React.useEffect(() => {
    if (!stream) return;
    const context = new AudioContext();
    const analyser = context.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.35;
    analyser.minDecibels = -85;
    analyser.maxDecibels = -25;
    context.createMediaStreamSource(stream).connect(analyser);
    const wave = new Uint8Array(analyser.fftSize);
    const freq = new Uint8Array(analyser.frequencyBinCount);
    const bands = new Float32Array(BANDS);
    const binHz = context.sampleRate / analyser.fftSize;
    // log-spaced bands from 80 Hz to 8 kHz, roughly how speech spreads out
    const edges = Array.from({ length: BANDS + 1 }, (_, i) => Math.max(1, Math.round((80 * Math.pow(100, i / BANDS)) / binHz)));
    let level = 0;
    meter.current = {
      level() {
        analyser.getByteTimeDomainData(wave);
        let sum = 0;
        for (const v of wave) sum += ((v - 128) / 128) ** 2;
        const next = Math.min(1, Math.pow(Math.sqrt(sum / wave.length) * 4, 0.8));
        level += (next - level) * (next > level ? 0.6 : 0.2);
        return level;
      },
      spectrum() {
        analyser.getByteFrequencyData(freq);
        for (let b = 0; b < BANDS; b++) {
          const lo = edges[b];
          const hi = Math.max(lo + 1, edges[b + 1]);
          let sum = 0;
          for (let i = lo; i < hi && i < freq.length; i++) sum += freq[i];
          const v = Math.pow(sum / (hi - lo) / 255, 1.4);
          bands[b] += (v - bands[b]) * (v > bands[b] ? 0.6 : 0.2);
        }
        return bands;
      },
    };
    void context.resume().catch(() => {});
    return () => {
      meter.current = null;
      void context.close().catch(() => {});
    };
  }, [stream]);

  return React.useMemo(
    () => ({
      getLevel: () => meter.current?.level() ?? 0,
      getSpectrum: (): ArrayLike<number> => meter.current?.spectrum() ?? SILENT,
    }),
    [],
  );
}
