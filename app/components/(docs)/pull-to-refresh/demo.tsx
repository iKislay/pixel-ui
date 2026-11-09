"use client";

import { useState } from "react";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";

const EVENTS = [
  "Deployed main to production",
  "Merged fix for login redirect",
  "Preview ready for feat/search",
  "Rolled back edge config",
  "Build cache warmed",
  "Opened issue: flaky e2e test",
  "Bumped motion to 12.40",
  "Deployed docs site",
];

export default function PullToRefreshDemo() {
  const [items, setItems] = useState(() =>
    EVENTS.map((title, i) => ({ id: i, title, time: `${(i + 1) * 7}m ago` })),
  );

  const refresh = async () => {
    await new Promise((r) => setTimeout(r, 1200));
    setItems((prev) => [
      { id: prev.length, title: EVENTS.at(-1 - (prev.length % EVENTS.length))!, time: "just now" },
      ...prev,
    ]);
  };

  return (
    <div className="relative flex h-full min-h-[500px] flex-col items-center justify-center gap-3 px-6">
      <PullToRefresh
        onRefresh={refresh}
        className="h-[460px] w-full max-w-[320px] rounded-2xl border"
      >
        <div className="sticky top-0 border-b bg-background/90 px-4 py-3 text-sm font-medium backdrop-blur">
          Activity
        </div>
        <ul>
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 border-b px-4 py-3">
              <span className="size-8 shrink-0 rounded-md bg-muted" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{item.title}</span>
                <span className="block text-xs text-muted-foreground">{item.time}</span>
              </span>
            </li>
          ))}
        </ul>
      </PullToRefresh>
      <span className="text-xs text-muted-foreground select-none">
        Drag the feed down and let go
      </span>
    </div>
  );
}
