"use client";

import type { ComponentType } from "react";
import { formatCompact } from "@/lib/chart";
import { AreaChart } from "@/components/ui/area-chart";
import { BarChart } from "@/components/ui/bar-chart";
import { DonutChart } from "@/components/ui/donut-chart";
import { LineChart } from "@/components/ui/line-chart";
import { RadialProgress } from "@/components/ui/radial-progress";
import { Sparkline } from "@/components/ui/sparkline";
import { StackedBarChart } from "@/components/ui/stacked-bar-chart";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const visitors = [1840, 2120, 1980, 2640, 3010, 2870, 3320, 3580, 3410, 3960, 4280, 4620];
const returning = [920, 1010, 1140, 1180, 1360, 1490, 1520, 1710, 1840, 1900, 2150, 2380];
const traffic = months.map((month, i) => ({ month, visitors: visitors[i], returning: returning[i] }));

function LineChartDemo() {
  return (
    <LineChart
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

function AreaChartDemo() {
  return (
    <AreaChart
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

function BarChartDemo() {
  return (
    <BarChart
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

function StackedBarChartDemo() {
  return (
    <StackedBarChart
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

function SparklineDemo() {
  return (
    <ul className="mx-auto flex w-full max-w-md flex-col divide-y divide-foreground/[0.06]">
      {trends.map((trend) => (
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

function DonutChartDemo() {
  return <DonutChart label="Traffic by source" data={sources} totalLabel="Visits" />;
}

function RadialProgressDemo() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-8">
      <RadialProgress className="w-40" label="Storage used" value={72} caption="Storage" />
      <RadialProgress className="w-40" label="Weekly goal" value={18} max={25} format={(n) => `${n}/25`} caption="Workouts" color="var(--chart-2)" />
    </div>
  );
}

export const DEMOS: Record<string, ComponentType> = {
  "radial-progress": RadialProgressDemo,
  "donut-chart": DonutChartDemo,
  sparkline: SparklineDemo,
  "stacked-bar-chart": StackedBarChartDemo,
  "line-chart": LineChartDemo,
  "area-chart": AreaChartDemo,
  "bar-chart": BarChartDemo,
};

export default function ChartDemo({ slug }: { slug: string }) {
  const Demo = DEMOS[slug];
  return Demo ? <Demo /> : null;
}
