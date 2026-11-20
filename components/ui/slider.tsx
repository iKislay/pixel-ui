"use client";

import { useEffect, useState, type ComponentProps } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { cn } from "@/lib/utils";

export type SliderFeedback = "select";

export type SliderProps = Omit<ComponentProps<"input">, "type" | "value" | "defaultValue" | "onChange"> & {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  ticks?: number;
  formatValue?: (value: number) => string;
  onValueChange?: (value: number) => void;
  onFeedback?: (event: SliderFeedback) => void;
};

const REST = 0.38;
const REACH = 0.09;

function Tick({ at, focus, filled }: { at: number; focus: MotionValue<number>; filled: boolean }) {
  // ticks near the focus point swell like a magnifier, falling off as a bell curve
  const height = useTransform(focus, (f) => `${(REST + (1 - REST) * Math.exp(-(((at - f) / REACH) ** 2))) * 100}%`);

  return (
    <motion.span
      style={{ height }}
      className={cn(
        "w-[3px] shrink-0 rounded-full transition-colors duration-150 motion-reduce:transition-none",
        filled ? "bg-brand" : "bg-foreground/20",
      )}
    />
  );
}

export function Slider({
  value,
  defaultValue,
  min = 0,
  max = 100,
  step = 1,
  ticks = 40,
  formatValue = String,
  onValueChange,
  onFeedback,
  className,
  disabled,
  onFocus,
  onBlur,
  ...props
}: SliderProps) {
  const [inner, setInner] = useState(defaultValue ?? min);
  const current = value ?? inner;
  const ratio = (current - min) / (max - min);
  const [hover, setHover] = useState<number | null>(null);
  const [focused, setFocused] = useState(false);
  const reduce = useReducedMotion();

  // far off the track means no tick swells
  const target = useMotionValue(-1);
  const focus = useSpring(target, { stiffness: 400, damping: 36 });
  const active = hover !== null || focused;

  useEffect(() => {
    const next = reduce ? -1 : (hover ?? (focused ? ratio : -1));
    target.set(next);
    if (next === -1) focus.jump(-1);
  }, [hover, focused, ratio, reduce, target, focus]);

  return (
    <div
      data-slot="slider"
      onPointerMove={(event) => {
        const box = event.currentTarget.getBoundingClientRect();
        setHover(Math.min(Math.max((event.clientX - box.left - 13) / (box.width - 26), 0), 1));
      }}
      onPointerLeave={() => setHover(null)}
      className={cn(
        "group relative flex h-12 w-full touch-none items-center justify-between rounded-[18px] bg-foreground/[0.05] px-3 py-2.5 [corner-shape:squircle] has-disabled:opacity-45 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand",
        className,
      )}
    >
      {Array.from({ length: ticks }, (_, i) => {
        const at = i / (ticks - 1);
        return <Tick key={i} at={at} focus={focus} filled={at <= ratio + 1e-9} />;
      })}

      <span
        aria-hidden
        style={{ left: `calc(13px + (100% - 26px) * ${ratio})` }}
        className="pointer-events-none absolute inset-y-1.5 w-[3px] -translate-x-1/2 rounded-full bg-foreground transition-transform duration-150 group-active:scale-y-110 motion-reduce:transition-none"
      />

      <AnimatePresence>
        {active && (
          <motion.span
            aria-hidden
            initial={{ opacity: 0, y: 6, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.8 }}
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 30 }}
            style={{ left: `calc(13px + (100% - 26px) * ${ratio})` }}
            className="pointer-events-none absolute -top-9 -translate-x-1/2 rounded-[10px] bg-foreground px-2 py-1 font-mono text-[11px] font-semibold text-background tabular-nums shadow-md [corner-shape:squircle]"
          >
            {formatValue(current)}
          </motion.span>
        )}
      </AnimatePresence>

      {/* the native range sits invisibly on top, so dragging, keyboard and screen readers come for free */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={current}
        disabled={disabled}
        aria-valuetext={formatValue(current)}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        onChange={(event) => {
          const next = Number(event.target.value);
          setInner(next);
          onValueChange?.(next);
          onFeedback?.("select");
        }}
        className="absolute inset-y-0 left-[5px] right-[5px] m-0 cursor-ew-resize opacity-0 disabled:cursor-not-allowed"
        {...props}
      />
    </div>
  );
}
