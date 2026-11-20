"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactElement, type ReactNode } from "react";
import { Slot } from "@radix-ui/react-slot";
import { AnimatePresence, animate, usePresence, useReducedMotion } from "motion/react";
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

const OPEN = "inset(-64px -64px -64px -64px round 36px)";
const SPRING = { type: "spring" as const, stiffness: 300, damping: 32 };

// the window starts clipped to the trigger's own box and unfolds from there, so it reads as the trigger growing
function reveal(panel: HTMLElement, anchor: HTMLElement) {
  const from = anchor.getBoundingClientRect();
  const to = panel.getBoundingClientRect();
  return {
    x: from.left - to.left,
    y: from.top - to.top,
    clip: `inset(0px ${to.width - from.width}px ${to.height - from.height}px 0px round 18px)`,
  };
}

function Sheet({
  title,
  description,
  children,
  className,
  onClose,
}: Pick<DialogProps, "title" | "description" | "children" | "className"> & { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const anchor = useRef<HTMLElement | null>(null);
  const id = useId();
  const reduce = useReducedMotion();
  const [present, safeToRemove] = usePresence();

  // the native modal dialog gives the focus trap, inert page and escape key for free
  useLayoutEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    anchor.current = opener && opener !== document.body ? opener : null;
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = "hidden";
    const dialog = ref.current;
    dialog?.showModal();

    const el = panel.current;
    ref.current?.style.setProperty("opacity", "0");
    content.current?.style.setProperty("opacity", "0");
    if (ref.current) animate(ref.current, { opacity: [0, 1] }, { duration: 0.2 });
    if (el && content.current) animate(content.current, { opacity: [0, 1] }, { duration: 0.2, delay: reduce ? 0 : 0.1 });
    if (el && anchor.current && !reduce) {
      const { x, y, clip } = reveal(el, anchor.current);
      el.style.setProperty("clip-path", clip);
      el.style.setProperty("transform", `translate(${x}px, ${y}px)`);
      animate(el, { clipPath: [clip, OPEN], x: [x, 0], y: [y, 0] }, SPRING);
    } else if (el && !reduce) {
      animate(el, { scale: [0.94, 1], y: [8, 0] }, SPRING);
    }

    return () => {
      root.style.overflow = overflow;
      // the page stays inert while the modal is open, so it must close before focus can go back
      dialog?.close();
      opener?.focus();
    };
  }, [reduce]);

  useEffect(() => {
    if (present) return;
    const el = panel.current;
    const steps: Promise<unknown>[] = [];
    if (ref.current) steps.push(animate(ref.current, { opacity: 0 }, { duration: 0.24 }).finished);
    if (content.current) animate(content.current, { opacity: 0 }, { duration: 0.1 });
    if (el && anchor.current?.isConnected && !reduce) {
      const { x, y, clip } = reveal(el, anchor.current);
      steps.push(animate(el, { clipPath: clip, x, y }, { duration: 0.26, ease: [0.4, 0, 0.2, 1] }).finished);
    }
    Promise.all(steps).then(safeToRemove);
  }, [present, reduce, safeToRemove]);

  return (
    <dialog
      ref={ref}
      data-slot="dialog"
      aria-labelledby={`${id}-title`}
      aria-describedby={description ? `${id}-description` : undefined}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => event.target === event.currentTarget && onClose()}
      className="fixed inset-0 m-0 flex h-dvh max-h-none w-screen max-w-none items-center justify-center bg-black/40 p-4 backdrop-blur-[2px] backdrop:bg-transparent"
    >
      <div
        ref={panel}
        className={cn(
          "relative w-full max-w-md rounded-[36px] bg-popover text-popover-foreground shadow-[0_24px_80px_-16px_rgba(0,0,0,0.4)] [corner-shape:squircle]",
          className,
        )}
      >
        <div ref={content} className="flex flex-col gap-4 p-7">
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
        </div>
      </div>
    </dialog>
  );
}
