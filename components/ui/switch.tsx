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
        "group peer inline-flex h-[26px] w-[44px] shrink-0 cursor-pointer items-center rounded-full bg-foreground/[0.12] p-[3px] outline-hidden transition-colors duration-200 hover:bg-foreground/[0.18] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none",
        on && "btn-primary",
        on ? "justify-end" : "justify-start",
        className,
      )}
      {...props}
    >
      <motion.span
        layout
        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 700, damping: 32 }}
        className="block h-5 w-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2)] transition-[width] duration-150 group-active:w-6 motion-reduce:transition-none"
      />
    </button>
  );
}
