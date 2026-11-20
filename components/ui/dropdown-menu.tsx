"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactElement, type ReactNode } from "react";
import { Slot } from "@radix-ui/react-slot";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export type DropdownMenuFeedback = "open" | "close" | "select";

export type DropdownMenuItem =
  | {
      label: ReactNode;
      icon?: ReactNode;
      shortcut?: string;
      onSelect?: () => void;
      destructive?: boolean;
      disabled?: boolean;
    }
  | "separator";

export type DropdownMenuProps = {
  trigger: ReactElement;
  items: DropdownMenuItem[];
  align?: "start" | "end";
  className?: string;
  onFeedback?: (event: DropdownMenuFeedback) => void;
};

export function DropdownMenu({ trigger, items, align = "start", className, onFeedback }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLSpanElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const id = useId();
  const reduce = useReducedMotion();

  const enabled = () => [...(menu.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)') ?? [])];

  const set = (next: boolean, refocus = false) => {
    setOpen(next);
    onFeedback?.(next ? "open" : "close");
    if (refocus) root.current?.querySelector<HTMLElement>("[aria-haspopup]")?.focus();
  };

  useEffect(() => {
    if (!open) return;
    enabled()[0]?.focus();
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) set(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onKeyDown = (event: KeyboardEvent) => {
    const list = enabled();
    const at = list.indexOf(document.activeElement as HTMLElement);
    const targets: Record<string, number> = {
      ArrowDown: (at + 1) % list.length,
      ArrowUp: (at - 1 + list.length) % list.length,
      Home: 0,
      End: list.length - 1,
    };
    if (event.key in targets) {
      event.preventDefault();
      list[targets[event.key]]?.focus();
    } else if (event.key === "Escape") {
      set(false, true);
    } else if (event.key === "Tab") {
      set(false);
    }
  };

  return (
    <span ref={root} data-slot="dropdown-menu" className="relative inline-flex">
      <Slot
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => set(!open)}
        onKeyDown={(event: KeyboardEvent) => {
          if (event.key === "ArrowDown" && !open) {
            event.preventDefault();
            set(true);
          }
        }}
      >
        {trigger}
      </Slot>
      <AnimatePresence>
        {open && (
          <motion.div
            ref={menu}
            id={id}
            role="menu"
            onKeyDown={onKeyDown}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: -4 }}
            transition={{ type: "spring", stiffness: 560, damping: 34 }}
            className={cn(
              "absolute top-full z-50 mt-2 flex min-w-52 flex-col rounded-[22px] bg-popover p-1.5 text-popover-foreground shadow-[0_12px_40px_-8px_rgba(0,0,0,0.25),0_0_0_1px_rgba(0,0,0,0.05)] [corner-shape:squircle] dark:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.08)]",
              align === "start" ? "left-0 origin-top-left" : "right-0 origin-top-right",
              className,
            )}
          >
            {items.map((item, index) =>
              item === "separator" ? (
                <div key={index} role="separator" className="mx-2 my-1 h-px bg-foreground/[0.08]" />
              ) : (
                <button
                  key={index}
                  type="button"
                  role="menuitem"
                  tabIndex={-1}
                  disabled={item.disabled}
                  onPointerMove={(event) => event.currentTarget.focus()}
                  onClick={() => {
                    onFeedback?.("select");
                    item.onSelect?.();
                    set(false, true);
                  }}
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 rounded-[14px] px-3 py-2 text-left text-sm font-medium outline-none [corner-shape:squircle] focus:bg-foreground/[0.06] disabled:cursor-not-allowed disabled:opacity-40 [&_svg]:size-4 [&_svg]:text-foreground/50",
                    item.destructive && "text-red-500 focus:bg-red-500/10 [&_svg]:text-red-500",
                  )}
                >
                  {item.icon}
                  <span className="flex-1">{item.label}</span>
                  {item.shortcut && <kbd className="font-mono text-[11px] text-foreground/35">{item.shortcut}</kbd>}
                </button>
              ),
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}
