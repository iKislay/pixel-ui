"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { AnimatePresence, MotionConfig, animate, motion } from "motion/react";
import { cn } from "@/lib/utils";

export type PosterMovie = {
  title: string;
  year: number;
  genre: string;
  rating: number;
  tagline: string;
  synopsis: string;
  color: string;
  poster?: string;
};

export type PosterSphereProps = Omit<ComponentProps<"div">, "children"> & {
  movies?: PosterMovie[];
  size?: "sm" | "md" | "lg";
  smoothness?: "snappy" | "smooth" | "floaty";
  movement?: "drag" | "hover";
};

const DEFAULT_MOVIES: PosterMovie[] = [
  { title: "The Last Lighthouse", year: 1987, genre: "Drama", rating: 82, tagline: "Someone has to keep the light on.", synopsis: "A retired keeper refuses to leave the last manual lighthouse on the coast, even after the ships stop coming.", color: "#e0703a" },
  { title: "Static Bloom", year: 2019, genre: "Sci-Fi", rating: 74, tagline: "The signal grew roots.", synopsis: "A radio astronomer finds a broadcast that only plays when the flowers in her garden open.", color: "#5b7cfa" },
  { title: "Paper Crowns", year: 2004, genre: "Comedy", rating: 68, tagline: "Long live the substitute king.", synopsis: "A party entertainer is mistaken for royalty and decides the job is easier than birthday parties.", color: "#f2c14e" },
  { title: "Undertow", year: 2011, genre: "Thriller", rating: 79, tagline: "Calm water lies.", synopsis: "Two lifeguards cover up one bad summer, until the tide brings it back.", color: "#2a9d8f" },
  { title: "Midnight Diner Club", year: 1996, genre: "Romance", rating: 71, tagline: "Open late. Hearts included.", synopsis: "Regulars at an all-night diner pair off, fall out and find their way back over one long winter.", color: "#d6457a" },
  { title: "Iron Orchard", year: 1978, genre: "Western", rating: 85, tagline: "Nothing grows here but trouble.", synopsis: "A widow defends a dying apple farm against a railroad baron with more patience than bullets.", color: "#b5542f" },
  { title: "Quiet Planet", year: 2023, genre: "Animation", rating: 88, tagline: "Small world, big silence.", synopsis: "A tiny robot on a forgotten moon learns to talk by listening to the wind.", color: "#7bc96f" },
  { title: "The Glass Detective", year: 1952, genre: "Mystery", rating: 77, tagline: "Every clue leaves a reflection.", synopsis: "A window cleaner sees a little too much from the forty-second floor.", color: "#8fa3b8" },
  { title: "Velvet Engine", year: 2008, genre: "Action", rating: 63, tagline: "Faster than the ending.", synopsis: "A getaway driver takes one last job and keeps missing the exit.", color: "#9b3df0" },
  { title: "Salt & Ember", year: 2015, genre: "Fantasy", rating: 81, tagline: "Two kingdoms. One spark.", synopsis: "A salt miner and a fire priestess share a secret that could end a hundred-year war.", color: "#ff5a36" },
  { title: "Northbound", year: 1999, genre: "Adventure", rating: 76, tagline: "Keep the compass close.", synopsis: "Three siblings drive their late father's van to the Arctic Circle to scatter a map, not ashes.", color: "#3fb6e0" },
  { title: "Hollow Hours", year: 2021, genre: "Horror", rating: 70, tagline: "The clock stopped. They didn't.", synopsis: "A night-shift crew notices the building has an extra floor between three and four in the morning.", color: "#5e5a73" },
  { title: "Small Fortunes", year: 2013, genre: "Drama", rating: 84, tagline: "Luck is a family business.", synopsis: "A cookie factory family writes every fortune by hand, until one starts coming true.", color: "#e9a23b" },
  { title: "Neon Tide", year: 1989, genre: "Crime", rating: 73, tagline: "The city never sleeps. Neither does she.", synopsis: "A harbour cop chases a smuggler who only works when the boardwalk lights are on.", color: "#ff3d9a" },
  { title: "The Long Weekend", year: 2006, genre: "Comedy", rating: 66, tagline: "Three days. Zero plans.", synopsis: "Old friends rent a cabin with no signal and run out of excuses by Saturday.", color: "#58c4a7" },
  { title: "Echo Valley", year: 2017, genre: "Documentary", rating: 90, tagline: "Listen to where you live.", synopsis: "A sound recordist spends a year capturing a valley before the dam fills it.", color: "#6d8b4a" },
];

const TILE = { sm: 64, md: 88, lg: 120 };
const FEEL = {
  snappy: { rate: 18, throw: 0.08 },
  smooth: { rate: 9, throw: 0.18 },
  floaty: { rate: 4, throw: 0.36 },
};
const HALF_PI = Math.PI / 2;
const DEAD_ZONE = 0.35;

type Origin = { x: number; y: number; w: number; h: number } | null;

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReduced(onChange: () => void) {
  const query = window.matchMedia(REDUCE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function movieAt(gx: number, gy: number, n: number) {
  const stride = Math.max(1, Math.floor(n / 2) - 1);
  return (((gx + gy * stride) % n) + n) % n;
}

export function PosterSphere({
  movies = DEFAULT_MOVIES,
  size = "md",
  smoothness = "smooth",
  movement = "drag",
  className,
  style,
  ...props
}: PosterSphereProps) {
  const reduced = useSyncExternalStore(subscribeReduced, () => window.matchMedia(REDUCE_QUERY).matches, () => false);
  const rootRef = useRef<HTMLDivElement>(null);
  const tilesRef = useRef<(HTMLDivElement | null)[]>([]);
  const slotsRef = useRef<number[]>([]);
  const [slots, setSlots] = useState<number[]>([]);
  const [grid, setGrid] = useState({ cols: 0, rows: 0 });
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState<{ index: number; origin: Origin } | null>(null);

  const tileW = TILE[size];
  const tileH = tileW * 1.5;
  const s = useRef({
    x: 0, y: 0, tx: 0, ty: 0, vx: 0, vy: 0,
    w: 0, h: 0, radius: 1, cellX: 1, cellY: 1, cols: 0, rows: 0,
    raf: 0, last: 0, moveAt: 0,
    drag: null as null | { id: number; px: number; py: number; tx: number; ty: number; moved: boolean; tile: number },
    pointer: { x: 0, y: 0, inside: false },
  }).current;
  const cfg = useRef({ movies, reduced, movement, smoothness, open: false });
  useLayoutEffect(() => {
    cfg.current = { movies, reduced, movement, smoothness, open: open !== null };
  });

  const layout = () => {
    const { cols, rows, cellX, cellY, radius } = s;
    const n = cfg.current.movies.length;
    if (!cols || !n) return;
    const W = cols * cellX;
    const H = rows * cellY;
    let next: number[] | null = null;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const ux = c * cellX + s.x;
        const uy = r * cellY + s.y;
        const wx = Math.round(ux / W);
        const wy = Math.round(uy / H);
        const px = ux - wx * W;
        const py = uy - wy * H;
        const m = movieAt(c - wx * cols, r - wy * rows, n);
        if (slotsRef.current[i] !== m) (next ??= slotsRef.current.slice())[i] = m;
        const el = tilesRef.current[i];
        if (!el) continue;
        const d = Math.hypot(px, py);
        const th = d / radius;
        if (th >= HALF_PI) {
          el.style.visibility = "hidden";
          continue;
        }
        // orthographic sphere: radial edge squashes by cos, tangential by sin/θ
        const tan = th < 1e-4 ? 1 : Math.sin(th) / th;
        const boost = 1 + 0.2 * Math.exp((-2 * d * d) / (cellX * cellX));
        const phi = Math.atan2(py, px);
        el.style.visibility = "";
        el.style.opacity = String(Math.min(1, (HALF_PI - th) / 0.7));
        el.style.transform = `translate3d(${px * tan}px,${py * tan}px,0) rotate(${phi}rad) scale(${Math.cos(th) * boost},${tan * boost}) rotate(${-phi}rad)`;
      }
    }
    if (next) {
      slotsRef.current = next;
      setSlots(next);
    }
    setActive(targetMovie());
  };

  const targetMovie = () =>
    movieAt(Math.round(-s.tx / s.cellX), Math.round(-s.ty / s.cellY), cfg.current.movies.length);

  const snap = () => {
    s.tx = Math.round(s.tx / s.cellX) * s.cellX;
    s.ty = Math.round(s.ty / s.cellY) * s.cellY;
  };

  const steering = () => {
    const c = cfg.current;
    if (c.movement !== "hover" || c.reduced || c.open || s.drag || !s.pointer.inside) return null;
    const nx = (s.pointer.x - s.w / 2) / (s.w / 2);
    const ny = (s.pointer.y - s.h / 2) / (s.h / 2);
    const len = Math.hypot(nx, ny);
    const strength = Math.min(1, Math.max(0, (len - DEAD_ZONE) / (1 - DEAD_ZONE)));
    return strength ? { x: (nx / len) * strength, y: (ny / len) * strength } : null;
  };

  const tick = (now: number) => {
    const dt = Math.min(0.05, (now - s.last) / 1000);
    s.last = now;
    const steer = steering();
    if (steer) {
      const speed = s.cellX * 5;
      s.tx -= steer.x * speed * dt;
      s.ty -= steer.y * speed * dt;
    } else if (!s.drag && cfg.current.movement === "hover" && s.pointer.inside) snap();
    const k = cfg.current.reduced ? 1 : 1 - Math.exp(-FEEL[cfg.current.smoothness].rate * dt);
    s.x += (s.tx - s.x) * k;
    s.y += (s.ty - s.y) * k;
    const settled = Math.abs(s.tx - s.x) < 0.1 && Math.abs(s.ty - s.y) < 0.1;
    if (settled) {
      s.x = s.tx;
      s.y = s.ty;
    }
    layout();
    s.raf = settled && !steer && !s.drag ? 0 : requestAnimationFrame(tick);
  };

  const kick = () => {
    if (s.raf) return;
    s.last = performance.now();
    s.raf = requestAnimationFrame(tick);
  };

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      s.w = width;
      s.h = height;
      s.radius = Math.max(1, Math.min(width, height) * 0.48);
      s.cellX = tileW * 1.12;
      s.cellY = tileH + tileW * 0.12;
      // the wrap seam must sit past the sphere's back so swapped posters are never seen
      s.cols = Math.ceil((s.radius * Math.PI) / s.cellX) + 2;
      s.rows = Math.ceil((s.radius * Math.PI) / s.cellY) + 2;
      snap();
      s.x = s.tx;
      s.y = s.ty;
      setGrid((g) => (g.cols === s.cols && g.rows === s.rows ? g : { cols: s.cols, rows: s.rows }));
      layout();
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(s.raf);
      s.raf = 0;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tileW, tileH]);

  useLayoutEffect(() => {
    slotsRef.current = [];
    layout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid, movies]);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const tile = (e.target as HTMLElement).closest<HTMLElement>("[data-tile]");
    s.drag = { id: e.pointerId, px: e.clientX, py: e.clientY, tx: s.tx, ty: s.ty, moved: false, tile: tile ? Number(tile.dataset.tile) : -1 };
    s.vx = s.vy = 0;
    s.moveAt = e.timeStamp;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (e.pointerType === "mouse") s.pointer = { x: e.clientX - rect.left, y: e.clientY - rect.top, inside: true };
    const d = s.drag;
    if (d && d.id === e.pointerId) {
      const dx = e.clientX - d.px;
      const dy = e.clientY - d.py;
      if (Math.hypot(dx, dy) > 6) d.moved = true;
      const now = e.timeStamp;
      const dt = Math.max(1, now - s.moveAt) / 1000;
      const nx = d.tx + dx;
      const ny = d.ty + dy;
      s.vx = 0.8 * ((nx - s.tx) / dt) + 0.2 * s.vx;
      s.vy = 0.8 * ((ny - s.ty) / dt) + 0.2 * s.vy;
      s.moveAt = now;
      s.tx = nx;
      s.ty = ny;
    }
    if (d || cfg.current.movement === "hover") kick();
  };

  const endDrag = (e: PointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const d = s.drag;
    if (!d || d.id !== e.pointerId) return;
    s.drag = null;
    if (!d.moved && !cancelled && d.tile >= 0) {
      openTile(tilesRef.current[d.tile]);
      return;
    }
    if (!cfg.current.reduced && e.timeStamp - s.moveAt < 80) {
      const t = FEEL[cfg.current.smoothness].throw;
      s.tx += s.vx * t;
      s.ty += s.vy * t;
    }
    snap();
    kick();
  };

  const openTile = (el: HTMLElement | null | undefined, index?: number) => {
    if (!el) return;
    const idx = index ?? slotsRef.current[Number(el.dataset.tile)];
    const r = el.getBoundingClientRect();
    s.pointer.inside = false;
    setOpen({ index: idx, origin: { x: r.left, y: r.top, w: r.width, h: r.height } });
  };

  const centerTile = () => {
    const root = rootRef.current?.getBoundingClientRect();
    if (!root) return null;
    let best: HTMLElement | null = null;
    let bestD = Infinity;
    for (const el of tilesRef.current) {
      if (!el || el.style.visibility === "hidden") continue;
      const r = el.getBoundingClientRect();
      const d = Math.hypot(r.left + r.width / 2 - root.left - root.width / 2, r.top + r.height / 2 - root.top - root.height / 2);
      if (d < bestD) {
        bestD = d;
        best = el;
      }
    }
    return best;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowLeft: [1, 0], ArrowRight: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[e.key];
    if (step) {
      e.preventDefault();
      snap();
      s.tx += step[0] * s.cellX;
      s.ty += step[1] * s.cellY;
      kick();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      // the target, not the poster mid-glide under the centre
      openTile(centerTile(), targetMovie());
    }
  };

  const current = movies[active];
  const count = grid.cols * grid.rows;

  return (
    <MotionConfig reducedMotion="user">
      <div
        ref={rootRef}
        data-slot="poster-sphere"
        tabIndex={0}
        role="group"
        aria-roledescription="poster sphere"
        aria-label="Movies. Use the arrow keys to browse and Enter to open the centred movie."
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => endDrag(e, false)}
        onPointerCancel={(e) => endDrag(e, true)}
        onPointerLeave={() => {
          s.pointer.inside = false;
          if (!s.drag) {
            snap();
            kick();
          }
        }}
        onKeyDown={onKeyDown}
        className={cn(
          "relative isolate cursor-grab touch-none overflow-hidden bg-background text-foreground outline-none select-none active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
        style={{ ...style, "--tile-w": `${tileW}px`, "--tile-h": `${tileH}px` } as CSSProperties}
        {...props}
      >
        <div aria-hidden className="absolute inset-0">
          {Array.from({ length: count }, (_, i) => {
            const movie = movies[slots[i]];
            return (
              <div
                key={i}
                ref={(el) => {
                  tilesRef.current[i] = el;
                }}
                data-tile={i}
                style={{ visibility: "hidden" }}
                className="absolute top-1/2 left-1/2 -mt-[calc(var(--tile-h)/2)] -ml-[calc(var(--tile-w)/2)] h-(--tile-h) w-(--tile-w) overflow-hidden rounded-[14%/9%] will-change-transform"
              >
                {movie && <Poster movie={movie} />}
              </div>
            );
          })}
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_45%,var(--color-background)_80%)]" />
        {current && (
          <div aria-live="polite" className="pointer-events-none absolute top-0 left-0 max-w-[min(26rem,80%)] p-5 sm:p-7">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <p className="text-xs text-muted-foreground">{current.tagline}</p>
                <h3 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
                  {current.title} <span className="font-normal text-muted-foreground">({current.year})</span>
                </h3>
                <div className="mt-2 flex items-center gap-3">
                  <span className="rounded-full bg-foreground px-2 py-0.5 text-[11px] font-medium text-background">{current.genre}</span>
                  <Rating value={current.rating} className="size-9" />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>
      <AnimatePresence>
        {open && movies[open.index] && (
          <MovieModal
            key="modal"
            movie={movies[open.index]}
            origin={reduced ? null : open.origin}
            onClose={() => setOpen(null)}
            onClosed={() => rootRef.current?.focus({ preventScroll: true })}
          />
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}

function Poster({ movie }: { movie: PosterMovie }) {
  if (movie.poster)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={movie.poster} alt="" loading="lazy" decoding="async" draggable={false} className="size-full object-cover" />;
  return (
    <div
      className="@container flex size-full flex-col justify-end p-[8%] text-white"
      style={{ background: `linear-gradient(160deg, ${movie.color}, color-mix(in oklab, ${movie.color} 25%, black))` }}
    >
      <span className="text-[13cqw] leading-none font-black tracking-tight uppercase">{movie.title}</span>
      <span className="mt-[4%] text-[8cqw] opacity-70">{movie.year}</span>
    </div>
  );
}

function Rating({ value, className }: { value: number; className?: string }) {
  const r = 15.5;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 36 36" className={className} role="img" aria-label={`Rated ${value} out of 100`}>
      <circle cx="18" cy="18" r={r} fill="none" stroke="currentColor" strokeOpacity={0.2} strokeWidth="3" />
      <circle cx="18" cy="18" r={r} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${(value / 100) * c} ${c}`} transform="rotate(-90 18 18)" />
      <text x="18" y="22" textAnchor="middle" fontSize="11" fontWeight="600" fill="currentColor">{value}</text>
    </svg>
  );
}

function MovieModal({
  movie,
  origin,
  onClose,
  onClosed,
}: {
  movie: PosterMovie;
  origin: Origin;
  onClose: () => void;
  onClosed: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const posterRef = useRef<HTMLDivElement>(null);
  const fly = useRef({ x: 0, y: 0, scale: 1 });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    const html = document.documentElement;
    const prev = { overflow: html.style.overflow, paddingRight: html.style.paddingRight };
    const bar = window.innerWidth - html.clientWidth;
    html.style.overflow = "hidden";
    if (bar > 0) html.style.paddingRight = `${bar}px`;
    return () => {
      html.style.overflow = prev.overflow;
      html.style.paddingRight = prev.paddingRight;
      onClosed();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    const el = posterRef.current;
    if (!el || !origin) return;
    const r = el.getBoundingClientRect();
    fly.current = {
      x: origin.x + origin.w / 2 - (r.left + r.width / 2),
      y: origin.y + origin.h / 2 - (r.top + r.height / 2),
      scale: origin.w / r.width,
    };
    animate(el, { x: [fly.current.x, 0], y: [fly.current.y, 0], scale: [fly.current.scale, 1] }, { type: "spring", duration: 0.6, bounce: 0.15 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.dialog
      ref={dialogRef}
      aria-label={movie.title}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      exit={{ pointerEvents: "none" }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-y-auto overscroll-contain bg-transparent p-0 text-white backdrop:bg-transparent"
    >
      <motion.div
        aria-hidden
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 bg-black/90"
      />
      <div className="pointer-events-none relative flex min-h-full flex-col items-center justify-center gap-8 p-6 sm:flex-row sm:gap-12 sm:p-12">
        <motion.div
          ref={posterRef}
          variants={{ out: () => ({ ...fly.current, opacity: origin ? 1 : 0 }) }}
          initial={origin ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit="out"
          transition={{ type: "spring", duration: 0.5, bounce: 0.1 }}
          className="pointer-events-auto aspect-2/3 w-[min(70vw,calc(60dvh/1.5),22rem)] shrink-0 overflow-hidden rounded-[6%/4%] shadow-2xl"
        >
          <Poster movie={movie} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.15, duration: 0.3 } }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          className="pointer-events-auto w-full max-w-md"
        >
          <p className="text-sm text-white/60">{movie.tagline}</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            {movie.title} <span className="font-normal text-white/50">({movie.year})</span>
          </h2>
          <div className="mt-4 flex items-center gap-3">
            <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-black">{movie.genre}</span>
            <Rating value={movie.rating} className="size-11" />
          </div>
          <p className="mt-5 text-base leading-relaxed text-white/80">{movie.synopsis}</p>
          <button
            type="button"
            autoFocus
            onClick={onClose}
            className="mt-8 rounded-full border border-white/25 px-5 py-2 text-sm font-medium transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          >
            Close
          </button>
        </motion.div>
      </div>
    </motion.dialog>
  );
}
