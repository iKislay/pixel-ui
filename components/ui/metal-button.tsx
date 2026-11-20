"use client";

import {
  useEffect,
  useImperativeHandle,
  useRef,
  type ComponentProps,
  type RefObject,
} from "react";
import { bindFullscreenQuad, createProgram, hexToRgb } from "@/lib/webgl";
import { cn } from "@/lib/utils";

type RGB = [number, number, number];
type Tuning = { stops: number[]; glow: RGB; glowAlpha: number; iris: number };

export type MetalPreset = "chromatic" | "silver" | "gold";
export type MetalTheme = "light" | "dark";
export type MetalVariant = "button" | "circle";

type Live = {
  preset: MetalPreset;
  theme?: MetalTheme;
  variant: MetalVariant;
  strength: number;
  glowGain: number;
  disableGlow: boolean;
  innerShadow: boolean;
  paused: boolean;
  reflectionTargets: RefObject<HTMLElement | null>[];
  text?: string;
  tint?: string;
};

const TAU = Math.PI * 2;
const HALO = 28;
const TEXT_PAD = 4;
const BEND_RADIUS = 36;
const REFLECT_RANGE = 60;

const tune = (stops: string[], glow: string, glowAlpha: number, iris: number): Tuning => ({
  stops: stops.flatMap(hexToRgb),
  glow: hexToRgb(glow),
  glowAlpha,
  iris,
});

const PRESETS: Record<MetalPreset, Record<MetalTheme, Tuning>> = {
  chromatic: {
    dark: tune(["#1d2027", "#7d838e", "#d5d9e0", "#ffffff"], "#8fb0ff", 0.8, 0.3),
    light: tune(["#5d626c", "#a3a8b1", "#e2e5ea", "#ffffff"], "#7f98ff", 0.55, 0.2),
  },
  silver: {
    dark: tune(["#24272d", "#868c96", "#d9dde3", "#ffffff"], "#d3dae4", 0.6, 0),
    light: tune(["#62666f", "#a7acb4", "#e3e6ea", "#ffffff"], "#8d96a3", 0.4, 0),
  },
  gold: {
    dark: tune(["#3b2608", "#a8741e", "#f0c76a", "#fff4d0"], "#ffc95c", 0.7, 0),
    light: tune(["#6e4810", "#b8862e", "#ecc979", "#fff6dc"], "#d9a440", 0.45, 0),
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
uniform vec2 uBox;
uniform float uRadius;
uniform float uRing;
uniform float uTime;
uniform vec3 uBend;
uniform vec3 uStops[4];
uniform vec3 uGlow;
uniform vec3 uTint;
uniform float uIris;
uniform float uAlpha;
uniform float uGlowAlpha;
uniform float uInner;
uniform float uText;
uniform sampler2D uMask;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = p * 2.03 + 17.0;
    a *= 0.5;
  }
  return v;
}

vec3 hue(float h) {
  return clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
}

vec3 ramp(float l) {
  l = clamp(l, 0.0, 1.0) * 3.0;
  if (l < 1.0) return mix(uStops[0], uStops[1], l);
  if (l < 2.0) return mix(uStops[1], uStops[2], l - 1.0);
  return mix(uStops[2], uStops[3], l - 2.0);
}

vec3 iris(vec3 col, float shift) {
  return mix(col, col * (0.55 + 0.9 * hue(shift)), uIris);
}

float sdBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main() {
  vec2 frag = vec2(gl_FragCoord.x, uRes.y * uDpr - gl_FragCoord.y) / uDpr;
  vec2 p = frag - uRes * 0.5;
  float t = uTime;
  float flow = fbm(p * 0.045 + vec2(t * 0.25, -t * 0.18));
  float liquid = fbm(p * 0.03 + vec2(-t * 0.2, t * 0.13) + flow * 1.4);

  if (uText > 0.5) {
    vec2 uv = frag / uRes;
    vec2 e = vec2(1.5) / uRes;
    float a = texture2D(uMask, uv).a;
    float gx = texture2D(uMask, uv + vec2(e.x, 0.0)).a - texture2D(uMask, uv - vec2(e.x, 0.0)).a;
    float gy = texture2D(uMask, uv + vec2(0.0, e.y)).a - texture2D(uMask, uv - vec2(0.0, e.y)).a;
    float sky = 1.0 - uv.y;
    float sweep = pow(0.5 + 0.5 * sin((p.x - p.y * 0.6) * 0.03 - t * 1.2), 18.0);
    float l = 0.15 + 0.5 * liquid + 0.35 * sky - 0.6 * gy + 0.2 * gx + 0.5 * sweep;
    vec3 col = iris(ramp(l), liquid * 1.5 + uv.x * 0.6 + t * 0.05) * mix(vec3(1.0), uTint, 0.5);
    a *= uAlpha;
    gl_FragColor = vec4(col * a, a);
    return;
  }

  float near = length(p - uBend.xy) / ${BEND_RADIUS}.0;
  float dent = uBend.z * exp(-near * near);
  float ring = uRing * (1.0 - 0.55 * dent);
  float d = sdBox(p, uBox, uRadius);
  float ang = atan(p.y, p.x);
  float u = clamp(d / ring, 0.0, 1.0);
  float tube = sqrt(max(0.0, 1.0 - pow(2.0 * u - 1.0, 2.0)));
  vec2 normal = normalize(p / (uBox + 1.0) + 1e-4) * (2.0 * u - 1.0);
  float lit = 0.5 + 0.5 * dot(normal, vec2(-0.4, -0.9));
  float spec = pow(max(0.0, sin(ang * 2.0 + flow * 4.0 + dent * 3.0 - t * 0.8)), 24.0) * tube;
  float l = 0.25 + 0.55 * lit + 0.3 * (liquid - 0.45) - 0.2 * (1.0 - tube) + 0.7 * spec;
  l *= 1.0 - 0.35 * dent;
  vec3 col = iris(ramp(l), flow * 1.5 + ang / 6.2832 + t * 0.05);
  float rim = uInner * (1.0 - smoothstep(0.0, 1.6, d)) * clamp(-p.y / uBox.y, 0.0, 1.0);
  col += rim * 0.8 * uStops[3];
  float cover = clamp(d * uDpr + 0.5, 0.0, 1.0) * clamp((ring - d) * uDpr + 0.5, 0.0, 1.0);

  float phase = t * 0.45 + sin(t * 0.7) * 1.4;
  float wander = pow(0.5 + 0.5 * cos(ang - phase), 8.0);
  float halo = exp(-max(d - ring, 0.0) / 6.0) * wander * (1.0 - cover) * step(0.0, d);
  vec3 glow = mix(uGlow, hue(ang / 6.2832 + t * 0.07) * 0.8 + 0.2, uIris * 0.4);

  float a = cover * uAlpha + halo * uGlowAlpha;
  gl_FragColor = vec4(col * cover * uAlpha + glow * halo * uGlowAlpha, min(a, 1.0));
}`;

type Bend = { x: number; y: number; target: number; amount: number };
const bends = new WeakMap<Element, Bend>();
const textReflections = new WeakMap<Element, Set<HTMLElement>>();

// paints the text color to read it back as rgb, since browsers may report lab() or oklch()
const isDark = (el: Element) => {
  const probe = document.createElement("canvas").getContext("2d");
  if (!probe) return true;
  probe.fillStyle = getComputedStyle(el).color;
  probe.fillRect(0, 0, 1, 1);
  const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
  return 0.299 * r + 0.587 * g + 0.114 * b > 128;
};

const hue = (h: number): RGB =>
  [0, 4, 2].map((o) => Math.min(Math.max(Math.abs((((h * 6 + o) % 6) + 6) % 6 - 3) - 1, 0), 1)) as RGB;

const glowColor = (t: Tuning, ang: number, time: number): RGB => {
  const h = hue(ang / TAU + time * 0.07);
  return t.glow.map((g, i) => g + (h[i] * 0.8 + 0.2 - g) * t.iris * 0.4) as RGB;
};

const pxRadius = (value: string, w: number, h: number) => {
  const n = parseFloat(value) || 0;
  return value.endsWith("%") ? (n / 100) * Math.min(w, h) : n;
};

function useMetal(
  rootRef: RefObject<HTMLElement | null>,
  canvasRef: RefObject<HTMLCanvasElement | null>,
  live: Live,
) {
  const liveRef = useRef(live);
  const wakeRef = useRef(() => {});
  const textMode = live.text !== undefined;

  useEffect(() => {
    liveRef.current = live;
    wakeRef.current();
  });

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    const gl = canvas.getContext("webgl", { premultipliedAlpha: true, antialias: false });
    if (!gl) return;
    const compiled = createProgram(gl, VERTEX, FRAGMENT);
    if (!compiled) return;

    gl.useProgram(compiled.program);
    const buffer = bindFullscreenQuad(gl, compiled.program, "aPos");
    const uniform = (name: string) => gl.getUniformLocation(compiled.program, name);
    const loc = {
      res: uniform("uRes"),
      dpr: uniform("uDpr"),
      box: uniform("uBox"),
      radius: uniform("uRadius"),
      ring: uniform("uRing"),
      time: uniform("uTime"),
      bend: uniform("uBend"),
      stops: uniform("uStops"),
      glow: uniform("uGlow"),
      tint: uniform("uTint"),
      iris: uniform("uIris"),
      alpha: uniform("uAlpha"),
      glowAlpha: uniform("uGlowAlpha"),
      inner: uniform("uInner"),
      text: uniform("uText"),
    };
    const texture = textMode ? gl.createTexture() : null;
    const mask = document.createElement("canvas");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const touched = new Set<HTMLElement>();
    const pad = textMode ? TEXT_PAD : HALO;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let dark = true;
    let visible = true;
    let time = 0;
    let last = 0;
    let raf = 0;

    const tuning = () => {
      const o = liveRef.current;
      return PRESETS[o.preset][o.theme ?? (dark ? "dark" : "light")];
    };

    const paintMask = () => {
      const ctx = mask.getContext("2d");
      const text = liveRef.current.text;
      if (!ctx || !texture || text === undefined) return;
      mask.width = canvas.width;
      mask.height = canvas.height;
      const s = getComputedStyle(root);
      ctx.scale(dpr, dpr);
      ctx.font = `${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
      ctx.fillStyle = "#fff";
      const m = ctx.measureText(text);
      const ascent = m.fontBoundingBoxAscent;
      ctx.fillText(text, pad, pad + (h - ascent - m.fontBoundingBoxDescent) / 2 + ascent);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mask);
    };

    const reflect = (t: Tuning) => {
      const o = liveRef.current;
      const targets: [HTMLElement | null, boolean][] = [
        ...o.reflectionTargets.map((r): [HTMLElement | null, boolean] => [r.current, false]),
        ...[...(textReflections.get(root) ?? [])].map((el): [HTMLElement, boolean] => [el, true]),
      ];
      if (!targets.length) return;
      const box = root.getBoundingClientRect();
      const phase = time * 0.45 + Math.sin(time * 0.7) * 1.4;
      for (const [el, text] of targets) {
        if (!el) continue;
        const r = el.getBoundingClientRect();
        const dx = r.left + r.width / 2 - (box.left + box.width / 2);
        const dy = r.top + r.height / 2 - (box.top + box.height / 2);
        const gap = Math.hypot(
          Math.max(0, Math.abs(dx) - (r.width + box.width) / 2),
          Math.max(0, Math.abs(dy) - (r.height + box.height) / 2),
        );
        const ang = Math.atan2(dy, dx);
        const wander = (0.5 + 0.5 * Math.cos(ang - phase)) ** 8;
        const k = o.disableGlow ? 0 : t.glowAlpha * o.glowGain * o.strength * wander * Math.exp(-gap / REFLECT_RANGE);
        const [cr, cg, cb] = glowColor(t, ang, time).map((c) => Math.round(c * 255));
        const len = Math.hypot(dx, dy) || 1;
        const shadow = `${((-dx / len) * 3).toFixed(1)}px ${((-dy / len) * 3).toFixed(1)}px`;
        const color = `rgba(${cr}, ${cg}, ${cb}, ${k.toFixed(3)})`;
        if (text) el.style.textShadow = `${shadow} 8px ${color}`;
        else el.style.filter = `drop-shadow(${shadow} 10px ${color})`;
        touched.add(el);
      }
    };

    const draw = () => {
      if (!w || !h) return;
      const o = liveRef.current;
      const t = tuning();
      const bend = bends.get(root);
      const radius =
        o.variant === "circle"
          ? Math.min(w, h) / 2
          : Math.min(pxRadius(getComputedStyle(root.firstElementChild ?? root).borderTopLeftRadius, w, h), Math.min(w, h) / 2);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(loc.res, w + pad * 2, h + pad * 2);
      gl.uniform1f(loc.dpr, dpr);
      gl.uniform2f(loc.box, w / 2, h / 2);
      gl.uniform1f(loc.radius, radius);
      gl.uniform1f(loc.ring, Math.min(Math.max(Math.min(w, h) * 0.04, 1.5), 2.5));
      gl.uniform1f(loc.time, time);
      gl.uniform3f(loc.bend, bend?.x ?? 0, bend?.y ?? 0, bend?.amount ?? 0);
      gl.uniform3fv(loc.stops, t.stops);
      gl.uniform3fv(loc.glow, t.glow);
      gl.uniform3fv(loc.tint, o.tint ? hexToRgb(o.tint) : [1, 1, 1]);
      gl.uniform1f(loc.iris, t.iris);
      gl.uniform1f(loc.alpha, o.strength);
      gl.uniform1f(loc.glowAlpha, o.disableGlow ? 0 : t.glowAlpha * o.glowGain * o.strength);
      gl.uniform1f(loc.inner, o.innerShadow ? 1 : 0);
      gl.uniform1f(loc.text, textMode ? 1 : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      reflect(t);
    };

    const tick = (now: number) => {
      raf = 0;
      const o = liveRef.current;
      const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
      last = now;
      const moving = !o.paused && !motion.matches;
      if (moving) time += dt;
      const bend = bends.get(root);
      let bending = false;
      if (bend) {
        bend.amount += (bend.target - bend.amount) * (1 - Math.exp(-dt * 14));
        bending = Math.abs(bend.target - bend.amount) > 0.002;
      }
      draw();
      if (visible && (moving || bending)) raf = requestAnimationFrame(tick);
      else last = 0;
    };

    const wake = () => {
      if (!raf && visible) raf = requestAnimationFrame(tick);
    };
    wakeRef.current = wake;

    const resize = () => {
      w = root.offsetWidth;
      h = root.offsetHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round((w + pad * 2) * dpr);
      canvas.height = Math.round((h + pad * 2) * dpr);
      if (textMode) paintMask();
      draw();
    };

    const syncTheme = () => {
      dark = isDark(root);
      draw();
    };

    const themeObserver = new MutationObserver(syncTheme);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style", "data-theme"],
    });
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(root);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      wake();
    });
    intersection.observe(root);
    motion.addEventListener("change", wake);
    root.addEventListener("metal:wake", wake);
    dark = isDark(root);
    if (textMode) root.dataset.live = "";
    document.fonts?.ready.then(() => {
      if (raf !== -1) resize();
    });
    wake();

    return () => {
      cancelAnimationFrame(raf);
      raf = -1;
      wakeRef.current = () => {};
      themeObserver.disconnect();
      resizeObserver.disconnect();
      intersection.disconnect();
      motion.removeEventListener("change", wake);
      root.removeEventListener("metal:wake", wake);
      delete root.dataset.live;
      for (const el of touched) {
        el.style.filter = "";
        el.style.textShadow = "";
      }
      gl.deleteBuffer(buffer);
      if (texture) gl.deleteTexture(texture);
      compiled.dispose();
    };
  }, [rootRef, canvasRef, textMode]);
}

type MetalOptions = {
  preset?: MetalPreset;
  theme?: MetalTheme;
  strength?: number;
  paused?: boolean;
};

type MetalButtonProps = ComponentProps<"div"> &
  MetalOptions & {
    variant?: MetalVariant;
    innerShadow?: boolean;
    reflectionTargets?: RefObject<HTMLElement | null>[];
    disableGlow?: boolean;
    glowGain?: number;
  };

const NO_TARGETS: RefObject<HTMLElement | null>[] = [];

function MetalButton({
  preset = "chromatic",
  variant = "button",
  strength = 1,
  theme,
  innerShadow = false,
  reflectionTargets = NO_TARGETS,
  disableGlow = false,
  glowGain = 1,
  paused = false,
  className,
  children,
  ref,
  ...props
}: MetalButtonProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useImperativeHandle(ref, () => rootRef.current as HTMLDivElement, []);
  useMetal(rootRef, canvasRef, {
    preset,
    theme,
    variant,
    strength,
    glowGain,
    disableGlow,
    innerShadow,
    paused,
    reflectionTargets,
  });

  return (
    <div
      ref={rootRef}
      data-slot="metal-button"
      className={cn("relative isolate inline-flex", variant === "circle" && "rounded-full", className)}
      {...props}
    >
      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none absolute -z-10"
        style={{ inset: -HALO, width: `calc(100% + ${HALO * 2}px)`, height: `calc(100% + ${HALO * 2}px)` }}
      />
      {children}
    </div>
  );
}

type MetalTextProps = Omit<ComponentProps<"span">, "children" | "color"> &
  MetalOptions & {
    children: string;
    font?: string;
    color?: string;
  };

function MetalText({
  children,
  font,
  color = "#e2e2e2",
  preset = "chromatic",
  theme,
  strength = 1,
  paused = false,
  className,
  style,
  ...props
}: MetalTextProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useMetal(rootRef, canvasRef, {
    preset,
    theme,
    variant: "button",
    strength,
    glowGain: 1,
    disableGlow: true,
    innerShadow: false,
    paused,
    reflectionTargets: NO_TARGETS,
    text: children,
    tint: color,
  });

  return (
    <span
      ref={rootRef}
      data-slot="metal-text"
      className={cn("relative inline-block whitespace-pre data-[live]:text-transparent", className)}
      style={{ font, color, ...style }}
      {...props}
    >
      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none absolute"
        style={{ inset: -TEXT_PAD, width: `calc(100% + ${TEXT_PAD * 2}px)`, height: `calc(100% + ${TEXT_PAD * 2}px)` }}
      />
      {children}
    </span>
  );
}

function MetalBadge({
  preset = "chromatic",
  theme,
  strength = 1,
  paused = false,
  className,
  ...props
}: ComponentProps<"span"> & MetalOptions) {
  return (
    <MetalButton preset={preset} theme={theme} strength={strength} paused={paused} glowGain={0.6}>
      <span
        data-slot="metal-badge"
        className={cn(
          "inline-flex items-center rounded-full bg-background px-2.5 py-0.5 text-xs font-medium text-foreground",
          className,
        )}
        {...props}
      />
    </MetalButton>
  );
}

function useMetalBend(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const bend: Bend = { x: 0, y: 0, target: 0, amount: 0 };
    bends.set(el, bend);
    const wake = () => el.dispatchEvent(new Event("metal:wake"));
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      bend.x = e.clientX - r.left - r.width / 2;
      bend.y = e.clientY - r.top - r.height / 2;
      bend.target = e.buttons ? 1.6 : 1;
      wake();
    };
    const leave = () => {
      bend.target = 0;
      wake();
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerdown", move);
    el.addEventListener("pointerup", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      bends.delete(el);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerdown", move);
      el.removeEventListener("pointerup", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [ref]);
}

function useMetalTextReflection(metalRef: RefObject<HTMLElement | null>, textRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const metal = metalRef.current;
    const text = textRef.current;
    if (!metal || !text) return;
    const set = textReflections.get(metal) ?? new Set();
    textReflections.set(metal, set.add(text));
    return () => {
      set.delete(text);
      text.style.textShadow = "";
    };
  }, [metalRef, textRef]);
}

export { MetalButton, MetalText, MetalBadge, useMetalBend, useMetalTextReflection };
