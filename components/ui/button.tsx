"use client";

import { useEffect, useRef, type ComponentProps, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, LoaderCircle, X } from "lucide-react";
import useMeasure from "react-use-measure";
import { cn } from "@/lib/utils";

export type ButtonFeedback = "press" | "error";
export type ButtonStatus = "idle" | "loading" | "success" | "error";

const VARIANTS = {
  primary: "btn-primary text-brand-foreground",
  secondary: "bg-foreground/[0.06] text-foreground hover:bg-foreground/[0.1]",
  ghost: "text-foreground/70 hover:bg-foreground/[0.06] hover:text-foreground",
  destructive: "bg-red-500 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] hover:bg-red-600",
};

const STATUS_TONE = {
  success: "bg-emerald-500 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]",
  error: "bg-red-500 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]",
};

const SIZES = {
  sm: { box: "h-9 rounded-[14px] text-[13px]", pad: "gap-1.5 px-3.5", square: "w-9" },
  md: { box: "h-11 rounded-[18px] text-sm", pad: "gap-2 px-5", square: "w-11" },
  lg: { box: "h-13 rounded-[22px] text-[15px]", pad: "gap-2.5 px-7", square: "w-13" },
  icon: { box: "h-11 rounded-[18px] text-sm", pad: "", square: "w-11" },
};

const ICONS: Record<Exclude<ButtonStatus, "idle">, ReactNode> = {
  loading: <LoaderCircle className="animate-spin motion-reduce:animate-none" />,
  success: <Check strokeWidth={3} />,
  error: <X strokeWidth={3} />,
};

export type ButtonProps = Omit<ComponentProps<typeof motion.button>, "children"> & {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  status?: ButtonStatus;
  children?: ReactNode;
  onFeedback?: (event: ButtonFeedback) => void;
};

export function Button({
  variant = "primary",
  size = "md",
  status = "idle",
  disabled,
  type = "button",
  className,
  children,
  onClick,
  onFeedback,
  ...props
}: ButtonProps) {
  const reduce = useReducedMotion();
  const [measure, bounds] = useMeasure();
  const busy = status !== "idle";
  const previous = useRef(status);

  useEffect(() => {
    if (status === "error" && previous.current !== "error") onFeedback?.("error");
    previous.current = status;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const spring = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 420, damping: 32 };

  return (
    <motion.button
      data-slot="button"
      data-status={status}
      type={type}
      disabled={disabled}
      // aria-busy instead of disabled keeps focus on the button while it works
      aria-busy={status === "loading" || undefined}
      initial={false}
      animate={bounds.width ? { width: bounds.width } : undefined}
      whileTap={disabled || busy || reduce ? undefined : { scale: 0.95 }}
      transition={{ width: spring, scale: { type: "spring", stiffness: 700, damping: 28 } }}
      onClick={(event) => {
        if (busy) return event.preventDefault();
        onFeedback?.("press");
        onClick?.(event);
      }}
      className={cn(
        "relative inline-flex shrink-0 cursor-pointer select-none items-center justify-center overflow-hidden font-semibold whitespace-nowrap outline-hidden transition-[background-color,color,box-shadow] duration-300 [corner-shape:squircle] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-45 aria-busy:cursor-progress motion-reduce:transition-none [&_svg]:size-4 [&_svg]:shrink-0",
        status === "success" || status === "error" ? STATUS_TONE[status] : VARIANTS[variant],
        SIZES[size].box,
        className,
      )}
      {...props}
    >
      <span ref={measure} className="inline-flex h-full items-center justify-center">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={busy ? status : "idle"}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.7, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.7, filter: "blur(6px)" }}
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 34 }}
            className={cn(
              "inline-flex h-full items-center justify-center",
              busy || size === "icon" ? SIZES[size].square : SIZES[size].pad,
            )}
          >
            {busy ? ICONS[status] : children}
          </motion.span>
        </AnimatePresence>
      </span>
    </motion.button>
  );
}
