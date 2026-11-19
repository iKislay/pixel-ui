"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { createPortal, flushSync } from "react-dom";
import { useTheme } from "next-themes";
import { DistortionWave, snapshot, type DistortionWaveHandle } from "distortion-waves";
import {
  ThemeToggle as UiThemeToggle,
  tick,
  type ThemeToggleProps,
} from "@/components/ui/theme-toggle";

type Theme = "light" | "dark";

type Pictures = { before: HTMLCanvasElement; after: HTMLCanvasElement | null };

type Wave = {
  light: HTMLCanvasElement | null;
  dark: HTMLCanvasElement | null;
  toDark: boolean;
};

const SIDES = ["top", "right", "bottom", "left"];

const FADE = 220;

// same front as the appearance demo, with a shorter afterglow so the page comes back sooner
const WAVE_STYLE = {
  rimFade: 1.4,
  hairlineLinger: 0.2,
  hairlineFade: 1.4,
  particleLife: 1.2,
};

const SCROLL_KEYS = new Set([" ", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"]);

const NO_TRANSITIONS = "*,*::before,*::after{transition:none!important}";

// small screens get lighter pictures and a lighter canvas, so the wave keeps its frame rate on phones
const resolution = () => (innerWidth < 768 ? 1 : Math.min(devicePixelRatio || 1, 1.5));

function pagePicture() {
  return snapshot(document.documentElement, {
    width: document.documentElement.clientWidth,
    height: innerHeight,
    scale: resolution(),
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

async function takePictures(next: Theme): Promise<Pictures> {
  const before = await pagePicture();
  const after = await otherThemePicture(next);
  return { before, after: differs(before, after) ? after : null };
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

// light is always the first view and dark the second, like the appearance demo:
// going dark sends the wave up the screen, going light pulls it back down
function ThemeWave({ light, dark, toDark, onDone }: Wave & { onDone: () => void }) {
  const wave = useRef<DistortionWaveHandle>(null);
  const root = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(!toDark);
  const ready = Boolean(light && dark);

  // the overlay sits on top of the whole site, so it must never outlive a wave that went wrong
  useEffect(() => {
    const limit = setTimeout(onDone, 5000);
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

  // the picture cannot scroll, so the page holds still for the short wave instead of jumping at the end
  useEffect(() => {
    const hold = (event: Event) => event.preventDefault();
    const holdKeys = (event: globalThis.KeyboardEvent) => {
      if (SCROLL_KEYS.has(event.key)) event.preventDefault();
    };
    let ending = false;
    const end = () => {
      if (ending) return;
      ending = true;
      if (root.current) root.current.style.opacity = "0";
      setTimeout(onDone, FADE);
    };
    addEventListener("wheel", hold, { passive: false, capture: true });
    addEventListener("touchmove", hold, { passive: false, capture: true });
    addEventListener("keydown", holdKeys, { capture: true });
    addEventListener("resize", end);
    return () => {
      removeEventListener("wheel", hold, { capture: true });
      removeEventListener("touchmove", hold, { capture: true });
      removeEventListener("keydown", holdKeys, { capture: true });
      removeEventListener("resize", end);
    };
  }, [onDone]);

  const width = document.documentElement.clientWidth;
  const height = innerHeight;

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
        revealed={revealed}
        // always up from the bottom edge, wherever the toggle sits
        source={{ x: 0, y: height - 1, w: width, h: 1 }}
        live={false}
        resolution={resolution()}
        cornerRadius={0}
        waveStyle={WAVE_STYLE}
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
  onPointerDown,
  onKeyDown,
  sound = true,
  ...props
}: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const pressing = useRef<{ pictures: Promise<Pictures>; at: number } | null>(null);
  const [wave, setWave] = useState<Wave | null>(null);
  const finish = useCallback(() => setWave(null), []);

  const next: Theme = resolvedTheme === "dark" ? "light" : "dark";

  // pictured on press, so the page cannot change before the click and most of the work is done by then
  const press = () => {
    if (wave) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const pictures = takePictures(next);
    pictures.catch(() => {});
    pressing.current = { pictures, at: performance.now() };
  };

  const toggle = async (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || wave) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    event.preventDefault();
    if (sound) tick();

    const apply = () => flushSync(() => setTheme(next));
    // a press that never became a click, such as a drag away, leaves pictures too old to trust
    const pressed = pressing.current;
    pressing.current = null;
    const taking =
      pressed && performance.now() - pressed.at < 1000 ? pressed.pictures : takePictures(next);
    try {
      const { before, after } = await taking;
      const toDark = next === "dark";
      const pair = (b: HTMLCanvasElement, a: HTMLCanvasElement | null) =>
        toDark ? { light: b, dark: a } : { light: a, dark: b };
      // the overlay paints in the same frame as the switch, so the page never shows the new theme early
      flushSync(() => setWave({ ...pair(before, after), toDark }));
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
        onPointerDown={(event: PointerEvent<HTMLButtonElement>) => {
          onPointerDown?.(event);
          press();
        }}
        onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => {
          onKeyDown?.(event);
          if (event.key === "Enter" || event.key === " ") press();
        }}
      />
      {wave && <ThemeWave {...wave} onDone={finish} />}
    </>
  );
}

export { UiThemeToggle as ThemeToggle };
