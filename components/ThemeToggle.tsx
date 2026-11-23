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
  revealTheme,
  tick,
  type ThemeToggleProps,
} from "@/components/ui/theme-toggle";

type Theme = "light" | "dark";

type Pictures = { before: HTMLCanvasElement; after: HTMLCanvasElement | null };

type Wave = {
  light: HTMLCanvasElement | null;
  dark: HTMLCanvasElement | null;
  toDark: boolean;
  source: Element;
  deadline: number;
  onLate: () => void;
};

const SIDES = ["top", "right", "bottom", "left"];

// same front as the appearance demo, with a shorter afterglow so the page comes back sooner
const WAVE_STYLE = {
  // full screen scales every length up, so the pull toward the toggle is eased back to the demo's feel
  pull: 12,
  inhale: 28,
  gatherGlow: 0.25,
  rimFade: 1.4,
  hairlineLinger: 0.2,
  hairlineFade: 1.4,
  particleLife: 1.2,
};

// a wave that has not started by then would feel broken, so the plain circle reveal runs instead
const START_BUDGET = 400;

const NO_TRANSITIONS = "*,*::before,*::after{transition:none!important}";

// small screens get lighter pictures and a lighter canvas, so the wave keeps its frame rate on phones
const resolution = () => (innerWidth < 768 ? 1 : Math.min(devicePixelRatio || 1, 1.5));

// media fully off screen is left out of the picture, the slow part of it: every image is fetched and
// re-encoded and every canvas copied; its parent keeps its height so nothing around it moves
function offscreenMedia() {
  const media = new Set<Element>();
  const pinned = new Map<Element, number>();
  const margin = 80;
  for (const el of document.querySelectorAll("img, canvas, video")) {
    const r = el.getBoundingClientRect();
    const away =
      r.bottom < -margin || r.top > innerHeight + margin || r.right < -margin || r.left > innerWidth + margin;
    if (!away) continue;
    media.add(el);
    const parent = el.parentElement;
    if (parent && !pinned.has(parent)) pinned.set(parent, parent.offsetHeight);
  }
  return { media, pinned };
}

function pagePicture() {
  const scrolled = scrollY;
  const { media, pinned } = offscreenMedia();
  return snapshot(document.documentElement, {
    width: document.documentElement.clientWidth,
    height: innerHeight,
    scale: resolution(),
    background: getComputedStyle(document.body).backgroundColor,
    skip: (el) => media.has(el),
    force: (el) => {
      const cs = getComputedStyle(el);
      const out: Record<string, string> = {};
      // preflight gives every box border-style solid at width 0; the picture would draw them 3px wide
      for (const side of SIDES) {
        if (cs.getPropertyValue(`border-${side}-width`) === "0px") out[`border-${side}-style`] = "none";
      }
      // the engine shifts body by the window scroll, which drags fixed bars (the navbar) out of the picture
      if (scrolled && cs.position === "fixed" && el instanceof HTMLElement) {
        out.top = `${el.offsetTop + scrolled}px`;
        out.bottom = "auto";
        out.height = `${el.offsetHeight}px`;
        out["box-sizing"] = "border-box";
      }
      const height = pinned.get(el);
      if (height !== undefined) {
        out.height = `${height}px`;
        out["box-sizing"] = "border-box";
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

// the first picture fetches and inlines every font and image it shows, the slow part of a first click,
// so one is taken while the browser is idle after load and the engine keeps them cached
let warmed = false;
function warmOnce() {
  if (warmed || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  warmed = true;
  const idle = window.requestIdleCallback ?? ((run: () => void) => setTimeout(run, 2000));
  idle(() => void pagePicture().catch(() => {}), { timeout: 5000 });
}

async function takePictures(next: Theme, signal: AbortSignal): Promise<Pictures> {
  const before = await pagePicture();
  signal.throwIfAborted();
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
// going dark sends the wave out from the toggle, going light pulls it back in
function ThemeWave({
  light,
  dark,
  toDark,
  source,
  deadline,
  onLate,
  onDone,
}: Wave & { onDone: () => void }) {
  const wave = useRef<DistortionWaveHandle>(null);
  const root = useRef<HTMLDivElement>(null);
  const phase = useRef<"waiting" | "started" | "late">("waiting");
  const [revealed, setRevealed] = useState(!toDark);
  const ready = Boolean(light && dark);

  // the overlay sits on top of the whole site, so it must never outlive a wave that went wrong
  useEffect(() => {
    const limit = setTimeout(onDone, 5000);
    return () => clearTimeout(limit);
  }, [onDone]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (phase.current !== "waiting") return;
      phase.current = "late";
      onLate();
    }, deadline - performance.now());
    return () => clearTimeout(timer);
  }, [deadline, onLate]);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    wave.current?.prepare().finally(() => {
      if (cancelled || phase.current === "late") return;
      phase.current = "started";
      setRevealed(toDark);
    });
    return () => {
      cancelled = true;
    };
  }, [ready, toDark]);

  // the window scroll slides the overlay with the page; an inner panel scroll cannot be followed, so the overlay steps aside
  useEffect(() => {
    const start = scrollY;
    const follow = (event: Event) => {
      const el = root.current;
      if (!el) return;
      if (event.target === document || event.target === document.documentElement) {
        el.style.transform = `translateY(${start - scrollY}px)`;
      } else {
        onDone();
      }
    };
    addEventListener("scroll", follow, { passive: true, capture: true });
    addEventListener("resize", onDone);
    return () => {
      removeEventListener("scroll", follow, { capture: true });
      removeEventListener("resize", onDone);
    };
  }, [onDone]);


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
      }}
    >
      <DistortionWave
        ref={wave}
        palette="mono"
        revealed={revealed}
        source={source}
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
  const pressing = useRef<{
    pictures: Promise<Pictures>;
    stop: AbortController;
    at: number;
  } | null>(null);
  const [wave, setWave] = useState<Wave | null>(null);
  const finish = useCallback(() => setWave(null), []);

  useEffect(warmOnce, []);

  const next: Theme = resolvedTheme === "dark" ? "light" : "dark";

  // pictured on press, so the page cannot change before the click and most of the work is done by then
  const press = () => {
    if (wave) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const stop = new AbortController();
    const pictures = takePictures(next, stop.signal);
    pictures.catch(() => {});
    pressing.current = { pictures, stop, at: performance.now() };
  };

  const toggle = async (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || wave) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    event.preventDefault();
    if (sound) tick();

    const source = event.currentTarget;
    const deadline = performance.now() + START_BUDGET;
    const rect = source.getBoundingClientRect();
    const reveal = (update: () => void) =>
      revealTheme(
        update,
        event.clientX || rect.left + rect.width / 2,
        event.clientY || rect.top + rect.height / 2,
      );
    const apply = () => flushSync(() => setTheme(next));
    // a press that never became a click, such as a drag away, leaves pictures too old to trust
    const pressed = pressing.current;
    pressing.current = null;
    const fresh = pressed && performance.now() - pressed.at < 1000;
    if (pressed && !fresh) pressed.stop.abort();
    const stop = fresh ? pressed.stop : new AbortController();
    const taking = fresh ? pressed.pictures : takePictures(next, stop.signal);
    try {
      const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), START_BUDGET));
      const pictures = await Promise.race([taking, timeout]);
      if (!pictures) {
        // the picture underway cannot be cut short, but the next one is skipped so the reveal gets the main thread
        stop.abort();
        reveal(() => setTheme(next));
        return;
      }
      const { before, after } = pictures;
      const toDark = next === "dark";
      const pair = (b: HTMLCanvasElement, a: HTMLCanvasElement | null) =>
        toDark ? { light: b, dark: a } : { light: a, dark: b };
      // the overlay paints in the same frame as the switch, so the page never shows the new theme early
      flushSync(() =>
        setWave({
          ...pair(before, after),
          toDark,
          source,
          deadline,
          // the theme is already applied under the overlay, so lifting it is the switch
          onLate: () => reveal(() => setWave(null)),
        }),
      );
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
