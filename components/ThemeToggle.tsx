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
  snapshot,
  waveFront,
} from "distortion-waves";
import { ThemeToggle as UiThemeToggle, type ThemeToggleProps } from "@/components/ui/theme-toggle";

type Theme = "light" | "dark";

const SIDES = ["top", "right", "bottom", "left"];

function pagePicture(theme?: Theme) {
  const root = document.documentElement;
  const scale = Math.min(devicePixelRatio, 2);
  const options = {
    width: innerWidth,
    height: innerHeight,
    scale,
    background: getComputedStyle(document.body).backgroundColor,
    force: (el: Element) => {
      const cs = getComputedStyle(el);
      const out: Record<string, string> = {};
      // preflight gives every box border-style solid at width 0; the picture would draw them 3px wide
      for (const side of SIDES) {
        if (cs.getPropertyValue(`border-${side}-width`) === "0px") out[`border-${side}-style`] = "none";
      }
      if (el === root) out.transform = `translate(${-scrollX}px, ${-scrollY}px)`;
      return out;
    },
  };
  if (!theme) return snapshot(root, options);

  // the engine reads the tree before its first await, so the other theme never paints
  const was = root.className;
  const scheme = root.style.colorScheme;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
  root.style.colorScheme = theme;
  const picture = snapshot(root, options);
  root.className = was;
  root.style.colorScheme = scheme;
  return picture;
}

async function themeWave(button: HTMLElement, next: Theme, apply: () => void) {
  const [before, after] = [await pagePicture(), await pagePicture(next)];

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.width = before.canvas.width;
  canvas.height = before.canvas.height;
  canvas.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;z-index:2147483647;pointer-events:none";
  const renderer = new WaveRenderer(canvas);
  try {
    if (!renderer.ok) throw new Error("no webgl2");
    await play(renderer, canvas, button, before.canvas, after.canvas, apply);
  } finally {
    renderer.dispose();
    canvas.remove();
  }
}

async function play(
  renderer: WaveRenderer,
  canvas: HTMLCanvasElement,
  button: HTMLElement,
  before: HTMLCanvasElement,
  after: HTMLCanvasElement,
  apply: () => void,
) {
  const w = innerWidth;
  const h = innerHeight;
  const style = { ...defaultStyle("center"), palette: PALETTES.mono, cornerRadius: 0 };
  renderer.setScreen(before, w, h, style.blur, "content");
  renderer.setScreen(after, w, h, style.blur, "revealed");

  const r = button.getBoundingClientRect();
  const source = { x: r.x, y: r.y, w: r.width, h: r.height };
  const front = newFront();
  const draw = (p: number) => {
    waveFront(p, source, w, h, style, null, front);
    renderer.render(front, style, rimLumps(front.time, w, h, 0, style.rimPulse), null, { floor: 1 });
  };

  draw(0);
  document.body.appendChild(canvas);
  // the canvas covers the page now, so the real switch underneath is never seen
  apply();

  const total = duration(style) * 1000;
  const start = performance.now();
  await new Promise<void>((done) => {
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / total);
      draw(p);
      if (p < 1) requestAnimationFrame(tick);
      else done();
    };
    requestAnimationFrame(tick);
  });
}

export default function ThemeToggle({ onClick, ...props }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const busy = useRef(false);

  const toggle = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || busy.current) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    event.preventDefault();

    const next: Theme = resolvedTheme === "dark" ? "light" : "dark";
    const apply = () => flushSync(() => setTheme(next));
    busy.current = true;
    themeWave(event.currentTarget, next, apply)
      .catch(apply)
      .finally(() => {
        busy.current = false;
      });
  };

  return <UiThemeToggle {...props} onClick={toggle} />;
}

export { UiThemeToggle as ThemeToggle };
