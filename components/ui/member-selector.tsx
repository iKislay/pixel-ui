"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type ReactNode,
  type RefObject,
} from "react";
import { cn } from "@/lib/utils";

export type Member = {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
};

export type MemberSelectorProps = Omit<ComponentProps<"div">, "onChange"> & {
  members: Member[];
  selected: string[];
  onChange: (selected: string[]) => void;
  max?: number;
  maxVisible?: number;
  label?: string;
};

type Spring = { easing: string; duration: number };

const EXIT_MS = 180;
const EXIT_EASE = "cubic-bezier(0.4, 0, 1, 1)";
const POPOVER_MS = 240;
const POPOVER_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
const STAGGER = 20;

const springs = new Map<string, Spring>();
let linearEasing: boolean | undefined;

// samples a damped spring into a css linear() curve, so waapi runs it off the main thread
function spring(stiffness: number, damping: number): Spring {
  const id = `${stiffness}/${damping}`;
  const cached = springs.get(id);
  if (cached) return cached;

  const w0 = Math.sqrt(stiffness);
  const zeta = Math.min(damping / (2 * w0), 1);
  const wd = w0 * Math.sqrt(1 - zeta * zeta);
  const at = (t: number) =>
    zeta < 1
      ? 1 -
        Math.exp(-zeta * w0 * t) *
          (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t))
      : 1 - Math.exp(-w0 * t) * (1 + w0 * t);

  let settle = 0.1;
  for (let t = 0; t < 2; t += 1 / 120) if (Math.abs(1 - at(t)) > 0.001) settle = t;

  const points = Array.from({ length: 41 }, (_, i) =>
    i === 40 ? 1 : +at((i / 40) * settle).toFixed(4),
  );
  linearEasing ??= CSS.supports("animation-timing-function", "linear(0, 1)");
  const result = {
    easing: linearEasing
      ? `linear(${points.join(", ")})`
      : "cubic-bezier(0.22, 1, 0.36, 1)",
    duration: Math.round(settle * 1000),
  };
  springs.set(id, result);
  return result;
}

const REDUCED = "(prefers-reduced-motion: reduce)";

function subscribeReduced(onChange: () => void) {
  const query = window.matchMedia(REDUCED);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function useReducedMotion() {
  return useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED).matches,
    () => false,
  );
}

// keeps removed items rendered until their exit animation finishes
function usePresence<T>(items: T[], keyOf: (item: T) => string) {
  const signature = items.map(keyOf).join("\u0000");
  const [previous, setPrevious] = useState({ signature, items });
  const [leaving, setLeaving] = useState<T[]>([]);

  if (previous.signature !== signature) {
    const kept = new Set(items.map(keyOf));
    const already = new Set(leaving.map(keyOf));
    setLeaving([
      ...leaving.filter((item) => !kept.has(keyOf(item))),
      ...previous.items.filter(
        (item) => !kept.has(keyOf(item)) && !already.has(keyOf(item)),
      ),
    ]);
    setPrevious({ signature, items });
  }

  const remove = useCallback(
    (key: string) =>
      setLeaving((current) => current.filter((item) => keyOf(item) !== key)),
    [keyOf],
  );

  return [leaving, remove] as const;
}

type Box = { x: number; y: number; w: number };

type FlipOptions = {
  reduced: boolean;
  enter: Keyframe[];
  exit: Keyframe[];
  appear?: boolean;
  stagger?: number;
  onExited: (key: string) => void;
};

function translation(el: HTMLElement) {
  const [x, y] = getComputedStyle(el).translate.split(" ").map(parseFloat);
  return { x: x || 0, y: y || 0 };
}

// flip on the translate property, so enter/exit transforms and hover scale never fight it
function useFlip(
  listRef: RefObject<HTMLElement | null>,
  { reduced, enter, exit, appear = false, stagger = 0, onExited }: FlipOptions,
) {
  const boxes = useRef<Map<string, Box> | null>(null);
  const moves = useRef(new WeakMap<Element, Animation>());
  const exits = useRef(new WeakMap<Element, Animation>());
  const exited = useRef(onExited);

  useLayoutEffect(() => {
    exited.current = onExited;
  });

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const first = boxes.current === null;
    const prev = boxes.current ?? new Map<string, Box>();
    const next = new Map<string, Box>();
    const move = spring(380, 34);
    const pop = spring(420, 30);
    let entering = 0;

    for (const el of Array.from(list.children) as HTMLElement[]) {
      const key = el.dataset.key;
      if (!key) continue;
      const last = prev.get(key);

      if (el.dataset.exiting) {
        if (exits.current.has(el)) continue;
        const shift = translation(el);
        moves.current.get(el)?.cancel();
        if (!last || reduced) {
          exited.current(key);
          continue;
        }
        // pin it where it was painted, so leaving never jumps
        el.style.left = `${last.x}px`;
        el.style.top = `${last.y}px`;
        el.style.width = `${last.w}px`;
        el.style.translate = `${shift.x}px ${shift.y}px`;
        const anim = el.animate(exit, {
          duration: EXIT_MS,
          easing: EXIT_EASE,
          fill: "forwards",
        });
        anim.onfinish = () => exited.current(key);
        exits.current.set(el, anim);
        continue;
      }

      const revived = exits.current.get(el);
      if (revived) {
        revived.cancel();
        exits.current.delete(el);
        el.style.left = el.style.top = el.style.width = el.style.translate = "";
      }

      const box = { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth };
      next.set(key, box);

      if (reduced) {
        moves.current.get(el)?.cancel();
        continue;
      }
      if (!last) {
        if (!first || appear) {
          el.animate(enter, {
            duration: pop.duration,
            easing: pop.easing,
            delay: entering++ * stagger,
            fill: "backwards",
          });
        }
        continue;
      }
      if (last.x === box.x && last.y === box.y) continue;

      // start from where it is painted right now, so an interrupted move stays continuous
      const shift = translation(el);
      moves.current.get(el)?.cancel();
      const dx = last.x + shift.x - box.x;
      const dy = last.y + shift.y - box.y;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue;
      moves.current.set(
        el,
        el.animate(
          { translate: [`${dx}px ${dy}px`, "0px 0px"] },
          { duration: move.duration, easing: move.easing },
        ),
      );
    }

    boxes.current = next;
  });

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const observer = new ResizeObserver(() => {
      const next = new Map<string, Box>();
      for (const el of Array.from(list.children) as HTMLElement[]) {
        const key = el.dataset.key;
        if (key && !el.dataset.exiting) {
          next.set(key, { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth });
        }
      }
      boxes.current = next;
    });
    observer.observe(list);
    return () => observer.disconnect();
  }, [listRef]);
}

function Icon({
  children,
  className,
  strokeWidth = 2,
}: {
  children: ReactNode;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  );
}

const PLUS = (
  <>
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </>
);

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function Face({
  member,
  selected,
  className,
  textClassName,
}: {
  member: Member;
  selected: boolean;
  className?: string;
  textClassName?: string;
}) {
  const [broken, setBroken] = useState<string>();

  return member.avatar && broken !== member.avatar ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={member.avatar}
      alt=""
      draggable={false}
      onError={() => setBroken(member.avatar)}
      // an error that fired before hydration never reaches onError
      ref={(img) => {
        if (img?.complete) img.decode().catch(() => setBroken(member.avatar));
      }}
      className={cn(
        "size-full object-cover transition-[filter] duration-300 motion-reduce:transition-none",
        !selected && "grayscale",
        className,
      )}
    />
  ) : (
    <span
      className={cn(
        "flex size-full items-center justify-center font-medium transition-colors duration-300 motion-reduce:transition-none",
        selected
          ? "bg-neutral-900/10 text-neutral-900 dark:bg-white/15 dark:text-white"
          : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
        textClassName,
      )}
    >
      {initials(member.name)}
    </span>
  );
}

const keyOfMember = (member: Member) => member.id;

const AVATAR_ENTER: Keyframe[] = [
  { opacity: 0, transform: "scale(0.5)", filter: "blur(4px)" },
  { opacity: 1, transform: "none", filter: "blur(0px)" },
];
const AVATAR_EXIT: Keyframe[] = [
  { opacity: 1, transform: "none", filter: "blur(0px)" },
  { opacity: 0, transform: "scale(0.5)", filter: "blur(4px)" },
];
const ROW_ENTER: Keyframe[] = [
  { opacity: 0, transform: "translateX(-10px)" },
  { opacity: 1, transform: "none" },
];
const ROW_EXIT: Keyframe[] = [
  { opacity: 1, transform: "none" },
  { opacity: 0, transform: "translateX(10px)" },
];

function AvatarButton({
  member,
  selected,
  leaving,
  onToggle,
}: {
  member: Member;
  selected: boolean;
  leaving?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      data-key={member.id}
      data-exiting={leaving || undefined}
      data-slot="member-selector-avatar"
      aria-label={member.name}
      aria-pressed={selected}
      tabIndex={leaving ? -1 : undefined}
      onClick={onToggle}
      className={cn(
        "group relative flex cursor-pointer flex-col items-center gap-1.5 outline-none transition-[scale] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-105 active:scale-95 motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100",
        leaving && "pointer-events-none absolute",
      )}
    >
      <span
        className={cn(
          "relative size-12 overflow-hidden rounded-full transition-opacity duration-300 group-focus-visible:ring-2 group-focus-visible:ring-neutral-400 group-focus-visible:ring-offset-2 motion-reduce:transition-none dark:ring-offset-neutral-950",
          !selected && "opacity-50 group-hover:opacity-75",
        )}
      >
        <Face member={member} selected={selected} textClassName="text-sm" />
      </span>

      <span
        aria-hidden
        className={cn(
          "absolute right-0 bottom-5 flex size-4 items-center justify-center rounded-full bg-neutral-900 text-white shadow-sm transition-[scale,opacity] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none dark:bg-white dark:text-black",
          selected ? "scale-0 opacity-0" : "scale-100 opacity-100",
        )}
      >
        <Icon className="size-2.5" strokeWidth={3}>
          {PLUS}
        </Icon>
      </span>

      <span
        className={cn(
          "max-w-15 truncate text-xs font-medium transition-colors duration-300 motion-reduce:transition-none",
          selected
            ? "text-neutral-900 dark:text-white"
            : "text-neutral-500 dark:text-neutral-400",
        )}
      >
        {member.name.split(" ")[0]}
      </span>
    </button>
  );
}

function MemberRow({
  member,
  selected,
  leaving,
  onToggle,
}: {
  member: Member;
  selected: boolean;
  leaving?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      data-key={member.id}
      data-exiting={leaving || undefined}
      data-slot="member-selector-option"
      aria-pressed={selected}
      tabIndex={leaving ? -1 : undefined}
      onClick={onToggle}
      className={cn(
        "flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left outline-none transition-colors duration-200 focus-visible:bg-neutral-100 motion-reduce:transition-none dark:focus-visible:bg-neutral-800",
        selected
          ? "bg-neutral-900/5 hover:bg-neutral-900/10 dark:bg-white/5 dark:hover:bg-white/10"
          : "hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60",
        leaving && "pointer-events-none absolute",
      )}
    >
      <span
        className={cn(
          "size-9 shrink-0 overflow-hidden rounded-full transition-opacity duration-300 motion-reduce:transition-none",
          !selected && "opacity-60",
        )}
      >
        <Face member={member} selected={selected} textClassName="text-xs" />
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block truncate text-sm font-medium transition-colors duration-200 motion-reduce:transition-none",
            selected
              ? "text-neutral-900 dark:text-white"
              : "text-neutral-900/80 dark:text-white/80",
          )}
        >
          {member.name}
        </span>
        {member.email && (
          <span className="block truncate text-xs text-neutral-500 dark:text-neutral-400">
            {member.email}
          </span>
        )}
      </span>

      <span
        aria-hidden
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200 motion-reduce:transition-none",
          selected
            ? "border-neutral-900 bg-neutral-900 dark:border-white dark:bg-white"
            : "border-neutral-500/30 dark:border-neutral-400/30",
        )}
      >
        <Icon
          strokeWidth={3}
          className={cn(
            "size-3 text-white transition-[scale,opacity] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none dark:text-black",
            selected ? "scale-100 opacity-100" : "scale-0 opacity-0",
          )}
        >
          <path d="M20 6 9 17l-5-5" />
        </Icon>
      </span>
    </button>
  );
}

function Dropdown({
  open,
  members,
  selected,
  query,
  reduced,
  onQuery,
  onToggle,
  onClosed,
}: {
  open: boolean;
  members: Member[];
  selected: string[];
  query: string;
  reduced: boolean;
  onQuery: (query: string) => void;
  onToggle: (id: string) => void;
  onClosed: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const animation = useRef<Animation | null>(null);
  const closed = useRef(onClosed);

  useLayoutEffect(() => {
    closed.current = onClosed;
  });

  // one animation reversed on close, so toggling mid-flight eases back from where it is
  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    let anim = animation.current;
    if (!anim) {
      anim = panel.animate(
        reduced
          ? [{ opacity: 0 }, { opacity: 1 }]
          : [
              { opacity: 0, transform: "translateY(-10px) scale(0.95)" },
              { opacity: 1, transform: "none" },
            ],
        {
          duration: reduced ? 120 : POPOVER_MS,
          easing: POPOVER_EASE,
          fill: "both",
        },
      );
      animation.current = anim;
    } else if (anim.playbackRate > 0 !== open) {
      anim.reverse();
    }
    anim.onfinish = () => {
      if (!open) closed.current();
    };
  }, [open, reduced]);

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members
      .filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.email?.toLowerCase().includes(q),
      )
      .sort(
        (a, b) => +selected.includes(b.id) - +selected.includes(a.id),
      );
  }, [members, selected, query]);

  const [leaving, remove] = usePresence(filtered, keyOfMember);

  useFlip(listRef, {
    reduced,
    enter: ROW_ENTER,
    exit: ROW_EXIT,
    appear: true,
    stagger: STAGGER,
    onExited: remove,
  });

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Add members"
      data-slot="member-selector-dropdown"
      className={cn(
        "absolute top-full right-0 z-50 mt-2 w-72 origin-top-right overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-800 dark:bg-neutral-900",
        !open && "pointer-events-none",
      )}
    >
      <div className="border-b border-neutral-200 p-3 dark:border-neutral-800">
        <div className="relative">
          <Icon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-500 dark:text-neutral-400">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </Icon>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search members..."
            aria-label="Search members"
            className="w-full rounded-lg border border-transparent bg-neutral-100/70 py-2 pr-3 pl-9 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-500 focus:border-neutral-900/30 focus:bg-white motion-reduce:transition-none dark:bg-neutral-800/70 dark:text-white dark:placeholder:text-neutral-400 dark:focus:border-white/30 dark:focus:bg-neutral-900"
          />
        </div>
      </div>

      <div className="max-h-64 overflow-y-auto [scrollbar-width:thin]">
        <div ref={listRef} className="relative">
          {filtered.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              selected={selected.includes(member.id)}
              onToggle={() => onToggle(member.id)}
            />
          ))}
          {leaving.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              selected={selected.includes(member.id)}
              leaving
              onToggle={() => {}}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="px-3 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
            No members found
          </div>
        )}
      </div>
    </div>
  );
}

export function MemberSelector({
  members,
  selected,
  onChange,
  max,
  maxVisible = 5,
  label,
  className,
  onKeyDown,
  ...props
}: MemberSelectorProps) {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [query, setQuery] = useState("");

  if (open && !rendered) setRendered(true);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  const visible = useMemo(
    () =>
      [...members]
        .sort((a, b) => +selected.includes(b.id) - +selected.includes(a.id))
        .slice(0, maxVisible),
    [members, selected, maxVisible],
  );

  const [leaving, remove] = usePresence(visible, keyOfMember);

  useFlip(rowRef, {
    reduced,
    enter: AVATAR_ENTER,
    exit: AVATAR_EXIT,
    onExited: remove,
  });

  const toggle = (id: string) => {
    if (selected.includes(id)) onChange(selected.filter((s) => s !== id));
    else if (!max || selected.length < max) onChange([...selected, id]);
  };

  return (
    <div
      ref={rootRef}
      data-slot="member-selector"
      {...props}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.key === "Escape" && open) {
          setOpen(false);
          addRef.current?.focus();
        }
      }}
      className={cn("relative", className)}
    >
      {label && (
        <div className="mb-3 text-xs font-semibold tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
          {label}
        </div>
      )}

      <div ref={rowRef} className="relative flex flex-wrap items-start gap-4">
        {visible.map((member) => (
          <AvatarButton
            key={member.id}
            member={member}
            selected={selected.includes(member.id)}
            onToggle={() => toggle(member.id)}
          />
        ))}
        {leaving.map((member) => (
          <AvatarButton
            key={member.id}
            member={member}
            selected={selected.includes(member.id)}
            leaving
            onToggle={() => {}}
          />
        ))}

        <div data-key="member-selector-add" className="relative">
          <button
            ref={addRef}
            type="button"
            aria-expanded={open}
            aria-haspopup="dialog"
            data-slot="member-selector-add"
            onClick={() => setOpen(!open)}
            className="group flex cursor-pointer flex-col items-center gap-1.5 outline-none transition-[scale] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-105 active:scale-95 motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100"
          >
            <span
              className={cn(
                "flex size-12 items-center justify-center rounded-full border-2 border-dashed transition-colors duration-200 group-focus-visible:ring-2 group-focus-visible:ring-neutral-400 group-focus-visible:ring-offset-2 motion-reduce:transition-none dark:ring-offset-neutral-950",
                open
                  ? "border-neutral-900 bg-neutral-900/10 dark:border-white dark:bg-white/10"
                  : "border-neutral-500/40 group-hover:border-neutral-500/60 group-hover:bg-neutral-100/50 dark:border-neutral-400/40 dark:group-hover:border-neutral-400/60 dark:group-hover:bg-neutral-800/50",
              )}
            >
              <Icon
                className={cn(
                  "size-5 transition-[rotate,color] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none",
                  open
                    ? "rotate-45 text-neutral-900 dark:text-white"
                    : "text-neutral-500 dark:text-neutral-400",
                )}
              >
                {PLUS}
              </Icon>
            </span>
            <span
              className={cn(
                "text-xs font-medium transition-colors duration-200 motion-reduce:transition-none",
                open
                  ? "text-neutral-900 dark:text-white"
                  : "text-neutral-500 dark:text-neutral-400",
              )}
            >
              Add
            </span>
          </button>

          {rendered && (
            <Dropdown
              open={open}
              members={members}
              selected={selected}
              query={query}
              reduced={reduced}
              onQuery={setQuery}
              onToggle={toggle}
              onClosed={() => {
                setRendered(false);
                setQuery("");
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default MemberSelector;
