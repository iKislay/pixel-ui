"use client";

import type { ComponentProps, ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

const TONES = {
  neutral: "bg-foreground/[0.07] text-foreground/70",
  brand: "bg-brand/15 text-brand",
  success: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  warning: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  danger: "bg-red-500/15 text-red-600 dark:text-red-400",
};

export type BadgeProps = Omit<ComponentProps<"span">, "children"> & {
  tone?: keyof typeof TONES;
  dot?: boolean;
  children?: ReactNode;
};

// each digit is a column of 0 to 9 that springs to its number, so counts roll like an odometer
function Digit({ value, reduce }: { value: number; reduce: boolean }) {
  return (
    <span className="relative inline-block h-[1em] w-[0.62em] overflow-hidden leading-none">
      <motion.span
        className="absolute inset-x-0 top-0 flex flex-col"
        initial={false}
        animate={{ y: `${-value}em` }}
        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 26 }}
      >
        {Array.from({ length: 10 }, (_, n) => (
          <span key={n} className="h-[1em] text-center">
            {n}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

export function Badge({ tone = "neutral", dot = false, className, children, ...props }: BadgeProps) {
  const reduce = useReducedMotion() ?? false;
  const count = typeof children === "number" ? String(Math.max(0, Math.floor(children))) : null;

  return (
    <span
      data-slot="badge"
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-[10px] px-2.5 text-xs font-semibold whitespace-nowrap tabular-nums [corner-shape:squircle] [&_svg]:size-3",
        TONES[tone],
        className,
      )}
      {...props}
    >
      {dot && (
        <span className="relative flex size-1.5" aria-hidden>
          <span className="absolute inset-0 animate-ping rounded-full bg-current opacity-60 motion-reduce:hidden" />
          <span className="relative size-1.5 rounded-full bg-current" />
        </span>
      )}
      {count !== null ? (
        <>
          <span className="sr-only">{count}</span>
          <span aria-hidden className="inline-flex">
            {count.split("").map((d, i) => (
              <Digit key={count.length - i} value={Number(d)} reduce={reduce} />
            ))}
          </span>
        </>
      ) : (
        children
      )}
    </span>
  );
}
