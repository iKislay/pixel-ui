"use client";

import * as React from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type Transition,
} from "motion/react";
import { cn } from "@/lib/utils";

const PX = 3;
const W = 12 * PX;
const H = 20 * PX;
const PEEK = 8 * PX;
const JUMP_AT = 76;
const MAX_PULL = 180;
const HANG_MS = 420;
const MIN_HOLD_MS = 1100;
const WHEEL_IDLE_MS = 250;

type Pose = "peek" | "hang" | "stand" | "push" | "crush";

const ARMS_UP = [
  ".DD......DD.",
  ".DD......DD.",
  ".TT..DD..TT.",
  ".TT.DDDD.TT.",
  ".TTDDDDDDTT.",
  ".T.DDDDDD.T.",
  ".T.VVVVVV.T.",
  ".T.DDDDDD.T.",
  ".T..DDDD..T.",
  ".TT.TTTT.TT.",
  "..TTTTTTTT..",
  "..TTTYYTTT..",
  "..TTTTTTTT..",
  "..DDDDDDDD..",
  "..TTTTTTTT..",
  "..TTT..TTT..",
  "..TTT..TTT..",
  "..TT....TT..",
  ".DDD....DDD.",
  ".DDD....DDD.",
];

const STRAIN = ARMS_UP.map((row, i) => (i === 6 ? ".T.VV..VV.T." : row));

const STAND = [
  "............",
  "............",
  ".....DD.....",
  "....DDDD....",
  "...DDDDDD...",
  "...DDDDDD...",
  "...VVVVVV...",
  "...DDDDDD...",
  "....DDDD....",
  "....TTTT....",
  ".TTTTTTTTTT.",
  ".TTTTYYTTTT.",
  ".TTTTTTTTTT.",
  ".DDDDDDDDDD.",
  ...ARMS_UP.slice(14),
];

const COLORS: Record<string, string> = {
  T: "#0d9488",
  D: "#111827",
  V: "#67e8f9",
  Y: "#facc15",
};

const SPRITES: Record<Pose, string[]> = {
  peek: ARMS_UP,
  hang: ARMS_UP,
  stand: STAND,
  push: STRAIN,
  crush: STRAIN,
};

const DUST = [-58, -40, -22, 22, 40, 58];

function Sprite({ rows }: { rows: string[] }) {
  return (
    <svg
      width={W}
      height={H}
      viewBox="0 0 12 20"
      shapeRendering="crispEdges"
      className="block"
    >
      {rows.flatMap((row, y) =>
        [...row].map((c, x) =>
          c === "." ? null : (
            <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={COLORS[c]} />
          ),
        ),
      )}
    </svg>
  );
}

function spriteTop(pose: Pose, gap: number) {
  if (pose === "peek") return gap - Math.min(gap * 0.35, PEEK);
  if (pose === "hang") return 0;
  return gap - H;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type PullToRefreshProps = React.HTMLAttributes<HTMLDivElement> & {
  onRefresh?: () => void | Promise<void>;
};

export function PullToRefresh({
  className,
  children,
  onRefresh,
  ...props
}: PullToRefreshProps) {
  const reduce = useReducedMotion();
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const drag = React.useRef<{ id: number; startY: number } | null>(null);
  const busyRef = React.useRef(false);
  const fallTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  const wheel = React.useRef<{ pull: number; timer?: ReturnType<typeof setTimeout> }>({ pull: 0 });
  const [pose, setPose] = React.useState<Pose>("peek");
  const [busy, setBusy] = React.useState(false);
  const [burst, setBurst] = React.useState(0);

  const gap = useMotionValue(0);
  const poseMv = useMotionValue<Pose>("peek");
  const from = useMotionValue(0);
  const t = useMotionValue(1);
  const land = useMotionValue(1);
  const jitter = useMotionValue(0);

  const top = useTransform(() => {
    const to = spriteTop(poseMv.get(), gap.get());
    return from.get() + (to - from.get()) * t.get();
  });
  const squash = useTransform(() =>
    poseMv.get() === "peek" || poseMv.get() === "hang"
      ? 1
      : Math.min(Math.max(gap.get() / H, 0), 1),
  );
  const scaleY = useTransform(() => squash.get() * land.get());
  const scaleX = useTransform(() => 1 + (1 - squash.get()) * 0.7);

  const go = React.useCallback(
    (next: Pose, transition: Transition) => {
      from.set(top.get());
      poseMv.set(next);
      setPose(next);
      t.set(0);
      if (reduce) t.set(1);
      else animate(t, 1, transition);
    },
    [from, top, poseMv, t, reduce],
  );

  React.useEffect(
    () => () => {
      clearTimeout(fallTimer.current);
      clearTimeout(wheel.current.timer);
    },
    [],
  );

  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    // touch needs a non-passive listener, or the browser claims the drag as a scroll
    const block = (e: TouchEvent) => {
      if (drag.current && gap.get() > 0 && e.cancelable) e.preventDefault();
    };
    el.addEventListener("touchmove", block, { passive: false });
    return () => el.removeEventListener("touchmove", block);
  }, [gap]);

  const jump = () => {
    go("hang", { duration: 0.28, ease: [0.2, 0.9, 0.3, 1] });
    fallTimer.current = setTimeout(() => {
      if (poseMv.get() !== "hang") return;
      go("stand", { duration: 0.26, ease: [0.5, 0, 0.9, 0.5] });
      if (!reduce) animate(land, [1, 0.78, 1.06, 1], { delay: 0.24, duration: 0.3 });
    }, HANG_MS);
  };

  const refresh = async () => {
    busyRef.current = true;
    setBusy(true);
    go("push", { duration: 0.3, ease: "easeOut" });
    await animate(gap, H, reduce ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 28 });
    const press = reduce
      ? undefined
      : animate(gap, [H, H - 7, H - 3, H - 10, H - 5], {
          duration: 1,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut",
        });
    const shake = reduce
      ? undefined
      : animate(jitter, [0, -1, 1, 0], { duration: 0.12, repeat: Infinity });
    try {
      await Promise.all([onRefresh?.(), wait(MIN_HOLD_MS)]);
    } finally {
      press?.stop();
      shake?.stop();
      jitter.set(0);
      go("crush", { duration: 0 });
      await animate(gap, 0, { duration: reduce ? 0 : 0.42, ease: [0.55, 0, 0.9, 0.3] });
      if (!reduce) setBurst((b) => b + 1);
      go("peek", { duration: 0 });
      busyRef.current = false;
      setBusy(false);
    }
  };

  const pullTo = (dy: number) => {
    const g = dy > 0 ? MAX_PULL * (1 - Math.exp(-dy / MAX_PULL)) : 0;
    gap.set(g);
    if (poseMv.get() === "peek" && g >= JUMP_AT) jump();
  };

  const release = () => {
    if (poseMv.get() !== "peek") void refresh();
    else animate(gap, 0, reduce ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 34 });
  };

  const onPointerDown =(e: React.PointerEvent<HTMLDivElement>) => {
    if (busyRef.current || e.button !== 0 || e.currentTarget.scrollTop > 0) return;
    drag.current = { id: e.pointerId, startY: e.clientY };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (drag.current?.id !== e.pointerId) return;
    const dy = e.clientY - drag.current.startY;
    if (dy > 0 && !e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.setPointerCapture(e.pointerId);
      e.currentTarget.style.userSelect = "none";
    }
    pullTo(dy);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (drag.current?.id !== e.pointerId) return;
    drag.current = null;
    e.currentTarget.style.userSelect = "";
    release();
  };

  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const w = wheel.current;
    if (busyRef.current || drag.current) return;
    if (w.pull === 0 && (e.deltaY >= 0 || e.currentTarget.scrollTop > 0)) return;
    clearTimeout(w.timer);
    if (e.deltaY > 0) {
      w.pull = 0;
      release();
      return;
    }
    w.pull -= e.deltaY * (e.deltaMode === 1 ? 16 : 1) * 0.5;
    pullTo(w.pull);
    // a pause in scrolling counts as letting go
    w.timer = setTimeout(() => {
      w.pull = 0;
      release();
    }, WHEEL_IDLE_MS);
  };

  return (
    <div
      data-slot="pull-to-refresh"
      aria-busy={busy}
      className={cn("relative overflow-hidden bg-muted", className)}
      {...props}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-0"
        style={{ left: `calc(50% - ${W / 2}px)`, x: jitter, y: top, scaleX, scaleY, originY: 1 }}
      >
        <Sprite rows={SPRITES[pose]} />
      </motion.div>
      <motion.div
        ref={scrollerRef}
        className="relative z-10 h-full overflow-y-auto overscroll-y-contain bg-background [scrollbar-width:none] [&::-webkit-scrollbar]:hidden shadow-[0_-1px_0_var(--border)]"
        style={{ y: gap }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      >
        {children}
      </motion.div>
      {burst > 0 && (
        <div key={burst} aria-hidden className="pointer-events-none absolute top-0 left-1/2 z-20">
          {DUST.map((dx, i) => (
            <motion.span
              key={i}
              className="absolute block bg-muted-foreground/60"
              style={{ width: PX * (i % 2 ? 1 : 2), height: PX * (i % 2 ? 1 : 2) }}
              initial={{ x: 0, y: 0, opacity: 1 }}
              animate={{ x: dx, y: 6 + (i % 3) * 5, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          ))}
        </div>
      )}
      <span role="status" className="sr-only">
        {busy ? "Refreshing" : ""}
      </span>
    </div>
  );
}
