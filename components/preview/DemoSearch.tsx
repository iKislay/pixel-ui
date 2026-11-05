"use client";

import { ArrowUp, Globe, Mic, Plus } from "lucide-react";

const CHIPS = ["/explore ideas", "/refine my writing", "/plan a project"];

export default function DemoSearch() {
  return (
    <div className="relative flex w-full max-w-xl flex-col items-center gap-4 px-6">
      <p className="text-center text-2xl font-semibold tracking-tight text-black sm:text-3xl dark:text-white">
        What should we build today?
      </p>
      <form
        onSubmit={(e) => e.preventDefault()}
        className="w-full rounded-2xl border border-black/[0.06] bg-white/70 p-3 shadow-sm backdrop-blur-md dark:border-white/[0.08] dark:bg-white/[0.04]"
      >
        <input
          aria-label="Ask anything"
          placeholder="Ask anything..."
          className="w-full bg-transparent px-1 py-2 text-[15px] text-black outline-none placeholder:text-neutral-400 dark:text-white dark:placeholder:text-white/40"
        />
        <div className="mt-2 flex items-center gap-1 text-neutral-500 dark:text-white/50">
          {[Plus, Globe, Mic].map((Icon, i) => (
            <span key={i} className="grid size-8 place-items-center rounded-full">
              <Icon className="size-4" />
            </span>
          ))}
          <button
            type="submit"
            aria-label="Send"
            className="ml-auto grid size-8 cursor-pointer place-items-center rounded-full bg-black text-white dark:bg-white dark:text-black"
          >
            <ArrowUp className="size-4" />
          </button>
        </div>
      </form>
      <div className="flex flex-wrap justify-center gap-2">
        {CHIPS.map((chip) => (
          <span
            key={chip}
            className="rounded-full border border-black/[0.06] bg-white/60 px-3 py-1 font-mono text-xs text-neutral-500 backdrop-blur-md dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/60"
          >
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}
