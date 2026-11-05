"use client";

import { useState } from "react";
import { AsciiJellyfish } from "@/components/ui/ascii-jellyfish";

const VARIANTS = ["color", "mono"] as const;

export default function Page() {
  const [variant, setVariant] = useState<(typeof VARIANTS)[number]>("color");
  return (
    <div className="relative h-full w-full font-runde">
      <AsciiJellyfish variant={variant} className="h-full w-full" />
      <div className="absolute left-1/2 top-4 flex -translate-x-1/2 gap-1 rounded-full bg-white/10 p-1 backdrop-blur">
        {VARIANTS.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setVariant(v)}
            className={`h-8 cursor-pointer rounded-full px-4 text-[13px] font-semibold capitalize transition-colors motion-reduce:transition-none ${variant === v ? "bg-white text-black" : "text-white/70 hover:text-white"}`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}
