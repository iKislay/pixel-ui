"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, LoaderCircle, Lock } from "lucide-react";
import useMeasure from "react-use-measure";
import { cn } from "@/lib/utils";

type Phase = "idle" | "input" | "verifying" | "error" | "success";

export type OtpInputProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onChange"
> & {
  length?: number;
  label?: string;
  onVerify?: (code: string) => boolean | Promise<boolean>;
};

const MORPH = { type: "spring", stiffness: 420, damping: 34 } as const;
const SNAP = { type: "spring", stiffness: 700, damping: 40 } as const;
const INSTANT = { duration: 0 } as const;
const FADE = { duration: 0.22, ease: "easeOut" } as const;
const ERROR_HOLD = 700;
const ERROR_CLEAR = 450;

export function OtpInput({
  length = 6,
  label = "Enter code",
  onVerify,
  className,
  ...props
}: OtpInputProps) {
  const reduce = useReducedMotion();
  const ringId = React.useId();
  const [ref, bounds] = useMeasure();
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [code, setCode] = React.useState("");
  const [focused, setFocused] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([]);

  React.useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const later = (fn: () => void, ms: number) =>
    timers.current.push(setTimeout(fn, ms));

  const verify = async (value: string) => {
    setPhase("verifying");
    let ok = false;
    try {
      ok = onVerify ? await onVerify(value) : true;
    } catch {}
    if (ok) return setPhase("success");
    setPhase("error");
    later(() => setCode(""), ERROR_HOLD);
    later(() => {
      setPhase("input");
      inputRef.current?.focus();
    }, ERROR_HOLD + ERROR_CLEAR);
  };

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value.replace(/\D/g, "").slice(0, length);
    setCode(next);
    if (next.length === length) void verify(next);
  };

  const blur = reduce ? "blur(0px)" : "blur(6px)";
  const swap = {
    initial: { opacity: 0, scale: reduce ? 1 : 0.92, filter: blur },
    animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
    exit: { opacity: 0, scale: reduce ? 1 : 0.92, filter: blur },
    transition: reduce ? INSTANT : FADE,
  } as const;

  const view =
    phase === "idle"
      ? "idle"
      : phase === "input" || phase === "error"
        ? "slots"
        : "status";
  const error = phase === "error";
  const active = Math.min(code.length, length - 1);

  return (
    <div
      data-slot="otp-input"
      className={cn("inline-flex", className)}
      {...props}
    >
      <motion.div
        initial={false}
        animate={{ width: bounds.width ? bounds.width + 12 : "auto" }}
        transition={reduce ? INSTANT : MORPH}
        className="relative overflow-hidden rounded-full bg-white p-1.5 shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.07)] dark:bg-neutral-900 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
      >
        <div ref={ref} className="w-max">
          <AnimatePresence mode="wait" initial={false}>
            {view === "idle" && (
              <motion.button
                key="idle"
                type="button"
                {...swap}
                onClick={() => setPhase("input")}
                className="flex h-9 cursor-pointer items-center gap-2 rounded-full bg-black/[0.06] px-4 text-sm font-semibold text-neutral-900 outline-none transition-colors hover:bg-black/[0.09] focus-visible:ring-2 focus-visible:ring-neutral-900/40 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
              >
                <Lock className="size-3.5" strokeWidth={2.5} />
                {label}
              </motion.button>
            )}

            {view === "slots" && (
              <motion.div
                key="slots"
                {...swap}
                className="relative"
              >
                <motion.div
                  animate={error && !reduce ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
                  transition={{ duration: 0.4 }}
                  className="flex gap-2"
                >
                  {Array.from({ length }, (_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "relative flex size-9 items-center justify-center rounded-[10px] text-sm first:rounded-l-full last:rounded-r-full font-semibold tabular-nums transition-colors duration-300",
                        error
                          ? "bg-red-500/15 text-red-600 dark:text-red-400"
                          : "bg-black/[0.06] text-neutral-900 dark:bg-white/10 dark:text-white",
                      )}
                    >
                      <AnimatePresence initial={false}>
                        {code[i] && (
                          <motion.span
                            key={code[i]}
                            initial={{ opacity: 0, y: reduce ? 0 : 10, filter: blur }}
                            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                            exit={{
                              opacity: 0,
                              y: reduce ? 0 : 12,
                              filter: blur,
                              transition: reduce
                                ? INSTANT
                                : { duration: 0.25, delay: i * 0.04 },
                            }}
                            transition={reduce ? INSTANT : SNAP}
                            className="absolute"
                          >
                            {code[i]}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      {focused && !error && i === active && (
                        <motion.div
                          layoutId={ringId}
                          transition={reduce ? INSTANT : SNAP}
                          className="absolute inset-0 rounded-[inherit] ring-2 ring-neutral-900 ring-inset dark:ring-white"
                        >
                          {!code[i] && (
                            <span className="absolute top-1/2 left-1/2 h-4 w-px -translate-1/2 animate-pulse bg-neutral-900 motion-reduce:animate-none dark:bg-white" />
                          )}
                        </motion.div>
                      )}
                    </div>
                  ))}
                </motion.div>
                <input
                  ref={inputRef}
                  autoFocus
                  value={code}
                  onChange={onChange}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  disabled={error}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="\d*"
                  maxLength={length}
                  aria-label="Verification code"
                  className="absolute inset-0 cursor-text bg-transparent text-transparent caret-transparent outline-none selection:bg-transparent"
                />
              </motion.div>
            )}

            {view === "status" && (
              <motion.div
                key="status"
                {...swap}
                className={cn(
                  "relative flex h-9 items-center gap-2 overflow-hidden rounded-full px-4 text-sm font-semibold transition-colors duration-300",
                  phase === "success"
                    ? "bg-green-500 text-white"
                    : "bg-black/[0.06] text-neutral-900 dark:bg-white/10 dark:text-white",
                )}
              >
                {phase === "success" ? (
                  <Check className="size-3.5" strokeWidth={3} />
                ) : (
                  <LoaderCircle
                    className="size-3.5 animate-spin motion-reduce:animate-none"
                    strokeWidth={2.5}
                  />
                )}
                {phase === "success" ? "Verified" : "Verifying"}
                {phase === "success" && !reduce && (
                  <motion.span
                    initial={{ x: "-100%" }}
                    animate={{ x: "200%" }}
                    transition={{ duration: 0.7, ease: "easeInOut" }}
                    className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      <span role="status" className="sr-only">
        {phase === "verifying" && "Verifying code"}
        {phase === "error" && "Incorrect code, try again"}
        {phase === "success" && "Code verified"}
      </span>
    </div>
  );
}
