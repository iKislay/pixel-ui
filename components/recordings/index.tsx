"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import Fallback from "./Fallback";
import type { RecordingProps } from "./Player";

const RECORDINGS: Record<string, ComponentType<RecordingProps>> = {
  "theme-toggle": dynamic(() => import("./theme-toggle"), { ssr: false }),
  "audio-chat-room": dynamic(() => import("./audio-chat-room"), { ssr: false }),
  toast: dynamic(() => import("./toast"), { ssr: false }),
  "member-selector": dynamic(() => import("./member-selector"), { ssr: false }),
  "ascii-jellyfish": dynamic(() => import("./ascii").then((m) => m.Jellyfish), { ssr: false }),
  "ascii-butterflies": dynamic(() => import("./ascii").then((m) => m.Butterflies), { ssr: false }),
};

export default function Recording({
  slug,
  ...props
}: RecordingProps & { slug?: string }) {
  const Recorded = slug ? RECORDINGS[slug] : undefined;
  return Recorded ? <Recorded {...props} /> : <Fallback />;
}
