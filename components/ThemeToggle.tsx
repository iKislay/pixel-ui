"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import { createPortal, flushSync } from "react-dom";
import { useTheme } from "next-themes";
import { DistortionWave, snapshot, type DistortionWaveHandle } from "distortion-waves";
import {
  ThemeToggle as UiThemeToggle,
  tick,
  type ThemeToggleProps,
} from "@/components/ui/theme-toggle";

type Theme = "light" | "dark";

type Pictures = {
  before: HTMLCanvasElement;
  after: HTMLCanvasElement | null;
  theme: string;
  view: string;
  at: number;
};

const SIDES = ["top", "right", "bottom", "left"];

// pictures older than this may miss what moved on the page since
const FRESH_FOR = 3000;

const FADE = 260;

const PULL = { pull: 9, inhale: 20, gatherGlow: 0.2 };

const NO_TRANSITIONS = "*,*::before,*::after{transition:none!important}";

const viewKey = () =>
  [scrollX, scrollY, document.documentElement.clientWidth, innerHeight, ...scrollTops()].join(",");

function scrollTops() {
  return Array.from(document.querySelectorAll("body *"), (el) => el.scrollTop).filter(Boolean);
}

function pagePicture() {
  return snapshot(document.documentElement, {
    width: document.documentElement.clientWidth,
    height: innerHeight,
    scale: Math.min(devicePixelRatio || 1, 1.5),
    background: getComputedStyle(document.body).backgroundColor,
    force: (el) => {
      const cs = getComputedStyle(el);
      const out: Record<string, string> = {};
      // preflight gives every box border-style solid at width 0; the picture would draw them 3px wide
      for (const side of SIDES) {
        if (cs.getPropertyValue(`border-${side}-width`) === "0px") out[`border-${side}-style`] = "none";
      }
      return out;
    },
  }).then((shot) => {
    shot.canvas.style.cssText = "display:block;width:100%;height:100%;border:none";
    return shot.canvas;
  });
}

// the engine reads the tree before its first await, so the other theme is pictured without ever painting
function otherThemePicture(theme: Theme) {
  const root = document.documentElement;
  const css = document.createElement("style");
  css.textContent = NO_TRANSITIONS;
  document.head.appendChild(css);
  const was = root.className;
  const scheme = root.style.colorScheme;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
  root.style.colorScheme = theme;
  const picture = pagePicture();
  root.className = was;
  root.style.colorScheme = scheme;
  // settle the restored styles while transitions are still off, so nothing animates back
  getComputedStyle(root).getPropertyValue("color");
  css.remove();
  return picture;
}

// an image the engine still had to fetch makes it read the page again later, in the old theme
function differs(a: HTMLCanvasElement, b: HTMLCanvasElement) {
  const read = (c: HTMLCanvasElement) => {
    const g = document.createElement("canvas").getContext("2d")!;
    g.canvas.width = 8;
    g.canvas.height = 8;
    g.drawImage(c, 0, 0, 8, 8);
    return g.getImageData(0, 0, 8, 8).data;
  };
  const x = read(a);
  const y = read(b);
  let total = 0;
  for (let i = 0; i < x.length; i++) total += Math.abs(x[i] - y[i]);
  return total / x.length > 8;
}

function Picture({ canvas }: { canvas: HTMLCanvasElement }) {
  const box = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = box.current;
    el?.appendChild(canvas);
    return () => el?.replaceChildren();
  }, [canvas]);
  return <div ref={box} style={{ width: "100%", height: "100%", border: "none" }} />;
}

type Wave = {
  light: HTMLCanvasElement | null;
  dark: HTMLCanvasElement | null;
  toDark: boolean;
  source: Element;
};

// light is always the first view and dark the second, like the appearance demo:
// going dark sends the wave out from the toggle, going light pulls it back in
function ThemeWave({ light, dark, toDark, source, onDone }: Wave & { onDone: () => void }) {
  const wave = useRef<DistortionWaveHandle>(null);
  const root = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(!toDark);
  const ready = Boolean(light && dark);

  // the overlay sits on top of the whole site, so it must never outlive a wave that went wrong
  useEffect(() => {
    const limit = setTimeout(onDone, 6000);
    return () => clearTimeout(limit);
  }, [onDone]);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    wave.current?.prepare().finally(() => {
      if (!cancelled) setRevealed(toDark);
    });
    return () => {
      cancelled = true;
    };
  }, [ready, toDark]);

  useEffect(() => {
    if (revealed !== toDark) return;
    let frame = 0;
    let ending = false;
    const end = () => {
      if (ending) return;
      ending = true;
      if (root.current) root.current.style.opacity = "0";
      setTimeout(onDone, FADE);
    };
    // once the wave has covered the screen the live page matches the picture, so hand it back
    const watch = () => {
      const debug = wave.current?.controller?.debug;
      if (debug?.running && debug.progress >= debug.clearAt) return end();
      frame = requestAnimationFrame(watch);
    };
    // the way back collapses into the toggle, so it plays to the end
    if (toDark) frame = requestAnimationFrame(watch);
    addEventListener("wheel", end, { passive: true });
    addEventListener("touchmove", end, { passive: true });
    addEventListener("keydown", end);
    addEventListener("resize", end);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("wheel", end);
      removeEventListener("touchmove", end);
      removeEventListener("keydown", end);
      removeEventListener("resize", end);
    };
  }, [revealed, toDark, onDone]);

  return createPortal(
    <div
      ref={root}
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483647,
        pointerEvents: "none",
        border: "none",
        transition: `opacity ${FADE}ms ease-out`,
      }}
    >
      <DistortionWave
        ref={wave}
        palette="mono"
        // full screen scales every length up, so the suck toward the toggle is eased back to the card's feel
        waveStyle={PULL}
        revealed={revealed}
        source={source}
        live={false}
        resolution={Math.min(devicePixelRatio || 1, 1.5)}
        cornerRadius={0}
        revealedContent={dark ? <Picture canvas={dark} /> : undefined}
        onFinish={(shown) => shown === toDark && onDone()}
        style={{ width: "100%", height: "100%", border: "none" }}
      >
        {light && <Picture canvas={light} />}
      </DistortionWave>
    </div>,
    document.body,
  );
}

export default function ThemeToggle({
  onClick,
  onPointerEnter,
  onFocus,
  sound = true,
  ...props
}: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const pictures = useRef<Pictures | null>(null);
  const warming = useRef<Promise<void> | null>(null);
  const [wave, setWave] = useState<Wave | null>(null);

  const finish = useCallback(() => setWave(null), []);

  const next = (resolvedTheme === "dark" ? "light" : "dark") as Theme;
  const fresh = (p: Pictures | null) =>
    p && p.theme === resolvedTheme && p.view === viewKey() && performance.now() - p.at < FRESH_FOR ? p : null;

  // pictured on approach, so the click itself has nothing left to wait for
  const warm = () => {
    if (warming.current || fresh(pictures.current)) return;
    const theme = resolvedTheme;
    const view = viewKey();
    warming.current = (async () => {
      const before = await pagePicture();
      let after: HTMLCanvasElement | null = await otherThemePicture(next);
      if (!differs(before, after)) after = null;
      pictures.current = { before, after, theme: theme ?? "", view, at: performance.now() };
    })()
      .catch(() => {
        pictures.current = null;
      })
      .finally(() => {
        warming.current = null;
      });
  };

  const toggle = async (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || wave) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    event.preventDefault();
    if (sound) tick();

    const source = event.currentTarget;
    const apply = () => flushSync(() => setTheme(next));
    try {
      if (warming.current) await warming.current;
      const ready = fresh(pictures.current);
      pictures.current = null;
      const before = ready?.before ?? (await pagePicture());
      const after = ready?.after ?? null;
      const toDark = next === "dark";
      const pair = (b: HTMLCanvasElement, a: HTMLCanvasElement | null) =>
        toDark ? { light: b, dark: a } : { light: a, dark: b };
      // the overlay paints in the same frame as the switch, so the page never shows the new theme early
      flushSync(() => setWave({ ...pair(before, after), toDark, source }));
      apply();
      if (!after) {
        const late = await pagePicture();
        setWave((current) => current && { ...current, ...pair(before, late) });
      }
    } catch {
      apply();
      setWave(null);
    }
  };

  return (
    <>
      <UiThemeToggle
        {...props}
        sound={sound}
        onClick={toggle}
        onPointerEnter={(event) => {
          onPointerEnter?.(event);
          warm();
        }}
        onFocus={(event) => {
          onFocus?.(event);
          warm();
        }}
      />
      {wave && (
        <ThemeWave {...wave} onDone={finish} />
      )}
    </>
  );
}

export { UiThemeToggle as ThemeToggle };
