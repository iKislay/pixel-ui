"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type ComicGlitchTextProps = Omit<React.HTMLAttributes<HTMLParagraphElement>, "children"> & {
  children: string;
  stagger?: number;
  loop?: boolean;
};

type Fx = "hide" | "panel" | "slice" | "chroma" | "bold" | "rest";
type Word = { el: HTMLSpanElement; queue: Fx[]; enterAt: number; exitAt: number };

const FPS = 24;
const HOLD = 4.2 * FPS;
const GAP = 0.6 * FPS;
const PANELS = [
  { fill: "#22e04a", ink: "#000" },
  { fill: "#d61cf0", ink: "#fff" },
  { fill: "#3b1cf5", ink: "#fff" },
  { fill: "#f5b700", ink: "#000" },
];
const GHOSTS = ["#ff2bd6", "#19e3ff", "#ffe14d", "#22e04a"];

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(xs: readonly T[]) => xs[Math.floor(Math.random() * xs.length)];
const glitch = (): Fx => (Math.random() < 0.5 ? "panel" : "slice");

const enterSeq = (): Fx[] => [glitch(), glitch(), "chroma", glitch(), "chroma", "chroma", ...Array<Fx>(10).fill("bold"), "rest"];
const idleSeq = (): Fx[] => [glitch(), "chroma", glitch(), "bold", "bold", "rest"];
const exitSeq = (): Fx[] => [glitch(), glitch(), "hide"];

function poly(points: number[][]) {
  return points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
}

function paint(w: Word, fx: Fx, hatch: string) {
  const el = w.el;
  el.dataset.fx = fx;
  el.style.rotate = fx === "panel" ? `${rand(-7, 7)}deg` : "";
  const [svg, text, dots, ...ghosts] = Array.from(el.children) as HTMLElement[];
  text.style.translate = fx === "slice" ? `${rand(-0.08, 0.08)}em ${rand(-0.05, 0.05)}em` : "";

  if (fx === "panel") {
    const p = pick(PANELS);
    const s = pick(PANELS.filter((x) => x !== p));
    const j = () => rand(-7, 7);
    const body = [[j(), j()], [rand(35, 75), rand(-14, 6)], [100 + j(), j()], [100 + j(), 100 + j()], [j(), 100 + j()]];
    const cx = Math.random() < 0.5 ? rand(-6, 12) : rand(88, 106);
    const cy = Math.random() < 0.5 ? rand(-18, 0) : rand(100, 118);
    const shard = [[cx, cy], [cx + rand(-38, 38), rand(30, 70)], [cx + rand(-24, 24), rand(20, 80)]];
    el.style.color = p.ink;
    svg.innerHTML =
      `<polygon points="${poly(shard)}" fill="${s.fill}" stroke="#000" stroke-width="2" vector-effect="non-scaling-stroke"/>` +
      `<polygon points="${poly(body)}" fill="${p.fill}" stroke="#000" stroke-width="2.5" vector-effect="non-scaling-stroke"/>` +
      (Math.random() < 0.5 ? `<polygon points="${poly(body)}" fill="url(#${hatch})"/>` : "");
  } else {
    el.style.color = "";
  }

  if (fx === "panel" || fx === "slice") {
    dots.style.left = `${rand(-15, 90)}%`;
    dots.style.top = `${rand(-50, 80)}%`;
    for (const g of ghosts) {
      const top = rand(0, 70);
      g.style.color = pick(GHOSTS);
      g.style.clipPath = `inset(${top}% 0 ${Math.max(0, 100 - top - rand(15, 45))}% 0)`;
      g.style.translate = `${rand(-0.3, 0.3)}em ${rand(-0.12, 0.12)}em`;
    }
  }
}

export function ComicGlitchText({ children, stagger = 3, loop = true, className, ...props }: ComicGlitchTextProps) {
  const rootRef = React.useRef<HTMLParagraphElement>(null);
  const hatch = `hatch-${React.useId().replace(/[^a-z0-9]/gi, "")}`;
  const words = children.split(/\s+/).filter(Boolean);

  React.useEffect(() => {
    const els = Array.from(rootRef.current!.querySelectorAll<HTMLSpanElement>("[data-fx]"));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach((el) => (el.dataset.fx = "rest"));
      return;
    }

    const list: Word[] = els.map((el) => ({ el, queue: [], enterAt: 0, exitAt: Infinity }));
    const entered = list.length * stagger + 16;
    const exitStart = entered + HOLD;
    const cycle = exitStart + list.length + 3 + GAP;

    const plan = () => {
      const order = list.map((_, i) => i).sort(() => Math.random() - 0.5);
      list.forEach((w, i) => {
        w.enterAt = i * stagger;
        w.exitAt = loop ? exitStart + order[i] : Infinity;
      });
    };

    let f = 0;
    plan();
    const id = setInterval(() => {
      for (const w of list) {
        if (f === w.enterAt) w.queue = enterSeq();
        if (f === w.exitAt) w.queue = exitSeq();
      }
      // idle re-glitch, kept out of the reveal and the exit
      if (f > entered && (!loop || f < exitStart) && f % 19 === 0 && Math.random() < 0.7) {
        const w = pick(list);
        if (!w.queue.length) w.queue = idleSeq();
      }
      for (const w of list) {
        const fx = w.queue.shift();
        if (fx) paint(w, fx, hatch);
      }
      f++;
      if (loop && f >= cycle) {
        f = 0;
        plan();
      }
    }, 1000 / FPS);
    return () => clearInterval(id);
  }, [children, stagger, loop, hatch]);

  return (
    <p ref={rootRef} data-slot="comic-glitch-text" className={cn("relative", className)} {...props}>
      <span className="sr-only">{children}</span>
      <svg aria-hidden className="absolute size-0">
        <pattern id={hatch} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(70)">
          <rect width="1.6" height="6" fill="#0004" />
        </pattern>
      </svg>
      {words.map((word, i) => (
        <React.Fragment key={i}>
          {i > 0 && " "}
          <span aria-hidden data-fx="hide" className="group relative inline-block data-[fx=hide]:invisible">
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="pointer-events-none absolute -top-[0.22em] -left-[0.3em] hidden h-[calc(100%+0.44em)] w-[calc(100%+0.6em)] overflow-visible group-data-[fx=panel]:block"
            />
            <span className="relative group-data-[fx=bold]:[-webkit-text-stroke:0.03em_currentColor] group-data-[fx=bold]:[text-shadow:-0.04em_0_#ff2bd655,0.04em_0.02em_#19e3ff55] group-data-[fx=chroma]:[-webkit-text-stroke:0.035em_currentColor] group-data-[fx=chroma]:[text-shadow:-0.08em_0_#ff2bd6,0.08em_0.03em_#19e3ff,0.03em_-0.05em_#ffe14d]">
              {word}
            </span>
            <span className="pointer-events-none absolute hidden size-[0.85em] bg-[radial-gradient(#e8112d_45%,transparent_50%)] bg-[length:0.22em_0.22em] group-data-[fx=panel]:block group-data-[fx=slice]:block" />
            {[0, 1, 2].map((g) => (
              <span key={g} className="pointer-events-none absolute top-0 left-0 hidden group-data-[fx=slice]:block">
                {word}
              </span>
            ))}
          </span>
        </React.Fragment>
      ))}
    </p>
  );
}
