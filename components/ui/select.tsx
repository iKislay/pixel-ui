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

  const spring = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 460, damping: 36 };

  return (
    <div ref={root} data-slot="select" className={cn("relative h-12 w-60", className)}>
      <div
        className={cn(
          "absolute inset-x-0 top-0 overflow-hidden rounded-[20px] transition-[background-color,box-shadow] duration-200 [corner-shape:squircle] motion-reduce:transition-none",
          open
            ? "z-50 bg-popover text-popover-foreground shadow-[0_18px_50px_-12px_rgba(0,0,0,0.3),0_0_0_1px_rgba(0,0,0,0.05)] dark:shadow-[0_18px_50px_-12px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.08)]"
            : "bg-foreground/[0.05] ring-1 ring-inset ring-foreground/[0.06] hover:bg-foreground/[0.08]",
        )}
      >
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
          className="flex h-12 w-full cursor-pointer items-center justify-between gap-2 rounded-[20px] px-4 text-left text-sm font-medium outline-hidden [corner-shape:squircle] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-45"
        >
          <span className="relative flex-1 overflow-hidden">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.span
                key={selected ?? "placeholder"}
                initial={{ y: reduce ? 0 : "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: reduce ? 0 : "-100%", opacity: 0 }}
                transition={spring}
                className={cn("block truncate", !current && "text-foreground/40")}
              >
                {current?.label ?? placeholder}
              </motion.span>
            </AnimatePresence>
          </span>
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={spring} className="text-foreground/45">
            <ChevronDown className="size-4" />
          </motion.span>
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              transition={spring}
            >
              <ul
                ref={list}
                id={`${id}-list`}
                role="listbox"
                tabIndex={-1}
                aria-activedescendant={`${id}-${active}`}
                onKeyDown={onListKey}
                className="max-h-64 overflow-y-auto border-t border-foreground/[0.06] p-1.5 outline-none"
              >
                {options.map((option, index) => (
                  <motion.li
                    key={option.value}
                    id={`${id}-${index}`}
                    role="option"
                    aria-selected={option.value === selected}
                    aria-disabled={option.disabled || undefined}
                    initial={{ opacity: 0, y: reduce ? 0 : -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: reduce ? 0 : index * 0.025, duration: 0.2 }}
                    onPointerMove={() => !option.disabled && setActive(index)}
                    onClick={() => pick(option)}
                    className={cn(
                      "relative flex cursor-pointer items-center justify-between gap-3 rounded-[14px] px-3 py-2 text-sm [corner-shape:squircle]",
                      option.disabled && "cursor-not-allowed text-foreground/35",
                    )}
                  >
                    {index === active && (
                      <motion.span
                        layoutId={`${id}-highlight`}
                        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 600, damping: 40 }}
                        className="absolute inset-0 rounded-[14px] bg-foreground/[0.06] [corner-shape:squircle]"
                      />
                    )}
                    <span className="relative">{option.label}</span>
                    {option.value === selected && <Check className="relative size-4 text-brand" aria-hidden />}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
