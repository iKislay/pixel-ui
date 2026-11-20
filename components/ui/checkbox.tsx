"use client";

import { useState, type ComponentProps } from "react";
import { motion, useReducedMotion } from "motion/react";
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
  const state = checked ?? inner;
  const on = state !== false;
  const reduce = useReducedMotion();
  const draw = { duration: reduce ? 0 : 0.22, ease: "easeOut" } as const;

  return (
    <button
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
      }}
      className={cn(
        "peer inline-flex size-[22px] shrink-0 cursor-pointer items-center justify-center rounded-[8px] text-white outline-hidden ring-1 ring-inset ring-foreground/15 transition-[background-color,box-shadow,transform] duration-150 [corner-shape:squircle] hover:ring-foreground/30 active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none motion-reduce:active:scale-100",
        on && "btn-primary ring-0",
        className,
      )}
      {...props}
    >
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className="size-3.5" aria-hidden>
        {state === "indeterminate" ? (
          <motion.path d="M4 8h8" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={draw} />
        ) : (
          <motion.path d="M3.5 8.5 6.5 11.5 12.5 4.5" initial={false} animate={{ pathLength: on ? 1 : 0, opacity: on ? 1 : 0 }} transition={draw} />
        )}
      </svg>
    </button>
  );
}
