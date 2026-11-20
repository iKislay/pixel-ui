"use client";

import { useId, useLayoutEffect, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from "react";
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
  const list = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState<{ left: number; right: number; dir: number } | null>(null);
  const last = useRef(currentIndex);

  // the pill is measured from the real tab, so labels of any width line up
  useLayoutEffect(() => {
    const measure = () => {
      const tab = refs.current[currentIndex];
      const box = list.current;
      if (!tab || !box) return;
      const dir = Math.sign(currentIndex - last.current);
      last.current = currentIndex;
      setEdges((prev) => ({
        left: tab.offsetLeft,
        right: box.clientWidth - tab.offsetLeft - tab.offsetWidth,
        dir: dir || prev?.dir || 1,
      }));
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (list.current) observer.observe(list.current);
    return () => observer.disconnect();
  }, [currentIndex]);

  const lead = { type: "spring" as const, stiffness: 700, damping: 40 };
  const trail = { type: "spring" as const, stiffness: 240, damping: 28 };
  // the edge heading toward the new tab leads and the other trails, so the pill stretches across
  const edgeSprings = reduce
    ? { left: { duration: 0 }, right: { duration: 0 } }
    : edges?.dir === 1
      ? { left: trail, right: lead }
      : { left: lead, right: trail };

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
        ref={list}
        role="tablist"
        aria-label={label}
        className="relative inline-flex w-fit gap-1 rounded-[20px] bg-foreground/[0.05] p-1 [corner-shape:squircle]"
      >
        {edges && (
          <motion.span
            aria-hidden
            initial={false}
            animate={{ left: edges.left, right: edges.right }}
            transition={edgeSprings}
            className="absolute inset-y-1 rounded-[16px] bg-background shadow-[0_1px_3px_rgba(0,0,0,0.08),0_0_0_0.5px_rgba(0,0,0,0.05)] [corner-shape:squircle] dark:bg-foreground/[0.12]"
          />
        )}
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
                "relative h-9 cursor-pointer rounded-[16px] px-4 text-sm font-semibold outline-hidden transition-colors duration-200 [corner-shape:squircle] focus-visible:outline-2 focus-visible:outline-brand motion-reduce:transition-none",
                active ? "text-foreground" : "text-foreground/50 hover:text-foreground/80",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <div className="relative overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false} custom={edges?.dir ?? 1}>
          <motion.div
            key={selected}
            custom={edges?.dir ?? 1}
            id={`${id}-panel`}
            role="tabpanel"
            aria-labelledby={`${id}-tab-${currentIndex}`}
            tabIndex={0}
            variants={{
              enter: (dir: number) => ({ opacity: 0, x: reduce ? 0 : dir * 24, filter: reduce ? "none" : "blur(4px)" }),
              center: { opacity: 1, x: 0, filter: "blur(0px)" },
              exit: (dir: number) => ({ opacity: 0, x: reduce ? 0 : dir * -24, filter: reduce ? "none" : "blur(4px)" }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 36 }}
            className="rounded-[16px] outline-hidden focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
          >
            {current?.content}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
