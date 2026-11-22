"use client";

import { usePathname } from "next/navigation";
import { usePreviewControl } from "@/components/preview/PreviewControls";
import { PRO_EFFECTS } from "@pro/effects";

export type ChartEffectChoice = { id: string; label: string; registry: string };

// every effect is a pro add-on installed from the pro registry; the code lives only in the pro repo
export const CHART_EFFECTS: ChartEffectChoice[] = [{ id: "dither", label: "Dither", registry: "dither" }];

// effects only paint filled areas, so charts drawn in lines or small dots do not offer them
const TAKES_EFFECT = new Set([
  "area-chart",
  "bar-chart",
  "stacked-bar-chart",
  "pill-bar-chart",
  "horizontal-bar-chart",
  "range-chart",
  "threshold-chart",
  "capsule-stack-chart",
  "donut-chart",
  "radial-progress",
  "activity-rings",
  "rose-chart",
  "spending-ring",
  "segmented-bar",
  "waffle-chart",
  "funnel-chart",
  "heatmap",
  "calendar-heatmap",
  "sankey-chart",
  "flow-hub",
  "gantt-chart",
  "radar-chart",
]);

export const takesEffect = (pathname: string) => pathname.startsWith("/charts/") && TAKES_EFFECT.has(pathname.slice(8));

export const effectUnlocked = (id: string) => id in PRO_EFFECTS;

export function useChartEffect() {
  const pathname = usePathname();
  const [name, setName] = usePreviewControl("chart-effect", "none");
  const choice = takesEffect(pathname) ? CHART_EFFECTS.find((effect) => effect.id === name) : undefined;
  return { choice, setName };
}

export const buildEffect = (id: string) => PRO_EFFECTS[id]?.();
