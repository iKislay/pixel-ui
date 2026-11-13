"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import {
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Mesh,
  PerspectiveCamera,
  Raycaster,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  Vector4,
  WebGLRenderer,
} from "three";
import { cn } from "@/lib/utils";

export type CorridorItem = { title: string; meta: string; color: string };

export type GalleryCorridorProps = Omit<ComponentProps<"div">, "children"> & {
  items?: CorridorItem[];
};

type Surface = "floor" | "right" | "ceil" | "left";
type Place = { surface: Surface; s0: number; s1: number; t0: number; t1: number; tc: number; iw: number; ih: number };
type Piece = {
  index: number;
  echo: boolean;
  place: Place;
  mesh: Mesh<BufferGeometry, ShaderMaterial>;
  center: Vector3;
  color: Color;
  on: number;
  onAt: number;
  hover: number;
};

const DEFAULT_ITEMS: CorridorItem[] = [
  { title: "Ember Field", meta: "Live visuals · Lowlands · 2026", color: "#ff6a3d" },
  { title: "Velvet Static", meta: "LED ceiling · Hamburg · 2026", color: "#8b7bff" },
  { title: "Night Rain", meta: "Station wall · Utrecht · 2025", color: "#3dd6ff" },
  { title: "Beat Rings", meta: "Floor projection · Amsterdam · 2025", color: "#f2f2f2" },
  { title: "Tidewater", meta: "Live data · Rotterdam · 2025", color: "#46f0b4" },
  { title: "Afterburn", meta: "Stage backdrop · Brussels · 2024", color: "#ff3d6e" },
  { title: "Lilac Hour", meta: "Immersive room · Paris · 2024", color: "#c9a7ff" },
  { title: "Signal Loss", meta: "Video wall · Hilversum · 2024", color: "#ffb23d" },
  { title: "Halo", meta: "Exhibition identity · Ghent · 2023", color: "#9fd7c8" },
  { title: "Groundwater", meta: "Generative print · Antwerp · 2023", color: "#7cff6b" },
];

const CELL = 0.8;
const TW = 6 * CELL;
const TH = 5 * CELL;
const PERIM = 2 * (TW + TH);
const EDGE: Record<Surface, number> = { floor: 0, right: TW, ceil: TW + TH, left: 2 * TW + TH };
const START = 9.2;
const SPACING = 7 * CELL;
const BACK = 4.6;
const EYE = 0.12;
const LIGHTS = 24;
const INTRO = 2.3;
const OPEN = 1.05;
const VEIL = 0.18;
const SURFACES: Surface[] = ["right", "left", "ceil", "floor"];
const ECHO: Record<Surface, [Surface, Surface]> = {
  left: ["floor", "ceil"],
  right: ["ceil", "floor"],
  floor: ["right", "left"],
  ceil: ["left", "right"],
};
const THEMES = {
  dark: { bg: "#000000", surf: "#030304", line: "#ffffff", lineA: 0.6, off: "#060607", dark: 1, dim: 0.72 },
  light: { bg: "#ececea", surf: "#f4f4f2", line: "#161616", lineA: 0.34, off: "#e4e4e1", dark: 0, dim: 0.6 },
};

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const smooth = (x: number) => x * x * (3 - 2 * x);
const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const pad = (n: number) => String(n).padStart(2, "0");

const spine = (t: number, out = new Vector3()) =>
  out.set(5.5 * Math.sin(t * 0.05) + 1.6 * Math.sin(t * 0.12 + 1), 1.3 * Math.sin(t * 0.06 + 0.5), -t);
const bend = (t: number) => -5.5 * 0.0025 * Math.sin(t * 0.05) - 1.6 * 0.0144 * Math.sin(t * 0.12 + 1);

function frameAt(t: number) {
  const tangent = new Vector3(
    0.275 * Math.cos(t * 0.05) + 0.192 * Math.cos(t * 0.12 + 1),
    0.078 * Math.cos(t * 0.06 + 0.5),
    -1,
  ).normalize();
  const up = new Vector3(0, 1, 0).addScaledVector(tangent, -tangent.y).normalize();
  const right = new Vector3().crossVectors(tangent, up).normalize();
  return { center: spine(t), up, right };
}

function onWall(s: number, t: number) {
  const f = frameAt(t);
  const q = ((s % PERIM) + PERIM) % PERIM;
  const [x, y, nx, ny] =
    q < EDGE.right
      ? [-TW / 2 + q, -TH / 2, 0, 1]
      : q < EDGE.ceil
        ? [TW / 2, -TH / 2 + q - EDGE.right, -1, 0]
        : q < EDGE.left
          ? [TW / 2 - (q - EDGE.ceil), TH / 2, 0, -1]
          : [-TW / 2, TH / 2 - (q - EDGE.left), 1, 0];
  return {
    p: f.center.addScaledVector(f.right, x).addScaledVector(f.up, y),
    n: f.right.multiplyScalar(nx).addScaledVector(f.up, ny),
  };
}

function placeFor(i: number, echo: boolean): Place {
  const main = SURFACES[i % SURFACES.length];
  const surface = echo ? ECHO[main][i % 2] : main;
  const wall = surface === "left" || surface === "right";
  const w = echo ? 2 : wall ? [4, 2, 3][i % 3] : 3;
  const h = echo ? 2 : wall ? 3 : 2;
  const at = echo ? (wall ? 1 + (i % 2) : 1 + 3 * ((i >> 1) % 2)) : wall ? 1 : 2;
  // even widths sit half a cell over so their edges land on grid lines
  const tc = START + i * SPACING + (echo ? SPACING / 2 : w % 2 === 0 ? CELL / 2 : 0);
  const s0 = EDGE[surface] + at * CELL;
  return {
    surface,
    s0,
    s1: s0 + h * CELL,
    t0: tc - (w * CELL) / 2,
    t1: tc + (w * CELL) / 2,
    tc,
    iw: (wall ? w : h) * CELL,
    ih: (wall ? h : w) * CELL,
  };
}

// art uv to wall coordinates, oriented so every piece reads upright from the walkway
function wallST(pl: Place, u: number, v: number): [number, number] {
  const s = (k: number) => pl.s0 + (pl.s1 - pl.s0) * k;
  const t = (k: number) => pl.t0 + (pl.t1 - pl.t0) * k;
  if (pl.surface === "floor") return [s(u), t(v)];
  if (pl.surface === "ceil") return [s(1 - u), t(v)];
  if (pl.surface === "right") return [s(v), t(1 - u)];
  return [s(1 - v), t(u)];
}

function grid(cols: number, rows: number, vertex: (c: number, r: number) => { p: Vector3; n: Vector3; uv: [number, number] }) {
  const pos: number[] = [];
  const nrm: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (let r = 0; r <= rows; r++)
    for (let c = 0; c <= cols; c++) {
      const v = vertex(c, r);
      pos.push(v.p.x, v.p.y, v.p.z);
      nrm.push(v.n.x, v.n.y, v.n.z);
      uv.push(...v.uv);
    }
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const a = r * (cols + 1) + c;
      const b = a + cols + 1;
      idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
  return { pos, nrm, uv, idx };
}

function buildTunnel(length: number) {
  const geo = new BufferGeometry();
  const pos: number[] = [];
  const nrm: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const rows = Math.ceil((length + 4) / 0.3);
  for (const [a, b] of [
    [0, TW],
    [TW, TW + TH],
    [TW + TH, 2 * TW + TH],
    [2 * TW + TH, PERIM],
  ]) {
    const cols = Math.round((b - a) / 0.4);
    const g = grid(cols, rows, (c, r) => {
      const s = a + ((b - a) * c) / cols;
      const t = -4 + r * 0.3;
      // nudge corner vertices inside this side so they take its normal
      const { p, n } = onWall(s + (c === 0 ? 1e-4 : c === cols ? -1e-4 : 0), t);
      return { p, n, uv: [s, t] };
    });
    const base = pos.length / 3;
    pos.push(...g.pos);
    nrm.push(...g.nrm);
    uv.push(...g.uv);
    for (const i of g.idx) idx.push(i + base);
  }
  geo.setAttribute("position", new Float32BufferAttribute(pos, 3));
  geo.setAttribute("normal", new Float32BufferAttribute(nrm, 3));
  geo.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  return geo;
}

function buildPanel(pl: Place) {
  const g = grid(24, 18, (c, r) => {
    const u = c / 24;
    const v = r / 18;
    const { p, n } = onWall(...wallST(pl, u, v));
    return { p, n, uv: [u, v] };
  });
  const geo = new BufferGeometry();
  geo.setAttribute("position", new Float32BufferAttribute(g.pos, 3));
  geo.setAttribute("aNormal", new Float32BufferAttribute(g.nrm, 3));
  geo.setAttribute("uv", new Float32BufferAttribute(g.uv, 2));
  geo.setIndex(g.idx);
  return geo;
}

const TUNNEL_VERTEX = /* glsl */ `
uniform vec4 uOpenRect;
uniform float uOpenK;
varying vec2 vST;
varying vec3 vW;
varying float vDepth;
void main() {
  vST = uv;
  vec2 d = uv - (uOpenRect.xy + uOpenRect.zw) * 0.5;
  // the wall round an opened piece gives way a little
  vec3 p = position - normal * uOpenK * 0.6 * exp(-dot(d, d) / 3.5);
  vW = p;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;

const TUNNEL_FRAGMENT = /* glsl */ `
uniform vec3 uBg;
uniform vec3 uSurf;
uniform vec3 uLine;
uniform float uLineA;
uniform float uDark;
uniform float uCamT;
uniform float uReveal;
uniform float uDim;
uniform vec4 uOpenRect;
uniform float uOpenK;
uniform vec3 uOpenCol;
uniform vec3 uLP[${LIGHTS}];
uniform vec3 uLC[${LIGHTS}];
varying vec2 vST;
varying vec3 vW;
varying float vDepth;
void main() {
  vec2 oc = (uOpenRect.xy + uOpenRect.zw) * 0.5;
  vec2 d = vST - oc;
  vec2 st = oc + d * (1.0 - 0.5 * uOpenK * exp(-dot(d, d) / 5.0));
  vec2 g = st / ${CELL.toFixed(2)};
  vec2 fw = fwidth(g);
  vec2 q = abs(fract(g - 0.5) - 0.5);
  vec2 l = 1.0 - smoothstep(fw * 0.35, fw * 1.05, q);
  float cells = max(l.x, l.y);
  // far cells shrink under a pixel: fade the lines before they shimmer
  float line = cells * (1.0 - smoothstep(0.32, 0.75, max(fw.x, fw.y)));

  vec3 glow = vec3(0.0);
  float glowK = 0.0;
  for (int i = 0; i < ${LIGHTS}; i++) {
    vec3 L = uLP[i] - vW;
    float k = exp(-dot(L, L) / 3.2);
    glow += uLC[i] * k;
    glowK += max(uLC[i].r, max(uLC[i].g, uLC[i].b)) * k;
  }
  glowK = min(glowK, 1.0);
  vec3 tint = glow / max(glowK, 1e-3);
  vec3 surf = uSurf + glow * 0.16 * uDark;
  surf = mix(surf, surf * mix(vec3(1.0), tint, 0.5), glowK * 0.35 * (1.0 - uDark));
  vec3 ink = mix(uLine, mix(uLine, tint, 0.75), glowK * mix(0.8, 0.9, uDark));
  float a = mix(uLineA, 1.0, glowK * 0.5);

  vec2 rd = max(uOpenRect.xy - vST, vST - uOpenRect.zw);
  float out_ = max(rd.x, rd.y);
  float inside = step(out_, 0.0);
  float rim = exp(-pow(max(out_, 0.0) * 9.0, 2.0)) * (1.0 - inside * 0.6);
  ink = mix(ink, uOpenCol, rim * uOpenK);
  line = max(line, rim * uOpenK * 0.9);
  surf = mix(surf, mix(surf, uOpenCol, 0.08 + 0.1 * uDark), inside * uOpenK);

  float ahead = vST.y - uCamT;
  float shown = 1.0 - smoothstep(uReveal - 2.5, uReveal, ahead);
  float front = exp(-pow((ahead - uReveal + 1.2) * 0.9, 2.0)) * step(uReveal, 150.0);
  line = line * shown + cells * front * 0.9;
  ink = mix(ink, uLine, front * (1.0 - uDark) * 0.5);
  a = max(a, front);

  vec3 col = mix(surf, ink, line * a);
  col = mix(col, uBg, smoothstep(10.0, 62.0, vDepth));
  col = mix(col, uBg, uDim);
  gl_FragColor = vec4(col, 1.0);
}`;

const PANEL_VERTEX = /* glsl */ `
attribute vec3 aNormal;
uniform vec3 uFlatO;
uniform vec3 uFlatX;
uniform vec3 uFlatY;
uniform vec2 uSize;
uniform float uK;
uniform float uHover;
varying vec2 vUv;
varying float vDepth;
varying float vK;
void main() {
  vUv = uv;
  vec3 p = position + aNormal * (0.014 + uHover * 0.05);
  // peel: one edge lets go first and the rest follows
  float k = clamp(uK * 1.45 - uv.x * 0.45, 0.0, 1.0);
  k = k * k * (3.0 - 2.0 * k);
  vec3 f = uFlatO + uFlatX * (uv.x - 0.5) * uSize.x + uFlatY * (uv.y - 0.5) * uSize.y;
  p = mix(p, f, k) + aNormal * sin(k * 3.14159) * 0.55;
  vK = k;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;

const PANEL_FRAGMENT = /* glsl */ `
uniform float uGen;
uniform float uTime;
uniform float uOn;
uniform float uHover;
uniform float uDim;
uniform vec2 uSize;
uniform vec4 uCrop;
uniform vec3 uBg;
uniform vec3 uOff;
uniform vec3 uTint;
varying vec2 vUv;
varying float vDepth;
varying float vK;

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.02 + 7.1; a *= 0.5; }
  return v;
}

vec3 art(vec2 uv) {
  float t = uTime;
  vec2 p = (uv - 0.5) * vec2(uSize.x / uSize.y, 1.0);
  if (uGen < 0.5) {
    // glow: soft lights wandering in the dark
    vec3 c = vec3(0.02, 0.01, 0.015);
    for (int i = 0; i < 3; i++) {
      float k = float(i);
      vec2 o = vec2(sin(t * 0.23 + k * 2.3) * 0.42, cos(t * 0.19 + k * 1.9) * 0.24);
      c += mix(uTint, vec3(1.0, 0.8, 0.4), k * 0.4) * exp(-dot(p - o, p - o) * 7.0) * 0.9;
    }
    return c + (hash(uv * 700.0 + t) - 0.5) * 0.05;
  }
  if (uGen < 1.5) {
    // marble: warped noise through a colour wheel
    vec2 q = vec2(fbm(p * 2.0 + t * 0.06), fbm(p * 2.0 + 4.0 - t * 0.05));
    float f = fbm(p * 1.6 + q * 2.2 + t * 0.03);
    vec3 wheel = 0.5 + 0.5 * cos(6.283 * (f * 1.3 + q.x * 0.4 + vec3(0.0, 0.33, 0.67)));
    return mix(vec3(0.03), uTint, smoothstep(0.2, 0.8, f)) + wheel * 0.35 * f;
  }
  if (uGen < 2.5) {
    // rain: columns of light sliding down at their own pace
    float cx = floor(uv.x * 40.0);
    float y = fract(hash(vec2(cx, 1.0)) - uv.y - t * (0.05 + hash(vec2(cx, 3.0)) * 0.2));
    float trail = smoothstep(0.2, 1.0, y) * step(0.3 + hash(vec2(cx, 7.0)) * 0.4, y);
    vec3 c = mix(uTint, vec3(1.0, 0.3, 0.85), hash(vec2(cx, 9.0)) * 0.6) * trail + step(0.985, y) * 0.8;
    return c * (0.85 + 0.15 * step(0.5, fract(uv.y * 150.0))) + vec3(0.01, 0.015, 0.03);
  }
  if (uGen < 3.5) {
    // rings: two ripple fields beating against each other
    vec2 a = vec2(sin(t * 0.13) * 0.18, cos(t * 0.1) * 0.12);
    float m = smoothstep(-0.2, 0.2, sin(length(p - a) * 110.0) * sin(length(p + a) * 110.0));
    return mix(vec3(0.02), mix(vec3(0.92), uTint, 0.35), m);
  }
  // contour: drifting height lines of a noise field
  float n = fbm(p * 1.8 + vec2(t * 0.05, 0.0));
  float lit = smoothstep(0.75, 1.0, sin((p.y + n * 0.9) * 70.0 + t * 1.2)) * (0.4 + n);
  return vec3(0.0, 0.02, 0.02) + uTint * lit + vec3(1.0) * pow(lit, 6.0) * 0.6;
}

void main() {
  vec3 c = art(vUv * uCrop.xy + uCrop.zw) * 0.96 + 0.015;
  vec2 e = min(vUv, 1.0 - vUv) * uSize;
  float edge = min(e.x, e.y);
  c *= 0.9 + 0.1 * smoothstep(0.0, 0.35, edge);
  c = mix(c, uTint, (1.0 - smoothstep(0.0, 0.012, edge)) * (0.35 + uHover * 0.65));
  c += uHover * 0.06;
  c = mix(uOff, c, uOn);
  c = mix(c, uBg, smoothstep(10.0, 62.0, vDepth) * (1.0 - vK));
  c = mix(c, uBg, uDim * (1.0 - vK));
  gl_FragColor = vec4(c, 1.0);
}`;

const isDark = (el: Element) => {
  const probe = document.createElement("canvas").getContext("2d");
  if (!probe) return true;
  probe.fillStyle = getComputedStyle(el).color;
  probe.fillRect(0, 0, 1, 1);
  const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
  return 0.299 * r + 0.587 * g + 0.114 * b > 128;
};

type Api = { go: (i: number) => void; open: (i: number | null) => void };

function GalleryCorridor({ items = DEFAULT_ITEMS, className, ...props }: GalleryCorridorProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const api = useRef<Api | null>(null);
  const [active, setActive] = useState(0);
  const [opened, setOpened] = useState<number | null>(null);
  const [hovering, setHovering] = useState(false);
  const n = items.length;

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas || !n) return;

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    } catch {
      // shortcut: without webgl only the captions and index work, add a flat grid of tiles if that matters
      return;
    }
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const scene = new Scene();
    const camera = new PerspectiveCamera(55, 1, 0.05, 140);
    const ray = new Raycaster();

    const tunnel = new Mesh(
      buildTunnel(START + (n - 1) * SPACING + 60),
      new ShaderMaterial({
        vertexShader: TUNNEL_VERTEX,
        fragmentShader: TUNNEL_FRAGMENT,
        side: DoubleSide,
        uniforms: {
          uBg: { value: new Color() },
          uSurf: { value: new Color() },
          uLine: { value: new Color() },
          uLineA: { value: 0.6 },
          uDark: { value: 1 },
          uCamT: { value: 0 },
          uReveal: { value: 0 },
          uDim: { value: 0 },
          uOpenRect: { value: new Vector4(-99, -99, -98, -98) },
          uOpenK: { value: 0 },
          uOpenCol: { value: new Color() },
          uLP: { value: Array.from({ length: LIGHTS }, () => new Vector3(0, -999, 0)) },
          uLC: { value: Array.from({ length: LIGHTS }, () => new Vector3()) },
        },
      }),
    );
    tunnel.frustumCulled = false;
    scene.add(tunnel);

    const makePiece = (index: number, echo: boolean): Piece => {
      const place = placeFor(index, echo);
      const color = new Color(items[index].color);
      const mesh = new Mesh(
        buildPanel(place),
        new ShaderMaterial({
          vertexShader: PANEL_VERTEX,
          fragmentShader: PANEL_FRAGMENT,
          side: DoubleSide,
          uniforms: {
            uGen: { value: index % 5 },
            uTime: { value: 0 },
            uOn: { value: 0 },
            uHover: { value: 0 },
            uDim: { value: 0 },
            uSize: { value: new Vector2(place.iw, place.ih) },
            uCrop: {
              value: echo ? new Vector4(0.5, 0.5, 0.12 + hash(index) * 0.36, 0.14 + hash(index + 5) * 0.36) : new Vector4(1, 1, 0, 0),
            },
            uBg: { value: new Color() },
            uOff: { value: new Color() },
            uTint: { value: color },
            uFlatO: { value: new Vector3() },
            uFlatX: { value: new Vector3(1, 0, 0) },
            uFlatY: { value: new Vector3(0, 1, 0) },
            uK: { value: 0 },
          },
        }),
      );
      mesh.frustumCulled = false;
      mesh.userData.index = index;
      scene.add(mesh);
      const mid = onWall(...wallST(place, 0.5, 0.5));
      return { index, echo, place, mesh, center: mid.p.addScaledVector(mid.n, 0.5), color, on: 0, onAt: -1, hover: 0 };
    };
    const pieces = items.map((_, i) => makePiece(i, false));
    const echoes = items.map((_, i) => makePiece(i, true));
    const all = [...pieces, ...echoes];

    let w = 1;
    let h = 1;
    let raf = 0;
    let last = 0;
    let visible = true;
    let time = 0;
    let artTime = 0;
    let target = 0;
    let settled = 0;
    let p = 0;
    let vel = 0;
    let roll = 0;
    let activeIdx = -1;
    let hoverIdx = -1;
    let openIdx: number | null = null;
    let shown = 0;
    let openT = 0;
    let openDir = 0;
    let veil = motionQuery.matches ? 1 : 0;
    let veilDir = motionQuery.matches ? -1 : 0;
    let onCut: (() => void) | null = null;
    let snapTimer = 0;
    let dimK = THEMES.dark.dim;
    let dark = true;
    const pointer = new Vector2();
    const look = new Vector2();
    const bx = new Vector3();
    const by = new Vector3();
    const bz = new Vector3();
    const tmp = new Vector3();
    const gaze = new Vector3();
    const ZERO = new Vector2();

    // reduced motion swaps every camera move for a quick fade through the background
    const cut = (fn: () => void) => {
      if (!motionQuery.matches) return fn();
      onCut = fn;
      veilDir = 1;
    };

    const settle = () => {
      const d = target - settled;
      if (Math.abs(d) >= 0.02) {
        const next = clamp(settled + Math.sign(d), 0, n - 1);
        settled = (d > 0 && target <= next) || (d < 0 && target >= next) ? next : clamp(Math.round(target), 0, n - 1);
      }
      target = settled;
    };
    const go = (i: number) => {
      clearTimeout(snapTimer);
      settled = target = clamp(i, 0, n - 1);
    };
    const open = (i: number | null) => {
      if (i !== null) go(i);
      setOpened(i);
      setHover(-1);
      cut(() => {
        if (i !== null && openIdx !== null && i !== shown) openT = 0;
        if (i !== null) shown = i;
        openIdx = i;
        openDir = i === null ? -1 : 1;
        if (motionQuery.matches) {
          openT = i === null ? 0 : 1;
          openDir = 0;
        }
      });
    };
    api.current = { go, open };

    const setHover = (i: number) => {
      if (i === hoverIdx) return;
      hoverIdx = i;
      setHovering(i >= 0);
    };

    const syncTheme = () => {
      dark = isDark(root);
      const t = dark ? THEMES.dark : THEMES.light;
      dimK = t.dim;
      renderer.setClearColor(t.bg, 1);
      const u = tunnel.material.uniforms;
      u.uBg.value.set(t.bg);
      u.uSurf.value.set(t.surf);
      u.uLine.value.set(t.line);
      u.uLineA.value = t.lineA;
      u.uDark.value = t.dark;
      for (const pc of all) {
        pc.mesh.material.uniforms.uBg.value.set(t.bg);
        pc.mesh.material.uniforms.uOff.value.set(t.off);
      }
    };

    const flicker = (pc: Piece, seed: number) => {
      if (pc.onAt < 0 || time < pc.onAt) return 0;
      const age = time - pc.onAt;
      if (motionQuery.matches || age > 0.5) return 1;
      return hash(Math.floor(age * 26) + seed) > 0.45 ? 0.35 + age * 1.3 : 0.05;
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = clamp((now - last) / 1000, 0, 0.05);
      last = now;
      time += dt;
      const still = motionQuery.matches;
      if (!still) artTime += dt;

      if (veilDir) {
        veil = clamp(veil + (veilDir * dt) / VEIL, 0, 1);
        if (veil === 1) {
          onCut?.();
          onCut = null;
          veilDir = -1;
        } else if (veil === 0) veilDir = 0;
      }

      const prev = p;
      if (still) {
        if (Math.abs(settled - p) > 1e-3 && !veilDir) cut(() => (p = settled));
      } else p += (target - p) * (1 - Math.exp(-dt * 4));
      vel += ((p - prev) / Math.max(dt, 1e-4) - vel) * (1 - Math.exp(-dt * 6));
      const nearest = clamp(Math.round(p), 0, n - 1);
      if (nearest !== activeIdx) setActive((activeIdx = nearest));

      const intro = still ? 1 : clamp(time / INTRO, 0, 1);
      const reveal = still ? 999 : 1 + Math.pow(intro, 2.2) * 150;
      if (openDir) {
        openT = clamp(openT + (openDir * dt) / OPEN, 0, 1);
        if (openT === 0 || openT === 1) openDir = 0;
      }
      const ob = easeInOut(openT);

      // camera: trails the walk, starts a little back and glides in during the intro
      const camT = START + p * SPACING - BACK - (1 - easeInOut(intro)) * 3.2;
      const fr = frameAt(camT);
      camera.position.copy(fr.center).addScaledVector(fr.up, EYE);
      const portrait = w / h < 0.85;
      const a = clamp(Math.floor(p), 0, n - 1);
      const b = clamp(a + 1, 0, n - 1);
      const lean = (i: number) => {
        const pc = pieces[i];
        const k = pc.place.surface === "floor" || pc.place.surface === "ceil" ? 0.85 : portrait ? 0.7 : 0.32;
        return pc.center.clone().sub(spine(pc.place.tc, tmp)).multiplyScalar(k);
      };
      gaze.copy(lean(a)).lerp(lean(b), smooth(clamp(p - a, 0, 1)));
      look.lerp(still ? ZERO : pointer, 1 - Math.exp(-dt * 3));
      spine(camT + 8, tmp).add(gaze).addScaledVector(fr.right, look.x * 0.9).addScaledVector(fr.up, look.y * 0.5);
      camera.up.copy(fr.up);
      camera.lookAt(tmp);
      const lean2 = still ? 0 : clamp(bend(camT + 4) * 6, -0.05, 0.05) + clamp(-vel * 0.006, -0.025, 0.025);
      roll += (lean2 - roll) * (1 - Math.exp(-dt * 2.5));
      camera.rotateZ(roll);
      const fov = (portrait ? 70 : 55) + (still ? 0 : clamp(Math.abs(vel) * 2.2, 0, 7));
      if (Math.abs(camera.fov - fov) > 0.01) {
        camera.fov = fov;
        camera.updateProjectionMatrix();
      }
      camera.updateMatrixWorld();
      bx.setFromMatrixColumn(camera.matrixWorld, 0);
      by.setFromMatrixColumn(camera.matrixWorld, 1);
      bz.setFromMatrixColumn(camera.matrixWorld, 2);
      const tan = Math.tan((camera.fov * Math.PI) / 360);

      const tu = tunnel.material.uniforms;
      all.forEach((pc, k) => {
        const u = pc.mesh.material.uniforms;
        if (pc.onAt < 0 && reveal > pc.place.tc - camT + 1)
          pc.onAt = time + (still ? 0 : (pc.echo ? 0.2 : 0.12) + hash(pc.index + (pc.echo ? 40 : 0)) * (pc.echo ? 0.5 : 0.45));
        pc.on = Math.min(1, flicker(pc, pc.index * (pc.echo ? 17 : 13)));
        pc.hover += ((hoverIdx === pc.index && openIdx === null ? 1 : 0) - pc.hover) * (1 - Math.exp(-dt * 10));
        const isOpen = !pc.echo && pc.index === shown && openT > 0;
        if (isOpen) {
          // fit the flat piece into a slot: centred on wide screens, higher and wider on tall ones
          const [sx, sy, fw, fh] = portrait ? [0, 0.14, 0.88, 0.48] : [0, 0.08, 0.56, 0.62];
          const { iw, ih } = pc.place;
          const dist = Math.max(ih / (2 * tan * fh), iw / (2 * tan * camera.aspect * fw));
          u.uFlatO.value
            .copy(camera.position)
            .addScaledVector(bz, -dist)
            .addScaledVector(bx, sx * dist * tan * camera.aspect)
            .addScaledVector(by, sy * dist * tan);
          u.uFlatX.value.copy(bx).addScaledVector(bz, look.x * 0.12).normalize();
          u.uFlatY.value.copy(by).addScaledVector(bz, look.y * 0.1).normalize();
        }
        u.uK.value = isOpen ? ob : 0;
        u.uOn.value = Math.max(pc.on, u.uK.value);
        u.uHover.value = pc.hover;
        u.uTime.value = pc.echo ? artTime * 0.8 + pc.index * 3.1 + 40 : artTime + pc.index * 7.3;
        u.uDim.value = Math.max(isOpen ? 0 : ob * (dimK + 0.08), veil);
        pc.mesh.renderOrder = isOpen ? 2 : 0;
        pc.mesh.material.depthTest = !isOpen;
        if (!pc.echo && k < LIGHTS) {
          tu.uLP.value[k].copy(pc.center);
          const glow = pc.on * (1 - (isOpen ? ob : 0)) * (0.8 + pc.hover * 0.6) * (dark ? 1 : 0.9);
          tu.uLC.value[k].set(pc.color.r, pc.color.g, pc.color.b).multiplyScalar(glow);
        }
      });
      const sp = pieces[shown].place;
      tu.uOpenK.value = openT > 0 ? ob : 0;
      tu.uOpenRect.value.set(sp.s0, sp.t0, sp.s1, sp.t1);
      tu.uOpenCol.value.copy(pieces[shown].color);
      tu.uCamT.value = camT;
      tu.uReveal.value = reveal;
      tu.uDim.value = Math.max(ob * dimK, veil);
      renderer.render(scene, camera);
    };

    const run = () => {
      cancelAnimationFrame(raf);
      if (!visible) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };

    const resize = () => {
      w = Math.max(1, root.clientWidth);
      h = Math.max(1, root.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, w < 760 ? 1.75 : 2));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    const pick = (x: number, y: number) => {
      const rect = canvas.getBoundingClientRect();
      ray.setFromCamera(new Vector2(((x - rect.left) / rect.width) * 2 - 1, -((y - rect.top) / rect.height) * 2 + 1), camera);
      const hit = ray
        .intersectObjects(all.filter((pc) => pc.on > 0.5).map((pc) => pc.mesh), false)
        .find((i) => i.distance < 26);
      return hit ? (hit.object.userData.index as number) : -1;
    };

    const onWheel = (e: WheelEvent) => {
      if (openIdx !== null) return e.preventDefault();
      const delta = (Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX) * (e.deltaMode === 1 ? 16 : 1);
      const next = clamp(target + delta / 700, 0, n - 1);
      // at either end, hand the wheel back to the page
      if (next === target) return;
      e.preventDefault();
      target = next;
      clearTimeout(snapTimer);
      snapTimer = window.setTimeout(settle, 180);
    };

    const drag = { id: -1, y: 0, moved: false };
    const onDown = (e: PointerEvent) => {
      drag.id = e.pointerId;
      drag.y = e.clientY;
      drag.moved = false;
      canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -(((e.clientY - rect.top) / rect.height) * 2 - 1));
      if (drag.id === e.pointerId && e.buttons) {
        const dy = e.clientY - drag.y;
        if (!drag.moved && Math.abs(dy) > 5) drag.moved = true;
        if (drag.moved && openIdx === null) {
          target = clamp(target - (dy * 2.2) / h, 0, n - 1);
          drag.y = e.clientY;
        }
        return;
      }
      if (e.pointerType === "mouse" && openIdx === null) setHover(pick(e.clientX, e.clientY));
    };
    const onUp = (e: PointerEvent) => {
      if (drag.id !== e.pointerId) return;
      drag.id = -1;
      if (drag.moved) return settle();
      if (openIdx !== null) return open(null);
      const i = pick(e.clientX, e.clientY);
      if (i >= 0) open(i);
    };
    const onLeave = () => {
      pointer.set(0, 0);
      setHover(-1);
    };

    const onKey = (e: KeyboardEvent) => {
      const k = e.key;
      if (openIdx !== null) {
        if (k === "Escape") open(null);
        else if (k === "ArrowRight" || k === "ArrowDown") open((openIdx + 1) % n);
        else if (k === "ArrowLeft" || k === "ArrowUp") open((openIdx - 1 + n) % n);
        else return;
      } else if (["ArrowDown", "ArrowRight", "PageDown"].includes(k)) go(settled + 1);
      else if (["ArrowUp", "ArrowLeft", "PageUp"].includes(k)) go(settled - 1);
      else if (k === "Home") go(0);
      else if (k === "End") go(n - 1);
      else if ((k === "Enter" || k === " ") && e.target === root) open(settled);
      else return;
      e.preventDefault();
    };

    const themeObserver = new MutationObserver(syncTheme);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme"] });
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(root);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      run();
    });
    intersection.observe(root);
    root.addEventListener("wheel", onWheel, { passive: false });
    root.addEventListener("keydown", onKey);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("pointerleave", onLeave);
    syncTheme();
    resize();
    run();

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(snapTimer);
      api.current = null;
      themeObserver.disconnect();
      resizeObserver.disconnect();
      intersection.disconnect();
      root.removeEventListener("wheel", onWheel);
      root.removeEventListener("keydown", onKey);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("pointerleave", onLeave);
      for (const m of [tunnel, ...all.map((pc) => pc.mesh)]) {
        m.geometry.dispose();
        m.material.dispose();
      }
      renderer.dispose();
    };
  }, [items, n]);

  const shown = opened ?? active;
  const item = items[shown];
  if (!item) return null;

  return (
    <MotionConfig reducedMotion="user">
      <div
        ref={rootRef}
        data-slot="gallery-corridor"
        tabIndex={0}
        role="group"
        aria-roledescription="carousel"
        aria-label={`A corridor of ${n} pieces. Scroll, drag or use the arrow keys to walk, Enter to open the one in front of you.`}
        className={cn(
          "relative isolate overflow-hidden text-foreground outline-none select-none touch-none focus-visible:ring-2 focus-visible:ring-ring",
          hovering && "cursor-pointer",
          className,
        )}
        {...props}
      >
        <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block size-full" />

        <div aria-live="polite" className="pointer-events-none absolute inset-x-0 bottom-0 p-5 sm:p-8 lg:p-10">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={shown}
              initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="font-mono text-[11px] tracking-widest tabular-nums">
                {pad(shown + 1)} <span className="opacity-50">/ {pad(n)}</span>
              </p>
              <h2 className="mt-1 max-w-[14ch] text-4xl leading-[0.95] font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
                {item.title}
              </h2>
              <p className="mt-3 flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase opacity-70 sm:text-[11px]">
                <span className="size-2 shrink-0 rounded-[2px]" style={{ background: item.color }} />
                {item.meta}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <ol
          aria-label="Pieces"
          className={cn(
            "absolute top-1/2 right-3 flex -translate-y-1/2 flex-col items-end gap-0.5 transition-opacity duration-300 sm:right-6",
            opened !== null && "pointer-events-none opacity-30",
          )}
        >
          {items.map((it, i) => (
            <li key={i}>
              <button
                type="button"
                aria-label={it.title}
                aria-current={i === active ? "true" : undefined}
                onClick={() => api.current?.go(i)}
                className="group flex h-4 items-center gap-2 font-mono text-[10px] tracking-widest uppercase outline-none"
              >
                <span
                  className={cn(
                    "hidden transition-opacity duration-300 sm:inline",
                    i === active ? "opacity-100" : "opacity-0 group-hover:opacity-60 group-focus-visible:opacity-60",
                  )}
                >
                  {it.title}
                </span>
                <span
                  className={cn(
                    "h-px bg-current transition-[width,opacity] duration-300",
                    i === active ? "w-6 opacity-100 sm:w-8" : "w-3 opacity-40 group-hover:opacity-80",
                  )}
                />
              </button>
            </li>
          ))}
        </ol>

        <AnimatePresence>
          {opened !== null && (
            <motion.button
              type="button"
              onClick={() => api.current?.open(null)}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="absolute top-4 right-4 rounded-full border border-current/20 bg-background/40 px-4 py-1.5 text-sm font-medium backdrop-blur-md sm:top-6 sm:right-6"
            >
              Close
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}

export { GalleryCorridor };
