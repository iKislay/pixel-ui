"use client";

import { usePreviewControl } from "@/components/preview/PreviewControls";

export const VOICE_PICKERS = [
  { name: "vg-type", title: "Type", options: ["default", "pill", "mobile"] },
  { name: "vg-variant", title: "Color variant", options: ["colorful", "mono", "ocean", "sunset", "forest", "candy", "ice", "gold"] },
  { name: "vg-theme", title: "Theme", options: ["auto", "dark", "light", "dither"] },
  { name: "vg-processing", title: "Processing", options: ["off", "on"] },
  { name: "vg-active", title: "Active", options: ["on", "off"] },
  { name: "vg-paused", title: "Paused", options: ["off", "on"] },
] as const;

// fallbacks match the component defaults; reach has none since it follows the type
export const VOICE_SLIDERS = [
  {
    group: "Input",
    items: [
      { key: "sensitivity", title: "Sensitivity", min: 0, max: 4, step: 0.05, fallback: 1.5 },
      { key: "threshold", title: "Threshold", min: 0, max: 0.5, step: 0.01, fallback: 0.05 },
      { key: "attack", title: "Attack (s)", min: 0, max: 0.5, step: 0.01, fallback: 0.06 },
      { key: "release", title: "Release (s)", min: 0, max: 1.5, step: 0.01, fallback: 0.35 },
    ],
  },
  {
    group: "Shape",
    items: [
      { key: "reach", title: "Reach", min: 0, max: 1, step: 0.01, fallback: 0.9 },
      { key: "spread", title: "Spread", min: 0, max: 1, step: 0.01, fallback: 0.8 },
      { key: "flow", title: "Flow", min: 0, max: 1, step: 0.01, fallback: 0.5 },
      { key: "bend", title: "Bend", min: 0, max: 1, step: 0.01, fallback: 0.5 },
      { key: "idle", title: "Idle", min: 0, max: 1, step: 0.01, fallback: 0.12 },
      { key: "strength", title: "Strength", min: 0, max: 1, step: 0.01, fallback: 1 },
      { key: "scale", title: "Scale", min: 0.25, max: 2, step: 0.05, fallback: 1 },
    ],
  },
];

export const VOICE_STYLE_KEY = "vg-style";

export function useVoiceStyle() {
  const [raw, setRaw] = usePreviewControl(VOICE_STYLE_KEY, "{}");
  const style = JSON.parse(raw) as Record<string, number>;
  const set = (key: string, value: number) => setRaw(JSON.stringify({ ...style, [key]: value }));
  return [style, set, () => setRaw("{}")] as const;
}
