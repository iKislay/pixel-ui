"use client";

import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { animate, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export type Point = { x: number; y: number };
type Target = string | Element | Point;

export type Cursor = {
  find: (selector: string, text?: string) => Element;
  move: (
    target: Target,
    options?: { duration?: number; track?: Element },
  ) => Promise<void>;
  click: (target: Target, on?: Element) => Promise<void>;
  wait: (ms: number) => Promise<void>;
};

export type Script = (cursor: Cursor) => Promise<void>;

export type RecordingProps = { playing?: boolean; autoPlay?: boolean };

const REST: Point = { x: 0.78, y: 0.84 };
const PATH_EASE: [number, number, number, number] = [0.45, 0, 0.2, 1];

class Stopped extends Error {}

export default function Player({
  script,
  width,
  height,
  playing = false,
  autoPlay = false,
  showCursor = true,
  children,
}: RecordingProps & {
  script: Script;
  width?: number;
  height?: number;
  showCursor?: boolean;
  children: ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef(script);
  const [take, setTake] = useState(0);
  const [inView, setInView] = useState(false);
  const reduced = useReducedMotion();
  const live = !reduced && (autoPlay ? inView : playing);
  const sized = Boolean(width && height);

  useLayoutEffect(() => {
    scriptRef.current = script;
  });

  // contain, never cover, so the stage always fits inside the card
  useLayoutEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage || !width || !height) return;
    const fit = () => {
      stage.style.scale = String(
        Math.min(root.offsetWidth / width, root.offsetHeight / height),
      );
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(root);
    return () => observer.disconnect();
  }, [width, height]);

  useEffect(() => {
    const root = rootRef.current;
    if (!autoPlay || !root) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.4 },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, [autoPlay]);

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    const pointer = cursorRef.current;
    if (!live || !root || !stage || !pointer) return;
    const arrow = pointer.firstElementChild as HTMLElement;
    const ring = pointer.lastElementChild as HTMLElement;
    let stopped = false;
    let current: { stop: () => void } | undefined;
    let at = { x: REST.x * root.offsetWidth, y: REST.y * root.offsetHeight };

    const guard = () => {
      if (stopped) throw new Stopped();
    };
    const step = async (animation: { then: (done: () => void) => unknown; stop: () => void }) => {
      current = animation;
      await new Promise<void>((done) => animation.then(done));
      guard();
    };
    const wait = async (ms: number) => {
      await new Promise((resolve) => setTimeout(resolve, ms));
      guard();
    };

    // the card itself may be scaled by a parent, so map through its painted size
    const frame = () => {
      const box = root.getBoundingClientRect();
      return { box, k: box.width / root.offsetWidth || 1 };
    };
    const toLocal = (target: Element | Point): Point => {
      if (!(target instanceof Element)) {
        return { x: target.x * root.offsetWidth, y: target.y * root.offsetHeight };
      }
      const { box, k } = frame();
      const r = target.getBoundingClientRect();
      return {
        x: (r.left + r.width / 2 - box.left) / k,
        y: (r.top + r.height / 2 - box.top) / k,
      };
    };
    const toClient = (p: Point) => {
      const { box, k } = frame();
      return { clientX: box.left + p.x * k, clientY: box.top + p.y * k };
    };
    const place = (p: Point) => {
      at = p;
      pointer.style.translate = `${p.x}px ${p.y}px`;
    };

    const find = (selector: string, text?: string) => {
      const match = Array.from(stage.querySelectorAll(selector)).find(
        (el) => text === undefined || el.textContent?.trim() === text,
      );
      if (!match) throw new Error(`recording target not found: ${selector} ${text ?? ""}`);
      return match;
    };
    const resolve = (target: Target) =>
      typeof target === "string" ? find(target) : target;

    const move: Cursor["move"] = async (target, { duration, track } = {}) => {
      const goal = resolve(target);
      delete pointer.dataset.hand;
      const from = at;
      const to = toLocal(goal);
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      // a slight bow, a ruler straight path reads as robotic
      const bend = { x: from.x + dx / 2 - dy * 0.15, y: from.y + dy / 2 + dx * 0.15 };
      await step(
        animate(0, 1, {
          duration: (duration ?? Math.min(1300, 550 + Math.hypot(dx, dy) * 1.4)) / 1000,
          ease: PATH_EASE,
          onUpdate: (t) => {
            const u = 1 - t;
            const p = {
              x: u * u * from.x + 2 * u * t * bend.x + t * t * to.x,
              y: u * u * from.y + 2 * u * t * bend.y + t * t * to.y,
            };
            place(p);
            track?.dispatchEvent(
              new PointerEvent("pointermove", { bubbles: true, pointerType: "mouse", ...toClient(p) }),
            );
          },
        }),
      );
      if (goal instanceof Element) {
        pointer.dataset.hand = "";
        goal.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, ...toClient(to) }));
      }
    };

    const click: Cursor["click"] = async (target, on) => {
      const goal = resolve(target);
      await move(goal, { track: on });
      const el = on ?? (goal instanceof Element ? goal : undefined);
      await step(animate(arrow, { scale: 0.8 }, { duration: 0.1, ease: "easeOut" }));
      animate(ring, { scale: [0.4, 1.5], opacity: [0.5, 0] }, { duration: 0.45, ease: "easeOut" });
      const point = toClient(at);
      el?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerType: "mouse", ...point }));
      el?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window, ...point }));
      await step(animate(arrow, { scale: 1 }, { type: "spring", stiffness: 500, damping: 22 }));
    };

    // another card's outside-click listener would treat a scripted press as a click away
    const contain = (event: Event) => event.stopPropagation();
    stage.addEventListener("pointerdown", contain);

    const cursor: Cursor = { find, move, click, wait };
    place(at);

    (async () => {
      if (showCursor) await step(animate(pointer, { opacity: 1 }, { duration: 0.3 }));
      for (;;) {
        await scriptRef.current(cursor);
        await move(REST);
        await step(animate(stage, { opacity: 0 }, { duration: 0.3 }));
        setTake((n) => n + 1);
        await wait(80);
        await step(animate(stage, { opacity: 1 }, { duration: 0.3 }));
      }
    })().catch((error) => {
      if (!(error instanceof Stopped) && !stopped) console.error(error);
    });

    return () => {
      stopped = true;
      current?.stop();
      stage.removeEventListener("pointerdown", contain);
      pointer.style.opacity = "0";
      stage.style.opacity = "1";
      setTake((n) => n + 1);
    };
  }, [live]);

  return (
    <div ref={rootRef} aria-hidden className="relative h-full w-full overflow-hidden">
      <div
        ref={stageRef}
        inert
        // scripted clicks must never reach a click handler around the preview
        onClick={(event) => {
          event.stopPropagation();
          event.preventDefault();
        }}
        style={sized ? { width, height, translate: "-50% -50%" } : undefined}
        className={cn(
          "pointer-events-none absolute",
          sized ? "left-1/2 top-1/2" : "inset-0",
        )}
      >
        <Fragment key={take}>{children}</Fragment>
      </div>

      <div
        ref={cursorRef}
        className="group/cursor pointer-events-none absolute left-0 top-0 z-10 opacity-0"
      >
        {/* the top left corner is the hotspot, so a press scales toward the tip */}
        <span className="block origin-top-left drop-shadow-[0_2px_3px_rgba(10,60,110,0.35)]">
          <svg
            viewBox="0 0 24 24"
            className="block -ml-[3.5px] -mt-[2.5px] size-6 group-data-[hand]/cursor:hidden"
          >
            <path
              d="M3.5 2.5 20.5 10.2Q12.6 12.4 10.3 20.5Z"
              fill="#8CC8EE"
              stroke="#2A8AD4"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path
              d="M5.6 4.9 17 10"
              stroke="#fff"
              strokeOpacity="0.7"
              strokeWidth="1.1"
              strokeLinecap="round"
            />
          </svg>
          <svg
            viewBox="0 0 24 24"
            className="-ml-[9.25px] -mt-[1.5px] hidden size-6 group-data-[hand]/cursor:block"
          >
            <path
              d="M7.5 13V3.25a1.75 1.75 0 0 1 3.5 0V9a1.6 1.6 0 0 1 3.2 0v.8a1.5 1.5 0 0 1 3 0v1a1.4 1.4 0 0 1 2.8 0v4.7c0 4.1-2.8 7-6.6 7h-1.1c-2.4 0-3.9-.8-5.4-2.3l-3.5-3.6a1.6 1.6 0 0 1 2.3-2.2l1.8 1.8Z"
              fill="#8CC8EE"
              stroke="#2A8AD4"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <path
              d="M11 9v3.5M14.2 9.8v2.9M17.2 10.8v2.4"
              stroke="#2A8AD4"
              strokeWidth="1.1"
              strokeLinecap="round"
            />
            <path
              d="M9.25 3v5"
              stroke="#fff"
              strokeOpacity="0.7"
              strokeWidth="1"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <span className="absolute left-0 top-0 -ml-4 -mt-4 size-8 rounded-full bg-[#2A8AD4]/35 opacity-0" />
      </div>
    </div>
  );
}
