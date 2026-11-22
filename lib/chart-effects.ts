"use client";

import { usePreviewControl } from "@/components/preview/PreviewControls";
import { PRO_EFFECTS } from "@pro/effects";

export type ChartEffectChoice = { id: string; label: string; registry: string };

// every effect is a pro add-on installed from the pro registry; the code lives only in the pro repo
export const CHART_EFFECTS: ChartEffectChoice[] = [{ id: "dither", label: "Dither", registry: "dither" }];

export const effectUnlocked = (id: string) => id in PRO_EFFECTS;

export function useChartEffect() {
  const [name, setName] = usePreviewControl("chart-effect", "none");
  const choice = CHART_EFFECTS.find((effect) => effect.id === name);
  return { choice, setName };
}

export const buildEffect = (id: string) => PRO_EFFECTS[id]?.();
