"use client";

import { useEffect, useId, useRef, useState, type ReactElement, type ReactNode } from "react";
import { Slot } from "@radix-ui/react-slot";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export type PopoverFeedback = "open" | "close";

const PLACEMENT = {
  bottom: { start: "top-full left-0 mt-2 origin-top-left", center: "top-full left-1/2 mt-2 -translate-x-1/2 origin-top", end: "top-full right-0 mt-2 origin-top-right" },
  top: { start: "bottom-full left-0 mb-2 origin-bottom-left", center: "bottom-full left-1/2 mb-2 -translate-x-1/2 origin-bottom", end: "bottom-full right-0 mb-2 origin-bottom-right" },
};

export type PopoverProps = {
  trigger: ReactElement;
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: keyof typeof PLACEMENT;
  align?: "start" | "center" | "end";
  className?: string;
  "aria-label"?: string;
  onFeedback?: (event: PopoverFeedback) => void;
};

export function Popover({
  trigger,
  children,
  open,
  defaultOpen = false,
  onOpenChange,
  side = "bottom",
  align = "center",
  className,
  onFeedback,
  "aria-label": label,
}: PopoverProps) {
  const [inner, setInner] = useState(defaultOpen);
  const shown = open ?? inner;
  const root = useRef<HTMLSpanElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const id = useId();
  const reduce = useReducedMotion();

  const set = (next: boolean, refocus = false) => {
    setInner(next);
    onOpenChange?.(next);
    onFeedback?.(next ? "open" : "close");
    if (refocus) root.current?.querySelector<HTMLElement>("[aria-haspopup]")?.focus();
  };

  useEffect(() => {
    if (!shown) return;
    panel.current?.focus();
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) set(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && set(false, true);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown]);

  return (
    <span ref={root} data-slot="popover" className="relative inline-flex">
      <Slot
        aria-haspopup="dialog"
        aria-expanded={shown}
        aria-controls={shown ? id : undefined}
        onClick={() => set(!shown)}
      >
        {trigger}
      </Slot>
      <AnimatePresence>
        {shown && (
          <motion.div
            ref={panel}
            id={id}
            role="dialog"
            aria-label={label}
            tabIndex={-1}
            initial={{ opacity: 0, scale: reduce ? 1 : 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: reduce ? 1 : 0.94 }}
            transition={{ type: "spring", stiffness: 520, damping: 34 }}
            className={cn(
              "absolute z-50 w-72 rounded-[26px] bg-popover p-4 text-sm text-popover-foreground shadow-[0_16px_48px_-12px_rgba(0,0,0,0.28),0_0_0_1px_rgba(0,0,0,0.05)] outline-none [corner-shape:squircle] dark:shadow-[0_16px_48px_-12px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.08)]",
              PLACEMENT[side][align],
              className,
            )}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}
