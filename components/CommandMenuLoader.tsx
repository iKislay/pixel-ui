"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { OPEN_EVENT } from "./CommandMenuTrigger";

const CommandMenu = dynamic(() => import("./CommandMenu"), { ssr: false });

export function CommandMenuLoader() {
  const [state, setState] = useState<"idle" | "warm" | "open">("idle");

  // mounting closed ahead of time makes the first open a plain state flip instead of a chunk load
  useEffect(() => {
    const warm = () => setState((s) => (s === "idle" ? "warm" : s));
    if (!("requestIdleCallback" in window)) {
      const timer = setTimeout(warm, 1500);
      return () => clearTimeout(timer);
    }
    const id = requestIdleCallback(warm, { timeout: 2000 });
    return () => cancelIdleCallback(id);
  }, []);

  // stays on until the menu is open so a click during the warm load is not lost; initialOpen is read on the menu's first render only
  useEffect(() => {
    if (state === "open") return;
    const request = () => setState("open");
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key?.toLowerCase() !== "k" || !(e.metaKey || e.ctrlKey)) return;
      e.preventDefault();
      request();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_EVENT, request);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_EVENT, request);
    };
  }, [state]);

  return state === "idle" ? null : <CommandMenu initialOpen={state === "open"} />;
}
