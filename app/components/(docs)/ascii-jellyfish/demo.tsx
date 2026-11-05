"use client";

import { useState } from "react";
import { AsciiJellyfish } from "@/components/ui/ascii-jellyfish";
import DemoSearch from "@/components/preview/DemoSearch";

const VARIANTS = ["color", "mono"] as const;
const COUNTS = [1, 2, 3, 4, 5, 6];

const GROUP =
  "flex gap-1 rounded-full bg-black/[0.04] p-1 dark:bg-white/[0.06]";
const OPTION =
  "h-8 min-w-8 cursor-pointer rounded-full px-3 text-[13px] font-semibold capitalize transition-colors motion-reduce:transition-none";
const ACTIVE = "bg-white text-black shadow-sm dark:bg-[#2C2C2C] dark:text-white";
const IDLE = "text-neutral-500 hover:text-black dark:text-white/60 dark:hover:text-white";

export default function Page() {
  const [variant, setVariant] = useState<(typeof VARIANTS)[number]>("color");
  const [count, setCount] = useState(4);
  return (
    <div className="relative h-full w-full overflow-hidden font-runde">
      <AsciiJellyfish variant={variant} count={count} className="absolute inset-0" />
      <div className="relative flex h-full items-center justify-center pb-16">
        <DemoSearch />
      </div>
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 flex-wrap justify-center gap-2">
        <div className={GROUP}>
          {VARIANTS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVariant(v)}
              className={`${OPTION} ${variant === v ? ACTIVE : IDLE}`}
            >
              {v}
            </button>
          ))}
        </div>
        <div className={GROUP}>
          {COUNTS.map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`Show ${n}`}
              onClick={() => setCount(n)}
              className={`${OPTION} ${count === n ? ACTIVE : IDLE}`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
