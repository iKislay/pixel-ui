"use client";

import { useState } from "react";
import Link from "next/link";
import type { ComponentItem } from "@/lib/components";
import { feedback } from "@/lib/feedback";
import { cn } from "@/lib/utils";
import Recording from "@/components/recordings";

export default function ComponentCard({
  item,
  large = false,
  autoPlay = false,
  className,
  aspectClassName,
}: {
  item: ComponentItem;
  large?: boolean;
  autoPlay?: boolean;
  className?: string;
  aspectClassName?: string;
}) {
  const [active, setActive] = useState(false);

  return (
    <div
      className={cn(
        "group relative flex aspect-4/3 w-full flex-col overflow-hidden rounded-[44px] bg-card isolate transition-colors duration-200 ease-out [transform:translateZ(0)] sm:rounded-[56px] lg:rounded-[64px]",
        large && "lg:aspect-auto lg:h-full lg:flex-1",
        aspectClassName,
        className,
      )}
      style={{ cornerShape: "squircle" } as React.CSSProperties}
    >
      <Recording slug={item.registry} playing={active} autoPlay={autoPlay} />

      {/* a sibling, not a parent: scripted clicks inside the recording must never reach the link */}
      <Link
        href={item.href}
        prefetch={active ? null : false}
        onClick={() => feedback("tick")}
        onMouseEnter={() => setActive(true)}
        onMouseLeave={() => setActive(false)}
        onFocus={() => setActive(true)}
        onBlur={() => setActive(false)}
        className="absolute inset-0 z-10"
      >
        <div className="pointer-events-none absolute right-5 top-5 opacity-0 transition-all duration-200 ease-out group-hover:opacity-100 [@media(hover:none)]:opacity-100 sm:right-6 sm:top-6 motion-reduce:transition-none">
          <div className="flex size-9 items-center justify-center rounded-full border border-black/[0.06] bg-white/85 text-black shadow-md backdrop-blur-md dark:border-white/10 dark:bg-[#1c1c1e]/85 dark:text-white sm:size-10">
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
          <div className="flex items-center gap-2 rounded-full border border-black/[0.06] bg-white/85 px-3.5 py-1.5 text-xs font-medium text-black shadow-md backdrop-blur-md dark:border-white/10 dark:bg-[#1c1c1e]/85 dark:text-white sm:px-4 sm:py-2 sm:text-sm">
            <span>{item.name}</span>
            {item.isNew && (
              <span className="rounded-full bg-brand/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-brand">
                NEW
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
