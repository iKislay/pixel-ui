"use client";

import { usePreviewControl } from "@/components/preview/PreviewControls";

export const METAL_PICKERS = [
  { name: "mt-preset", title: "Preset", options: ["chromatic", "silver", "gold"] },
  { name: "mt-variant", title: "Variant", options: ["button", "circle"] },
  { name: "mt-theme", title: "Theme", options: ["auto", "dark", "light"] },
  { name: "mt-inner", title: "Inner shadow", options: ["on", "off"] },
  { name: "mt-glow", title: "Glow", options: ["on", "off"] },
  { name: "mt-bend", title: "Cursor bend", options: ["on", "off"] },
  { name: "mt-reflect", title: "Reflections", options: ["on", "off"] },
  { name: "mt-paused", title: "Paused", options: ["off", "on"] },
] as const;

// fallbacks match the component defaults
export const METAL_SLIDERS = [
  { key: "strength", title: "Strength", min: 0, max: 1, step: 0.01, fallback: 1 },
  { key: "glowGain", title: "Glow gain", min: 0, max: 3, step: 0.05, fallback: 1 },
];

export function useMetalStyle() {
  const [raw, setRaw] = usePreviewControl("mt-style", "{}");
  const style = JSON.parse(raw) as Record<string, number>;
  const set = (key: string, value: number) => setRaw(JSON.stringify({ ...style, [key]: value }));
  return [style, set, () => setRaw("{}")] as const;
}
