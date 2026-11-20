"use client";

import { useId, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export type RadioGroupFeedback = "select";

export type RadioOption = {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
};

export type RadioGroupProps = Omit<ComponentProps<"div">, "defaultValue" | "onChange"> & {
  options: RadioOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onFeedback?: (event: RadioGroupFeedback) => void;
};

const NEXT_KEYS: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };

export function RadioGroup({
  options,
  value,
  defaultValue,
  onValueChange,
  onFeedback,
  className,
  ...props
}: RadioGroupProps) {
  const [inner, setInner] = useState(defaultValue);
  const selected = value ?? inner;
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const reduce = useReducedMotion();
  const id = useId();
  const glide = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 420, damping: 34 };
  const enabled = options.filter((o) => !o.disabled);
  // with nothing selected, the first enabled radio takes the tab stop
  const tabStop = enabled.some((o) => o.value === selected) ? selected : enabled[0]?.value;

  const choose = (next: string) => {
    if (next === selected) return;
    setInner(next);
    onValueChange?.(next);
    onFeedback?.("select");
  };

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    const step = NEXT_KEYS[event.key];
    if (!step) return;
    event.preventDefault();
    for (let i = 1; i <= options.length; i++) {
      const target = (index + step * i + options.length) % options.length;
      if (options[target].disabled) continue;
      refs.current[target]?.focus();
      choose(options[target].value);
      return;
    }
  };

  return (
    <div data-slot="radio-group" role="radiogroup" className={cn("flex flex-col gap-1", className)} {...props}>
      {options.map((option, index) => {
        const checked = option.value === selected;
        return (
          <button
            key={option.value}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            disabled={option.disabled}
            tabIndex={option.value === tabStop ? 0 : -1}
            onClick={() => choose(option.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className="group relative flex cursor-pointer items-start gap-3 rounded-[20px] px-3.5 py-3 text-left outline-hidden transition-colors duration-150 hover:bg-foreground/[0.03] motion-reduce:transition-none [corner-shape:squircle] focus-visible:outline-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-45"
          >
            {checked && (
              <motion.span
                layoutId={`${id}-card`}
                transition={glide}
                className="absolute inset-0 rounded-[20px] bg-background shadow-[0_1px_3px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.04)] [corner-shape:squircle] dark:bg-foreground/[0.08]"
              />
            )}
            <span className="relative mt-px flex size-5 shrink-0 items-center justify-center rounded-full ring-1 ring-inset ring-foreground/15 transition-colors duration-150 group-hover:ring-foreground/30 motion-reduce:transition-none">
              {checked && (
                <motion.span
                  layoutId={`${id}-dot`}
                  transition={glide}
                  className="btn-primary flex size-5 items-center justify-center rounded-full"
                >
                  <span className="size-2 rounded-full bg-white" />
                </motion.span>
              )}
            </span>
            <span className="relative flex flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">{option.label}</span>
              {option.description && <span className="text-xs text-foreground/50">{option.description}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
