"use client";

import { useMemo } from "react";
import ChartDemo from "@/components/charts/demos";
import { buildEffect, useChartEffect } from "@/lib/chart-effects";

export default function ChartPreview({ slug }: { slug: string }) {
  const { choice } = useChartEffect();
  const effect = useMemo(() => (choice ? buildEffect(choice.id, slug) : undefined), [choice, slug]);
  return <ChartDemo slug={slug} effect={effect} />;
}
