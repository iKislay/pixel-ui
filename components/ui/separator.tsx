"use client";

import type { ComponentProps, ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export type SeparatorProps = ComponentProps<"div"> & {
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
  label?: ReactNode;
};

export function Separator({ orientation = "horizontal", decorative = true, label, className, ...props }: SeparatorProps) {
  const reduce = useReducedMotion();
  const horizontal = orientation === "horizontal";
  const line = (origin: string) => (
    <motion.span
      aria-hidden
      initial={reduce ? false : horizontal ? { scaleX: 0 } : { scaleY: 0 }}
      whileInView={horizontal ? { scaleX: 1 } : { scaleY: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
      style={{ transformOrigin: origin }}
      className={cn("block flex-1 rounded-full bg-foreground/[0.08]", horizontal ? "h-px" : "w-px")}
    />
  );

  return (
    <div
      data-slot="separator"
      role={decorative ? "none" : "separator"}
      aria-orientation={decorative || horizontal ? undefined : orientation}
      className={cn(
        "flex shrink-0 items-center",
        horizontal ? "w-full gap-3" : "flex-col self-stretch gap-2",
        className,
      )}
      {...props}
    >
      {label ? (
        <>
          {line(horizontal ? "right" : "bottom")}
          <span className="text-xs font-medium text-foreground/40">{label}</span>
          {line(horizontal ? "left" : "top")}
        </>
      ) : (
        line("center")
      )}
    </div>
  );
}
