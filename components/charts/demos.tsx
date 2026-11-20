"use client";

import type { ComponentType } from "react";
import { formatCompact } from "@/lib/chart";
import { AreaChart } from "@/components/ui/area-chart";
import { BarChart } from "@/components/ui/bar-chart";
import { LineChart } from "@/components/ui/line-chart";
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

export const DEMOS: Record<string, ComponentType> = {
  "stacked-bar-chart": StackedBarChartDemo,
  "line-chart": LineChartDemo,
  "area-chart": AreaChartDemo,
  "bar-chart": BarChartDemo,
};

export default function ChartDemo({ slug }: { slug: string }) {
  const Demo = DEMOS[slug];
  return Demo ? <Demo /> : null;
}
