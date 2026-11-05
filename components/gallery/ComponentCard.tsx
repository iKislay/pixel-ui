"use client";

import { useState } from "react";
import Link from "next/link";
import type { ComponentItem } from "@/lib/components";
import { cn } from "@/lib/utils";
import PreviewFallback from "./PreviewFallback";
import PreviewVideo from "./PreviewVideo";

export default function ComponentCard({
  item,
  large = false,
  autoPlay = false,
  className,
  aspectClassName,
  overlay = false,
}: {
  item: ComponentItem;
  large?: boolean;
  autoPlay?: boolean;
  className?: string;
  aspectClassName?: string;
  overlay?: boolean;
}) {
  const [active, setActive] = useState(false);

  return (
    <Link
      href={item.href}
      prefetch={active ? null : false}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden transition-colors duration-200 ease-out [transform:translateZ(0)]",
        overlay
          ? "rounded-[44px] bg-[#F5F5F7] sm:rounded-[56px] lg:rounded-[64px] dark:bg-[#121212]"
          : "rounded-[32px] border border-black/[0.04] bg-[#F5F5F7] p-2 dark:border-transparent dark:border-apple dark:bg-[#121212] dark:hover:bg-muted",
        large && "lg:h-full",
        className,
      )}
      style={{ cornerShape: "squircle" } as React.CSSProperties}
    >
      <div
        className={cn(
          "relative aspect-4/3 w-full overflow-hidden bg-white isolate [transform:translateZ(0)] dark:bg-neutral-950",
          overlay
            ? "rounded-[44px] sm:rounded-[56px] lg:rounded-[64px]"
            : "rounded-3xl border border-black/[0.06] dark:border-neutral-500/15",
          large && "lg:aspect-auto lg:flex-1",
          aspectClassName,
        )}
        style={{ cornerShape: "squircle" } as React.CSSProperties}
      >
        {item.preview ? (
          <PreviewVideo
            src={item.preview}
            scale={item.previewScale}
            playing={active}
            autoPlay={autoPlay}
          />
        ) : (
          <PreviewFallback />
        )}

        {overlay && (
          <>
            <div className="pointer-events-none absolute right-5 top-5 opacity-0 transition-all duration-200 ease-out group-hover:opacity-100 [@media(hover:none)]:opacity-100 sm:right-6 sm:top-6 motion-reduce:transition-none">
              <div className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white shadow-md backdrop-blur-md dark:bg-[#1c1c1e]/85 sm:size-10">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none sm:size-4.5"
                  aria-hidden="true"
                >
                  <path d="M7 17 17 7M8 7h9v9" />
                </svg>
              </div>
            </div>

            <div className="pointer-events-none absolute bottom-5 left-5 opacity-0 transition-all duration-200 ease-out group-hover:opacity-100 [@media(hover:none)]:opacity-100 sm:bottom-6 sm:left-6 motion-reduce:transition-none">
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-3.5 py-1.5 font-runde text-xs font-medium text-white shadow-md backdrop-blur-md dark:bg-[#1c1c1e]/85 sm:px-4 sm:py-2 sm:text-sm">
                <span>{item.name}</span>
                {item.isNew && (
                  <span className="rounded-full bg-brand/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-brand">
                    NEW
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {!overlay && (
        <div className="flex flex-col gap-0.5 px-3 pb-1 pt-2">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-runde text-base font-semibold tracking-tight">
              {item.name}
            </h3>
            {item.isNew && (
              <span className="shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-brand">
                NEW
              </span>
            )}
          </div>
          {item.description && (
            <p className="line-clamp-1 text-sm text-muted-foreground">
              {item.description}
            </p>
          )}
        </div>
      )}
    </Link>
  );
}
