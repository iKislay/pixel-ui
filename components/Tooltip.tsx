"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const OPEN_DELAY_MS = 400;
const SKIP_DELAY_MS = 400;

type Side = "top" | "bottom" | "left" | "right";
type Align = "center" | "start" | "end";

const VERTICAL_ALIGN = {
  center: { pill: "left-1/2 -translate-x-1/2", arrow: "left-1/2 -ml-2" },
  start: { pill: "left-0", arrow: "left-2" },
  end: { pill: "right-0", arrow: "right-1.5" },
} as const;

const SIDE_CLASSES: Record<Side, string> = {
  top: "bottom-full mb-2.5",
  bottom: "top-full mt-2.5",
  left: "right-full mr-2.5 top-1/2 -translate-y-1/2",
  right: "left-full ml-2.5 top-1/2 -translate-y-1/2",
};

const PILL_BASE =
  "pointer-events-none absolute z-50 block whitespace-nowrap rounded-xl bg-popover px-3 py-1.5 text-sm font-medium text-foreground shadow-lg";

let lastClosedAt = 0;

function useDelayedHover(onBeforeOpen?: () => void) {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const show = () => {
    if (timer.current) clearTimeout(timer.current);
    onBeforeOpen?.();
    if (Date.now() - lastClosedAt < SKIP_DELAY_MS) {
      setOpen(true);
      return;
    }
    timer.current = setTimeout(() => {
      onBeforeOpen?.();
      setOpen(true);
    }, OPEN_DELAY_MS);
  };

  const hide = () => {
    if (timer.current) clearTimeout(timer.current);
    if (open) lastClosedAt = Date.now();
    setOpen(false);
  };

  return { open, show, hide };
}

function TooltipArrow({
  className,
  side,
}: {
  className?: string;
  side: Side;
}) {
  if (side === "top") {
    return (
      <svg
        aria-hidden
        viewBox="0 0 16 9"
        className={cn("absolute -bottom-2 h-[9px] w-4", className)}
      >
        <path d="M0 0L5.6 6.8Q8 9 10.4 6.8L16 0Z" className="fill-popover" />
      </svg>
    );
  }

  if (side === "left") {
    return (
      <svg
        aria-hidden
        viewBox="0 0 9 16"
        className={cn("absolute -right-2 top-1/2 h-4 w-[9px] -translate-y-1/2", className)}
      >
        <path d="M0 0L6.8 5.6Q9 8 6.8 10.4L0 16Z" className="fill-popover" />
      </svg>
    );
  }

  if (side === "right") {
    return (
      <svg
        aria-hidden
        viewBox="0 0 9 16"
        className={cn("absolute -left-2 top-1/2 h-4 w-[9px] -translate-y-1/2", className)}
      >
        <path d="M9 0L2.2 5.6Q0 8 2.2 10.4L9 16Z" className="fill-popover" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden
      viewBox="0 0 16 9"
      className={cn("absolute -top-2 h-[9px] w-4", className)}
    >
      <path d="M0 9L5.6 2.2Q8 0 10.4 2.2L16 9Z" className="fill-popover" />
    </svg>
  );
}

function getPlacement(
  trigger: HTMLElement,
  preferredSide?: Side,
  preferredAlign?: Align,
): { side: Side; align: Align } {
  const rect = trigger.getBoundingClientRect();
  const vh = window.innerHeight;
  const vw = window.innerWidth;

  const spaceAbove = rect.top;
  const spaceBelow = vh - rect.bottom;
  const spaceLeft = rect.left;
  const spaceRight = vw - rect.right;

  let side: Side;
  if (preferredSide === "left" || preferredSide === "right") {
    if (preferredSide === "left" && spaceLeft < 80 && spaceRight > spaceLeft) {
      side = "right";
    } else if (preferredSide === "right" && spaceRight < 80 && spaceLeft > spaceRight) {
      side = "left";
    } else {
      side = preferredSide;
    }
  } else if (preferredSide === "top" || preferredSide === "bottom") {
    if (preferredSide === "top" && spaceAbove < 60 && spaceBelow > spaceAbove) {
      side = "bottom";
    } else if (preferredSide === "bottom" && spaceBelow < 60 && spaceAbove > spaceBelow) {
      side = "top";
    } else {
      side = preferredSide;
    }
  } else {
    if (spaceBelow < 60 && spaceAbove >= spaceBelow) {
      side = "top";
    } else if (spaceAbove < 60 && spaceBelow >= spaceAbove) {
      side = "bottom";
    } else if (rect.top + rect.height / 2 > vh / 2) {
      side = "top";
    } else {
      side = "bottom";
    }
  }

  let align: Align;
  if (preferredAlign === "start") {
    align = spaceRight < 80 && spaceLeft > spaceRight ? "end" : "start";
  } else if (preferredAlign === "end") {
    align = spaceLeft < 80 && spaceRight > spaceLeft ? "start" : "end";
  } else {
    if (spaceLeft < 80 && spaceRight >= 80) {
      align = "start";
    } else if (spaceRight < 80 && spaceLeft >= 80) {
      align = "end";
    } else {
      align = "center";
    }
  }

  return { side, align };
}

type TooltipProps = {
  label: string;
  side?: Side;
  align?: Align;
  className?: string;
  children: React.ReactNode;
};

export default function Tooltip({
  label,
  side,
  align,
  className,
  children,
}: TooltipProps) {
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLSpanElement | null>(null);

  const [placement, setPlacement] = useState<{ side: Side; align: Align }>({
    side: side ?? "bottom",
    align: align ?? "center",
  });

  const updatePlacement = () => {
    if (!triggerRef.current) return;
    setPlacement(getPlacement(triggerRef.current, side, align));
  };

  const { open, show, hide } = useDelayedHover(updatePlacement);

  useEffect(() => {
    if (!open) return;
    const handleUpdate = () => {
      if (!triggerRef.current) return;
      const next = getPlacement(triggerRef.current, side, align);
      setPlacement((prev) => {
        if (prev.side === next.side && prev.align === next.align) return prev;
        return next;
      });
    };

    window.addEventListener("resize", handleUpdate);
    window.addEventListener("scroll", handleUpdate, true);
    return () => {
      window.removeEventListener("resize", handleUpdate);
      window.removeEventListener("scroll", handleUpdate, true);
    };
  }, [open, side, align]);

  useEffect(() => {
    if (!open || !triggerRef.current || !tooltipRef.current) return;
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const vh = window.innerHeight;
    const vw = window.innerWidth;

    setPlacement((prev) => {
      let nextSide = prev.side;
      let nextAlign = prev.align;

      if (prev.side === "bottom" && tooltipRect.bottom > vh - 4 && triggerRect.top > tooltipRect.height + 16) {
        nextSide = "top";
      } else if (prev.side === "top" && tooltipRect.top < 4 && vh - triggerRect.bottom > tooltipRect.height + 16) {
        nextSide = "bottom";
      }

      if (tooltipRect.right > vw - 4 && triggerRect.right - tooltipRect.width > 4) {
        nextAlign = "end";
      } else if (tooltipRect.left < 4 && triggerRect.left + tooltipRect.width < vw - 4) {
        nextAlign = "start";
      }

      if (nextSide === prev.side && nextAlign === prev.align) return prev;
      return { side: nextSide, align: nextAlign };
    });
  }, [open]);

  const isVertical = placement.side === "top" || placement.side === "bottom";
  const alignClass = isVertical ? VERTICAL_ALIGN[placement.align] : null;

  return (
    <div
      ref={triggerRef}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      className={cn("relative flex", className)}
    >
      {children}

      {open && (
        <span
          ref={tooltipRef}
          role="tooltip"
          className={cn(PILL_BASE, SIDE_CLASSES[placement.side], alignClass?.pill)}
        >
          <TooltipArrow side={placement.side} className={alignClass?.arrow} />
          {label}
        </span>
      )}
    </div>
  );
}
