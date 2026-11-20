"use client";

import type { ComponentProps } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export type ProgressProps = ComponentProps<"div"> & {
  value?: number;
  max?: number;
};

export function Progress({ value, max = 100, className, ...props }: ProgressProps) {
  const reduce = useReducedMotion();
  const indeterminate = value === undefined;
  const ratio = indeterminate ? 0 : Math.min(Math.max(value / max, 0), 1);

  return (
    <div
      data-slot="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={indeterminate ? undefined : value}
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-foreground/[0.08]", className)}
      {...props}
    >
      {indeterminate ? (
        <motion.div
          className="btn-primary absolute inset-y-0 w-2/5 rounded-full"
          initial={{ x: reduce ? "75%" : "-100%" }}
          animate={reduce ? undefined : { x: "250%" }}
          transition={{ duration: 1.4, ease: [0.65, 0, 0.35, 1], repeat: Infinity }}
        />
      ) : (
        <motion.div
          className="btn-primary absolute inset-0 origin-left rounded-full"
          initial={false}
          animate={{ scaleX: ratio }}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 140, damping: 24 }}
        />
      )}
    </div>
  );
}
