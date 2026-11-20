"use client";

import { useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from "react";
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
            className="group flex cursor-pointer items-start gap-3 rounded-[18px] px-3 py-2.5 text-left outline-hidden transition-colors duration-150 [corner-shape:squircle] hover:bg-foreground/[0.04] focus-visible:outline-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
          >
            <span
              className={cn(
                "mt-px flex size-5 shrink-0 items-center justify-center rounded-full ring-1 ring-inset ring-foreground/15 transition-colors duration-150 group-hover:ring-foreground/30 motion-reduce:transition-none",
                checked && "btn-primary",
              )}
            >
              <motion.span
                initial={false}
                animate={{ scale: checked ? 1 : 0 }}
                transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 600, damping: 24 }}
                className="size-2 rounded-full bg-white"
              />
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">{option.label}</span>
              {option.description && <span className="text-xs text-foreground/50">{option.description}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
