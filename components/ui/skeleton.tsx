"use client";

import type { ComponentProps, ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export type SkeletonProps = Omit<ComponentProps<"div">, "children"> & {
  loading?: boolean;
  children?: ReactNode;
};

export function Skeleton({ loading = true, className, children, ...props }: SkeletonProps) {
  const reduce = useReducedMotion();

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      {loading ? (
        <motion.div
          key="skeleton"
          data-slot="skeleton"
          aria-hidden
          exit={{ opacity: 0, filter: reduce ? "none" : "blur(4px)" }}
          transition={{ duration: 0.25 }}
          className={cn("relative overflow-hidden rounded-[14px] bg-foreground/[0.07] [corner-shape:squircle]", className)}
          {...(props as ComponentProps<typeof motion.div>)}
        >
          {!reduce && (
            <motion.div
              className="absolute inset-0 bg-linear-to-r from-transparent via-foreground/[0.06] to-transparent"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 1.6, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.3 }}
            />
          )}
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0, filter: reduce ? "none" : "blur(6px)", y: reduce ? 0 : 4 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
