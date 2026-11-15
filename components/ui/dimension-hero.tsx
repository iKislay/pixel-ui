"use client";

import { useEffect, useRef, useState, type ComponentProps, type CSSProperties } from "react";
import {
  BufferGeometry,
  CanvasTexture,
  EdgesGeometry,
  Float32BufferAttribute,
  Fog,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  PointsMaterial,
  Scene,
  WebGLRenderer,
} from "three";
import type { Font } from "three/addons/loaders/FontLoader.js";
import type { TextGeometry as TextGeometryType } from "three/addons/geometries/TextGeometry.js";
import { cn } from "@/lib/utils";

export type DimensionHeroProps = Omit<ComponentProps<"section">, "children"> & {
  headline?: string;
  tagline?: string;
};

const SHAPES = ["square", "circle", "circle", "square"];
const STAGGER = 0.12;
const FOV = 40;
const WORLD_H = 10;
const DIST = WORLD_H / 2 / Math.tan((FOV * Math.PI) / 360);
const TRACKING = -0.04;

const CSS = `
.dh-root{container-type:size}
.dh-stage{transform:translateY(-12cqh);animation:dh-rise 1.9s cubic-bezier(.83,0,.17,1) 1.5s both}
@keyframes dh-rise{from{transform:translateY(calc((1.5rem + 1.25rem * 1.1) / 2))}}
.dh-head{font-size:clamp(40px,calc((100cqw - 3rem) / 5.5),220px)}
.dh-word{display:inline-block;position:relative}
.dh-text{display:inline-block;-webkit-text-fill-color:transparent;animation:dh-text 1s step-end var(--d) forwards,dh-drift .25s ease-out calc(var(--d) + .55s) both}
.dh-word[data-side=left] .dh-text{transform-origin:left bottom}
.dh-word[data-side=right] .dh-text{transform-origin:right bottom}
.dh-text::before{content:"";position:absolute;width:.12em;height:.12em;bottom:.02em;background:currentColor;visibility:hidden;animation:dh-shape 1s step-end var(--d) both}
.dh-word[data-side=left] .dh-text::before{right:100%;transform-origin:right bottom}
.dh-word[data-side=right] .dh-text::before{left:calc(100% + .06em);transform-origin:left bottom}
.dh-word[data-shape=circle] .dh-text::before{border-radius:50%}
@keyframes dh-shape{0%{visibility:hidden;scale:1}.5%{visibility:visible;scale:1}15%{visibility:visible;scale:1.5}30%{visibility:visible;scale:2}45%{visibility:visible;scale:2}55%{visibility:hidden;scale:0}}
@keyframes dh-text{0%{-webkit-text-fill-color:transparent;transform:scale(.35)}15%{-webkit-text-fill-color:transparent;transform:scale(.35)}30%{-webkit-text-fill-color:currentcolor;transform:scale(.35)}45%{-webkit-text-fill-color:currentcolor;transform:scale(.65)}55%{-webkit-text-fill-color:currentcolor;transform:scale(1)}to{-webkit-text-fill-color:currentcolor;transform:scale(1)}}
@keyframes dh-drift{from{translate:calc(var(--dir) * .08em) 0}to{translate:0 0}}
.dh-tag{animation:dh-fade .8s cubic-bezier(.16,1,.3,1) 1.66s both}
.dh-pill{animation:dh-fade .8s cubic-bezier(.16,1,.3,1) 2s both}
@keyframes dh-fade{from{opacity:0;transform:translateY(8px)}}
.dh-capsule{rotate:-30deg;animation:dh-rock 3.2s ease-in-out infinite}
@keyframes dh-rock{50%{rotate:-12deg}}
@media (prefers-reduced-motion:reduce){.dh-stage,.dh-text,.dh-text::before,.dh-tag,.dh-pill,.dh-capsule{animation:none}.dh-text{-webkit-text-fill-color:currentcolor}}
`;

type Word = { text: string; x: number; y: number; w: number; h: number };
type Snapshot = {
  words: Word[];
  fontSize: number;
  tag: (Word & { font: string }) | null;
};

function snapshot(root: HTMLElement): Snapshot {
  const box = root.getBoundingClientRect();
  const rel = (el: Element) => {
    const r = el.getBoundingClientRect();
    return { x: r.left - box.left, y: r.top - box.top, w: r.width, h: r.height };
  };
  const words = [...root.querySelectorAll<HTMLElement>(".dh-word")].map((el) => ({
    text: el.textContent ?? "",
    ...rel(el),
  }));
  const head = root.querySelector(".dh-head");
  const tagEl = root.querySelector<HTMLElement>(".dh-tag");
  const tagStyle = tagEl && getComputedStyle(tagEl);
  return {
    words,
    fontSize: head ? parseFloat(getComputedStyle(head).fontSize) : 100,
    tag:
      tagEl && tagStyle && Number(tagStyle.opacity) > 0.5
        ? { text: tagEl.textContent ?? "", font: `${tagStyle.fontWeight} ${tagStyle.fontSize} ${tagStyle.fontFamily}`, ...rel(tagEl) }
        : null,
  };
}

function seeded(seed: number) {
  return () => (seed = (seed * 16807) % 2147483647) / 2147483647;
}

function lines(points: number[]) {
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(points, 3));
  return g;
}

function startScene(
  canvas: HTMLCanvasElement,
  root: HTMLElement,
  font: Font,
  TextGeometry: typeof TextGeometryType,
  reduced: boolean,
  onReady: () => void,
) {
  const renderer = new WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 1);
  const scene = new Scene();
  scene.fog = new Fog(0x000000, DIST * 0.9, DIST * 4.5);
  const camera = new PerspectiveCamera(FOV, 1, 0.05, 400);

  const fill = new MeshBasicMaterial({ color: 0x000000, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  const edge = new LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });
  const grid = new LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2 });
  const streak = new LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12 });
  const dust = new PointsMaterial({ color: 0xffffff, size: 0.05, transparent: true, opacity: 0.8 });
  const glyphs = new Map<string, { solid: BufferGeometry; edges: BufferGeometry }>();
  const glyph = (ch: string) => {
    let g = glyphs.get(ch);
    if (!g) {
      const solid = new TextGeometry(ch, { font, size: 1, depth: 1, curveSegments: 6, bevelEnabled: false });
      solid.translate(0, 0, -1);
      g = { solid, edges: new EdgesGeometry(solid, 25) };
      glyphs.set(ch, g);
    }
    return g;
  };

  let world = new Group();
  let owned: { dispose: () => void }[] = [];

  const build = () => {
    const W = root.clientWidth;
    const H = root.clientHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    scene.remove(world);
    for (const o of owned) o.dispose();
    owned = [];
    world = new Group();
    scene.add(world);

    const k = WORLD_H / H;
    const halfW = (W * k) / 2;
    const snap = snapshot(root);
    const rand = seeded(7);
    const res = font.data.resolution;

    // each piece sits at a random depth, scaled so the front view still reads as the flat headline
    const place = (obj: Mesh | LineSegments | Group, x: number, y: number, z: number, size: number, depth: number) => {
      const f = (DIST - z) / DIST;
      obj.position.set(x * f, y * f, z);
      obj.scale.set(size * f, size * f, depth * f);
    };

    for (const word of snap.words) {
      const chars = [...word.text];
      const advances = chars.map((c) => (font.data.glyphs[c]?.ha ?? res * 0.3) / res + TRACKING);
      const span = advances.reduce((a, b) => a + b, 0) - TRACKING;
      const size = Math.min(word.w / span, snap.fontSize * 1.2) * k;
      let pen = word.x * k - halfW;
      const baseline = WORLD_H / 2 - (word.y + word.h / 2 + snap.fontSize * 0.36) * k;
      chars.forEach((c, i) => {
        if (c.trim()) {
          const g = glyph(c);
          const z = (rand() - 0.75) * DIST * 1.4;
          const depth = size * (0.25 + rand() * 0.9);
          const letter = new Group();
          letter.add(new Mesh(g.solid, fill), new LineSegments(g.edges, edge));
          place(letter, pen, baseline, z, size, depth);
          world.add(letter);
        }
        pen += advances[i] * size;
      });
    }

    if (snap.tag) {
      const t = snap.tag;
      const c = document.createElement("canvas");
      c.width = Math.ceil(t.w * 2);
      c.height = Math.ceil(t.h * 2);
      const ctx = c.getContext("2d");
      if (ctx) {
        ctx.scale(2, 2);
        ctx.font = t.font;
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(t.text, t.w / 2, t.h / 2);
      }
      const map = new CanvasTexture(c);
      const geo = new PlaneGeometry(1, 1);
      const mat = new MeshBasicMaterial({ map, transparent: true, opacity: 0.75, depthWrite: false });
      const plane = new Mesh(geo, mat);
      place(plane, (t.x + t.w / 2) * k - halfW, WORLD_H / 2 - (t.y + t.h / 2) * k, -DIST * 0.35, t.w * k, 1);
      plane.scale.y = t.h * k * ((DIST + DIST * 0.35) / DIST);
      world.add(plane);
      owned.push(map, geo, mat);
    }

    const A = Math.max(halfW * 1.3, 8);
    const B = WORLD_H * 0.75;
    const z0 = DIST * 1.2;
    const z1 = -DIST * 3;
    const step = 1.25;
    const room: number[] = [];
    for (let z = z1; z <= z0; z += step) room.push(-A, -B, z, A, -B, z, -A, B, z, A, B, z, -A, -B, z, -A, B, z, A, -B, z, A, B, z);
    for (let x = -A; x <= A; x += step) room.push(x, -B, z1, x, -B, z0, x, B, z1, x, B, z0, x, -B, z1, x, B, z1);
    for (let y = -B; y <= B; y += step) room.push(-A, y, z1, -A, y, z0, A, y, z1, A, y, z0, -A, y, z1, A, y, z1);
    const roomGeo = lines(room);

    const rays: number[] = [];
    const specks: number[] = [];
    for (let i = 0; i < 520; i++) {
      const u = rand() * 2 - 1;
      const a = rand() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      const d = [s * Math.cos(a), u, s * Math.sin(a) - 0.4];
      const r0 = 10 + rand() * 30;
      const r1 = r0 + 2 + rand() * 10;
      rays.push(d[0] * r0, d[1] * r0, d[2] * r0, d[0] * r1, d[1] * r1, d[2] * r1);
      specks.push((rand() * 2 - 1) * A, (rand() * 2 - 1) * B, z1 + rand() * (z0 - z1));
    }
    const rayGeo = lines(rays);
    const speckGeo = lines(specks);
    world.add(new LineSegments(roomGeo, grid), new LineSegments(rayGeo, streak), new Points(speckGeo, dust));
    owned.push(roomGeo, rayGeo, speckGeo);
  };

  const aim = { x: reduced ? 0 : 0.35, y: reduced ? 0 : 0.15 };
  const cam = { yaw: 0, pitch: 0, fly: 0, flyTo: 0 };
  const onMove = (e: PointerEvent) => {
    const r = root.getBoundingClientRect();
    aim.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    aim.y = 1 - ((e.clientY - r.top) / r.height) * 2;
  };
  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    cam.flyTo = Math.min(DIST * 2.4, Math.max(-DIST * 0.2, cam.flyTo + e.deltaY * 0.01));
  };
  root.addEventListener("pointermove", onMove);
  root.addEventListener("wheel", onWheel, { passive: false });

  let frame = 0;
  let pending = 0;
  const ro = new ResizeObserver(() => {
    cancelAnimationFrame(pending);
    pending = requestAnimationFrame(build);
  });
  build();
  ro.observe(root);

  const start = performance.now();
  let last = start;
  let first = true;
  const tick = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const t = (now - start) / 1000;
    // the camera opens dead on so the cut lands on the flat headline, then swings toward the pointer
    const open = reduced ? 1 : 1 - Math.pow(2, -10 * Math.min(1, t / 1.6));
    const drift = reduced ? 0 : Math.sin(t * 0.25) * 0.12;
    const ease = 1 - Math.exp(-dt * 4);
    cam.yaw += (aim.x * 0.85 * open + drift * open - cam.yaw) * ease;
    cam.pitch += (aim.y * 0.5 * open - cam.pitch) * ease;
    cam.fly += (cam.flyTo - cam.fly) * (1 - Math.exp(-dt * 3));
    const cp = Math.cos(cam.pitch);
    camera.position.set(DIST * Math.sin(cam.yaw) * cp, DIST * Math.sin(cam.pitch), DIST * Math.cos(cam.yaw) * cp - cam.fly);
    camera.lookAt(0, 0, -cam.fly);
    renderer.render(scene, camera);
    if (first) {
      first = false;
      onReady();
    }
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(frame);
    cancelAnimationFrame(pending);
    ro.disconnect();
    root.removeEventListener("pointermove", onMove);
    root.removeEventListener("wheel", onWheel);
    for (const o of owned) o.dispose();
    for (const g of glyphs.values()) {
      g.solid.dispose();
      g.edges.dispose();
    }
    for (const m of [fill, edge, grid, streak, dust]) m.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  };
}

export function DimensionHero({
  headline = "Draw outside the frame",
  tagline = "Every flat page hides a little depth. The pill knows where.",
  className,
  ...props
}: DimensionHeroProps) {
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [deep, setDeep] = useState(false);
  const [shown, setShown] = useState(false);
  const words = headline.split(/\s+/).filter(Boolean);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!deep || !root || !canvas) return;
    let stop = () => {};
    let gone = false;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    Promise.all([
      import("three/addons/loaders/FontLoader.js"),
      import("three/addons/geometries/TextGeometry.js"),
      import("three/examples/fonts/helvetiker_bold.typeface.json"),
    ]).then(([{ FontLoader }, { TextGeometry }, json]) => {
      if (gone) return;
      const font = new FontLoader().parse(json.default ?? json);
      stop = startScene(canvas, root, font, TextGeometry, reduced, () => setShown(true));
    });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDeep(false);
    window.addEventListener("keydown", onKey);
    return () => {
      gone = true;
      stop();
      window.removeEventListener("keydown", onKey);
      setShown(false);
    };
  }, [deep]);

  return (
    <section
      ref={rootRef}
      data-slot="dimension-hero"
      className={cn(
        "dh-root relative isolate overflow-hidden bg-background text-foreground",
        shown && "bg-black",
        className,
      )}
      {...props}
    >
      <style>{CSS}</style>
      <div className={cn("absolute inset-0 flex flex-col items-center justify-center px-6", shown && "invisible")}>
        <div className="dh-stage flex flex-col items-center">
          <h1
            aria-label={headline}
            className="dh-head text-center leading-[0.8] font-medium tracking-[-0.04em] text-balance select-none"
          >
            {words.map((word, i) => (
              <span key={i}>
                <span
                  aria-hidden
                  className="dh-word"
                  data-side={i % 2 ? "right" : "left"}
                  data-shape={SHAPES[i % 4]}
                  style={{ "--d": `${(i * STAGGER).toFixed(2)}s`, "--dir": i % 2 ? 1 : -1 } as CSSProperties}
                >
                  <span className="dh-text">{word}</span>
                </span>
                {i < words.length - 1 && " "}
              </span>
            ))}
          </h1>
          <p className="dh-tag mt-6 text-center text-[clamp(14px,2.2cqw,20px)] leading-[1.1]">{tagline}</p>
        </div>
      </div>
      {deep && <canvas ref={canvasRef} aria-hidden className={cn("absolute inset-0 size-full", !shown && "invisible")} />}
      <button
        type="button"
        aria-pressed={deep}
        aria-label={deep ? "Leave the 3D view" : "See this hero in 3D"}
        onClick={() => setDeep((d) => !d)}
        className="dh-pill absolute right-3 bottom-3 z-10 grid size-14 cursor-pointer place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-current"
      >
        <span
          className="dh-capsule relative block h-11 w-5 overflow-hidden rounded-full shadow-[0_6px_14px_rgba(0,0,0,0.35)] transition-transform duration-300 hover:scale-110"
          style={{
            background: deep
              ? "linear-gradient(#ff3b30 50%, #e9e9f2 50%)"
              : "linear-gradient(#5b3df5 50%, #ff8fc4 50%)",
          }}
        >
          <span className="absolute inset-0 rounded-full bg-[linear-gradient(90deg,rgba(0,0,0,0.35),transparent_35%,rgba(255,255,255,0.55)_52%,transparent_68%,rgba(0,0,0,0.3))]" />
        </span>
      </button>
    </section>
  );
}
