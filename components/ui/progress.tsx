"use client";

import { useEffect, type ComponentProps } from "react";
import { motion, useAnimate, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export type ProgressProps = ComponentProps<"div"> & {
  value?: number;
  max?: number;
};

export function Progress({ value, max = 100, className, ...props }: ProgressProps) {
  const reduce = useReducedMotion();
  const indeterminate = value === undefined;
  const ratio = indeterminate ? 0 : Math.min(Math.max(value / max, 0), 1);
  const done = ratio >= 1;
  const [scope, animate] = useAnimate<HTMLDivElement>();

  useEffect(() => {
    if (!done || reduce) return;
    animate(scope.current, { boxShadow: ["0 0 0 0px rgb(16 185 129 / 0.45)", "0 0 0 8px rgb(16 185 129 / 0)"] }, { duration: 0.7 });
  }, [done, reduce, animate, scope]);

  return (
    <div
      data-slot="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={indeterminate ? undefined : value}
      data-state={indeterminate ? "indeterminate" : done ? "complete" : "loading"}
      ref={scope}
      className={cn("relative h-2.5 w-full overflow-hidden rounded-full bg-foreground/[0.08]", className)}
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
          className={cn(
            "absolute inset-y-0 left-0 overflow-hidden rounded-full transition-colors duration-500 motion-reduce:transition-none",
            done ? "bg-emerald-500" : "btn-primary",
          )}
          initial={false}
          animate={{ width: `${ratio * 100}%` }}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 22 }}
        >
          {!reduce && !done && (
            <motion.span
              aria-hidden
              className="absolute inset-y-0 w-1/2 bg-linear-to-r from-transparent via-white/35 to-transparent"
              initial={{ x: "-100%" }}
              animate={{ x: "300%" }}
              transition={{ duration: 1.8, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.4 }}
            />
          )}
          <span aria-hidden className="absolute inset-y-0 right-0 w-3 rounded-full bg-white/60 blur-[3px]" />
        </motion.div>
      )}
    </div>
  );
}
