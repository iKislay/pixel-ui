"use client";

import { useEffect, useId, useRef, useState, type ReactElement, type ReactNode } from "react";
import { Slot } from "@radix-ui/react-slot";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type DialogFeedback = "open" | "close";

export type DialogProps = {
  trigger?: ReactElement;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  onFeedback?: (event: DialogFeedback) => void;
};

export function Dialog({
  trigger,
  open,
  defaultOpen = false,
  onOpenChange,
  onFeedback,
  ...sheet
}: DialogProps) {
  const [inner, setInner] = useState(defaultOpen);
  const shown = open ?? inner;

  const set = (next: boolean) => {
    setInner(next);
    onOpenChange?.(next);
    onFeedback?.(next ? "open" : "close");
  };

  return (
    <>
      {trigger && (
        <Slot aria-haspopup="dialog" onClick={() => set(true)}>
          {trigger}
        </Slot>
      )}
      <AnimatePresence>{shown && <Sheet {...sheet} onClose={() => set(false)} />}</AnimatePresence>
    </>
  );
}

function Sheet({
  title,
  description,
  children,
  className,
  onClose,
}: Pick<DialogProps, "title" | "description" | "children" | "className"> & { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  const reduce = useReducedMotion();

  // the native modal dialog gives the focus trap, inert page and escape key for free
  useEffect(() => {
    const returnTo = document.activeElement as HTMLElement | null;
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = "hidden";
    ref.current?.showModal();
    return () => {
      root.style.overflow = overflow;
      returnTo?.focus();
    };
  }, []);

  return (
    <motion.dialog
      ref={ref}
      data-slot="dialog"
      aria-labelledby={`${id}-title`}
      aria-describedby={description ? `${id}-description` : undefined}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => event.target === event.currentTarget && onClose()}
      initial="closed"
      animate="open"
      exit="closed"
      variants={{ open: { opacity: 1 }, closed: { opacity: 0 } }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 m-0 flex h-dvh max-h-none w-screen max-w-none items-center justify-center bg-black/40 p-4 backdrop-blur-[2px] backdrop:bg-transparent"
    >
      <motion.div
        variants={{
          open: { opacity: 1, scale: 1, y: 0 },
          closed: reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 },
        }}
        transition={{ type: "spring", stiffness: 480, damping: 34 }}
        className={cn(
          "relative flex w-full max-w-md flex-col gap-4 rounded-[36px] bg-popover p-7 text-popover-foreground shadow-[0_24px_80px_-16px_rgba(0,0,0,0.4)] [corner-shape:squircle]",
          className,
        )}
      >
        <div className="flex flex-col gap-1.5 pr-8">
          <h2 id={`${id}-title`} className="text-lg font-semibold tracking-tight">
            {title}
          </h2>
          {description && (
            <p id={`${id}-description`} className="text-sm leading-relaxed text-foreground/55">
              {description}
            </p>
          )}
        </div>
        {children}
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-5 top-5 flex size-8 cursor-pointer items-center justify-center rounded-full text-foreground/45 outline-hidden transition-colors hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-2 focus-visible:outline-brand"
        >
          <X className="size-4" />
        </button>
      </motion.div>
    </motion.dialog>
  );
}
