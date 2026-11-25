"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type PasskeyStatus = "idle" | "scanning" | "verified" | "error";

export type PasskeyButtonProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onError"
> & {
  onVerify?: () => unknown;
  status?: PasskeyStatus;
  onStatusChange?: (status: PasskeyStatus) => void;
  labels?: Partial<Record<PasskeyStatus, string>>;
  errorMessage?: React.ReactNode;
  variant?: "surface" | "primary" | "outline";
  size?: "default" | "lg";
  fullWidth?: boolean;
  resetAfter?: number;
  disabled?: boolean;
};

type Rgb = [number, number, number];

const LABELS: Record<PasskeyStatus, string> = {
  idle: "Sign in with passkey",
  scanning: "Verifying passkey",
  verified: "Verified",
  error: "Try again",
};

const EASE = "ease-[cubic-bezier(0.16,1,0.3,1)]";
const VERIFY_LIFE = 0.64;
const ERROR_LIFE = 0.42;

function point(r: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  return [12 + r * Math.cos(a), 13 + r * Math.sin(a)];
}

function ridge(r: number, from: number, to: number) {
  const [x0, y0] = point(r, from);
  const [x1, y1] = point(r, to);
  const large = to - from > 180 ? 1 : 0;
  return {
    d: `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`,
    y: (13 - r * 0.7) / 24,
  };
}

const RIDGES = [
  ridge(9.5, 205, 335),
  ridge(7, 175, 330),
  ridge(7, 345, 372),
  ridge(4.5, 160, 380),
  ridge(2, 190, 350),
  { d: "M12 13v6.5", y: 0.68 },
  { d: "M7.5 19.4q1.6 1.2 3.2 1.4", y: 0.82 },
  { d: "M16.5 19.4q-.8.7-1.7 1.1", y: 0.82 },
];

const MINUTIAE = [point(4.5, 270), point(7, 200), point(7, 320), [12, 13]].map(
  ([x, y]) => ({ x, y, v: y / 24 }),
);

// standard 8x8 ordered dither thresholds, normalised to (0, 1)
const BAYER = (() => {
  const out = new Float32Array(64);
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      let v = 0;
      for (let bit = 0, xc = x ^ y, yc = y; bit < 3; bit++) {
        v = (v << 2) | (((xc >> bit) & 1) << 1) | ((yc >> bit) & 1);
      }
      out[y * 8 + x] = (v + 0.5) / 64;
    }
  }
  return out;
})();

const PALETTES: Record<
  "primary" | "light" | "dark",
  (accent: Rgb) => { scan: [Rgb, Rgb]; verify: [Rgb, Rgb]; error: Rgb; alpha: number }
> = {
  primary: () => ({
    scan: [[186, 230, 253], [255, 255, 255]],
    verify: [[167, 243, 208], [255, 255, 255]],
    error: [254, 202, 202],
    alpha: 0.4,
  }),
  light: (accent) => ({
    scan: [accent, [14, 165, 233]],
    verify: [[5, 150, 105], [16, 185, 129]],
    error: [220, 38, 38],
    alpha: 0.26,
  }),
  dark: () => ({
    scan: [[56, 189, 248], [129, 140, 248]],
    verify: [[52, 211, 153], [209, 250, 229]],
    error: [248, 113, 113],
    alpha: 0.42,
  }),
};

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const mix = (a: Rgb, b: Rgb, t: number): Rgb => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

let swatch: CanvasRenderingContext2D | null = null;
function toRgb(color: string): Rgb {
  swatch ??= document
    .createElement("canvas")
    .getContext("2d", { willReadFrequently: true });
  if (!swatch) return [128, 128, 128];
  swatch.clearRect(0, 0, 1, 1);
  swatch.fillStyle = "#808080";
  swatch.fillStyle = color;
  swatch.fillRect(0, 0, 1, 1);
  const [r, g, b] = swatch.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}

const REDUCED = "(prefers-reduced-motion: reduce)";

function subscribeReduced(onChange: () => void) {
  const query = window.matchMedia(REDUCED);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function useReducedMotion() {
  return React.useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED).matches,
    () => false,
  );
}

export function PasskeyButton({
  onVerify,
  status: controlled,
  onStatusChange,
  labels: labelOverrides,
  errorMessage,
  variant = "surface",
  size = "default",
  fullWidth = false,
  resetAfter = 0,
  disabled = false,
  className,
  ...props
}: PasskeyButtonProps) {
  const reduced = useReducedMotion();
  const [own, setOwn] = React.useState<PasskeyStatus>("idle");
  const [caught, setCaught] = React.useState<string | null>(null);
  const status = controlled ?? own;
  const labels = { ...LABELS, ...labelOverrides };

  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const wellRef = React.useRef<HTMLSpanElement>(null);
  const beamRef = React.useRef<SVGGElement>(null);
  const labelRef = React.useRef<HTMLSpanElement>(null);
  const ridgeRefs = React.useRef<(SVGPathElement | null)[]>([]);
  const dotRefs = React.useRef<(SVGCircleElement | null)[]>([]);
  const statusRef = React.useRef(status);
  const variantRef = React.useRef(variant);
  const reducedRef = React.useRef(reduced);
  const kickRef = React.useRef<(prev: PasskeyStatus) => void>(() => {});
  const prevRef = React.useRef(status);
  const alive = React.useRef(true);
  const clipId = React.useId();

  const setStatus = (next: PasskeyStatus) => {
    if (controlled === undefined) setOwn(next);
    onStatusChange?.(next);
  };

  React.useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const grid = document.createElement("canvas");
    const gctx = grid.getContext("2d");
    if (!canvas || !ctx || !gctx) return;

    let img: ImageData | null = null;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let wellU = 0.1;
    let palette = PALETTES.dark([56, 132, 255]);
    let time = 0;
    let sw = statusRef.current === "scanning" ? 1 : 0;
    let burst: "verify" | "error" | null = null;
    let age = 0;
    let frame = 0;
    let last = 0;

    const theme = () => {
      const button = canvas.parentElement!;
      const style = getComputedStyle(button);
      const [r, g, b] = toRgb(style.color);
      const lightSurface = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.52;
      const accent = toRgb(style.getPropertyValue("--primary").trim() || "#3884ff");
      const key =
        variantRef.current === "primary" ? "primary" : lightSurface ? "light" : "dark";
      palette = PALETTES[key](accent);
    };

    const draw = (dt: number) => {
      time += dt;
      const target = statusRef.current === "scanning" ? 1 : 0;
      sw += (target - sw) * (1 - Math.exp(-dt * 9));
      if (Math.abs(target - sw) < 0.004) sw = target;
      if (burst) {
        age += dt;
        if (age >= (burst === "verify" ? VERIFY_LIFE : ERROR_LIFE)) burst = null;
      }

      const scanY = 0.52 - 0.36 * Math.cos(time * 4.5);
      const beam = beamRef.current;
      if (beam) {
        beam.style.opacity = sw > 0.02 ? sw.toFixed(2) : "0";
        beam.style.transform = `translateY(${(scanY * 24 - 12).toFixed(2)}px)`;
      }
      RIDGES.forEach(({ y }, i) => {
        const el = ridgeRefs.current[i];
        if (!el) return;
        const lit = 0.14 + 0.86 * Math.exp(-((y - scanY) ** 2) / 0.024) * sw;
        el.style.opacity = sw > 0.02 ? lit.toFixed(2) : "0";
      });
      MINUTIAE.forEach(({ v }, i) => {
        const el = dotRefs.current[i];
        if (!el) return;
        el.style.opacity = (Math.exp(-((v - scanY) ** 2) / 0.014) * sw).toFixed(2);
      });

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (w > 0 && h > 0 && (sw > 0.008 || burst)) {
        const cols = Math.ceil(w / 2);
        const rows = Math.ceil(h / 2);
        if (!img || img.width !== cols || img.height !== rows) {
          grid.width = cols;
          grid.height = rows;
          img = gctx.createImageData(cols, rows);
        }
        const data = img.data;
        data.fill(0);

        const { scan, verify, error, alpha } = palette;
        const scanU = wellU + ((time * 0.72) % 1.24) - 0.12;
        const k = burst ? age / (burst === "verify" ? VERIFY_LIFE : ERROR_LIFE) : 0;
        const verifyFront = wellU + (1 - (1 - k) ** 2.3) * 1.12;
        const verifyFade = Math.sin(Math.PI * k ** 0.72);
        const errorFront = wellU + (0.65 - wellU) * (1 - k) ** 1.8;
        const errorFade = Math.sin(Math.PI * k ** 0.6);

        for (let r = 0; r < rows; r++) {
          const v = (r + 0.5) / rows;
          const edge = Math.sin(Math.PI * v);
          for (let c = 0; c < cols; c++) {
            const u = (c + 0.5) / cols;
            let energy = 0;
            let color = scan[0];

            if (sw > 0.008) {
              const aura = Math.exp(-((u - wellU) ** 2) / 0.022) * 0.52;
              const d = u - scanU;
              const band = Math.exp(-(d * d) / 0.026) * 0.72;
              const wake = d < 0 ? Math.exp(d / 0.18) * 0.28 : 0;
              energy = (aura + (band + wake) * (0.45 + 0.55 * edge)) * sw;
              color = mix(scan[0], scan[1], clamp01(band * 1.1));
            }
            if (burst === "verify") {
              const d = u - verifyFront;
              const lead = Math.exp(-(d * d) / 0.014);
              const tail = d < 0 ? Math.exp(d / 0.22) * 0.78 : 0;
              const e = (lead + tail) * verifyFade * (0.55 + 0.45 * edge);
              if (e > energy) {
                energy = e;
                color = mix(verify[0], verify[1], clamp01(lead * 0.9));
              }
            } else if (burst === "error") {
              const d = u - errorFront;
              const e = Math.exp(-(d * d) / 0.045) * errorFade * (0.5 + 0.5 * edge);
              if (e > energy) {
                energy = e;
                color = error;
              }
            }

            if (energy <= 0.04) continue;
            const hit = clamp01((energy - BAYER[((r & 7) << 3) | (c & 7)] + 0.04) / 0.09);
            if (hit <= 0.02) continue;
            const i = (r * cols + c) * 4;
            data[i] = color[0];
            data[i + 1] = color[1];
            data[i + 2] = color[2];
            data[i + 3] = hit * alpha * 255;
          }
        }

        gctx.putImageData(img, 0, 0);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(grid, 0, 0, cols * 2 * dpr, rows * 2 * dpr);
      }

      return statusRef.current === "scanning" || sw > 0 || burst !== null;
    };

    const tick = (now: number) => {
      const dt = last ? Math.min(1 / 24, (now - last) / 1000) : 1 / 60;
      last = now;
      frame = !reducedRef.current && draw(dt) ? requestAnimationFrame(tick) : 0;
    };

    kickRef.current = (prev) => {
      const next = statusRef.current;
      if (reducedRef.current) {
        burst = null;
        sw = next === "scanning" ? 1 : 0;
        time = 0.5;
        draw(0);
        return;
      }
      if (next === "verified" && prev !== "verified") [burst, age] = ["verify", 0];
      else if (next === "error" && prev !== "error") [burst, age] = ["error", 0];
      else if (next === "scanning") [burst, time] = [null, 0];
      if (!frame) {
        last = 0;
        frame = requestAnimationFrame(tick);
      }
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const well = wellRef.current?.getBoundingClientRect();
      w = Math.round(rect.width);
      h = Math.round(rect.height);
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      if (well && w > 0) wellU = (well.left + well.width / 2 - rect.left) / w;
      theme();
      draw(0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const mo = new MutationObserver(() => {
      theme();
      draw(0);
    });
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style", "data-theme"],
    });

    return () => {
      ro.disconnect();
      mo.disconnect();
      cancelAnimationFrame(frame);
      kickRef.current = () => {};
    };
  }, []);

  React.useEffect(() => {
    statusRef.current = status;
    variantRef.current = variant;
    reducedRef.current = reduced;
    const prev = prevRef.current;
    prevRef.current = status;
    kickRef.current(prev);
    if (prev === status || reduced) return;
    labelRef.current?.animate(
      [
        { opacity: 0, filter: "blur(3px)", transform: "translateY(4px)" },
        { opacity: 1, filter: "blur(0px)", transform: "none" },
      ],
      { duration: 260, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
    );
    if (status === "error") {
      buttonRef.current?.animate(
        [
          { transform: "none" },
          { transform: "translateX(-4.5px)" },
          { transform: "translateX(4px)" },
          { transform: "translateX(-2px)" },
          { transform: "translateX(1px)" },
          { transform: "none" },
        ],
        { duration: 360, easing: "ease-out" },
      );
    }
  }, [status, variant, reduced]);

  React.useEffect(() => {
    if (status !== "verified" || resetAfter <= 0) return;
    const timer = window.setTimeout(() => {
      if (controlled === undefined) setOwn("idle");
      onStatusChange?.("idle");
    }, resetAfter);
    return () => window.clearTimeout(timer);
  }, [status, resetAfter, controlled, onStatusChange]);

  const scanning = status === "scanning";
  const verified = status === "verified";
  const failed = status === "error";
  const shownError = failed ? (errorMessage ?? caught) : null;
  const primary = variant === "primary";

  const handleClick = () => {
    if (disabled || scanning) return;
    if (verified && controlled === undefined) return setStatus("idle");
    if (!onVerify) return;
    setCaught(null);
    let result: unknown;
    try {
      result = onVerify();
    } catch (err) {
      result = Promise.reject(err);
    }
    if (!(result instanceof Promise)) return setStatus("verified");
    setStatus("scanning");
    result.then(
      () => alive.current && setStatus("verified"),
      (err: unknown) => {
        if (!alive.current) return;
        setCaught(
          err instanceof Error && err.message
            ? err.message
            : "Passkey verification was cancelled.",
        );
        setStatus("error");
      },
    );
  };

  return (
    <div
      data-slot="passkey-button"
      className={cn(
        "inline-flex flex-col",
        fullWidth ? "w-full" : "w-fit max-w-full items-center",
        className,
      )}
      {...props}
    >
      <button
        ref={buttonRef}
        type="button"
        data-status={status}
        disabled={disabled}
        aria-busy={scanning || undefined}
        onClick={handleClick}
        className={cn(
          "group relative isolate inline-flex cursor-pointer items-center overflow-clip rounded-full border font-medium select-none",
          "transition-[background-color,color,scale] duration-200 active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100",
          "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
          "disabled:cursor-default disabled:opacity-45",
          EASE,
          size === "lg"
            ? "h-[54px] gap-3.5 pr-6 pl-2.5 text-[15px]"
            : "h-[46px] gap-3 pr-5 pl-2 text-sm",
          fullWidth && "w-full justify-center",
          primary
            ? "border-transparent bg-primary text-primary-foreground hover:bg-primary/90"
            : variant === "outline"
              ? "border-border bg-background text-foreground hover:bg-accent/60"
              : "border-border bg-card text-card-foreground shadow-[inset_0_0.5px_0_rgb(255_255_255/0.8)] hover:bg-accent/45 dark:shadow-[inset_0_0.5px_0_rgb(255_255_255/0.07)]",
        )}
      >
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 size-full"
        />

        <span
          ref={wellRef}
          aria-hidden="true"
          className={cn(
            "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border transition-[background-color,border-color,color] duration-300",
            size === "lg" ? "size-9" : "size-8",
            verified
              ? primary
                ? "border-white/30 bg-white/20 text-white"
                : "border-transparent bg-emerald-600 text-white dark:bg-emerald-500"
              : failed
                ? primary
                  ? "border-red-200/45 bg-red-500/35 text-white"
                  : "border-red-500/35 bg-red-500/12 text-red-600 dark:text-red-400"
                : primary
                  ? "border-white/20 bg-white/14 text-primary-foreground"
                  : "border-border bg-muted text-foreground",
          )}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className={cn(
              "absolute inset-0 m-auto size-5 transition-[scale,opacity] duration-300 motion-reduce:transition-none",
              EASE,
              verified
                ? "scale-[0.68] opacity-0"
                : scanning
                  ? "scale-[1.03]"
                  : "group-hover:scale-[1.02]",
            )}
          >
            <defs>
              <clipPath id={clipId}>
                <circle cx="12" cy="12" r="9.5" />
              </clipPath>
              <linearGradient id={`${clipId}-beam`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
                <stop offset="50%" stopColor="currentColor" stopOpacity="0.65" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            </defs>

            <g
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              className={cn(
                "transition-opacity duration-200",
                failed
                  ? "opacity-85"
                  : scanning
                    ? "opacity-25"
                    : "opacity-60 group-hover:opacity-90",
              )}
            >
              {RIDGES.map(({ d }, i) => (
                <path
                  key={d}
                  d={d}
                  pathLength={1}
                  strokeDasharray={1}
                  className={cn(
                    "transition-[stroke-dashoffset] duration-300 motion-reduce:transition-none",
                    EASE,
                  )}
                  style={{
                    strokeDashoffset: verified ? 1 : 0,
                    transitionDelay: verified ? `${i * 12}ms` : "0ms",
                  }}
                />
              ))}
            </g>

            <g
              stroke={primary ? "#ffffff" : "var(--primary)"}
              strokeWidth="1.65"
              strokeLinecap="round"
            >
              {RIDGES.map(({ d }, i) => (
                <path
                  key={d}
                  ref={(el) => {
                    ridgeRefs.current[i] = el;
                  }}
                  d={d}
                  opacity={0}
                />
              ))}
            </g>

            <g fill={primary ? "#e0f2fe" : "#0ea5e9"}>
              {MINUTIAE.map(({ x, y }, i) => (
                <circle
                  key={`${x}-${y}`}
                  ref={(el) => {
                    dotRefs.current[i] = el;
                  }}
                  cx={x}
                  cy={y}
                  r={1}
                  opacity={0}
                />
              ))}
            </g>

            <g
              clipPath={`url(#${clipId})`}
              className={primary ? "text-sky-200" : "text-primary"}
            >
              <g ref={beamRef} opacity={0}>
                <rect x="2" y="8.4" width="20" height="7.2" fill={`url(#${clipId}-beam)`} opacity={0.5} />
                <line x1="2.5" x2="21.5" y1="12" y2="12" stroke="currentColor" strokeWidth="1.15" />
              </g>
            </g>
          </svg>

          <svg
            viewBox="0 0 18 18"
            fill="none"
            className={cn(
              "absolute inset-0 m-auto size-4 transition-[scale,opacity] duration-300 motion-reduce:transition-none",
              EASE,
              verified ? "scale-100 opacity-100 delay-75" : "scale-[0.65] opacity-0",
            )}
          >
            <path
              d="M3.75 9.35 7.25 12.85 14.25 5.4"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={1}
              className={cn(
                verified && "transition-[stroke-dashoffset] delay-100 duration-[360ms] motion-reduce:transition-none",
                EASE,
              )}
              style={{ strokeDashoffset: verified ? 0 : 1 }}
            />
          </svg>
        </span>

        <span
          ref={labelRef}
          className="relative whitespace-nowrap tracking-[-0.01em]"
        >
          {labels[status]}
        </span>
      </button>

      <div
        aria-hidden={!shownError || undefined}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 motion-reduce:transition-none",
          EASE,
          shownError
            ? "grid-rows-[1fr] opacity-100"
            : "pointer-events-none grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <p className="max-w-[300px] pt-2 text-center text-[12.5px] leading-5 text-red-600 dark:text-red-400">
            {shownError}
          </p>
        </div>
      </div>

      <span className="sr-only" role="status" aria-live="polite">
        {scanning || verified || failed ? labels[status] : ""}
      </span>
    </div>
  );
}
