"use client";

import { useMemo } from "react";
import type { WaveStyleInput, WaveType } from "distortion-waves";
import { usePreviewControl } from "@/components/preview/PreviewControls";

export const SCENE = "scene";

export const WAVE_PICKERS = [
  { name: "dw-type", title: "Type", options: [SCENE, "vertical", "horizontal", "center"] },
  { name: "dw-palette", title: "Palette", options: [SCENE, "colorful", "green", "ocean", "sunset", "mono"] },
  { name: "dw-live", title: "Live picture", options: ["on", "animations", "off"] },
  { name: "dw-capture", title: "Capture", options: ["picture", "colour only"] },
  { name: "dw-resolution", title: "Resolution", options: ["display", "1x", "0.5x"] },
  { name: "dw-motion", title: "Reduced motion", options: ["system", "always", "never"] },
] as const;

export type WaveSlider = { key: string; title: string; min: number; max: number; step: number; fallback: number };

// fallbacks are the engine's vertical defaults, shown until a slider is moved
export const WAVE_SLIDERS: { group: string; items: WaveSlider[] }[] = [
  {
    group: "Timing",
    items: [
      { key: "anticipation", title: "Anticipation", min: 0, max: 1.5, step: 0.05, fallback: 0.5 },
      { key: "travel", title: "Travel", min: 0.5, max: 6, step: 0.05, fallback: 2.28 },
      { key: "returnSpeed", title: "Return speed", min: 0.5, max: 4, step: 0.05, fallback: 1.45 },
      { key: "linger", title: "Linger", min: -1, max: 1, step: 0.05, fallback: -0.35 },
      { key: "rimFade", title: "Edge fade", min: 0.5, max: 6, step: 0.05, fallback: 3.03 },
    ],
  },
  {
    group: "Lens",
    items: [
      { key: "amplitude", title: "Amplitude", min: 0, max: 80, step: 1, fallback: 34 },
      { key: "lensWidth", title: "Lens width", min: 30, max: 300, step: 5, fallback: 150 },
      { key: "swell", title: "Swell", min: 0, max: 60, step: 1, fallback: 22 },
      { key: "aberration", title: "Aberration", min: 0, max: 2, step: 0.02, fallback: 0.78 },
      { key: "blur", title: "Blur", min: 0, max: 50, step: 1, fallback: 18 },
      { key: "strength", title: "Colour strength", min: 0, max: 1.5, step: 0.02, fallback: 0.92 },
      { key: "pull", title: "Pull", min: 0, max: 60, step: 1, fallback: 24 },
      { key: "inhale", title: "Inhale", min: 0, max: 120, step: 1, fallback: 56 },
    ],
  },
  {
    group: "Edge",
    items: [
      { key: "rimWidth", title: "Edge width", min: 0, max: 40, step: 1, fallback: 14 },
      { key: "rimStrength", title: "Edge strength", min: 0, max: 1.5, step: 0.02, fallback: 0.82 },
      { key: "rimPulse", title: "Edge pulse", min: 0, max: 1.5, step: 0.05, fallback: 0.6 },
      { key: "hairlineWidth", title: "Hairline width", min: 0, max: 4, step: 0.1, fallback: 1.5 },
      { key: "hairlineOpacity", title: "Hairline opacity", min: 0, max: 1, step: 0.05, fallback: 0.9 },
    ],
  },
  {
    group: "Particles",
    items: [
      { key: "particleCount", title: "Count", min: 0, max: 200, step: 1, fallback: 64 },
      { key: "particleSize", title: "Size", min: 0.5, max: 5, step: 0.1, fallback: 1.8 },
      { key: "particleReach", title: "Reach", min: 0, max: 300, step: 5, fallback: 150 },
      { key: "particleLife", title: "Life", min: 0.5, max: 6, step: 0.05, fallback: 2.19 },
    ],
  },
];

export const STYLE_KEY = "dw-style";

export const SCRUB_KEY = "dw-scrub";

const RESOLUTION: Record<string, number | undefined> = { display: undefined, "1x": 1, "0.5x": 0.5 };

export function useWaveStyle() {
  const [raw, setRaw] = usePreviewControl(STYLE_KEY, "{}");
  const style = useMemo(() => JSON.parse(raw) as Record<string, number>, [raw]);
  const set = (key: string, value: number | undefined) => {
    const next = { ...style, [key]: value };
    if (value === undefined) delete next[key];
    setRaw(JSON.stringify(next));
  };
  return [style, set, () => setRaw("{}")] as const;
}

// merges the sidebar's live values over a scene's own type and palette
export function useWaveControls(own: { type?: WaveType; palette?: string }) {
  const [type] = usePreviewControl("dw-type", SCENE);
  const [palette] = usePreviewControl("dw-palette", SCENE);
  const [live] = usePreviewControl("dw-live", "on");
  const [capture] = usePreviewControl("dw-capture", "picture");
  const [resolution] = usePreviewControl("dw-resolution", "display");
  const [motion] = usePreviewControl("dw-motion", "system");
  const [scrub] = usePreviewControl(SCRUB_KEY, "");
  const [style] = useWaveStyle();

  return {
    type: type === SCENE ? own.type : (type as WaveType),
    palette: palette === SCENE ? own.palette : palette,
    waveStyle: style as WaveStyleInput,
    live: live === "on" ? true : live === "off" ? false : ("animations" as const),
    capture: capture === "picture",
    resolution: RESOLUTION[resolution],
    reducedMotion: motion as "system" | "always" | "never",
    scrub: scrub === "" ? null : Number(scrub),
  };
}
