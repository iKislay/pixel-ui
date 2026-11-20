"use client";

import { useId, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export type TabsFeedback = "select";

export type TabItem = { value: string; label: ReactNode; content: ReactNode };

export type TabsProps = Omit<ComponentProps<"div">, "defaultValue" | "onChange"> & {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onFeedback?: (event: TabsFeedback) => void;
};

export function Tabs({
  items,
  value,
  defaultValue,
  onValueChange,
  onFeedback,
  className,
  "aria-label": label,
  ...props
}: TabsProps) {
  const [inner, setInner] = useState(defaultValue ?? items[0]?.value);
  const selected = value ?? inner;
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const id = useId();
  const reduce = useReducedMotion();
  const currentIndex = items.findIndex((item) => item.value === selected);
  const current = items[currentIndex];

  const choose = (next: string) => {
    if (next === selected) return;
    setInner(next);
    onValueChange?.(next);
    onFeedback?.("select");
  };

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    const steps: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: items.length - 1,
    };
    if (!(event.key in steps)) return;
    event.preventDefault();
    const next = (steps[event.key] + items.length) % items.length;
    refs.current[next]?.focus();
    choose(items[next].value);
  };

  return (
    <div data-slot="tabs" className={cn("flex w-full flex-col gap-4", className)} {...props}>
      <div
        role="tablist"
        aria-label={label}
        className="inline-flex w-fit gap-1 rounded-[20px] bg-foreground/[0.05] p-1 [corner-shape:squircle]"
      >
        {items.map((item, index) => {
          const active = item.value === selected;
          return (
            <button
              key={item.value}
              ref={(node) => {
                refs.current[index] = node;
              }}
              id={`${id}-tab-${index}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`${id}-panel`}
              tabIndex={active ? 0 : -1}
              onClick={() => choose(item.value)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={cn(
                "relative h-9 cursor-pointer rounded-[16px] px-4 text-sm font-semibold outline-hidden transition-colors duration-150 [corner-shape:squircle] focus-visible:outline-2 focus-visible:outline-brand motion-reduce:transition-none",
                active ? "text-foreground" : "text-foreground/50 hover:text-foreground/80",
              )}
            >
              {active && (
                <motion.span
                  layoutId={`${id}-pill`}
                  transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 36 }}
                  className="absolute inset-0 rounded-[16px] bg-background shadow-[0_1px_3px_rgba(0,0,0,0.08),0_0_0_0.5px_rgba(0,0,0,0.05)] [corner-shape:squircle] dark:bg-foreground/[0.12]"
                />
              )}
              <span className="relative">{item.label}</span>
            </button>
          );
        })}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={selected}
          id={`${id}-panel`}
          role="tabpanel"
          aria-labelledby={`${id}-tab-${currentIndex}`}
          tabIndex={0}
          initial={{ opacity: 0, y: reduce ? 0 : 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reduce ? 0 : -4 }}
          transition={{ duration: 0.15 }}
          className="rounded-[16px] outline-hidden focus-visible:outline-2 focus-visible:outline-brand"
        >
          {current?.content}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
