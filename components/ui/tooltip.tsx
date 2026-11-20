"use client";

import { useEffect, useId, useRef, useState, type ReactElement, type ReactNode } from "react";
import { Slot } from "@radix-ui/react-slot";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export type TooltipFeedback = "open" | "close";

const SIDES = {
  top: { box: "bottom-full left-1/2 mb-2 -translate-x-1/2", from: { y: 4 } },
  bottom: { box: "top-full left-1/2 mt-2 -translate-x-1/2", from: { y: -4 } },
  left: { box: "right-full top-1/2 mr-2 -translate-y-1/2", from: { x: 4 } },
  right: { box: "left-full top-1/2 ml-2 -translate-y-1/2", from: { x: -4 } },
};

export type TooltipProps = {
  content: ReactNode;
  children: ReactElement;
  side?: keyof typeof SIDES;
  delay?: number;
  className?: string;
  onFeedback?: (event: TooltipFeedback) => void;
};

export function Tooltip({ content, children, side = "top", delay = 300, className, onFeedback }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const shown = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const id = useId();
  const reduce = useReducedMotion();

  const set = (next: boolean) => {
    clearTimeout(timer.current);
    if (shown.current === next) return;
    shown.current = next;
    setOpen(next);
    onFeedback?.(next ? "open" : "close");
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && set(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <span data-slot="tooltip" className="relative inline-flex">
      <Slot
        aria-describedby={open ? id : undefined}
        onPointerEnter={() => {
          clearTimeout(timer.current);
          timer.current = setTimeout(() => set(true), delay);
        }}
        onPointerLeave={() => set(false)}
        onFocus={() => set(true)}
        onBlur={() => set(false)}
      >
        {children}
      </Slot>
      <AnimatePresence>
        {open && (
          <motion.span
            id={id}
            role="tooltip"
            initial={{ opacity: 0, scale: reduce ? 1 : 0.94, ...(reduce ? {} : SIDES[side].from) }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: reduce ? 1 : 0.94 }}
            transition={{ type: "spring", stiffness: 600, damping: 36 }}
            className={cn(
              "pointer-events-none absolute z-50 whitespace-nowrap rounded-[12px] bg-foreground px-2.5 py-1.5 text-xs font-semibold text-background shadow-lg [corner-shape:squircle]",
              SIDES[side].box,
              className,
            )}
          >
            {content}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
