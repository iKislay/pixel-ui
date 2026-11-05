"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type CSSProperties,
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
const GAP = 8;
const PADDING = 8;
const FIELD_RADIUS = 16;
const CARD_RADIUS = FIELD_RADIUS + PADDING;
const FADE = 20;
const THUMB_INSET = 6;
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

const SQUIRCLE = { cornerShape: "squircle" } as CSSProperties;

function MemberRow({
  id,
  member,
  selected,
  active,
  leaving,
  onToggle,
  onHover,
}: {
  id?: string;
  member: Member;
  selected: boolean;
  active?: boolean;
  leaving?: boolean;
  onToggle?: () => void;
  onHover?: () => void;
}) {
  return (
    <div
      id={id}
      role={leaving ? undefined : "option"}
      aria-selected={leaving ? undefined : selected}
      data-key={member.id}
      data-exiting={leaving || undefined}
      data-slot="member-selector-option"
      onClick={onToggle}
      onMouseMove={onHover}
      style={SQUIRCLE}
      className={cn(
        "flex h-13 w-full cursor-pointer items-center gap-3 rounded-[14px] px-2.5 text-left transition-colors duration-150 motion-reduce:transition-none",
        active && "bg-[#F4F4F9] dark:bg-[#2C2C2E]",
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
            "block truncate text-[14px] font-semibold leading-5 transition-colors duration-200 motion-reduce:transition-none",
            selected || active
              ? "text-black dark:text-white"
              : "text-black/75 dark:text-white/75",
          )}
        >
          {member.name}
        </span>
        {member.email && (
          <span className="block truncate text-[12px] font-medium leading-4 text-[#868593]">
            {member.email}
          </span>
        )}
      </span>

      <span
        aria-hidden
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full transition-[background-color,box-shadow] duration-200 motion-reduce:transition-none",
          selected
            ? "bg-black dark:bg-white"
            : "shadow-[inset_0_0_0_1.5px_#D9D9E0] dark:shadow-[inset_0_0_0_1.5px_#3A3A3C]",
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
    </div>
  );
}

const shape = (top: number, right: number, bottom: number, left: number) =>
  `inset(${top}px ${right}px ${bottom}px ${left}px round ${CARD_RADIUS}px)`;

const HIDDEN_BODY = { opacity: "0", filter: "blur(6px)", transform: "translateY(-8px)" };
const SHOWN_BODY = { opacity: "1", filter: "blur(0px)", transform: "none" };

function bodyStyle(el: HTMLElement) {
  const style = getComputedStyle(el);
  return { opacity: style.opacity, filter: style.filter, transform: style.transform };
}

function Dropdown({
  open,
  anchorRef,
  members,
  selected,
  query,
  reduced,
  onQuery,
  onToggle,
  onClose,
  onClosed,
}: {
  open: boolean;
  anchorRef: RefObject<HTMLButtonElement | null>;
  members: Member[];
  selected: string[];
  query: string;
  reduced: boolean;
  onQuery: (query: string) => void;
  onToggle: (id: string) => void;
  onClose: () => void;
  onClosed: () => void;
}) {
  const uid = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const clipRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const animations = useRef<Animation[]>([]);
  const idle = useRef<ReturnType<typeof setTimeout>>(undefined);
  const closed = useRef(onClosed);
  const [activeId, setActiveId] = useState<string>();

  useLayoutEffect(() => {
    closed.current = onClosed;
  });

  // the card grows out of the add circle; every run starts from what is painted, so toggling mid-flight never jumps
  useLayoutEffect(() => {
    const panel = panelRef.current;
    const clip = clipRef.current;
    const spacer = spacerRef.current;
    const body = bodyRef.current;
    const anchor = anchorRef.current;
    const circle = anchor?.firstElementChild;
    if (!panel || !clip || !spacer || !body || !anchor || !circle) return;

    const first = animations.current.length === 0;
    const top = anchor.offsetHeight + GAP;
    spacer.style.height = `${top}px`;

    const p = clip.getBoundingClientRect();
    const c = circle.getBoundingClientRect();
    const folded = shape(c.top - p.top, p.right - c.right, p.bottom - c.bottom, c.left - p.left);
    const unfolded = shape(top, 0, 0, 0);

    const fromShape = first ? folded : getComputedStyle(clip).clipPath;
    const fromBody = first ? HIDDEN_BODY : bodyStyle(body);
    const fromOpacity = first ? "0" : getComputedStyle(panel).opacity;
    animations.current.forEach((animation) => animation.cancel());

    let main: Animation;
    if (reduced) {
      clip.style.clipPath = unfolded;
      Object.assign(body.style, SHOWN_BODY);
      panel.style.opacity = open ? "1" : "0";
      main = panel.animate([{ opacity: fromOpacity }, { opacity: open ? 1 : 0 }], {
        duration: 140,
        easing: "ease-out",
      });
      animations.current = [main];
    } else {
      const motion = open ? spring(300, 32) : spring(440, 42);
      const toBody = open ? SHOWN_BODY : HIDDEN_BODY;
      clip.style.clipPath = open ? unfolded : folded;
      Object.assign(body.style, toBody);
      panel.style.opacity = "1";
      main = clip.animate([{ clipPath: fromShape }, { clipPath: open ? unfolded : folded }], motion);
      // content waits for the card to open up, and clears out before it folds back in
      const bodyFrames: Keyframe[] = open
        ? first
          ? [fromBody, { ...fromBody, offset: 0.35 }, toBody]
          : [fromBody, toBody]
        : [fromBody, { ...toBody, offset: 0.4 }, toBody];
      animations.current = [
        main,
        body.animate(bodyFrames, motion),
        panel.animate([{ opacity: fromOpacity }, { opacity: 1, offset: 0.15 }, { opacity: 1 }], motion),
      ];
    }
    main.onfinish = () => {
      if (!open) closed.current();
    };
  }, [open, reduced, anchorRef]);

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
      .sort((a, b) => +selected.includes(b.id) - +selected.includes(a.id));
  }, [members, selected, query]);

  const [leaving, remove] = usePresence(filtered, keyOfMember);
  const active = filtered.find((m) => m.id === activeId) ?? filtered[0];
  const optionId = (id: string) => `${uid}-option-${id}`;

  useFlip(listRef, {
    reduced,
    enter: ROW_ENTER,
    exit: ROW_EXIT,
    appear: true,
    stagger: STAGGER,
    onExited: remove,
  });

  const paintScroll = useCallback(() => {
    const scroller = scrollRef.current;
    const thumb = thumbRef.current;
    if (!scroller || !thumb) return;
    const { scrollTop, scrollHeight, clientHeight } = scroller;
    const room = scrollHeight - clientHeight;
    const above = scrollTop > 1;
    const below = scrollTop < room - 1;
    scroller.style.maskImage = `linear-gradient(to bottom, ${above ? "transparent" : "#000"} 0, #000 ${FADE}px, #000 calc(100% - ${FADE}px), ${below ? "transparent" : "#000"} 100%)`;
    if (room <= 1) {
      delete thumb.dataset.scrollable;
      return;
    }
    thumb.dataset.scrollable = "";
    const track = clientHeight - THUMB_INSET * 2;
    const size = Math.max((clientHeight / scrollHeight) * track, 28);
    thumb.style.height = `${size}px`;
    thumb.style.transform = `translateY(${(scrollTop / room) * (track - size)}px)`;
  }, []);

  useLayoutEffect(paintScroll);

  const onScroll = () => {
    paintScroll();
    const thumb = thumbRef.current;
    if (!thumb?.dataset.scrollable) return;
    thumb.style.opacity = "1";
    clearTimeout(idle.current);
    idle.current = setTimeout(() => {
      thumb.style.opacity = "";
    }, 700);
  };

  useEffect(() => () => clearTimeout(idle.current), []);

  const moveActive = (step: number) => {
    if (!filtered.length) return;
    const index = active ? filtered.indexOf(active) : -1;
    const next = filtered[(index + step + filtered.length) % filtered.length];
    setActiveId(next.id);
    requestAnimationFrame(() =>
      document.getElementById(optionId(next.id))?.scrollIntoView({
        block: "nearest",
        behavior: reduced ? "auto" : "smooth",
      }),
    );
  };

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Add members"
      data-slot="member-selector-dropdown"
      className={cn(
        "absolute top-0 right-0 z-40 w-80 max-w-[calc(100vw-2rem)] [filter:drop-shadow(0_0_0.5px_rgba(0,0,0,0.22))_drop-shadow(0_12px_32px_rgba(0,0,0,0.12))] dark:[filter:drop-shadow(0_0_0.5px_rgba(255,255,255,0.3))_drop-shadow(0_16px_40px_rgba(0,0,0,0.5))]",
        !open && "pointer-events-none",
      )}
    >
      <div ref={clipRef} className="relative">
        <div aria-hidden className="absolute inset-0 bg-white dark:bg-[#1C1C1E]" />
        <div ref={spacerRef} aria-hidden />

        <div ref={bodyRef} className="relative" style={{ padding: PADDING }}>
          <label
            style={{ borderRadius: FIELD_RADIUS }}
            className="flex h-12 cursor-text items-center gap-3 bg-[#F7F7FA] pr-2.5 pl-4 dark:bg-[#121212]"
          >
            <Icon strokeWidth={2.5} className="size-4 shrink-0 text-[#868593]">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </Icon>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                onQuery(e.target.value);
                setActiveId(undefined);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                  e.preventDefault();
                  moveActive(e.key === "ArrowDown" ? 1 : -1);
                } else if (e.key === "Enter" && active) {
                  e.preventDefault();
                  setActiveId(active.id);
                  onToggle(active.id);
                }
              }}
              placeholder="Search members"
              role="combobox"
              aria-expanded="true"
              aria-controls={`${uid}-list`}
              aria-activedescendant={active ? optionId(active.id) : undefined}
              className="h-full w-full min-w-0 bg-transparent text-[15px] font-medium text-black caret-[#FC4C01] outline-none placeholder:text-[#A1A0AB] dark:text-white dark:placeholder:text-[#6E6D78]"
            />
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="group/esc grid h-7 w-10 shrink-0 cursor-pointer place-items-center rounded-[8px] bg-white text-[12px] font-semibold text-[#868593] outline-none transition-colors duration-150 hover:text-black focus-visible:ring-2 focus-visible:ring-[#FC4C01]/60 motion-reduce:transition-none dark:bg-[#2C2C2E] dark:hover:text-white"
            >
              <span className="col-start-1 row-start-1 transition-[opacity,filter,scale] duration-200 ease-out group-hover/esc:scale-75 group-hover/esc:opacity-0 group-hover/esc:blur-[2px] group-focus-visible/esc:scale-75 group-focus-visible/esc:opacity-0 group-focus-visible/esc:blur-[2px] motion-reduce:transition-none [@media(hover:none)]:hidden">
                esc
              </span>
              <Icon
                strokeWidth={2.5}
                className="col-start-1 row-start-1 size-3.5 scale-75 opacity-0 blur-[2px] transition-[opacity,filter,scale] duration-200 ease-out group-hover/esc:scale-100 group-hover/esc:opacity-100 group-hover/esc:blur-none group-focus-visible/esc:scale-100 group-focus-visible/esc:opacity-100 group-focus-visible/esc:blur-none motion-reduce:transition-none [@media(hover:none)]:scale-100 [@media(hover:none)]:opacity-100 [@media(hover:none)]:blur-none"
              >
                <path d="M7 7l10 10M17 7L7 17" />
              </Icon>
            </button>
          </label>

          <div className="group/list relative mt-2">
            <div
              ref={scrollRef}
              id={`${uid}-list`}
              role="listbox"
              aria-multiselectable="true"
              aria-label="Members"
              onScroll={onScroll}
              style={{ scrollPaddingBlock: FADE }}
              className="h-66 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <div ref={listRef} className="relative">
                {filtered.map((member) => (
                  <MemberRow
                    key={member.id}
                    id={optionId(member.id)}
                    member={member}
                    selected={selected.includes(member.id)}
                    active={member.id === active?.id}
                    onToggle={() => {
                      setActiveId(member.id);
                      onToggle(member.id);
                    }}
                    onHover={() => setActiveId(member.id)}
                  />
                ))}
                {leaving.map((member) => (
                  <MemberRow
                    key={member.id}
                    member={member}
                    selected={selected.includes(member.id)}
                    leaving
                  />
                ))}
              </div>

              {filtered.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center gap-1 px-6 text-center">
                  <p className="text-[13px] font-semibold text-black dark:text-white">
                    Nothing found
                  </p>
                  <p className="max-w-full truncate text-[13px] font-medium text-[#868593]">
                    No members match &ldquo;{query.trim()}&rdquo;
                  </p>
                </div>
              )}
            </div>

            <div
              ref={thumbRef}
              aria-hidden
              style={{ top: THUMB_INSET }}
              className="pointer-events-none absolute right-0.5 w-[3px] rounded-full bg-black/25 opacity-0 transition-opacity duration-300 group-hover/list:data-scrollable:opacity-50 motion-reduce:transition-none dark:bg-white/30"
            />
          </div>
        </div>
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
            className="group relative z-50 flex cursor-pointer flex-col items-center gap-1.5 outline-none transition-[scale] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-105 active:scale-95 motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100"
          >
            <span
              className={cn(
                "flex size-12 items-center justify-center rounded-full border-2 transition-[background-color,border-color,box-shadow] duration-300 group-focus-visible:ring-2 group-focus-visible:ring-neutral-400 group-focus-visible:ring-offset-2 motion-reduce:transition-none dark:ring-offset-neutral-950",
                // stays filled until the card has folded back into it
                rendered
                  ? "border-transparent bg-white shadow-[0_0_0_0.5px_rgba(0,0,0,0.2),0_4px_12px_rgba(0,0,0,0.08)] dark:bg-[#1C1C1E] dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.3),0_4px_12px_rgba(0,0,0,0.4)]"
                  : "border-dashed border-neutral-500/40 group-hover:border-neutral-500/60 group-hover:bg-neutral-100/50 dark:border-neutral-400/40 dark:group-hover:border-neutral-400/60 dark:group-hover:bg-neutral-800/50",
              )}
            >
              <Icon
                className={cn(
                  "size-5 transition-[rotate,color] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none",
                  open
                    ? "rotate-45 text-black dark:text-white"
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
              anchorRef={addRef}
              members={members}
              selected={selected}
              query={query}
              reduced={reduced}
              onQuery={setQuery}
              onToggle={toggle}
              onClose={() => {
                setOpen(false);
                addRef.current?.focus();
              }}
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
