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
}: {
  item: ComponentItem;
  large?: boolean;
  autoPlay?: boolean;
  className?: string;
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
        "group flex h-full flex-col rounded-[32px] border border-black/[0.04] bg-[#F5F5F7] p-2 transition-colors duration-200 ease-out dark:border-transparent dark:border-apple dark:bg-[#121212] dark:hover:bg-muted",
        large && "lg:h-full",
        className,
      )}
      style={{ cornerShape: "squircle" } as React.CSSProperties}
    >
      <div
        className={cn(
          "relative aspect-4/3 w-full overflow-hidden rounded-3xl border border-black/[0.06] bg-white dark:border-neutral-500/15 dark:bg-neutral-950",
          large && "lg:aspect-auto lg:flex-1",
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
      </div>

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
    </Link>
  );
}
