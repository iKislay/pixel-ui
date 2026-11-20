"use client";

import type { ComponentProps } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ButtonFeedback = "press";

const VARIANTS = {
  primary: "btn-primary text-brand-foreground",
  secondary: "bg-foreground/[0.06] text-foreground hover:bg-foreground/[0.1]",
  ghost: "text-foreground/70 hover:bg-foreground/[0.06] hover:text-foreground",
  destructive: "bg-red-500 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] hover:bg-red-600",
};

const SIZES = {
  sm: "h-9 gap-1.5 rounded-[14px] px-3.5 text-[13px]",
  md: "h-11 gap-2 rounded-[18px] px-5 text-sm",
  lg: "h-13 gap-2.5 rounded-[22px] px-7 text-[15px]",
  icon: "size-11 rounded-[18px]",
};

export type ButtonProps = Omit<
  ComponentProps<typeof motion.button>,
  "children"
> & {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  loading?: boolean;
  children?: React.ReactNode;
  onFeedback?: (event: ButtonFeedback) => void;
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  type = "button",
  className,
  children,
  onClick,
  onFeedback,
  ...props
}: ButtonProps) {
  const reduce = useReducedMotion();

  return (
    <motion.button
      data-slot="button"
      type={type}
      disabled={disabled}
      // aria-busy instead of disabled keeps focus on the button while it loads
      aria-busy={loading || undefined}
      whileTap={disabled || loading || reduce ? undefined : { scale: 0.96 }}
      transition={{ type: "spring", stiffness: 600, damping: 30 }}
      onClick={(event) => {
        if (loading) return event.preventDefault();
        onFeedback?.("press");
        onClick?.(event);
      }}
      className={cn(
        "relative inline-flex shrink-0 cursor-pointer select-none items-center justify-center font-semibold whitespace-nowrap outline-hidden transition-colors duration-150 [corner-shape:squircle] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-45 aria-busy:cursor-progress [&_svg]:size-4 [&_svg]:shrink-0",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      <AnimatePresence initial={false} mode="popLayout">
        {loading ? (
          <motion.span
            key="loading"
            initial={{ opacity: 0, filter: "blur(4px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, filter: "blur(4px)" }}
            transition={{ duration: reduce ? 0 : 0.16 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <LoaderCircle className="animate-spin motion-reduce:animate-none" aria-hidden />
          </motion.span>
        ) : null}
      </AnimatePresence>
      <span
        className={cn(
          "inline-flex items-center gap-[inherit] transition-opacity duration-150",
          loading && "opacity-0",
        )}
      >
        {children}
      </span>
    </motion.button>
  );
}
