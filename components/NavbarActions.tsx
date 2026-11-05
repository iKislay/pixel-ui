"use client";

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
            className="flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-[10px] bg-popover px-2.5 text-xs font-medium text-foreground transition-colors hover:text-foreground"
          >
            <span className="flex size-4 items-center justify-center">
              <GithubIcon className="size-3.5 text-foreground" />
            </span>

            {liveStars != null && (
              <span className="text-xs font-medium tabular-nums text-foreground/80">
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

  const pill = "rounded-full liquid-glass";
  const inPill = inNavbar ? "md:bg-transparent md:border-transparent md:shadow-none md:backdrop-blur-none" : "";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <a
        href={GITHUB_URL}
        target="_blank"
        rel="noreferrer"
        aria-label="GitHub"
        className={cn(
          pill,
          inPill,
          "flex h-12 items-center transition-colors duration-200 ease-out hover:bg-black/[0.04] active:bg-black/[0.08] dark:hover:bg-white/10 dark:active:bg-white/15",
        )}
      >
        <span className="flex h-12 w-12 items-center justify-center">
          <GithubIcon className="h-6 w-6 text-foreground" />
        </span>

        {liveStars != null && (
          <span className="pr-4 text-sm font-medium tabular-nums text-foreground/80">
            {liveStars}
          </span>
        )}
      </a>

      <ThemeToggle
        className={cn(
          pill,
          inPill,
          "flex h-12 w-12 items-center justify-center p-0 text-foreground/80 hover:bg-black/[0.04] hover:text-foreground active:bg-black/[0.08] dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white dark:active:bg-white/15 [&_svg]:h-6 [&_svg]:w-6",
        )}
      />
    </div>
  );
}
