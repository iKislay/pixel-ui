"use client";

import { useEffect, useRef, type ComponentProps } from "react";
import { bindFullscreenQuad, createProgram } from "@/lib/webgl";
import { cn } from "@/lib/utils";

type RGB = [number, number, number];
type Theme = { hud: RGB; body: RGB; scan: [RGB, RGB, RGB]; render: [RGB, RGB, RGB]; shine: RGB };
type Point = { ux: number; uy: number; side: number; wing: number; big: boolean; x: number; y: number };

const TAU = Math.PI * 2;
const TRACKED = 25;
const LABEL_EVERY = 4;
const COLUMNS = 42;
const CELL_ASPECT = 1.5;
const FLAP_HZ = 0.3;
const RIPPLES = 4;
const RIPPLE_SPEED = 220;
const RIPPLE_LIFE = 1.6;
const RIPPLE_EVERY = 3;
const GLOW_RADIUS = 42;
// center x, center y, radius x, radius y, rotation, in wing units
const FORE = [0.573, -0.284, 0.64, 0.24, -0.46];
const HIND = [0.45, 0.38, 0.46, 0.3, 0.35];
const HIND_BOX = [0, 0.06, 0.9, 0.7];
const BODY = [-0.3, 0.5];

const THEMES: Record<"dark" | "light", Theme> = {
  dark: {
    hud: [225, 235, 245],
    body: [70, 100, 255],
    scan: [
      [28, 92, 80],
      [150, 255, 215],
      [70, 235, 230],
    ],
    render: [
      [52, 92, 255],
      [140, 96, 255],
      [236, 120, 226],
    ],
    shine: [255, 240, 255],
  },
  light: {
    hud: [30, 34, 52],
    body: [45, 65, 200],
    scan: [
      [120, 190, 172],
      [0, 130, 105],
      [0, 150, 170],
    ],
    render: [
      [45, 75, 225],
      [125, 60, 220],
      [205, 70, 180],
    ],
    shine: [40, 20, 110],
  },
};

const VERTEX = `
attribute vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAGMENT = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;
uniform float uDpr;
uniform vec2 uCell;
uniform vec2 uPos;
uniform vec2 uTilt;
uniform float uScale;
uniform vec2 uOpen;
uniform float uTime;
uniform vec3 uPointer;
uniform vec4 uRipple[${RIPPLES}];
uniform vec3 uScan[3];
uniform vec3 uRender[3];
uniform vec3 uBody;
uniform vec3 uShine;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float ellipse(vec2 p, vec2 c, vec2 r, float a) {
  vec2 d = p - c;
  vec2 q = vec2(d.x * cos(a) + d.y * sin(a), d.y * cos(a) - d.x * sin(a)) / r;
  return length(q);
}

void main() {
  vec2 frag = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 cell = floor(frag / uCell);
  vec2 f = frag / uCell - cell - 0.5;
  vec2 center = (cell + 0.5) * uCell / uDpr;

  vec2 d = center - uPos;
  vec2 l = vec2(d.x * uTilt.x + d.y * uTilt.y, d.y * uTilt.x - d.x * uTilt.y) / uScale;
  float ax = abs(l.x);
  vec2 uf = vec2(ax / uOpen.x, l.y);
  vec2 uh = vec2(ax / uOpen.y, l.y);
  float ef = ellipse(uf, vec2(${FORE[0]}, ${FORE[1]}), vec2(${FORE[2]}, ${FORE[3]}), ${FORE[4]});
  float eh = ellipse(uh, vec2(${HIND[0]}, ${HIND[1]}), vec2(${HIND[2]}, ${HIND[3]}), ${HIND[4]});
  bool body = ax * uScale < uCell.x / uDpr && l.y > ${BODY[0]} && l.y < ${BODY[1]};
  bool fore = ef < 1.0;
  if (!body && !fore && eh >= 1.0) discard;
  float e = fore ? ef : eh;
  vec2 u = fore ? uf : uh;

  float ring = 0.0;
  for (int i = 0; i < ${RIPPLES}; i++) {
    float gap = (distance(center, uRipple[i].xy) - uRipple[i].z) / 16.0;
    ring += uRipple[i].w * exp(-gap * gap);
  }
  ring = min(ring, 1.0);
  float near = distance(center, uPointer.xy) / ${GLOW_RADIUS}.0;
  float glow = uPointer.z * exp(-near * near);

  float h1 = hash(cell);
  float h2 = hash(cell + 17.0);
  vec3 col;
  float a;
  if (body) {
    col = mix(uBody, uShine, 0.35 * h2 + 0.4 * glow);
    a = 0.95;
  } else if (l.x < 0.0) {
    float density = 1.0 - 0.85 * smoothstep(0.2, 1.0, e) + ring + glow;
    if (h1 > density) discard;
    float spark = step(0.92, hash(cell + floor(uTime * 3.0 + h1 * 8.0)));
    col = mix(uScan[0], uScan[1], spark);
    a = mix(0.55 + 0.4 * h2, 1.0, spark);
    float lit = clamp(ring + 0.7 * glow, 0.0, 1.0);
    col = mix(col, uScan[2], lit);
    a = max(a, lit);
  } else {
    float k = clamp(smoothstep(0.6, 1.25, length(u)) + 0.3 * smoothstep(0.8, 1.0, e), 0.0, 1.0);
    col = k < 0.5 ? mix(uRender[0], uRender[1], k * 2.0) : mix(uRender[1], uRender[2], k * 2.0 - 1.0);
    float band = (u.x * 0.9 - u.y * 0.5 - 0.5 - 0.35 * sin(uTime * 0.7)) * 5.0;
    float sheen = 0.5 * exp(-band * band);
    col = mix(col, uShine, clamp(sheen + 0.85 * ring + 0.5 * glow, 0.0, 0.9));
    a = 0.72 + 0.28 * h2;
  }

  vec2 q = abs(f) - vec2(0.22, 0.28);
  float led = 1.0 - smoothstep(0.1, 0.18, length(max(q, 0.0)));
  a *= led;
  gl_FragColor = vec4(col * a, a);
}`;

const fract = (v: number) => v - Math.floor(v);
const hash = (i: number) => fract(Math.sin(i * 12.9898 + 78.233) * 43758.5453);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const rgba = ([r, g, b]: RGB, a: number) => `rgba(${r},${g},${b},${a})`;
const unit = (colors: RGB[]) => colors.flatMap((c) => c.map((v) => v / 255));

function buildPoints() {
  const points: Point[] = [];
  for (let k = 0; k < TRACKED - 1; k++) {
    const [cx, cy, rx, ry, rot] = (k >> 1) % 2 ? HIND : FORE;
    const a = ((k >> 2) / 6) * TAU + hash(k) * 0.8;
    const reach = 0.5 + 0.45 * hash(k + 40);
    const ex = Math.cos(a) * rx * reach;
    const ey = Math.sin(a) * ry * reach;
    points.push({
      ux: Math.max(0.08, cx + ex * Math.cos(rot) - ey * Math.sin(rot)),
      uy: cy + ex * Math.sin(rot) + ey * Math.cos(rot),
      side: k % 2 ? 1 : -1,
      wing: (k >> 1) % 2,
      big: k % 5 === 0,
      x: 0,
      y: 0,
    });
  }
  points.push({ ux: 0, uy: -0.05, side: 1, wing: 0, big: false, x: 0, y: 0 });
  return points;
}

// paints the text color to read it back as rgb, since browsers may report lab() or oklch()
const isDark = (el: Element) => {
  const probe = document.createElement("canvas").getContext("2d");
  if (!probe) return true;
  probe.fillStyle = getComputedStyle(el).color;
  probe.fillRect(0, 0, 1, 1);
  const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
  return 0.299 * r + 0.587 * g + 0.114 * b > 128;
};

function TrackedButterflyAscii({ className, ...props }: ComponentProps<"div">) {
  const glRef = useRef<HTMLCanvasElement>(null);
  const hudRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const glCanvas = glRef.current;
    const hudCanvas = hudRef.current;
    const ctx = hudCanvas?.getContext("2d");
    if (!glCanvas || !hudCanvas || !ctx) return;

    const points = buildPoints();
    const thorax = points[TRACKED - 1];
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");

    // shortcut: without webgl only the overlay draws, add a 2d cell painter if that ever matters
    const gl = glCanvas.getContext("webgl", { premultipliedAlpha: true, antialias: false });
    const compiled = gl && createProgram(gl, VERTEX, FRAGMENT);
    let quad: WebGLBuffer | null = null;
    const uniform = (name: string) => (gl && compiled ? gl.getUniformLocation(compiled.program, name) : null);
    if (gl && compiled) {
      gl.useProgram(compiled.program);
      quad = bindFullscreenQuad(gl, compiled.program, "aPos");
    }
    const loc = {
      res: uniform("uRes"),
      dpr: uniform("uDpr"),
      cell: uniform("uCell"),
      pos: uniform("uPos"),
      tilt: uniform("uTilt"),
      scale: uniform("uScale"),
      open: uniform("uOpen"),
      time: uniform("uTime"),
      pointer: uniform("uPointer"),
      ripple: uniform("uRipple"),
      scan: uniform("uScan"),
      render: uniform("uRender"),
      body: uniform("uBody"),
      shine: uniform("uShine"),
    };

    let w = 0;
    let h = 0;
    let dpr = 1;
    let scale = 0;
    let cell = 4;
    let font = "monospace";
    let theme = THEMES.dark;
    let time = 0;
    let phase = 0;
    let startle = 0;
    let tilt = 0;
    let sinceRipple = 0;
    let raf = 0;
    let last = 0;
    let visible = true;
    let disposed = false;
    const open = [1, 1];
    const pos = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    const pointer = { x: 0, y: 0, active: false };
    const ripples: { x: number; y: number; age: number }[] = [];
    const rippleData = new Float32Array(RIPPLES * 4);

    const place = (ux: number, uy: number, side: number, spread: number): [number, number] => {
      const lx = side * ux * spread * scale;
      const ly = uy * scale;
      return [pos.x + lx * Math.cos(tilt) - ly * Math.sin(tilt), pos.y + lx * Math.sin(tilt) + ly * Math.cos(tilt)];
    };

    const ripple = (x: number, y: number) => {
      ripples.push({ x, y, age: 0 });
      if (ripples.length > RIPPLES) ripples.shift();
      sinceRipple = 0;
    };

    const step = (dt: number, still: boolean) => {
      if (still) {
        ripples.length = 0;
        open[0] = open[1] = 1;
        tilt = 0;
        pos.x = w / 2;
        pos.y = h / 2;
      } else {
        time += dt;
        startle *= Math.exp(-dt * 1.6);
        phase += dt * TAU * FLAP_HZ * (0.7 + 0.3 * Math.sin(time * 0.37) + 4 * startle);
        open[0] = 0.72 + 0.28 * Math.cos(phase);
        open[1] = 0.72 + 0.28 * Math.cos(phase - 0.4);
        const pull = pointer.active ? 0.12 : 0;
        const tx = w / 2 + Math.sin(time * 0.23) * w * 0.05 + (pointer.x - w / 2) * pull;
        const ty = h / 2 + Math.sin(time * 0.31 + 1) * h * 0.04 + (pointer.y - h / 2) * pull;
        const ease = 1 - Math.exp(-dt * 2);
        const prevX = pos.x;
        pos.x += (tx - pos.x) * ease;
        pos.y += (ty - pos.y) * ease;
        tilt += (clamp(((pos.x - prevX) / Math.max(dt, 1e-3)) * 0.002, -0.15, 0.15) - tilt) * ease;

        for (const r of ripples) r.age += dt;
        while (ripples.length && ripples[0].age > RIPPLE_LIFE) ripples.shift();
        sinceRipple += dt;
        if (sinceRipple > RIPPLE_EVERY) ripple(target.x, target.y);
      }

      for (const p of points) [p.x, p.y] = place(p.ux, p.uy, p.side, open[p.wing]);
      const goal = pointer.active ? pointer : thorax;
      const snap = still ? 1 : 1 - Math.exp(-dt * 14);
      target.x += (goal.x - target.x) * snap;
      target.y += (goal.y - target.y) * snap;
    };

    const paintCells = () => {
      if (!gl || !compiled) return;
      rippleData.fill(0);
      ripples.forEach((r, i) => rippleData.set([r.x, r.y, r.age * RIPPLE_SPEED, 1 - r.age / RIPPLE_LIFE], i * 4));
      gl.viewport(0, 0, glCanvas.width, glCanvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(loc.res, glCanvas.width, glCanvas.height);
      gl.uniform1f(loc.dpr, dpr);
      gl.uniform2f(loc.cell, cell, Math.round(cell * CELL_ASPECT));
      gl.uniform2f(loc.pos, pos.x, pos.y);
      gl.uniform2f(loc.tilt, Math.cos(tilt), Math.sin(tilt));
      gl.uniform1f(loc.scale, scale);
      gl.uniform2f(loc.open, open[0], open[1]);
      gl.uniform1f(loc.time, time);
      gl.uniform3f(loc.pointer, pointer.x, pointer.y, pointer.active ? 1 : 0);
      gl.uniform4fv(loc.ripple, rippleData);
      gl.uniform3fv(loc.scan, unit(theme.scan));
      gl.uniform3fv(loc.render, unit(theme.render));
      gl.uniform3fv(loc.body, unit([theme.body]));
      gl.uniform3fv(loc.shine, unit([theme.shine]));
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    const paintHud = () => {
      const ink = (a: number) => rgba(theme.hud, a);
      const text = (label: string, x: number, y: number, a: number) => {
        ctx.fillStyle = ink(a);
        ctx.fillText(label, x, y);
      };
      const tag = (label: string, x: number, y: number, a: number) => {
        const tw = ctx.measureText(label).width + 10;
        ctx.fillStyle = theme === THEMES.dark ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.75)";
        ctx.fillRect(x, y, tw, 14);
        ctx.strokeStyle = ink(a * 0.6);
        ctx.strokeRect(Math.round(x) + 0.5, Math.round(y) + 0.5, tw, 14);
        text(label, x + 5.5, y + 8, a);
      };

      ctx.lineWidth = 1;
      ctx.font = `500 9px ${font}`;
      ctx.textBaseline = "middle";

      const grid = Math.max(24, scale / 5);
      ctx.strokeStyle = ink(0.05);
      ctx.beginPath();
      for (let x = (w / 2) % grid; x < w; x += grid) ctx.rect(Math.round(x) + 0.5, -1, 0, h + 2);
      for (let y = (h / 2) % grid; y < h; y += grid) ctx.rect(-1, Math.round(y) + 0.5, w + 2, 0);
      ctx.stroke();

      ctx.strokeStyle = ink(0.2);
      ctx.beginPath();
      for (const p of points) {
        ctx.moveTo(target.x, target.y);
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();

      const [headX, headY] = place(0, BODY[0], 1, 1);
      ctx.strokeStyle = ctx.fillStyle = ink(0.9);
      for (const side of [-1, 1]) {
        const [tipX, tipY] = place(0.14, -0.74, side, 1);
        const [bendX, bendY] = place(0.02, -0.6, side, 1);
        ctx.beginPath();
        ctx.moveTo(headX, headY);
        ctx.quadraticCurveTo(bendX, bendY, tipX, tipY);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(tipX, tipY, 1.8, 3, side * 0.5, 0, TAU);
        ctx.fill();
      }

      for (const side of [-1, 1]) {
        const [ax, ay] = place(HIND_BOX[0], HIND_BOX[1], side, open[1]);
        const [bx, by] = place(HIND_BOX[2], HIND_BOX[3], side, open[1]);
        const x0 = Math.round(Math.min(ax, bx));
        const y0 = Math.round(Math.min(ay, by));
        ctx.strokeStyle = ink(0.22);
        ctx.strokeRect(x0 + 0.5, y0 + 0.5, Math.abs(bx - ax), Math.abs(by - ay));
        tag(`HINDWING ${side < 0 ? "L" : "R"}`, x0, y0 - 18, 0.75);
      }

      ctx.strokeStyle = ink(0.6);
      points.forEach((p, k) => {
        const s = p.big ? 11 : 7;
        ctx.strokeRect(Math.round(p.x - s / 2) + 0.5, Math.round(p.y - s / 2) + 0.5, s, s);
        if (k % LABEL_EVERY === 0 && p.ux > 0.3) text(`X ${Math.round(p.x * dpr)} Y ${Math.round(p.y * dpr)}`, p.x + 9, p.y - 8, 0.65);
      });

      const tx = Math.round(target.x);
      const ty = Math.round(target.y);
      ctx.strokeStyle = rgba(theme.scan[2], 0.95);
      ctx.strokeRect(tx - 11.5, ty - 8.5, 23, 17);
      ctx.beginPath();
      ctx.moveTo(tx - 16, ty + 0.5);
      ctx.lineTo(tx - 12, ty + 0.5);
      ctx.moveTo(tx + 12, ty + 0.5);
      ctx.lineTo(tx + 16, ty + 0.5);
      ctx.stroke();
      tag(pointer.active ? "TARGET" : "LOCK", tx + 18, ty - 16, 0.95);

      tag(`TRACKING ${TRACKED} POINTS`, 16, 16, 0.7);
    };

    const render = (dt: number, still: boolean) => {
      step(dt, still);
      paintCells();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      paintHud();
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      render(dt, false);
      raf = requestAnimationFrame(frame);
    };

    const schedule = () => {
      cancelAnimationFrame(raf);
      if (disposed || !w) return;
      if (motion.matches) return render(0, true);
      if (!visible) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const resize = () => {
      const rect = hudCanvas.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      const first = !w;
      w = rect.width;
      h = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      scale = Math.min(w * 0.26, h * 0.4);
      cell = Math.max(3, Math.round((scale / COLUMNS) * dpr));
      font = getComputedStyle(hudCanvas).fontFamily;
      for (const c of [glCanvas, hudCanvas]) {
        c.width = Math.round(w * dpr);
        c.height = Math.round(h * dpr);
      }
      if (first) {
        pos.x = w / 2;
        pos.y = h / 2;
        [target.x, target.y] = place(thorax.ux, thorax.uy, 1, 1);
      }
      schedule();
    };

    const track = (e: PointerEvent) => {
      const rect = hudCanvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = true;
      if (motion.matches) render(0, true);
    };
    const onLeave = () => {
      pointer.active = false;
      if (motion.matches) render(0, true);
    };
    const onDown = (e: PointerEvent) => {
      track(e);
      if (motion.matches) return;
      startle = 1;
      ripple(pointer.x, pointer.y);
    };

    const syncTheme = () => {
      theme = isDark(hudCanvas) ? THEMES.dark : THEMES.light;
      if (motion.matches && w) render(0, true);
    };
    const themeObserver = new MutationObserver(syncTheme);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style", "data-theme"],
    });
    syncTheme();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(hudCanvas);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      schedule();
    });
    intersection.observe(hudCanvas);
    motion.addEventListener("change", schedule);
    hudCanvas.addEventListener("pointermove", track);
    hudCanvas.addEventListener("pointerleave", onLeave);
    hudCanvas.addEventListener("pointerdown", onDown);
    document.fonts?.ready.then(() => {
      if (!disposed && w) resize();
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      themeObserver.disconnect();
      intersection.disconnect();
      motion.removeEventListener("change", schedule);
      hudCanvas.removeEventListener("pointermove", track);
      hudCanvas.removeEventListener("pointerleave", onLeave);
      hudCanvas.removeEventListener("pointerdown", onDown);
      if (gl && quad) gl.deleteBuffer(quad);
      compiled?.dispose();
    };
  }, []);

  return (
    <div
      data-slot="tracked-butterfly-ascii"
      role="img"
      aria-label="A pixel butterfly with tracking markers on its wings"
      className={cn("relative overflow-hidden font-mono select-none", className)}
      {...props}
    >
      <canvas ref={glRef} aria-hidden="true" className="absolute inset-0 block h-full w-full" />
      <canvas ref={hudRef} aria-hidden="true" className="absolute inset-0 block h-full w-full" />
    </div>
  );
}

export { TrackedButterflyAscii };
