"use client";

import { useEffect, useRef, type ComponentProps } from "react";
import { animate, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export type InputFeedback = "error";

export type InputProps = ComponentProps<"input"> & {
  invalid?: boolean;
  onFeedback?: (event: InputFeedback) => void;
};

export function Input({ invalid = false, className, onFeedback, ref, ...props }: InputProps) {
  const local = useRef<HTMLInputElement>(null);
  const reduce = useReducedMotion();

  // shakes once each time the field turns invalid, not on every render while it stays invalid
  useEffect(() => {
    if (!invalid) return;
    onFeedback?.("error");
    if (!reduce && local.current) {
      animate(local.current, { x: [0, -6, 5, -3, 2, 0] }, { duration: 0.36 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invalid]);

  return (
    <input
      data-slot="input"
      ref={(node) => {
        local.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      aria-invalid={invalid || undefined}
      className={cn(
        "h-11 w-full min-w-0 rounded-[18px] bg-foreground/[0.05] px-4 text-sm text-foreground outline-none ring-1 ring-inset ring-foreground/[0.06] transition-[box-shadow,background-color] duration-150 [corner-shape:squircle] placeholder:text-foreground/35 hover:bg-foreground/[0.07] focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-brand/60 disabled:cursor-not-allowed disabled:opacity-45 aria-invalid:ring-2 aria-invalid:ring-red-500/60 motion-reduce:transition-none file:mr-3 file:border-0 file:bg-transparent file:text-sm file:font-semibold file:text-foreground",
        className,
      )}
      {...props}
    />
  );
}
