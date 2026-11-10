"use client";

import * as React from "react";
import { flushSync } from "react-dom";
import { animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

const FACE_W = 30;
const FACE_H = 36;
const WHEEL_GAIN = 3;
const PULL_MS = 110;
const SHOOT_MS = 90;
const RELOAD_PX = 30;
const EDGE_GAP = 28;
const WEB_LIFE_MS = 1600;
const COVER_LIFE_MS = 2600;
const DRAG_LAG_MS = 180;
const DRAG_HANG = 26;
const CLICKABLE = "button, a, [role='button']";
const SPRING = { type: "spring", stiffness: 520, damping: 11 } as const;

type Pt = [number, number];
type Web = ReturnType<typeof weave> & { id: number; life: number };
type Mode = "mask" | "text" | "dot";
type Drag = { el: HTMLElement; px: number; py: number; cx: number; cy: number; t: number };

const n = (v: number) => v.toFixed(1);

function dot(x: number, y: number, r: number) {
  return `M${n(x - r)} ${n(y)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
}

function weave([cx, cy]: Pt, anchors: Pt[], rings: number, blob = 0) {
  let spokes = "";
  let net = "";
  let knots = blob ? dot(cx, cy, blob) : "";
  let reach = 0;
  let girth = 0;
  for (const [x, y] of anchors) {
    spokes += `M${n(cx)} ${n(cy)}L${n(x)} ${n(y)}`;
    knots += dot(x, y, 1.4);
    reach = Math.max(reach, Math.hypot(x - cx, y - cy));
  }
  for (let k = 1; k <= rings; k++) {
    const t = k / (rings + 0.4);
    const at = ([x, y]: Pt): Pt => [cx + (x - cx) * t, cy + (y - cy) * t];
    let prev = at(anchors[anchors.length - 1]);
    let length = 0;
    net += `M${n(prev[0])} ${n(prev[1])}`;
    for (const anchor of anchors) {
      const next = at(anchor);
      const qx = cx + ((prev[0] + next[0]) / 2 - cx) * 0.84;
      const qy = cy + ((prev[1] + next[1]) / 2 - cy) * 0.84;
      net += `Q${n(qx)} ${n(qy)} ${n(next[0])} ${n(next[1])}`;
      length += Math.hypot(next[0] - prev[0], next[1] - prev[1]);
      prev = next;
    }
    girth = Math.max(girth, length * 1.1);
  }
  return { spokes, net, knots, reach, girth };
}

function ring([cx, cy]: Pt, count: number, radius: (i: number) => number, wobble = 0): Pt[] {
  const turn = wobble && Math.random() * Math.PI * 2;
  return Array.from({ length: count }, (_, i) => {
    const a = turn + (i / count) * Math.PI * 2 + (Math.random() - 0.5) * wobble;
    return [cx + Math.cos(a) * radius(i), cy + Math.sin(a) * radius(i)];
  });
}

function cover(x: number, y: number, w: number, h: number) {
  const c: Pt = [x + w / 2, y + h / 2];
  const rx = w / 2 + 2;
  const ry = h / 2 + 5;
  const anchors = ring(c, 11, () => 0.9 + Math.random() * 0.2, 0.2);
  const oval = anchors.map(([ax, ay]): Pt => [c[0] + (ax - c[0]) * rx, c[1] + (ay - c[1]) * ry]);
  return { ...weave(c, oval, 3), knots: "" };
}

const THROWS: ((c: Pt) => ReturnType<typeof weave>)[] = [
  (c) => weave(c, ring(c, 9, () => 40 + Math.random() * 12, 0.25), 3),
  (c) => weave(c, ring(c, 14, (i) => (i % 2 ? 16 : 30) + Math.random() * 6, 0.2), 1, 6),
  (c) => weave(c, ring(c, 6, () => 34 + Math.random() * 30, 0.5), 2),
];

const MASK_WEB = weave([0, 3], ring([0, 3], 12, () => 30), 4);

function wordAt(x: number, y: number) {
  const pos = document.caretPositionFromPoint?.(x, y);
  const node = pos?.offsetNode;
  if (!pos || !(node instanceof Text) || node.parentElement?.closest(CLICKABLE)) return null;
  let start = pos.offset;
  let end = pos.offset;
  while (start > 0 && /\S/.test(node.data[start - 1])) start--;
  while (end < node.data.length && /\S/.test(node.data[end])) end++;
  if (start === end) return null;
  const range = document.createRange();
  range.setStart(node, start);
  range.setEnd(node, end);
  const r = range.getBoundingClientRect();
  // the caret api snaps to the nearest text, so confirm the pointer is really on the word
  return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom ? r : null;
}

function setStrand(g: SVGGElement | null, d: string) {
  g?.querySelectorAll("path").forEach((p) => p.setAttribute("d", d));
}

function strandPath(x1: number, y1: number, x2: number, y2: number, stuck: boolean) {
  const tip = stuck
    ? `M${x2 - 6} ${y2}L${x2 + 6} ${y2}M${x2 - 4} ${y2 - 4}L${x2 + 4} ${y2 + 4}M${x2 + 4} ${y2 - 4}L${x2 - 4} ${y2 + 4}`
    : "";
  return `M${x1} ${y1}L${x2} ${y2}${tip}`;
}

function settle(el: HTMLElement, dx: number, dy: number) {
  el.style.zIndex = "50";
  animate(1, 0, {
    type: "spring",
    stiffness: 260,
    damping: 22,
    onUpdate: (p) => {
      el.style.translate = `${dx * p}px ${dy * p}px`;
    },
    onComplete: () => {
      el.style.translate = el.style.zIndex = "";
    },
  });
}

type SilkProps = {
  d: string;
  len: number;
  width: number;
  duration: number;
  delay?: number;
  still: boolean;
};

function Silk({ d, len, width, duration, delay = 0, still }: SilkProps) {
  const draw = {
    d,
    fill: "none",
    strokeLinecap: "round" as const,
    strokeDasharray: len + 4,
    initial: { strokeDashoffset: still ? 0 : len + 4 },
    animate: { strokeDashoffset: 0 },
    transition: { duration, delay, ease: "easeOut" as const },
  };
  return (
    <>
      <motion.path {...draw} stroke="#111" strokeWidth={width + 1} />
      <motion.path {...draw} stroke="#fff" strokeWidth={width} />
    </>
  );
}

function Mask() {
  const clip = React.useId();
  return (
    <svg viewBox="-20 -24 40 48" width={FACE_W} height={FACE_H} overflow="visible">
      <clipPath id={clip}>
        <ellipse rx="18" ry="22" />
      </clipPath>
      <ellipse rx="18" ry="22" fill="#dc2626" />
      <path
        d={MASK_WEB.spokes + MASK_WEB.net}
        clipPath={`url(#${clip})`}
        fill="none"
        stroke="#111"
        strokeWidth="0.7"
      />
      <ellipse rx="18" ry="22" fill="none" stroke="#111" strokeWidth="1.6" />
      <g fill="#fff" stroke="#111" strokeWidth="2" strokeLinejoin="round">
        <path d="M-3 1L-14 -8L-11 5Z" />
        <path d="M3 1L14 -8L11 5Z" />
      </g>
    </svg>
  );
}

type SpiderCursorProps = React.ComponentProps<"div"> & {
  onWebDrop?: (item: HTMLElement, zone: HTMLElement | null) => void;
};

export function SpiderCursor({ className, children, onWebDrop, ...props }: SpiderCursorProps) {
  const reduce = !!useReducedMotion();
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const strandRef = React.useRef<SVGGElement>(null);
  const drag = React.useRef<Drag | null>(null);
  const ids = React.useRef(0);
  const scrolling = React.useRef(false);
  const [visible, setVisible] = React.useState(false);
  const [webs, setWebs] = React.useState<Web[]>([]);
  const [mode, setMode] = React.useState<Mode>("mask");
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const scaleX = useMotionValue(1);
  const scaleY = useMotionValue(1);
  const lean = useMotionValue(0);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el || reduce) return;
    let pos = 0;
    let target = 0;
    let queued = 0;
    let raf = 0;
    let last = 0;
    let stretch = 0;
    let shot = 0;
    let tipX = 0;
    let tipY = 0;

    // the tip sticks to a spot on the page, and the page is pulled until that spot reaches the mask
    const shoot = (t: number) => {
      const h = el.clientHeight;
      const max = el.scrollHeight - h;
      const dir = Math.sign(queued);
      const fy = Math.min(Math.max(y.get(), 0), h);
      const edge = Math.max(dir > 0 ? h - fy : fy, h * 0.35) - EDGE_GAP;
      const room = dir > 0 ? max - target : target;
      const reach = Math.min(Math.abs(queued), edge - Math.abs(target - pos), room);
      queued = room > reach ? queued - dir * reach : 0;
      if (reach < 1) return false;
      target += dir * reach;
      shot = t;
      tipX = x.get() + (Math.random() - 0.5) * 50;
      tipY = fy + target;
      return true;
    };

    const step = (t: number) => {
      const dt = Math.min(t - last, 50) || 16;
      last = t;
      const h = el.clientHeight;
      const move = (target - pos) * (1 - Math.exp(-dt / PULL_MS));
      pos += move;
      el.scrollTop = pos;
      const left = Math.abs(target - pos);
      const dir = Math.sign(target - pos);
      const fx = x.get();
      const fy = Math.min(Math.max(y.get(), 0), h);

      stretch += (Math.min(1, Math.abs(move) / dt / 2.5) - stretch) * 0.25;
      scaleY.set(1 + stretch * 0.3);
      scaleX.set(1 - stretch * 0.18);
      lean.set(dir * stretch * 5);

      if (left < RELOAD_PX && queued && shoot(t)) {
        raf = requestAnimationFrame(step);
        return;
      }
      if (left < 0.5) {
        el.scrollTop = pos = target;
        raf = stretch = 0;
        queued = 0;
        scrolling.current = false;
        if (!drag.current) setStrand(strandRef.current, "");
        animate(scaleX, 1, SPRING);
        animate(scaleY, 1, SPRING);
        animate(lean, 0, SPRING);
        return;
      }

      if (!drag.current) {
        const p = Math.min(1, (t - shot) / SHOOT_MS);
        const ay = tipY - pos;
        setStrand(strandRef.current, strandPath(fx, fy, fx + (tipX - fx) * p, fy + (ay - fy) * p, p === 1));
      }
      raf = requestAnimationFrame(step);
    };

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (drag.current) return e.preventDefault();
      const max = el.scrollHeight - el.clientHeight;
      if (!raf) pos = target = el.scrollTop;
      // at the edge, let the wheel reach the page
      if (!e.deltaY || (!raf && (e.deltaY > 0 ? pos >= max - 1 : pos <= 0))) return;
      e.preventDefault();
      const delta = e.deltaY * (e.deltaMode === 1 ? 16 : 1) * WHEEL_GAIN;
      if (Math.sign(queued) !== Math.sign(delta)) queued = 0;
      queued += delta;
      const now = performance.now();
      // ticks that land while the web is still flying make that web longer
      if (raf && now - shot < SHOOT_MS && Math.sign(target - pos) === Math.sign(delta)) {
        const keepX = tipX;
        const flying = shot;
        if (shoot(now)) [tipX, shot] = [keepX, flying];
      }
      if (raf) return;
      if (!shoot(now)) return;
      scrolling.current = true;
      setMode("mask");
      last = now;
      raf = requestAnimationFrame(step);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      cancelAnimationFrame(raf);
      scrolling.current = false;
    };
  }, [reduce, x, y, scaleX, scaleY, lean]);

  const track = (e: React.PointerEvent) => {
    const el = scrollRef.current;
    if (e.pointerType !== "mouse" || !el) return;
    const rect = el.getBoundingClientRect();
    x.set(e.clientX - rect.left);
    y.set(e.clientY - rect.top);
    setVisible(true);
    // content sliding under a still pointer fires moves; hit testing text there stalls the scroll
    if (drag.current || scrolling.current) return;
    const over = e.target as Element;
    setMode(over.closest(CLICKABLE) ? "dot" : wordAt(e.clientX, e.clientY) ? "text" : "mask");
  };

  const grab = (e: React.PointerEvent<HTMLDivElement>, item: HTMLElement) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.style.userSelect = "none";
    item.style.zIndex = "50";
    drag.current = { el: item, px: x.get(), py: y.get(), cx: 0, cy: 0, t: performance.now() };
    animate(scaleX, 0.85, { duration: 0.1 });
    animate(scaleY, 0.85, { duration: 0.1 });

    const tick = (t: number) => {
      const d = drag.current;
      if (!d || !scrollRef.current) return;
      const k = reduce ? 1 : 1 - Math.exp(-(t - d.t) / DRAG_LAG_MS);
      const tx = x.get() - d.px;
      d.t = t;
      d.cx += (tx - d.cx) * k;
      d.cy += (y.get() - d.py + DRAG_HANG - d.cy) * k;
      d.el.style.translate = `${d.cx}px ${d.cy}px`;
      d.el.style.rotate = `${Math.max(-7, Math.min(7, (tx - d.cx) * 0.06))}deg`;
      setStrand(strandRef.current, strandPath(x.get(), y.get(), d.px + d.cx, d.py + d.cy, true));
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const release = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    const root = scrollRef.current;
    if (!d || !root) return;
    drag.current = null;
    e.currentTarget.style.userSelect = "";
    setStrand(strandRef.current, "");
    animate(scaleX, 1, SPRING);
    animate(scaleY, 1, SPRING);

    d.el.style.rotate = "";
    const from = d.el.getBoundingClientRect();
    const zone =
      document
        .elementsFromPoint(e.clientX, e.clientY)
        .find((el) => !d.el.contains(el))
        ?.closest<HTMLElement>("[data-web-drop]") ?? null;
    flushSync(() => onWebDrop?.(d.el, zone));

    // moving between lists remounts the item, so find the new node by its id
    const id = d.el.dataset.webDrag;
    const el = (id && root.querySelector<HTMLElement>(`[data-web-drag="${CSS.escape(id)}"]`)) || d.el;
    d.el.style.translate = d.el.style.zIndex = "";
    const to = el.getBoundingClientRect();
    if (!reduce) settle(el, from.left - to.left, from.top - to.top);
  };

  const press = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (e.pointerType !== "mouse" || e.button !== 0 || !el) return;
    track(e);
    const target = e.target as Element;
    const item = target.closest<HTMLElement>("[data-web-drag]");
    if (item && el.contains(item)) {
      setMode("mask");
      return grab(e, item);
    }
    // a press on text starts a selection, so no web
    if (wordAt(e.clientX, e.clientY)) return;

    const rect = el.getBoundingClientRect();
    const ox = el.scrollLeft - rect.left;
    const oy = el.scrollTop - rect.top;
    const button = target.closest(CLICKABLE);
    const b = button && el.contains(button) ? button.getBoundingClientRect() : null;
    const id = ids.current++;
    const web: Web = b
      ? { id, life: COVER_LIFE_MS, ...cover(b.left + ox, b.top + oy, b.width, b.height) }
      : { id, life: WEB_LIFE_MS, ...THROWS[id % THROWS.length]([e.clientX + ox, e.clientY + oy]) };
    setWebs((prev) => [...prev, web]);
    setTimeout(() => setWebs((prev) => prev.filter((w) => w.id !== id)), web.life);
    if (reduce) return;
    animate(scaleX, [1, 0.7, 1.1, 1], { duration: 0.36 });
    animate(scaleY, [1, 0.7, 1.1, 1], { duration: 0.36 });
  };

  const morph = { duration: reduce ? 0 : 0.15 };

  return (
    <div
      data-slot="spider-cursor"
      className={cn("relative cursor-none overflow-hidden selection:bg-red-500/30! selection:text-current! [&_*]:cursor-none", className)}
      {...props}
      onPointerMove={track}
      onPointerDown={press}
      onPointerUp={release}
      onPointerCancel={release}
      onPointerLeave={() => setVisible(false)}
    >
      <div
        ref={scrollRef}
        className="relative isolate h-full overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
        <svg aria-hidden className="pointer-events-none absolute top-0 left-0 size-px overflow-visible">
          {webs.map((w) => (
            <motion.g
              key={w.id}
              animate={{ opacity: [1, 1, 0], y: [0, 0, reduce ? 0 : 12] }}
              transition={{ duration: w.life / 1000, times: [0, 0.75, 1], ease: "easeIn" }}
            >
              <Silk d={w.spokes} len={w.reach} width={1.2} duration={0.16} still={reduce} />
              <Silk d={w.net} len={w.girth} width={0.9} duration={0.45} delay={0.1} still={reduce} />
              <motion.path
                d={w.knots}
                fill="#fff"
                stroke="#111"
                strokeWidth="0.7"
                initial={{ opacity: reduce ? 1 : 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.14, duration: 0.06 }}
              />
            </motion.g>
          ))}
        </svg>
      </div>
      <svg aria-hidden className="pointer-events-none absolute inset-0 size-full">
        <g ref={strandRef} fill="none" strokeLinecap="round">
          <path stroke="#111" strokeWidth="2.9" />
          <path stroke="#fff" strokeWidth="1.5" />
        </g>
      </svg>
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 size-0"
        style={{ x, y, opacity: visible ? 1 : 0 }}
      >
        <motion.div
          className="absolute"
          style={{ left: -FACE_W / 2, top: -FACE_H / 2 }}
          animate={{ scale: mode === "mask" ? 1 : 0 }}
          transition={morph}
        >
          <motion.div style={{ scaleX, scaleY, y: lean }}>
            <Mask />
          </motion.div>
        </motion.div>
        <motion.div
          className={cn(
            "absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600",
            mode === "dot" && "ring-1 ring-white",
          )}
          initial={false}
          animate={{
            width: mode === "text" ? 2 : 8,
            height: mode === "text" ? 22 : 8,
            scale: mode === "mask" ? 0 : 1,
          }}
          transition={morph}
        />
      </motion.div>
    </div>
  );
}
