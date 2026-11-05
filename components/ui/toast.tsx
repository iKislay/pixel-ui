"use client";

import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Bell,
  Check,
  Info,
  LoaderCircle,
  TriangleAlert,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType =
  | "default"
  | "loading"
  | "success"
  | "error"
  | "warning"
  | "info";

export type ToastId = string | number;

export type ToastAction = {
  label: string;
  onClick: () => void;
};

export type ToastOptions = {
  id?: ToastId;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ToastAction;
  duration?: number;
  dismissible?: boolean;
};

export type ToastPromiseMessages<T> = {
  loading: ReactNode;
  success: ReactNode | ((data: T) => ReactNode);
  error: ReactNode | ((error: unknown) => ReactNode);
};

export type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

type ToastItem = Omit<ToastOptions, "id" | "duration"> & {
  id: ToastId;
  type: ToastType;
  title: ReactNode;
  pulse: number;
};

const DURATION = 5000;
const VISIBLE = 3;
const PEEK = 10;
const STACK = { type: "spring", stiffness: 380, damping: 30, mass: 0.8 } as const;
const POP = { type: "spring", stiffness: 300, damping: 20 } as const;
const WORD = { type: "spring", stiffness: 200, damping: 20 } as const;
const RIPPLE = { duration: 2, ease: "easeOut" } as const;
const EXIT = { duration: 0.3, ease: [0.4, 0, 1, 1] } as const;
const INSTANT = { duration: 0 } as const;

type Tone = {
  icon: LucideIcon;
  badge: string;
  glow?: string;
  ring?: string;
  shadow?: string;
};

const TONES: Record<Exclude<ToastType, "default">, Tone> = {
  loading: { icon: LoaderCircle, badge: "bg-yellow-500" },
  success: {
    icon: Check,
    badge: "bg-green-500",
    glow: "bg-green-300",
    ring: "via-green-300",
    shadow: "1px 0 rgba(34,197,94,0.18), -1px 0 rgba(59,130,246,0.14)",
  },
  error: {
    icon: X,
    badge: "bg-red-500",
    glow: "bg-red-300",
    ring: "via-red-300",
    shadow: "1px 0 rgba(239,68,68,0.18), -1px 0 rgba(168,85,247,0.14)",
  },
  warning: {
    icon: TriangleAlert,
    badge: "bg-amber-500",
    glow: "bg-amber-300",
    ring: "via-amber-300",
    shadow: "1px 0 rgba(245,158,11,0.18), -1px 0 rgba(239,68,68,0.14)",
  },
  info: {
    icon: Info,
    badge: "bg-blue-500",
    glow: "bg-blue-300",
    ring: "via-blue-300",
    shadow: "1px 0 rgba(59,130,246,0.18), -1px 0 rgba(168,85,247,0.14)",
  },
};

let toasts: ToastItem[] = [];
let seq = 0;
const NONE: ToastItem[] = [];
const listeners = new Set<() => void>();
const timers = new Map<ToastId, ReturnType<typeof setTimeout>>();

const emit = () => listeners.forEach((listener) => listener());

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function dismiss(id?: ToastId) {
  const gone = id === undefined ? toasts.map((t) => t.id) : [id];
  gone.forEach((key) => {
    clearTimeout(timers.get(key));
    timers.delete(key);
  });
  toasts = id === undefined ? [] : toasts.filter((t) => t.id !== id);
  emit();
}

function show(
  type: ToastType,
  title: ReactNode,
  { id, duration, ...options }: ToastOptions = {},
) {
  const key = id ?? `toast-${++seq}`;
  const item: ToastItem = { ...options, id: key, type, title, pulse: ++seq };
  toasts = toasts.some((t) => t.id === key)
    ? toasts.map((t) => (t.id === key ? item : t))
    : [item, ...toasts];

  clearTimeout(timers.get(key));
  // loading stays up until it is updated or dismissed
  const ms = duration ?? (type === "loading" ? Infinity : DURATION);
  if (Number.isFinite(ms)) timers.set(key, setTimeout(() => dismiss(key), ms));
  emit();
  return key;
}

const message = <V,>(value: ReactNode | ((input: V) => ReactNode), input: V) =>
  typeof value === "function" ? value(input) : value;

function promise<T>(
  task: Promise<T> | (() => Promise<T>),
  messages: ToastPromiseMessages<T>,
  options: ToastOptions = {},
) {
  const id = show("loading", messages.loading, { ...options, duration: Infinity });
  const settle = (type: ToastType, title: ReactNode) =>
    show(type, title, { ...options, id });

  const pending = typeof task === "function" ? task() : task;
  // catch after then, so a throwing success message still leaves the spinner
  pending
    .then((data) => settle("success", message(messages.success, data)))
    .catch((error) => settle("error", message(messages.error, error)));
  return pending;
}

const variant =
  (type: ToastType) => (title: ReactNode, options?: ToastOptions) =>
    show(type, title, options);

export const toast = Object.assign(variant("default"), {
  success: variant("success"),
  error: variant("error"),
  warning: variant("warning"),
  info: variant("info"),
  loading: variant("loading"),
  promise,
  dismiss,
});

// words keep their key across a text change, so shared words glide and the rest fade
function Morph({ text, reduced }: { text: string; reduced: boolean }) {
  const seen = new Map<string, number>();
  const tokens = text
    .split(/(\n|[^\S\n]+)/)
    .filter(Boolean)
    .map((token) => {
      const n = seen.get(token) ?? 0;
      seen.set(token, n + 1);
      return { token, key: `${token}-${n}` };
    });

  return (
    <span className="flex flex-wrap">
      <AnimatePresence initial={false} mode="popLayout">
        {tokens.map(({ token, key }) =>
          token === "\n" ? (
            <span key={key} className="basis-full" />
          ) : (
            <motion.span
              key={key}
              layout="position"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={reduced ? INSTANT : WORD}
              className="whitespace-pre"
            >
              {token}
            </motion.span>
          ),
        )}
      </AnimatePresence>
    </span>
  );
}

function Text({
  value,
  reduced,
}: {
  value: ReactNode;
  reduced: boolean;
}) {
  return typeof value === "string" ? (
    <Morph text={value} reduced={reduced} />
  ) : (
    value
  );
}

function Copy({
  title,
  description,
  reduced,
}: {
  title: ReactNode;
  description?: ReactNode;
  reduced: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div
        data-slot="toast-title"
        className="text-base font-medium text-neutral-900 dark:text-white"
      >
        <Text value={title} reduced={reduced} />
      </div>
      {description && (
        <div
          data-slot="toast-description"
          className="text-sm text-neutral-500 dark:text-neutral-400"
        >
          <Text value={description} reduced={reduced} />
        </div>
      )}
    </div>
  );
}

function Warp({ id }: { id: string }) {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute size-0 overflow-hidden"
    >
      <defs>
        <filter
          id={id}
          x="-250%"
          y="-250%"
          width="600%"
          height="600%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012 0.08"
            numOctaves={2}
            seed={7}
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale={18}
            xChannelSelector="R"
            yChannelSelector="G"
            result="warped"
          />
          <feGaussianBlur in="warped" stdDeviation={1.5} />
        </filter>
      </defs>
    </svg>
  );
}

type ToastCardProps = Omit<ComponentProps<"div">, "title"> & {
  type: ToastType;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ToastAction;
  pulse?: number;
  onDismiss?: () => void;
};

export function ToastCard({
  type,
  title,
  description,
  icon,
  action,
  pulse = 0,
  onDismiss,
  className,
  ...props
}: ToastCardProps) {
  const reduced = useReducedMotion() ?? false;
  const filter = `toast-warp-${useId().replace(/[^\w-]/g, "")}`;
  const tone = type === "default" ? undefined : TONES[type];
  const ripple = !reduced && tone?.glow;
  const Glyph = tone?.icon;

  return (
    <div
      data-slot="toast"
      data-type={type}
      {...props}
      className={cn(
        "group/toast relative w-full overflow-hidden rounded-2xl border border-neutral-200 bg-white p-4 shadow-lg dark:border-neutral-800 dark:bg-neutral-900",
        className,
      )}
    >
      {ripple && (
        <>
          <Warp id={filter} />
          <motion.div
            key={`glow-${pulse}`}
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.9, 0] }}
            transition={{ ...RIPPLE, delay: 0.2 }}
            className="pointer-events-none absolute inset-0"
          >
            <div className={cn("absolute -top-5 left-0 h-5 w-30 -rotate-7 blur-lg", tone.glow)} />
            <div className={cn("absolute top-0 -left-10 h-full w-10 blur-lg", tone.glow)} />
            <div className={cn("absolute -bottom-5 left-0 h-5 w-30 rotate-7 blur-lg", tone.glow)} />
          </motion.div>
        </>
      )}

      <div className="relative flex items-start gap-4">
        <div className="relative flex size-10 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-neutral-100 text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
          {icon ?? <Bell className="size-5" strokeWidth={2} />}
          {Glyph && (
            <motion.div
              key={pulse}
              aria-hidden
              data-slot="toast-badge"
              initial={{ scale: 1 }}
              animate={{ scale: ripple ? [1.2, 1] : 1 }}
              transition={POP}
              className={cn(
                "absolute -right-1 bottom-0 flex size-4.5 items-center justify-center rounded-full text-white ring-2 ring-white dark:ring-neutral-900",
                tone.badge,
              )}
            >
              {ripple && (
                <motion.div
                  initial={{ opacity: 0.8, scale: 1 }}
                  animate={{ opacity: 0, scale: 30 }}
                  transition={RIPPLE}
                  style={{ filter: `url(#${filter})` }}
                  className={cn(
                    "pointer-events-none absolute inset-0 rounded-full bg-radial from-transparent from-35% via-55% to-transparent to-75% blur-xs",
                    tone.ring,
                  )}
                />
              )}
              <Glyph
                className={cn(
                  type === "success" || type === "error" ? "size-3.5" : "size-3",
                  type === "loading" && "animate-spin motion-reduce:animate-none",
                )}
                strokeWidth={2.5}
              />
            </motion.div>
          )}
        </div>

        <div className="relative min-w-0 flex-1 pr-4">
          <Copy title={title} description={description} reduced={reduced} />
          {ripple && (
            // a warped copy of the text, revealed by a circle growing out of the badge
            <motion.div
              key={`wave-${pulse}`}
              aria-hidden
              initial={{ opacity: 0.9, clipPath: "circle(0px at -32px 28px)" }}
              animate={{ opacity: 0, clipPath: "circle(280px at -32px 28px)" }}
              transition={RIPPLE}
              style={{ filter: `url(#${filter})`, textShadow: tone.shadow }}
              className="pointer-events-none absolute inset-0 pr-4"
            >
              <Copy title={title} description={description} reduced />
            </motion.div>
          )}
        </div>

        {action && (
          <button
            type="button"
            data-slot="toast-action"
            onClick={() => {
              action.onClick();
              onDismiss?.();
            }}
            className="relative shrink-0 cursor-pointer self-center rounded-lg bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-900 outline-none transition-[background-color,transform] hover:bg-neutral-200 focus-visible:ring-2 focus-visible:ring-neutral-400 active:scale-95 motion-reduce:transition-none dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700"
          >
            {action.label}
          </button>
        )}
      </div>

      {onDismiss && (
        <motion.button
          type="button"
          aria-label="Dismiss"
          data-slot="toast-close"
          onClick={onDismiss}
          whileTap={{ scale: 0.9 }}
          className="absolute top-2.5 right-2.5 flex size-5 cursor-pointer items-center justify-center rounded-full bg-neutral-100 text-neutral-500 opacity-0 outline-none transition-opacity duration-150 hover:bg-neutral-200 hover:text-neutral-700 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-neutral-400 group-hover/toast:opacity-100 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-white [@media(hover:none)]:opacity-100"
        >
          <X className="size-3" strokeWidth={2.5} />
        </motion.button>
      )}
    </div>
  );
}

// offsetHeight, not getBoundingClientRect: the stack scales back toasts and that would skew it
function useHeight<T extends HTMLElement>(onHeight: (height: number) => void) {
  const ref = useRef<T>(null);
  const report = useRef(onHeight);

  useLayoutEffect(() => {
    report.current = onHeight;
  });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(() => report.current(el.offsetHeight));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}

const PLACEMENT: Record<ToastPosition, string> = {
  "top-left": "top-6 left-6",
  "top-center": "top-6 left-1/2 -translate-x-1/2",
  "top-right": "top-6 right-6",
  "bottom-left": "bottom-6 left-6",
  "bottom-center": "bottom-6 left-1/2 -translate-x-1/2",
  "bottom-right": "bottom-6 right-6",
};

function StackItem({
  item,
  index,
  offset,
  expanded,
  top,
  side,
  reduced,
  onHeight,
  onHover,
}: {
  item: ToastItem;
  index: number;
  offset: number;
  expanded: boolean;
  top: boolean;
  side: number;
  reduced: boolean;
  onHeight: (height: number) => void;
  onHover: (hovering: boolean) => void;
}) {
  const ref = useHeight<HTMLDivElement>(onHeight);
  const dir = top ? 1 : -1;
  const y = dir * (expanded ? offset : index * PEEK);

  return (
    <motion.div
      ref={ref}
      initial={{ y: -dir * 64, opacity: 0, scale: 0.88 }}
      animate={{
        y,
        scale: expanded ? 1 : 1 - index * 0.04,
        opacity: expanded ? 1 : Math.max(0.6, 1 - index * 0.12),
      }}
      exit={{
        x: side * 420,
        y: side === 0 ? -dir * 64 : y,
        opacity: 0,
        scale: 0.9,
        transition: reduced ? INSTANT : EXIT,
      }}
      transition={reduced ? INSTANT : STACK}
      style={{ zIndex: VISIBLE - index }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onFocus={() => onHover(true)}
      onBlur={() => onHover(false)}
      className={cn(
        "pointer-events-auto absolute inset-x-0",
        top ? "top-0" : "bottom-0",
      )}
    >
      <ToastCard
        type={item.type}
        title={item.title}
        description={item.description}
        icon={item.icon}
        action={item.action}
        pulse={item.pulse}
        onDismiss={
          item.dismissible === false ? undefined : () => dismiss(item.id)
        }
      />
    </motion.div>
  );
}

const noop = () => () => {};

export type ToasterProps = Omit<ComponentProps<"section">, "children"> & {
  position?: ToastPosition;
  gap?: number;
};

export function Toaster({
  position = "bottom-right",
  gap = 12,
  className,
  ...props
}: ToasterProps) {
  const mounted = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
  const items = useSyncExternalStore(
    subscribe,
    () => toasts,
    () => NONE,
  );
  const reduced = useReducedMotion() ?? false;
  const [expanded, setExpanded] = useState(false);
  const [heights, setHeights] = useState<Record<string, number>>({});
  const leave = useRef<ReturnType<typeof setTimeout>>(undefined);

  if (!mounted) return null;

  const visible = items.slice(0, VISIBLE);
  const top = position.startsWith("top");
  const side = position.endsWith("left") ? -1 : position.endsWith("right") ? 1 : 0;
  // a short grace period, so crossing the gap between expanded toasts doesn't collapse them
  const hover = (hovering: boolean) => {
    clearTimeout(leave.current);
    if (hovering) setExpanded(true);
    else leave.current = setTimeout(() => setExpanded(false), 80);
  };

  const offsets = visible.map((_, index) =>
    visible
      .slice(0, index)
      .reduce((sum, prev) => sum + (heights[prev.id] ?? 0) + gap, 0),
  );

  // portaled so a z-index or transform on an ancestor can't trap or clip the stack
  return createPortal(
    <section
      aria-label="Notifications"
      aria-live="polite"
      data-slot="toaster"
      {...props}
      className={cn(
        "pointer-events-none fixed z-[100] w-sm max-w-[calc(100vw-2rem)]",
        PLACEMENT[position],
        className,
      )}
    >
      <AnimatePresence mode="sync">
        {visible.map((item, index) => (
          <StackItem
            key={item.id}
            item={item}
            index={index}
            offset={offsets[index]}
            expanded={expanded}
            top={top}
            side={side}
            reduced={reduced}
            onHover={hover}
            onHeight={(height) =>
              setHeights((prev) =>
                prev[item.id] === height ? prev : { ...prev, [item.id]: height },
              )
            }
          />
        ))}
      </AnimatePresence>
    </section>,
    document.body,
  );
}

export default Toaster;
