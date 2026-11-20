"use client";

import { useState, type ComponentProps } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export type TextareaFeedback = "error";

export type TextareaProps = ComponentProps<"textarea"> & {
  invalid?: boolean;
  onFeedback?: (event: TextareaFeedback) => void;
};

const RING = 2 * Math.PI * 8;
const WARN_AT = 20;

export function Textarea({ invalid = false, maxLength, className, onChange, onFeedback, ...props }: TextareaProps) {
  const [length, setLength] = useState(String(props.value ?? props.defaultValue ?? "").length);
  const count = props.value !== undefined ? String(props.value).length : length;
  const reduce = useReducedMotion();
  const left = maxLength ? maxLength - count : 0;
  const warn = maxLength !== undefined && left <= WARN_AT;

  return (
    <div data-slot="textarea" className={cn("relative w-full", className)}>
      <textarea
        aria-invalid={invalid || undefined}
        maxLength={maxLength}
        onChange={(event) => {
          setLength(event.target.value.length);
          if (maxLength && event.target.value.length >= maxLength) onFeedback?.("error");
          onChange?.(event);
        }}
        className={cn(
          "block min-h-28 w-full resize-none rounded-[24px] bg-foreground/[0.05] px-4 py-3.5 text-sm leading-relaxed text-foreground outline-none ring-1 ring-inset ring-foreground/[0.06] transition-[box-shadow,background-color] duration-200 [field-sizing:content] [corner-shape:squircle] placeholder:text-foreground/35 hover:bg-foreground/[0.07] focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-brand/60 disabled:cursor-not-allowed disabled:opacity-45 aria-invalid:ring-2 aria-invalid:ring-red-500/60 motion-reduce:transition-none",
          maxLength !== undefined && "pb-10",
        )}
        {...props}
      />
      {maxLength !== undefined && (
        <div aria-hidden className="pointer-events-none absolute bottom-3 right-3.5 flex items-center gap-1.5">
          <AnimatePresence>
            {warn && (
              <motion.span
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 6 }}
                className={cn("font-mono text-[11px] font-semibold tabular-nums", left <= 0 ? "text-red-500" : "text-foreground/45")}
              >
                {left}
              </motion.span>
            )}
          </AnimatePresence>
          <motion.svg viewBox="0 0 20 20" className="size-5 -rotate-90" animate={{ scale: warn && !reduce ? 1.15 : 1 }}>
            <circle cx="10" cy="10" r="8" fill="none" strokeWidth="2.5" className="stroke-foreground/10" />
            <motion.circle
              cx="10"
              cy="10"
              r="8"
              fill="none"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={RING}
              initial={false}
              animate={{ strokeDashoffset: RING * (1 - Math.min(count / maxLength, 1)) }}
              transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30 }}
              className={cn("transition-colors", left <= 0 ? "stroke-red-500" : warn ? "stroke-amber-500" : "stroke-brand")}
            />
          </motion.svg>
        </div>
      )}
    </div>
  );
}
