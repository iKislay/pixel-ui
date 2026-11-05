"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import ThemeToggle from "@/components/ThemeToggle";
import Tooltip from "@/components/Tooltip";
import { useStarCount } from "@/lib/use-star-count";
import { cn } from "@/lib/utils";

const GITHUB_URL = "https://github.com/ikislay/pixel-ui";

const GithubIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.75 2.69 1.25 3.35.95.1-.74.4-1.25.72-1.53-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11.04 11.04 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.7 5.39-5.26 5.68.41.35.77 1.05.77 2.12 0 1.53-.01 2.76-.01 3.14 0 .3.2.66.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
  </svg>
);

const StarIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 800 800"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M305.105 180.279C347.327 104.538 368.437 66.6667 400 66.6667C431.563 66.6667 452.673 104.537 494.893 180.279L505.817 199.874C517.817 221.398 523.813 232.16 533.17 239.26C542.523 246.361 554.17 248.997 577.47 254.268L598.683 259.068C680.67 277.619 721.667 286.894 731.42 318.258C741.173 349.62 713.227 382.303 657.33 447.663L642.87 464.573C626.987 483.147 619.043 492.433 615.47 503.923C611.9 515.413 613.1 527.803 615.5 552.587L617.687 575.147C626.137 662.353 630.363 705.957 604.83 725.34C579.293 744.723 540.91 727.05 464.143 691.707L444.283 682.56C422.47 672.517 411.563 667.493 400 667.493C388.437 667.493 377.53 672.517 355.717 682.56L335.857 691.707C259.089 727.05 220.706 744.723 195.172 725.34C169.637 705.957 173.863 662.353 182.313 575.147L184.499 552.587C186.901 527.803 188.102 515.413 184.529 503.923C180.956 492.433 173.014 483.147 157.131 464.573L142.67 447.663C86.7749 382.303 58.8272 349.62 68.5806 318.258C78.3339 286.894 119.329 277.619 201.318 259.068L222.53 254.268C245.828 248.997 257.478 246.361 266.831 239.26C276.185 232.16 282.184 221.398 294.182 199.874L305.105 180.279Z" />
  </svg>
);

const SparkleIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M12 0l2.5 9.5L24 12l-9.5 2.5L12 24l-2.5-9.5L0 12l9.5-2.5L12 0z" />
  </svg>
);

const morphSpring = { type: "spring", stiffness: 250, damping: 24 } as const;
const popSpring = { type: "spring", stiffness: 320, damping: 15 } as const;
const fade = { duration: 0.3, ease: "easeOut" } as const;
const morphTransition = {
  scale: morphSpring,
  rotate: morphSpring,
  opacity: fade,
  filter: fade,
} as const;
const popTransition = {
  scale: popSpring,
  rotate: popSpring,
  opacity: fade,
  filter: fade,
} as const;

export function NavbarActions({
  stars,
  variant = "compact",
  inNavbar = false,
  className,
}: {
  stars?: number | null;
  variant?: "default" | "compact";
  inNavbar?: boolean;
  className?: string;
}) {
  const liveStars = useStarCount(stars);
  const [starHovered, setStarHovered] = useState(false);
  const reduceMotion = useReducedMotion();

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex w-fit items-center gap-1.5 rounded-2xl border border-black/[0.06] bg-muted p-1.5 shadow-sm dark:border-transparent dark:border-apple",
          className,
        )}
      >
        <Tooltip label="Star on GitHub">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub repository"
            onMouseEnter={() => setStarHovered(true)}
            onMouseLeave={() => setStarHovered(false)}
            onFocus={() => setStarHovered(true)}
            onBlur={() => setStarHovered(false)}
            className="flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-[10px] bg-popover px-2.5 text-xs font-medium text-foreground transition-colors hover:text-foreground"
          >
            <span className="relative flex size-4 items-center justify-center">
              <motion.span
                initial={false}
                animate={{
                  scale: starHovered ? 0.25 : 1,
                  opacity: starHovered ? 0 : 1,
                  rotate: reduceMotion ? 0 : starHovered ? -60 : 0,
                  filter: starHovered ? "blur(2px)" : "blur(0px)",
                }}
                transition={reduceMotion ? { duration: 0 } : morphTransition}
                className="flex items-center justify-center"
              >
                <GithubIcon className="size-3.5 text-foreground" />
              </motion.span>
              <motion.span
                initial={false}
                animate={{
                  scale: starHovered ? 1 : 0.25,
                  opacity: starHovered ? 1 : 0,
                  rotate: reduceMotion ? 0 : starHovered ? 0 : -150,
                  filter: starHovered ? "blur(0px)" : "blur(2px)",
                }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : starHovered
                      ? popTransition
                      : morphTransition
                }
                className="absolute inset-0 flex items-center justify-center text-[#FFC83D]"
              >
                <StarIcon className="size-4" />
              </motion.span>
            </span>

            {liveStars != null && (
              <span className="font-runde text-xs font-medium tabular-nums text-foreground/80">
                {liveStars}
              </span>
            )}
          </a>
        </Tooltip>

        <div className="h-4 w-px bg-black/[0.06] dark:bg-white/10" />

        <Tooltip label="Toggle theme" align="start">
          <ThemeToggle className="flex size-7 items-center justify-center rounded-full bg-popover p-1 text-foreground/80 hover:text-foreground [&_svg]:size-4" />
        </Tooltip>
      </div>
    );
  }

  const pill = "rounded-full border-apple bg-neutral-900";
  const inPill = inNavbar ? "md:bg-transparent md:shadow-none" : "";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <a
        href={GITHUB_URL}
        target="_blank"
        rel="noreferrer"
        aria-label="GitHub"
        onMouseEnter={() => setStarHovered(true)}
        onMouseLeave={() => setStarHovered(false)}
        onFocus={() => setStarHovered(true)}
        onBlur={() => setStarHovered(false)}
        className={cn(
          pill,
          inPill,
          "flex h-12 items-center transition-colors duration-200 ease-out hover:bg-neutral-800 md:hover:bg-neutral-800",
        )}
      >
        <span className="relative flex h-12 w-12 items-center justify-center">
          <motion.span
            initial={false}
            animate={{
              scale: starHovered ? 0.25 : 1,
              opacity: starHovered ? 0 : 1,
              rotate: reduceMotion ? 0 : starHovered ? -60 : 0,
              filter: starHovered ? "blur(4px)" : "blur(0px)",
            }}
            transition={reduceMotion ? { duration: 0 } : morphTransition}
            className="flex items-center justify-center"
          >
            <GithubIcon className="h-6 w-6 text-white" />
          </motion.span>
          <motion.span
            initial={false}
            animate={{
              scale: starHovered ? 1 : 0.25,
              opacity: starHovered ? 1 : 0,
              rotate: reduceMotion ? 0 : starHovered ? 0 : -150,
              filter: starHovered ? "blur(0px)" : "blur(4px)",
            }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : starHovered
                  ? popTransition
                  : morphTransition
            }
            className="absolute inset-0 flex items-center justify-center text-[#FFC83D]"
          >
            <StarIcon className="h-7 w-7" />
          </motion.span>
          <motion.span
            initial={false}
            animate={{
              scale: starHovered && !reduceMotion ? 1 : 0,
              opacity: starHovered ? 1 : 0,
              rotate: reduceMotion ? 0 : starHovered ? 0 : -90,
            }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : starHovered
                  ? {
                      scale: { ...popSpring, delay: 0.1 },
                      rotate: { ...popSpring, delay: 0.1 },
                      opacity: { ...fade, delay: 0.1 },
                    }
                  : { duration: 0.15 }
            }
            className="absolute right-2 top-2 text-[#FFE9A8]"
          >
            <SparkleIcon className="h-2 w-2" />
          </motion.span>
          <motion.span
            initial={false}
            animate={{
              scale: starHovered && !reduceMotion ? 1 : 0,
              opacity: starHovered ? 1 : 0,
              rotate: reduceMotion ? 0 : starHovered ? 0 : 90,
            }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : starHovered
                  ? {
                      scale: { ...popSpring, delay: 0.18 },
                      rotate: { ...popSpring, delay: 0.18 },
                      opacity: { ...fade, delay: 0.18 },
                    }
                  : { duration: 0.15 }
            }
            className="absolute bottom-2.5 left-2 text-[#FFE9A8]"
          >
            <SparkleIcon className="h-1.5 w-1.5" />
          </motion.span>
        </span>

        {liveStars != null && (
          <span className="pr-4 font-runde text-sm font-medium tabular-nums text-white/80">
            {liveStars}
          </span>
        )}
      </a>

      <ThemeToggle
        className={cn(
          pill,
          inPill,
          "flex h-12 w-12 items-center justify-center p-0 text-white/80 hover:bg-neutral-800 hover:text-white md:hover:bg-neutral-800 [&_svg]:h-6 [&_svg]:w-6",
        )}
      />
    </div>
  );
}
