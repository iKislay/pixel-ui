"use client";

import type { ComponentProps } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  const reduce = useReducedMotion();

  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn("relative overflow-hidden rounded-[14px] bg-foreground/[0.07] [corner-shape:squircle]", className)}
      {...props}
    >
      {!reduce && (
        <motion.div
          className="absolute inset-0 bg-linear-to-r from-transparent via-foreground/[0.06] to-transparent"
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ duration: 1.6, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.3 }}
        />
      )}
    </div>
  );
}
