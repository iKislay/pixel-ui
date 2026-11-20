"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import PrimitiveDemo from "@/components/primitives/demos";
import type { ComponentItem } from "@/lib/components";
import { feedback } from "@/lib/feedback";

export default function PrimitiveCard({ item, preview }: { item: ComponentItem; preview?: ReactNode }) {
  return (
    <div
      className="group relative flex aspect-4/3 w-full items-center justify-center overflow-hidden rounded-[44px] bg-card isolate sm:rounded-[56px] lg:rounded-[64px]"
      style={{ cornerShape: "squircle" } as React.CSSProperties}
    >
      <div inert className="pointer-events-none flex w-full scale-[0.85] items-center justify-center px-8 select-none">
        {preview ?? (item.registry && <PrimitiveDemo slug={item.registry} />)}
      </div>

      <Link
        href={item.href}
        prefetch={false}
        onClick={() => feedback("tick")}
        className="absolute inset-0 z-10 rounded-[inherit] outline-hidden focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-brand"
      >
        <span className="absolute bottom-5 left-6 text-sm font-semibold text-foreground/70 transition-colors duration-200 group-hover:text-foreground sm:bottom-6 sm:left-7 motion-reduce:transition-none">
          {item.name}
        </span>
        <span className="absolute right-5 top-5 flex size-9 items-center justify-center rounded-full border border-black/[0.06] bg-white/85 text-black opacity-0 shadow-md backdrop-blur-md transition-opacity duration-200 group-hover:opacity-100 [@media(hover:none)]:opacity-100 dark:border-white/10 dark:bg-[#1c1c1e]/85 dark:text-white sm:right-6 sm:top-6 motion-reduce:transition-none">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden="true">
            <path d="M7 17 17 7M8 7h9v9" />
          </svg>
        </span>
      </Link>
    </div>
  );
}
