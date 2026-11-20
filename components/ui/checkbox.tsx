"use client";

import { useState, type ComponentProps } from "react";
import { AnimatePresence, motion, useAnimate, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export type CheckboxFeedback = "toggle";
export type CheckedState = boolean | "indeterminate";

export type CheckboxProps = Omit<ComponentProps<"button">, "onChange" | "value"> & {
  checked?: CheckedState;
  defaultChecked?: CheckedState;
  onCheckedChange?: (checked: boolean) => void;
  onFeedback?: (event: CheckboxFeedback) => void;
};

export function Checkbox({
  checked,
  defaultChecked = false,
  onCheckedChange,
  onFeedback,
  onClick,
  className,
  ...props
}: CheckboxProps) {
  const [inner, setInner] = useState(defaultChecked);
  const [pulse, setPulse] = useState(0);
  const [scope, animate] = useAnimate<HTMLButtonElement>();
  const state = checked ?? inner;
  const on = state !== false;
  const reduce = useReducedMotion();
  const spring = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 520, damping: 30 };

  return (
    <button
      ref={scope}
      data-slot="checkbox"
      type="button"
      role="checkbox"
      aria-checked={state === "indeterminate" ? "mixed" : state}
      data-state={state === "indeterminate" ? "indeterminate" : on ? "checked" : "unchecked"}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        const next = state !== true;
        setInner(next);
        onCheckedChange?.(next);
        onFeedback?.("toggle");
        if (reduce) return;
        animate(scope.current, { scaleX: [1, 1.14, 0.94, 1], scaleY: [1, 0.86, 1.06, 1] }, { duration: 0.4 });
        if (next) setPulse((p) => p + 1);
      }}
      className={cn(
        "peer relative inline-flex size-[22px] shrink-0 cursor-pointer items-center justify-center rounded-[8px] text-white outline-hidden ring-1 ring-inset ring-foreground/15 transition-shadow duration-150 [corner-shape:squircle] hover:ring-foreground/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none",
        className,
      )}
      {...props}
    >
      <AnimatePresence>
        {pulse > 0 && (
          <motion.span
            key={pulse}
            aria-hidden
            initial={{ opacity: 0.5, scale: 1 }}
            animate={{ opacity: 0, scale: 2.1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="pointer-events-none absolute inset-0 rounded-[8px] ring-2 ring-brand [corner-shape:squircle]"
          />
        )}
      </AnimatePresence>
      <motion.span
        aria-hidden
        initial={false}
        animate={{ scale: on ? 1 : 0, opacity: on ? 1 : 0 }}
        transition={spring}
        className="btn-primary absolute inset-0 rounded-[8px] [corner-shape:squircle]"
      />
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className="relative size-3.5" aria-hidden>
        {state === "indeterminate" ? (
          <motion.path d="M4 8h8" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: reduce ? 0 : 0.2 }} />
        ) : (
          <motion.path
            d="M3.5 8.5 6.5 11.5 12.5 4.5"
            initial={false}
            animate={{ pathLength: on ? 1 : 0, opacity: on ? 1 : 0 }}
            transition={{ duration: reduce ? 0 : 0.24, delay: on && !reduce ? 0.08 : 0, ease: "easeOut" }}
          />
        )}
      </svg>
    </button>
  );
}
