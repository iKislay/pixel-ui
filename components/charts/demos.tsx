"use client";

import type { ComponentType } from "react";

type DemoProps = { compact?: boolean };
import { formatCompact } from "@/lib/chart";
import { AreaChart } from "@/components/ui/area-chart";
import { BarChart } from "@/components/ui/bar-chart";
import { DonutChart } from "@/components/ui/donut-chart";
import { PillBarChart } from "@/components/ui/pill-bar-chart";
import { Heatmap } from "@/components/ui/heatmap";
import { LineChart } from "@/components/ui/line-chart";
import { RadialProgress } from "@/components/ui/radial-progress";
import { ScatterChart } from "@/components/ui/scatter-chart";
import { Sparkline } from "@/components/ui/sparkline";
import { StackedBarChart } from "@/components/ui/stacked-bar-chart";
import { StatTile } from "@/components/ui/stat-tile";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const visitors = [1840, 2120, 1980, 2640, 3010, 2870, 3320, 3580, 3410, 3960, 4280, 4620];
const returning = [920, 1010, 1140, 1180, 1360, 1490, 1520, 1710, 1840, 1900, 2150, 2380];
const traffic = months.map((month, i) => ({ month, visitors: visitors[i], returning: returning[i] }));

function LineChartDemo({ compact }: DemoProps) {
  return (
    <LineChart
      height={compact ? 170 : undefined}
      label="Visitors by month"
      data={traffic}
      index="month"
      series={[
        { key: "visitors", label: "Visitors" },
        { key: "returning", label: "Returning" },
      ]}
    />
  );
}

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const takings = [4200, 5100, 4800, 6300, 7900, 9400, 8100];

function AreaChartDemo({ compact }: DemoProps) {
  return (
    <AreaChart
      height={compact ? 170 : undefined}
      label="Revenue by day"
      data={days.map((day, i) => ({ day, revenue: takings[i] }))}
      index="day"
      series={[{ key: "revenue", label: "Revenue" }]}
      format={(n) => "$" + formatCompact(n)}
    />
  );
}

const signups = [
  { quarter: "Q1", web: 320, mobile: 210 },
  { quarter: "Q2", web: 410, mobile: 290 },
  { quarter: "Q3", web: 380, mobile: 350 },
  { quarter: "Q4", web: 520, mobile: 430 },
];

function BarChartDemo({ compact }: DemoProps) {
  return (
    <BarChart
      height={compact ? 170 : undefined}
      label="Signups by quarter"
      data={signups}
      index="quarter"
      series={[
        { key: "web", label: "Web" },
        { key: "mobile", label: "Mobile" },
      ]}
    />
  );
}

const plans = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((month, i) => ({
  month,
  free: [120, 150, 170, 165, 198, 230][i],
  pro: [40, 52, 61, 70, 84, 96][i],
  team: [12, 18, 25, 31, 36, 47][i],
}));

function StackedBarChartDemo({ compact }: DemoProps) {
  return (
    <StackedBarChart
      height={compact ? 170 : undefined}
      label="Accounts by plan"
      data={plans}
      index="month"
      series={[
        { key: "free", label: "Free" },
        { key: "pro", label: "Pro" },
        { key: "team", label: "Team" },
      ]}
    />
  );
}

const trends = [
  { name: "Signups", value: "1,284", data: [42, 51, 48, 62, 58, 71, 69, 84, 92, 88, 104, 118] },
  { name: "Active users", value: "8,920", data: [610, 640, 655, 630, 700, 720, 760, 745, 800, 830, 870, 892] },
  { name: "Refunds", value: "37", data: [9, 7, 8, 6, 7, 5, 6, 4, 5, 4, 3, 4], color: "var(--chart-4)" },
];

function SparklineDemo({ compact }: DemoProps) {
  return (
    <ul className="mx-auto flex w-full max-w-md flex-col divide-y divide-foreground/[0.06]">
      {trends.slice(0, compact ? 2 : 3).map((trend) => (
        <li key={trend.name} className="flex items-center gap-6 py-4">
          <div className="flex-1">
            <p className="text-sm font-semibold text-muted-foreground">{trend.name}</p>
            <p className="font-mono text-xl font-medium tabular-nums">{trend.value}</p>
          </div>
          <Sparkline className="w-36" label={`${trend.name} over twelve months`} labels={months} data={trend.data} color={trend.color} />
        </li>
      ))}
    </ul>
  );
}

const sources = [
  { label: "Direct", value: 4200 },
  { label: "Search", value: 3100 },
  { label: "Social", value: 1800 },
  { label: "Referral", value: 950 },
  { label: "Email", value: 620 },
];

function DonutChartDemo({ compact }: DemoProps) {
  return (
    <DonutChart
      label="Traffic by source"
      data={sources}
      totalLabel="Visits"
      className={compact ? "flex-nowrap gap-x-6 [&_ul]:min-w-0 [&_ul]:text-xs" : undefined}
    />
  );
}

function RadialProgressDemo({ compact }: DemoProps) {
  const size = compact ? "w-32" : "w-40";
  return (
    <div className="flex items-center justify-center gap-8">
      <RadialProgress className={size} label="Storage used" value={72} caption="Storage" />
      <RadialProgress className={size} label="Weekly goal" value={18} max={25} format={(n) => `${n}/25`} caption="Workouts" color="var(--chart-2)" />
    </div>
  );
}

// a fixed pseudo-random cloud so the server and client render the same dots
const cloud = (seed: number, count: number, slope: number) =>
  Array.from({ length: count }, (_, i) => {
    const noise = Math.sin(seed * 97 + i * 13.37) * 0.5 + 0.5;
    const load = 0.4 + ((i * 7 + seed * 3) % count) / count * 3.2;
    return { x: +load.toFixed(2), y: Math.round(Math.max(8, 88 - load * slope + (noise - 0.5) * 26)) };
  });

function ScatterChartDemo({ compact }: DemoProps) {
  return (
    <ScatterChart
      height={compact ? 170 : undefined}
      label="Load time against conversion"
      xLabel="Load time (s)"
      yLabel="Conversion"
      format={(n) => `${n}%`}
      formatX={(n) => `${n}s`}
      series={[
        { label: "Desktop", points: cloud(1, 22, 16) },
        { label: "Mobile", points: cloud(2, 22, 22) },
      ]}
    />
  );
}

const hours = Array.from({ length: 12 }, (_, i) => `${(i * 2).toString().padStart(2, "0")}h`);
const activity = days.map((_, d) =>
  hours.map((_, h) => {
    const daytime = Math.max(0, Math.sin(((h - 3) / 12) * Math.PI * 2) * 0.5 + Math.sin(((h - 2) / 12) * Math.PI) * 0.6);
    const weekend = d >= 5 ? 0.55 : 1;
    return Math.round((daytime * weekend + (Math.sin(d * 5 + h * 3) * 0.5 + 0.5) * 0.15) * 120);
  }),
);

function HeatmapDemo() {
  return <Heatmap label="Sessions by day and hour" rows={days} columns={hours} data={activity} />;
}

function StatTileDemo({ compact }: DemoProps) {
  return (
    <div className={compact ? "grid w-full max-w-64 [&>:nth-child(2)]:hidden" : "grid w-full gap-3 sm:grid-cols-2"}>
      <StatTile
        label="Revenue"
        value={48210}
        change={12.4}
        caption="vs last month"
        trend={[31, 34, 33, 38, 41, 40, 46, 48]}
        format={(n) => "$" + Math.round(n).toLocaleString("en-US")}
        className="bg-background"
      />
      <StatTile
        label="Churn"
        value={2.1}
        change={-0.6}
        caption="vs last month"
        invert
        trend={[3.1, 2.9, 3, 2.7, 2.5, 2.4, 2.2, 2.1]}
        format={(n) => `${n.toFixed(1)}%`}
        color="var(--chart-4)"
        className="bg-background"
      />
    </div>
  );
}

const focus = days.map((day, i) => ({ day, hours: [5.2, 6.8, 4.9, 7.6, 6.1, 2.4, 1.8][i] }));

function PillBarChartDemo({ compact }: DemoProps) {
  return (
    <PillBarChart
      height={compact ? 170 : undefined}
      label="Focus hours by day"
      data={focus}
      index="day"
      series={[{ key: "hours", label: "Hours" }]}
      format={(n) => `${n}h`}
      highlight={3}
    />
  );
}

export const DEMOS: Record<string, ComponentType<DemoProps>> = {
  "pill-bar-chart": PillBarChartDemo,
  "stat-tile": StatTileDemo,
  heatmap: HeatmapDemo,
  "scatter-chart": ScatterChartDemo,
  "radial-progress": RadialProgressDemo,
  "donut-chart": DonutChartDemo,
  sparkline: SparklineDemo,
  "stacked-bar-chart": StackedBarChartDemo,
  "line-chart": LineChartDemo,
  "area-chart": AreaChartDemo,
  "bar-chart": BarChartDemo,
};

export default function ChartDemo({ slug, compact }: { slug: string } & DemoProps) {
  const Demo = DEMOS[slug];
  return Demo ? <Demo compact={compact} /> : null;
}
