"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SelectFeedback = "open" | "close" | "select";

export type SelectOption = { value: string; label: ReactNode; disabled?: boolean };

export type SelectProps = {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: ReactNode;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
  onFeedback?: (event: SelectFeedback) => void;
};

export function Select({
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder = "Choose…",
  disabled,
  className,
  onFeedback,
  ...aria
}: SelectProps) {
  const [inner, setInner] = useState(defaultValue);
  const selected = value ?? inner;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const id = useId();
  const reduce = useReducedMotion();
  const current = options.find((o) => o.value === selected);

  const show = () => {
    const index = options.findIndex((o) => o.value === selected);
    setActive(index === -1 ? options.findIndex((o) => !o.disabled) : index);
    setOpen(true);
    onFeedback?.("open");
  };

  const hide = (refocus = true) => {
    setOpen(false);
    onFeedback?.("close");
    if (refocus) trigger.current?.focus();
  };

  const pick = (option?: SelectOption) => {
    if (!option || option.disabled) return;
    if (option.value !== selected) {
      setInner(option.value);
      onValueChange?.(option.value);
      onFeedback?.("select");
    }
    hide();
  };

  useEffect(() => {
    if (!open) return;
    list.current?.focus();
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) hide(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const move = (from: number, step: number) => {
    for (let i = 1; i <= options.length; i++) {
      const next = from + step * i;
      if (next < 0 || next >= options.length) return;
      if (!options[next].disabled) return setActive(next);
    }
  };

  const onListKey = (event: KeyboardEvent) => {
    const keys: Record<string, () => void> = {
      ArrowDown: () => move(active, 1),
      ArrowUp: () => move(active, -1),
      Home: () => move(-1, 1),
      End: () => move(options.length, -1),
      Enter: () => pick(options[active]),
      " ": () => pick(options[active]),
      Escape: () => hide(),
      Tab: () => hide(false),
    };
    const run = keys[event.key];
    if (run) {
      if (event.key !== "Tab") event.preventDefault();
      return run();
    }
    // type a letter to jump to the next option starting with it
    if (event.key.length === 1) {
      const letter = event.key.toLowerCase();
      const order = options.map((_, i) => (active + 1 + i) % options.length);
      const hit = order.find((i) => !options[i].disabled && String(options[i].label).toLowerCase().startsWith(letter));
      if (hit !== undefined) setActive(hit);
    }
  };

  return (
    <div ref={root} data-slot="select" className={cn("relative inline-block w-56", className)}>
      <button
        ref={trigger}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${id}-list` : undefined}
        onClick={() => (open ? hide() : show())}
        onKeyDown={(event) => {
          if (["ArrowDown", "ArrowUp"].includes(event.key)) {
            event.preventDefault();
            show();
          }
        }}
        {...aria}
        className="flex h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-[18px] bg-foreground/[0.05] px-4 text-left text-sm font-medium outline-hidden ring-1 ring-inset ring-foreground/[0.06] transition-colors duration-150 [corner-shape:squircle] hover:bg-foreground/[0.08] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
      >
        <span className={cn("truncate", !current && "text-foreground/40")}>{current?.label ?? placeholder}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: reduce ? 0 : 0.2 }} className="text-foreground/45">
          <ChevronDown className="size-4" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            ref={list}
            id={`${id}-list`}
            role="listbox"
            tabIndex={-1}
            aria-activedescendant={`${id}-${active}`}
            onKeyDown={onListKey}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -4 }}
            transition={{ type: "spring", stiffness: 520, damping: 34 }}
            className="absolute left-0 top-full z-50 mt-2 max-h-72 w-full origin-top overflow-auto rounded-[22px] bg-popover p-1.5 text-popover-foreground shadow-[0_12px_40px_-8px_rgba(0,0,0,0.25),0_0_0_1px_rgba(0,0,0,0.05)] outline-none [corner-shape:squircle] dark:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.08)]"
          >
            {options.map((option, index) => (
              <li
                key={option.value}
                id={`${id}-${index}`}
                role="option"
                aria-selected={option.value === selected}
                aria-disabled={option.disabled || undefined}
                onPointerMove={() => !option.disabled && setActive(index)}
                onClick={() => pick(option)}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-3 rounded-[14px] px-3 py-2 text-sm [corner-shape:squircle]",
                  index === active && "bg-foreground/[0.06]",
                  option.disabled && "cursor-not-allowed opacity-40",
                )}
              >
                {option.label}
                {option.value === selected && <Check className="size-4 text-brand" aria-hidden />}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
