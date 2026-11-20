"use client";

import { useState, type ComponentProps } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export type SwitchFeedback = "toggle";

export type SwitchProps = Omit<ComponentProps<"button">, "onChange" | "value"> & {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onFeedback?: (event: SwitchFeedback) => void;
};

const INSET = 3;
const TRAVEL = 20;
const LEAD = { type: "spring" as const, stiffness: 900, damping: 40 };
const TRAIL = { type: "spring" as const, stiffness: 260, damping: 26 };

export function Switch({
  checked,
  defaultChecked = false,
  onCheckedChange,
  onFeedback,
  onClick,
  className,
  ...props
}: SwitchProps) {
  const [inner, setInner] = useState(defaultChecked);
  const on = checked ?? inner;
  const reduce = useReducedMotion();
  // the leading edge races ahead and the trailing edge catches up, so the thumb stretches as it travels
  const edges = reduce
    ? { left: { duration: 0 }, right: { duration: 0 } }
    : { left: on ? TRAIL : LEAD, right: on ? LEAD : TRAIL };

  return (
    <button
      data-slot="switch"
      type="button"
      role="switch"
      aria-checked={on}
      data-state={on ? "checked" : "unchecked"}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        setInner(!on);
        onCheckedChange?.(!on);
        onFeedback?.("toggle");
      }}
      className={cn(
        "group peer relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full bg-foreground/[0.12] outline-hidden transition-colors duration-300 hover:bg-foreground/[0.18] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none",
        on && "btn-primary",
        className,
      )}
      {...props}
    >
      <motion.span
        initial={false}
        animate={{ left: on ? INSET + TRAVEL : INSET, right: on ? INSET : INSET + TRAVEL }}
        transition={edges}
        className="absolute inset-y-[3px] flex items-center justify-center rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.22)]"
      >
        <svg viewBox="0 0 12 12" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-2.5 stroke-brand" aria-hidden>
          <motion.path
            d="M2.5 6.2 5 8.5 9.5 3.5"
            initial={false}
            animate={{ pathLength: on ? 1 : 0, opacity: on ? 1 : 0 }}
            transition={{ duration: reduce ? 0 : 0.2, delay: on && !reduce ? 0.12 : 0 }}
          />
        </svg>
      </motion.span>
    </button>
  );
}
