"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactElement, type ReactNode, type RefObject } from "react";
import { Slot } from "@radix-ui/react-slot";
import { AnimatePresence, animate, motion, usePresence, useReducedMotion } from "motion/react";
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
          <Panel
            panel={panel}
            anchor={root}
            id={id}
            label={label}
            reduce={!!reduce}
            className={cn(PLACEMENT[side][align], className)}
          >
            {children}
          </Panel>
        )}
      </AnimatePresence>
    </span>
  );
}

const OPEN = "inset(-48px -48px -48px -48px round 26px)";

// the panel starts clipped to the trigger's own box and unfolds from there, so it reads as the trigger growing
function reveal(panel: HTMLElement, anchor: HTMLElement) {
  const from = anchor.getBoundingClientRect();
  const to = panel.getBoundingClientRect();
  const x = from.left - to.left;
  const y = from.top - to.top;
  const clip = `inset(0px ${to.width - from.width}px ${to.height - from.height}px 0px round 16px)`;
  return { x, y, clip };
}

function Panel({
  panel,
  anchor,
  id,
  label,
  reduce,
  className,
  children,
}: {
  panel: RefObject<HTMLDivElement | null>;
  anchor: RefObject<HTMLSpanElement | null>;
  id: string;
  label?: string;
  reduce: boolean;
  className?: string;
  children: ReactNode;
}) {
  const [present, safeToRemove] = usePresence();

  useLayoutEffect(() => {
    const el = panel.current;
    if (!el || !anchor.current) return;
    if (reduce) {
      animate(el, { opacity: [0, 1] }, { duration: 0.15 });
      return;
    }
    const { x, y, clip } = reveal(el, anchor.current);
    el.style.setProperty("clip-path", clip);
    el.style.setProperty("transform", `translate(${x}px, ${y}px)`);
    animate(el, { clipPath: [clip, OPEN], x: [x, 0], y: [y, 0] }, { type: "spring", stiffness: 380, damping: 34 });
  }, [panel, anchor, reduce]);

  useEffect(() => {
    const el = panel.current;
    if (present || !el) return;
    if (reduce || !anchor.current) {
      animate(el, { opacity: 0 }, { duration: 0.12 }).then(safeToRemove);
      return;
    }
    const { x, y, clip } = reveal(el, anchor.current);
    animate(el, { clipPath: clip, x, y, opacity: 0 }, { duration: 0.22, ease: [0.4, 0, 0.2, 1] }).then(
      safeToRemove,
    );
  }, [present, panel, anchor, reduce, safeToRemove]);

  return (
    <div
      ref={panel}
      id={id}
      role="dialog"
      aria-label={label}
      tabIndex={-1}
      className={cn(
        "absolute z-50 w-72 rounded-[26px] bg-popover p-4 text-sm text-popover-foreground shadow-[0_16px_48px_-12px_rgba(0,0,0,0.28),0_0_0_1px_rgba(0,0,0,0.05)] outline-none [corner-shape:squircle] dark:shadow-[0_16px_48px_-12px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.08)]",
        className,
      )}
    >
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: reduce ? 0 : 0.08, duration: 0.2 }}>
        {children}
      </motion.div>
    </div>
  );
}
