"use client";

import { useRef, type MouseEvent } from "react";
import { flushSync } from "react-dom";
import { useTheme } from "next-themes";
import {
  PALETTES,
  WaveRenderer,
  defaultStyle,
  duration,
  newFront,
  rimLumps,
  waveFront,
} from "distortion-waves";
import {
  ThemeToggle as UiThemeToggle,
  tick,
  type ThemeToggleProps,
} from "@/components/ui/theme-toggle";

const RING = "theme-wave";

// the ring rides on its own transition layer above the page, so the reveal clip never cuts it
const RING_CSS = `::view-transition-group(${RING}),::view-transition-old(${RING}),::view-transition-new(${RING}){animation:none}::view-transition-old(${RING}){display:none}::view-transition-group(${RING}){z-index:10000}`;

const FRAME = 1000 / 60;

// a second wave ends the first, since two rings with one transition name abort the transition
let endPrevious: (() => void) | null = null;

type TransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { ready: Promise<void>; finished: Promise<void> };
};

function themeWave(button: HTMLElement, apply: () => void) {
  const doc = document as TransitionDocument;
  if (!doc.startViewTransition) return 0;
  endPrevious?.();

  const canvas = document.createElement("canvas");
  const renderer = new WaveRenderer(canvas, { alpha: true });
  if (!renderer.ok) return 0;

  const width = document.documentElement.clientWidth;
  const height = innerHeight;
  // the ring is soft colour with no fine detail, so 1x keeps every frame cheap on any screen
  const scale = Math.min(1, renderer.maxTextureSize / Math.max(width, height));
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = `position:fixed;left:0;top:0;width:${width}px;height:${height}px;z-index:2147483647;pointer-events:none;view-transition-name:${RING}`;
  renderer.setSize(width, height);

  const style = { ...defaultStyle("center"), palette: PALETTES.mono, cornerRadius: 0 };
  const r = button.getBoundingClientRect();
  const source = { x: r.x, y: r.y, w: r.width, h: r.height };
  const total = duration(style) * 1000;
  const front = newFront();
  const draw = (p: number) => {
    waveFront(p, source, width, height, style, null, front);
    renderer.render(front, style, rimLumps(front.time, width, height, 0, style.rimPulse), null);
  };

  // the reveal follows the front: sample its radius once per frame until it passes the far corner
  const cx = r.x + r.width / 2;
  const cy = r.y + r.height / 2;
  const far = Math.hypot(Math.max(cx, width - cx), Math.max(cy, height - cy));
  const clip: string[] = [];
  for (let t = 0; ; t += FRAME) {
    waveFront(Math.min(1, t / total), source, width, height, style, null, front);
    clip.push(`circle(${Math.max(0, front.radius)}px at ${front.ox}px ${front.oy}px)`);
    if (front.radius >= far || t >= total) break;
  }
  const reveal = clip.length * FRAME;

  const css = document.createElement("style");
  css.textContent = RING_CSS;
  document.head.appendChild(css);
  draw(0);
  document.body.appendChild(canvas);

  let running = true;
  const cleanup = () => {
    if (!running) return;
    running = false;
    renderer.dispose();
    canvas.remove();
    css.remove();
    if (endPrevious === cleanup) endPrevious = null;
  };
  endPrevious = cleanup;

  const transition = doc.startViewTransition(apply);
  transition.ready
    .then(() => {
      document.documentElement.animate(
        { clipPath: clip },
        { duration: reveal, easing: "linear", pseudoElement: "::view-transition-new(root)" },
      );
      const start = performance.now();
      const frame = (now: number) => {
        if (!running) return;
        const p = Math.min(1, (now - start) / total);
        draw(p);
        if (p < 1) requestAnimationFrame(frame);
        else cleanup();
      };
      requestAnimationFrame(frame);
    })
    .catch(cleanup);
  return reveal;
}

export default function ThemeToggle({ onClick, sound = true, ...props }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const busy = useRef(false);

  const toggle = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || busy.current) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const next = resolvedTheme === "dark" ? "light" : "dark";
    const reveal = themeWave(event.currentTarget, () => flushSync(() => setTheme(next)));
    // no view transitions or webgl 2 here: the plain toggle switches on its own
    if (!reveal) return;

    event.preventDefault();
    if (sound) tick();
    busy.current = true;
    setTimeout(() => {
      busy.current = false;
    }, reveal);
  };

  return <UiThemeToggle {...props} sound={sound} onClick={toggle} />;
}

export { UiThemeToggle as ThemeToggle };
