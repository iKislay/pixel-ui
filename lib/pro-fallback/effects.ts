import type { ChartEffect } from "@/components/ui/chart";

export type ChartEffectFactory = (options?: { fade?: "down" | "up" | "right" | "left" }) => ChartEffect;

// stands in for pro/effects when the private pro repo is not checked out
export const PRO_EFFECTS: Record<string, ChartEffectFactory> = {};
