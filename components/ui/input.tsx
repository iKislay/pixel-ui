"use client";

import { useEffect, useId, useRef, type ComponentProps, type ReactNode } from "react";
import { AnimatePresence, animate, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export type InputFeedback = "error";

export type InputProps = Omit<ComponentProps<"input">, "placeholder"> & {
  label: string;
  error?: ReactNode;
  onFeedback?: (event: InputFeedback) => void;
};

export function Input({ label, error, className, onFeedback, id, ref, ...props }: InputProps) {
  const field = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const auto = useId();
  const inputId = id ?? auto;
  const invalid = Boolean(error);

  // shakes once each time the field turns invalid, not on every render while it stays invalid
  useEffect(() => {
    if (!invalid) return;
    onFeedback?.("error");
    if (!reduce && field.current) {
      animate(field.current, { x: [0, -6, 5, -3, 2, 0] }, { duration: 0.36 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invalid]);

  return (
    <div data-slot="input" className={cn("flex w-full flex-col", className)}>
      <div
        ref={field}
        className={cn(
          "group relative h-14 rounded-[20px] bg-foreground/[0.05] ring-1 ring-inset ring-foreground/[0.06] transition-[box-shadow,background-color] duration-200 [corner-shape:squircle] hover:bg-foreground/[0.07] has-focus-visible:bg-background has-focus-visible:ring-2 has-focus-visible:ring-brand/60 has-disabled:opacity-45 motion-reduce:transition-none",
          invalid && "ring-2 ring-red-500/60 has-focus-visible:ring-red-500/70",
        )}
      >
        <input
          ref={ref}
          id={inputId}
          // a blank placeholder lets css tell an empty field from a filled one
          placeholder=" "
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? `${inputId}-error` : undefined}
          className="peer absolute inset-0 h-full w-full bg-transparent px-4 pt-5 text-sm text-foreground outline-none disabled:cursor-not-allowed"
          {...props}
        />
        <label
          htmlFor={inputId}
          className="pointer-events-none absolute left-4 top-2.5 origin-left text-[11px] font-semibold text-foreground/45 transition-all duration-200 ease-[cubic-bezier(0.2,0.9,0.3,1.2)] peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:font-medium peer-placeholder-shown:text-foreground/40 peer-focus:top-2.5 peer-focus:translate-y-0 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:text-brand motion-reduce:transition-none"
        >
          {label}
        </label>
      </div>
      <AnimatePresence initial={false}>
        {invalid && (
          <motion.p
            id={`${inputId}-error`}
            role="alert"
            initial={{ height: 0, opacity: 0, y: reduce ? 0 : -6 }}
            animate={{ height: "auto", opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: reduce ? 0 : -6 }}
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 36 }}
            className="overflow-hidden px-4 text-xs font-medium text-red-500"
          >
            <span className="block pt-2">{error}</span>
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
