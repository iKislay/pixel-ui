"use client";

import { useState } from "react";
import { AsciiButterflies } from "@/components/ui/ascii-butterflies";

const VARIANTS = ["color", "mono"] as const;

export default function Page() {
  const [variant, setVariant] = useState<(typeof VARIANTS)[number]>("color");
  return (
    <div className="relative h-full w-full font-runde">
      <AsciiButterflies variant={variant} className="h-full w-full" />
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1 rounded-full bg-black/[0.04] p-1 dark:bg-white/[0.06]">
        {VARIANTS.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setVariant(v)}
            className={`h-8 cursor-pointer rounded-full px-4 text-[13px] font-semibold capitalize transition-colors motion-reduce:transition-none ${variant === v ? "bg-white text-black shadow-sm dark:bg-[#2C2C2C] dark:text-white" : "text-neutral-500 hover:text-black dark:text-white/60 dark:hover:text-white"}`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}
