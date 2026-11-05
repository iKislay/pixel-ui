"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from "motion/react";
import Recording from "@/components/recordings";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  components,
  type ComponentItem,
} from "@/lib/components";
import { cn } from "@/lib/utils";
import {
  CLOSE_EVENT,
  getCommandMenuOrigin,
  getSearchBarRect,
  OPEN_EVENT,
  SearchIcon,
  type CommandMenuOrigin,
} from "./CommandMenuTrigger";

type Category = ComponentItem["category"];

const PANEL_WIDTH = 760;
const PILL_HEIGHT = 52;
const GAP = 10;
const EDGE = 16;
const FADE = 40;

const morphSpring = {
  type: "spring",
  stiffness: 380,
  damping: 34,
  mass: 0.8,
} as const;

const softSpring = { type: "spring", stiffness: 420, damping: 30 } as const;

const rankCategory = (item: ComponentItem) => {
  const index = CATEGORY_ORDER.indexOf(item.category);
  return index === -1 ? CATEGORY_ORDER.length : index;
};

const promote = (item: ComponentItem) =>
  (item.isNew ? 2 : 0) + (item.featured ? 1 : 0);

const suggestOrder = [...components]
  .sort((a, b) => rankCategory(a) - rankCategory(b))
  .sort((a, b) => promote(b) - promote(a));

const categories = CATEGORY_ORDER.filter((c) =>
  components.some((item) => item.category === c),
);

const haystacks = new Map(
  components.map((item) => [
    item,
    `${item.name} ${CATEGORY_LABELS[item.category]} ${item.description ?? ""}`.toLowerCase(),
  ]),
);

const search = (query: string): ComponentItem[] => {
  const q = query.trim().toLowerCase();
  if (!q) return suggestOrder;

  const terms = q.split(/\s+/);
  const rank = (item: ComponentItem) => {
    const name = item.name.toLowerCase();
    if (name.startsWith(q)) return 0;
    if (name.includes(q)) return 1;
    return 2;
  };

  return suggestOrder
    .filter((item) => terms.every((t) => haystacks.get(item)!.includes(t)))
    .sort((a, b) => rank(a) - rank(b));
};

const Highlight = ({ text, query }: { text: string; query: string }) => {
  const q = query.trim().toLowerCase();
  const start = q ? text.toLowerCase().indexOf(q) : -1;
  if (start === -1) return text;

  return (
    <>
      {text.slice(0, start)}
      <span className="text-brand">
        {text.slice(start, start + q.length)}
      </span>
      {text.slice(start + q.length)}
    </>
  );
};

const readViewport = () =>
  typeof window === "undefined"
    ? { w: 1024, h: 768 }
    : { w: window.innerWidth, h: window.innerHeight };

export default function CommandMenu({
  initialOpen = false,
}: {
  initialOpen?: boolean;
}) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(initialOpen);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | null>(null);
  const [active, setActive] = useState(0);
  const [viewport, setViewport] = useState(readViewport);
  const [origin, setOrigin] = useState<CommandMenuOrigin | null>(() =>
    typeof window !== "undefined"
      ? (getCommandMenuOrigin() ?? getSearchBarRect())
      : null,
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const shelfRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(
    initialOpen && typeof document !== "undefined"
      ? (document.activeElement as HTMLElement | null)
      : null,
  );
  const openRef = useRef(initialOpen);
  const [edges, setEdges] = useState({ start: false, end: false });

  const matches = useMemo(() => search(query), [query]);
  const results = category
    ? matches.filter((item) => item.category === category)
    : matches;
  const activeItem = results[active];
  const searching = !!query.trim();

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    const update = () => setViewport(readViewport());
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // the pill grows out of the search bar: same top edge, widened around its center
  const frame = useMemo(() => {
    const width = Math.min(PANEL_WIDTH, viewport.w - EDGE * 2);
    if (!origin) {
      return {
        top: Math.round(viewport.h * 0.12),
        left: Math.round((viewport.w - width) / 2),
        width,
        collapsed: null,
      };
    }
    const center = origin.left + origin.width / 2;
    const left = Math.round(
      Math.min(Math.max(center - width / 2, EDGE), viewport.w - width - EDGE),
    );
    return {
      top: Math.round(origin.top),
      left,
      width,
      collapsed: {
        x: Math.round(origin.left - left),
        width: Math.round(origin.width),
        height: Math.round(origin.height),
        borderRadius: origin.radius ?? 16,
      },
    };
  }, [origin, viewport]);

  const collapsed =
    reduceMotion || !frame.collapsed
      ? { opacity: 0, y: reduceMotion ? 0 : -8 }
      : { ...frame.collapsed, opacity: 1 };

  const rise: Variants = reduceMotion
    ? { hidden: { opacity: 0 }, show: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 12, filter: "blur(6px)" },
        show: {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: softSpring,
        },
      };

  const stagger: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.035,
        delayChildren: reduceMotion ? 0 : 0.12,
      },
    },
  };

  useEffect(() => {
    const show = (e?: Event) => {
      if (openRef.current) return;
      returnFocus.current = document.activeElement as HTMLElement | null;
      const customOrigin = (e as CustomEvent<{ origin?: CommandMenuOrigin }>)
        ?.detail?.origin;
      setOrigin(customOrigin ?? getCommandMenuOrigin() ?? getSearchBarRect());
      setViewport(readViewport());
      setQuery("");
      setCategory(null);
      setActive(0);
      setOpen(true);
    };
    const hide = () => {
      setOpen(false);
      window.dispatchEvent(new Event(CLOSE_EVENT));
      returnFocus.current?.focus();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && openRef.current) {
        e.preventDefault();
        return hide();
      }
      // autofill fires keydown events without a key
      if (e.key?.toLowerCase() !== "k" || !(e.metaKey || e.ctrlKey)) return;
      e.preventDefault();
      if (openRef.current) hide();
      else show();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_EVENT, show);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_EVENT, show);
    };
  }, []);

  const measureEdges = () => {
    const shelf = shelfRef.current;
    if (!shelf) return;
    const start = shelf.scrollLeft > 0;
    const end = shelf.scrollLeft + shelf.clientWidth < shelf.scrollWidth - 1;
    setEdges((prev) =>
      prev.start === start && prev.end === end ? prev : { start, end },
    );
  };

  useEffect(measureEdges, [open, results.length, viewport]);

  useEffect(() => {
    shelfRef.current
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [active]);

  const close = () => {
    setOpen(false);
    window.dispatchEvent(new Event(CLOSE_EVENT));
    returnFocus.current?.focus();
  };

  const go = (item: ComponentItem | undefined) => {
    if (!item) return;
    setOpen(false);
    window.dispatchEvent(new Event(CLOSE_EVENT));
    router.push(item.href);
  };

  const pickCategory = (next: Category | null) => {
    setCategory(next);
    setActive(0);
    inputRef.current?.focus();
  };

  // ←/→ walk the shelf, ↑/↓ walk the category chips
  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const count = results.length;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const step = e.key === "ArrowRight" ? 1 : -1;
      setActive((i) => (count ? (i + step + count) % count : 0));
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const cycle = [null, ...categories];
      const step = e.key === "ArrowDown" ? 1 : -1;
      const next = cycle.indexOf(category) + step;
      pickCategory(cycle[(next + cycle.length) % cycle.length]);
    } else if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      e.preventDefault();
      go(activeItem);
    }
  };

  const panelTop = PILL_HEIGHT + GAP;
  const shelfTitle = searching
    ? "Results"
    : category
      ? CATEGORY_LABELS[category]
      : "Suggestions";

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-100">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.25, delay: 0.05 } }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={close}
            className="absolute inset-0 bg-black/25 backdrop-blur-lg dark:bg-black/55"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Search components"
            data-slot="command-menu"
            className="absolute"
            style={{ top: frame.top, left: frame.left, width: frame.width }}
          >
            <motion.label
              initial={collapsed}
              animate={{
                opacity: 1,
                x: 0,
                y: 0,
                width: frame.width,
                height: PILL_HEIGHT,
                borderRadius: 26,
              }}
              exit={{
                ...collapsed,
                opacity: 0,
                transition: reduceMotion
                  ? { duration: 0.15 }
                  : {
                      ...morphSpring,
                      opacity: { duration: 0.12, delay: 0.16 },
                    },
              }}
              transition={reduceMotion ? { duration: 0.15 } : morphSpring}
              className="flex cursor-text items-center gap-3 overflow-hidden border border-black/[0.08] bg-white pl-4 pr-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:border-white/10 dark:bg-[#1C1C1E] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
            >
              <SearchIcon className="size-[18px] shrink-0 text-[#868593]" />
              <input
                ref={inputRef}
                autoFocus
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onInputKeyDown}
                placeholder="Search components..."
                role="combobox"
                aria-expanded="true"
                aria-controls="command-menu-shelf"
                aria-activedescendant={
                  activeItem ? `command-item-${activeItem.href}` : undefined
                }
                className="h-full min-w-0 flex-1 bg-transparent text-[15px] font-medium text-black caret-brand outline-none placeholder:text-[#868593] dark:text-white dark:placeholder:text-[#A1A0AB]"
              />
              <button
                type="button"
                aria-label="Close"
                onClick={close}
                className="grid h-8 min-w-8 shrink-0 cursor-pointer place-items-center rounded-full bg-[#F4F4F9] px-3 text-[11px] font-semibold text-[#868593] outline-none transition-colors duration-150 hover:text-black focus-visible:ring-2 focus-visible:ring-brand/60 motion-reduce:transition-none dark:bg-[#2C2C2E] dark:hover:text-white"
              >
                esc
              </button>
            </motion.label>

            <motion.div
              initial={
                reduceMotion ? { opacity: 0 } : { opacity: 0, y: -16, scale: 0.97 }
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={
                reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: -10, scale: 0.98, transition: { duration: 0.14 } }
              }
              transition={
                reduceMotion ? { duration: 0.15 } : { ...morphSpring, delay: 0.05 }
              }
              style={{
                top: panelTop,
                maxHeight: viewport.h - frame.top - panelTop - EDGE,
                transformOrigin: "top center",
              }}
              className="no-scrollbar absolute inset-x-0 overflow-y-auto overscroll-contain rounded-[30px] border border-black/[0.08] bg-white p-5 shadow-[0_2px_4px_rgba(0,0,0,0.04),0_24px_64px_rgba(0,0,0,0.18)] sm:p-6 dark:border-white/10 dark:bg-[#1C1C1E] dark:shadow-[0_2px_4px_rgba(0,0,0,0.35),0_24px_64px_rgba(0,0,0,0.6)]"
            >
              <motion.div variants={stagger} initial="hidden" animate="show">
                <motion.p
                  variants={rise}
                  className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A1A0AB] dark:text-[#6E6D78]"
                >
                  Browse
                </motion.p>
                <div className="no-scrollbar -mx-1 mt-3 flex gap-2 overflow-x-auto px-1">
                  {[null, ...categories].map((c) => {
                    const count = c
                      ? matches.filter((item) => item.category === c).length
                      : matches.length;
                    const selected = category === c;
                    return (
                      <motion.button
                        key={c ?? "all"}
                        variants={rise}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => pickCategory(selected ? null : c)}
                        className={cn(
                          "relative flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full px-4 text-[14px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-brand/60 transition-[color,opacity] duration-200",
                          selected
                            ? "text-white dark:text-black"
                            : "bg-[#F4F4F9] text-[#5E5D6B] hover:text-black dark:bg-[#2C2C2E] dark:text-[#C4C3CC] dark:hover:text-white",
                          !count && !selected && "opacity-40",
                        )}
                      >
                        {selected && (
                          <motion.span
                            layoutId="command-chip"
                            transition={reduceMotion ? { duration: 0 } : softSpring}
                            className="absolute inset-0 rounded-full bg-black dark:bg-white"
                          />
                        )}
                        <span className="relative">
                          {c ? CATEGORY_LABELS[c] : "All"}
                        </span>
                        <span className="relative text-[12px] tabular-nums opacity-60">
                          {count}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>

                <motion.p
                  variants={rise}
                  className="mt-7 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A1A0AB] dark:text-[#6E6D78]"
                >
                  {shelfTitle}
                </motion.p>

                {results.length === 0 ? (
                  <motion.div
                    variants={rise}
                    className="mt-3 flex h-[150px] flex-col items-center justify-center gap-1 rounded-[20px] bg-[#F4F4F9] text-center sm:h-[168px] dark:bg-[#121212]"
                  >
                    <p className="text-[14px] font-semibold text-black dark:text-white">
                      Nothing found
                    </p>
                    <p className="text-[13px] font-medium text-[#868593]">
                      Try another word or category
                    </p>
                  </motion.div>
                ) : (
                  <div
                    ref={shelfRef}
                    id="command-menu-shelf"
                    role="listbox"
                    aria-orientation="horizontal"
                    aria-label={shelfTitle}
                    onScroll={measureEdges}
                    style={{
                      scrollPaddingInline: FADE,
                      maskImage: `linear-gradient(to right, ${
                        edges.start ? "transparent" : "#000"
                      } 0, #000 ${FADE}px, #000 calc(100% - ${FADE}px), ${
                        edges.end ? "transparent" : "#000"
                      } 100%)`,
                    }}
                    className="no-scrollbar -mx-1 mt-3 flex gap-3 overflow-x-auto px-1 pb-1 pt-2"
                  >
                    <AnimatePresence mode="popLayout">
                      {results.map((item, index) => {
                        const selected = index === active;
                        return (
                          <motion.div
                            key={item.href}
                            layout={!reduceMotion}
                            variants={rise}
                            exit={{
                              opacity: 0,
                              scale: 0.9,
                              transition: { duration: 0.15 },
                            }}
                            id={`command-item-${item.href}`}
                            role="option"
                            aria-selected={selected}
                            data-index={index}
                            onMouseEnter={() => setActive(index)}
                            onClick={() => go(item)}
                            className="w-[150px] shrink-0 cursor-pointer sm:w-[168px]"
                          >
                            <motion.div
                              animate={
                                reduceMotion
                                  ? undefined
                                  : { y: selected ? -4 : 0, scale: selected ? 1 : 0.97 }
                              }
                              transition={softSpring}
                              className={cn(
                                "relative aspect-square overflow-hidden rounded-[20px] bg-[#F4F4F9] ring-offset-2 ring-offset-white transition-shadow duration-200 dark:bg-[#121212] dark:ring-offset-[#1C1C1E]",
                                selected && "ring-2 ring-brand",
                              )}
                            >
                              <Recording slug={item.registry} playing={selected} />
                              {item.isNew && (
                                <span className="absolute left-2.5 top-2.5 rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                                  New
                                </span>
                              )}
                            </motion.div>
                            <p
                              className={cn(
                                "mt-3 truncate px-1 text-[14px] font-semibold transition-colors duration-200",
                                selected
                                  ? "text-black dark:text-white"
                                  : "text-[#868593]",
                              )}
                            >
                              <Highlight text={item.name} query={query} />
                            </p>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}

                <div className="mt-4 h-5 overflow-hidden px-1">
                  <AnimatePresence mode="wait" initial={false}>
                    {activeItem?.description && (
                      <motion.p
                        key={activeItem.href}
                        initial={
                          reduceMotion
                            ? { opacity: 0 }
                            : { opacity: 0, y: 6, filter: "blur(4px)" }
                        }
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={
                          reduceMotion
                            ? { opacity: 0 }
                            : { opacity: 0, y: -6, filter: "blur(4px)" }
                        }
                        transition={{ duration: 0.16, ease: "easeOut" }}
                        className="truncate text-[13px] font-medium text-[#868593]"
                      >
                        {activeItem.description}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
