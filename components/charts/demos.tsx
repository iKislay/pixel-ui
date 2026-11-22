"use client";

import { useEffect, useRef, type ComponentType } from "react";

type DemoProps = { compact?: boolean };
import { formatCompact } from "@/lib/chart";
import { AreaChart } from "@/components/ui/area-chart";
import { BarChart } from "@/components/ui/bar-chart";
import { DonutChart } from "@/components/ui/donut-chart";
import { PillBarChart } from "@/components/ui/pill-bar-chart";
import { HorizontalBarChart } from "@/components/ui/horizontal-bar-chart";
import { LollipopChart } from "@/components/ui/lollipop-chart";
import { DotMatrixChart } from "@/components/ui/dot-matrix-chart";
import { CombChart } from "@/components/ui/comb-chart";
import { Gauge } from "@/components/ui/gauge";
import { ActivityRings } from "@/components/ui/activity-rings";
import { SegmentedBar } from "@/components/ui/segmented-bar";
import { WaffleChart } from "@/components/ui/waffle-chart";
import { RadarChart } from "@/components/ui/radar-chart";
import { FunnelChart } from "@/components/ui/funnel-chart";
import { CalendarHeatmap } from "@/components/ui/calendar-heatmap";
import { SankeyChart } from "@/components/ui/sankey-chart";
import { FlowHub } from "@/components/ui/flow-hub";
import { GanttChart } from "@/components/ui/gantt-chart";
import { RoseChart } from "@/components/ui/rose-chart";
import { RadialBarChart } from "@/components/ui/radial-bar-chart";
import { RangeChart } from "@/components/ui/range-chart";
import { ThresholdChart } from "@/components/ui/threshold-chart";
import { Heatmap } from "@/components/ui/heatmap";
import { LineChart } from "@/components/ui/line-chart";
import { RadialProgress } from "@/components/ui/radial-progress";
import { ScatterChart } from "@/components/ui/scatter-chart";
import { Sparkline } from "@/components/ui/sparkline";
import { StackedBarChart } from "@/components/ui/stacked-bar-chart";
import { StatTile } from "@/components/ui/stat-tile";
import { TickTape, type TickTapeHandle } from "@/components/ui/tick-tape";

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

const countries = [
  { label: "United States", value: 4120 },
  { label: "Germany", value: 2380 },
  { label: "India", value: 1960 },
  { label: "Brazil", value: 1240 },
  { label: "Japan", value: 860 },
];

function HorizontalBarChartDemo({ compact }: DemoProps) {
  return (
    <HorizontalBarChart
      className="mx-auto max-w-md"
      label="Visitors by country"
      data={compact ? countries.slice(0, 4) : countries}
    />
  );
}

const teams = [
  { team: "Design", now: 82, before: 70 },
  { team: "Support", now: 91, before: 84 },
  { team: "Sales", now: 74, before: 78 },
  { team: "Product", now: 88, before: 72 },
  { team: "Ops", now: 69, before: 61 },
];

function LollipopChartDemo({ compact }: DemoProps) {
  return (
    <LollipopChart
      height={compact ? 170 : undefined}
      label="Satisfaction by team"
      data={teams}
      index="team"
      series={[
        { key: "now", label: "This quarter" },
        { key: "before", label: "Last quarter" },
      ]}
    />
  );
}

const requests = ["08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19"].map((hour, i) => ({
  hour,
  reads: [8, 18, 26, 22, 30, 24, 34, 38, 29, 21, 14, 9][i],
  writes: [3, 6, 9, 12, 8, 10, 14, 11, 12, 8, 5, 4][i],
}));

function DotMatrixChartDemo({ compact }: DemoProps) {
  return (
    <DotMatrixChart
      height={compact ? 170 : undefined}
      rows={compact ? 10 : 14}
      label="Requests by hour"
      data={requests}
      index="hour"
      series={[
        { key: "reads", label: "Reads" },
        { key: "writes", label: "Writes" },
      ]}
    />
  );
}

const commits = Array.from({ length: 36 }, (_, i) => ({
  day: `Day ${i + 1}`,
  commits: Math.round(6 + Math.sin(i * 0.55) * 3 + Math.sin(i * 1.7) * 2 + i * 0.18),
}));

function CombChartDemo({ compact }: DemoProps) {
  return (
    <CombChart
      height={compact ? 170 : undefined}
      label="Commits per day"
      data={commits}
      index="day"
      series={[{ key: "commits", label: "Commits" }]}
    />
  );
}

function GaugeDemo({ compact }: DemoProps) {
  return (
    <div className="flex items-center justify-center gap-8">
      <Gauge label="Server load" value={68} caption="CPU load" format={(n) => `${Math.round(n)}%`} />
      {!compact && (
        <Gauge
          label="Response time"
          value={182}
          max={400}
          caption="Response, ms"
          color="var(--chart-2)"
          format={(n) => `${Math.round(n)}`}
        />
      )}
    </div>
  );
}

const goals = [
  { label: "Move", value: 420, max: 600 },
  { label: "Exercise", value: 24, max: 30 },
  { label: "Stand", value: 9, max: 12 },
];

function ActivityRingsDemo({ compact }: DemoProps) {
  return (
    <ActivityRings
      label="Today's goals"
      data={goals}
      className={compact ? "flex-nowrap gap-x-6 [&_svg]:max-w-36 [&_ul]:min-w-0 [&_ul]:text-xs" : undefined}
    />
  );
}

const storage = [
  { label: "Photos", value: 48 },
  { label: "Apps", value: 31 },
  { label: "Music", value: 12 },
  { label: "Mail", value: 6 },
  { label: "Other", value: 9 },
];

function SegmentedBarDemo() {
  return <SegmentedBar className="mx-auto max-w-md" label="Storage by type" data={storage} format={(n) => `${n} GB`} />;
}

const renewals = [
  { label: "Renewed", value: 62 },
  { label: "Upgraded", value: 14 },
  { label: "Paused", value: 7 },
];

function WaffleChartDemo({ compact }: DemoProps) {
  return (
    <WaffleChart
      label="Subscriptions this year"
      data={renewals}
      total={100}
      format={(n) => `${n}`}
      className={compact ? "flex-nowrap gap-x-6 [&>div]:max-w-36 [&_ul]:min-w-0 [&_ul]:text-xs" : undefined}
    />
  );
}

const plansCompared = [
  { skill: "Speed", pro: 82, free: 60 },
  { skill: "Storage", pro: 90, free: 40 },
  { skill: "Support", pro: 75, free: 35 },
  { skill: "Sharing", pro: 88, free: 70 },
  { skill: "Search", pro: 70, free: 55 },
  { skill: "Privacy", pro: 84, free: 62 },
];

function RadarChartDemo({ compact }: DemoProps) {
  return (
    <RadarChart
      curve="smooth"
      grid="polygon"
      className={compact ? "[&>div]:max-w-52" : undefined}
      label="Plans compared"
      data={plansCompared}
      index="skill"
      series={[
        { key: "pro", label: "Pro" },
        { key: "free", label: "Free" },
      ]}
    />
  );
}

const funnel = [
  { label: "Visited", value: 12400 },
  { label: "Signed up", value: 3100 },
  { label: "Activated", value: 1820 },
  { label: "Paid", value: 640 },
];

function FunnelChartDemo({ compact }: DemoProps) {
  return <FunnelChart className="mx-auto max-w-md" label="Signup funnel" data={compact ? funnel.slice(0, 3) : funnel} />;
}

const contributions = Array.from({ length: 26 * 7 - 3 }, (_, i) => {
  const date = new Date(Date.UTC(2026, 4, 4) + i * 86_400_000).toISOString().slice(0, 10);
  const weekday = i % 7;
  const wave = Math.sin(i * 0.11) * 0.5 + 0.5;
  const noise = Math.sin(i * 12.9898) * 0.5 + 0.5;
  return { date, value: weekday >= 5 ? Math.round(noise * 3) : Math.round(wave * 8 + noise * 6) };
});

function CalendarHeatmapDemo({ compact }: DemoProps) {
  return <CalendarHeatmap label="Contributions over six months" data={compact ? contributions.slice(-18 * 7) : contributions} />;
}

const budgetNodes = [
  { id: "salary", label: "Salary" },
  { id: "freelance", label: "Freelance" },
  { id: "dividends", label: "Dividends" },
  { id: "income", label: "Income" },
  { id: "home", label: "Home" },
  { id: "food", label: "Food" },
  { id: "travel", label: "Travel" },
  { id: "savings", label: "Savings" },
];

const budgetLinks = [
  { source: "salary", target: "income", value: 4200 },
  { source: "freelance", target: "income", value: 1300 },
  { source: "dividends", target: "income", value: 500 },
  { source: "income", target: "home", value: 1900 },
  { source: "income", target: "food", value: 900 },
  { source: "income", target: "travel", value: 700 },
  { source: "income", target: "savings", value: 2500 },
];

function SankeyChartDemo({ compact }: DemoProps) {
  return (
    <SankeyChart
      height={compact ? 190 : undefined}
      label="Monthly budget"
      nodes={budgetNodes}
      links={budgetLinks}
      format={(n) => "$" + formatCompact(n)}
    />
  );
}

const hubInputs = [
  { label: "Business", value: 22987 },
  { label: "Presentation", value: 14641 },
  { label: "Finance", value: 12657 },
  { label: "Development", value: 23054 },
];

const hubOutputs = [
  { label: "Investments", value: 28644 },
  { label: "Startups", value: 15752 },
  { label: "Operations", value: 9101 },
  { label: "Reserves", value: 19842 },
];

function FlowHubDemo({ compact }: DemoProps) {
  return (
    <FlowHub
      height={compact ? 200 : undefined}
      label="Sales by source and destination"
      totalLabel="Total sales"
      inputs={hubInputs}
      outputs={hubOutputs}
      format={(n) => "$" + formatCompact(n)}
    />
  );
}

const plan = [
  { label: "Research", start: 8, end: 9.5, progress: 1 },
  { label: "Design", start: 8.5, end: 10.5, progress: 1 },
  { label: "Design", start: 12, end: 14, progress: 0.3 },
  { label: "Build", start: 10, end: 12.5, progress: 0.77 },
  { label: "Build", start: 14, end: 16.5, progress: 0.76 },
  { label: "Review", start: 13, end: 14.5, progress: 1 },
  { label: "Launch", start: 15.5, end: 19, progress: 0.81 },
];

const hour = (h: number) => `${Math.floor(h) % 12 || 12}${h < 12 ? "am" : "pm"}`;

function GanttChartDemo({ compact }: DemoProps) {
  return (
    <GanttChart
      label="Today's plan"
      tasks={compact ? plan.slice(0, 5) : plan}
      formatTime={hour}
      rowHeight={compact ? 32 : undefined}
    />
  );
}

const moods = [
  { label: "Happy", value: 12 },
  { label: "Calm", value: 7 },
  { label: "Excited", value: 10 },
  { label: "Curious", value: 5 },
  { label: "Tired", value: 4 },
  { label: "Proud", value: 9 },
];

function RoseChartDemo({ compact }: DemoProps) {
  return (
    <RoseChart
      label="How the release felt"
      data={moods}
      format={(n) => `${n}`}
      className={compact ? "flex-nowrap gap-x-6 [&>div]:max-w-40 [&_ul]:min-w-0 [&_ul]:text-xs" : undefined}
    />
  );
}

const byHour = Array.from({ length: 24 }, (_, hour) => ({
  hour: `${hour}:00`,
  orders: Math.round(Math.max(4, 26 + 22 * Math.sin((hour - 9) / 3.8) + 6 * Math.sin(hour * 1.3))),
}));

function RadialBarChartDemo({ compact }: DemoProps) {
  return (
    <RadialBarChart
      className={compact ? "[&>div]:max-w-48" : undefined}
      label="Orders by hour"
      data={byHour}
      index="hour"
      value="orders"
      totalLabel="Orders today"
    />
  );
}

const activeRange = Array.from({ length: 14 }, (_, i) => {
  const mid = 210 + Math.sin(i * 0.7) * 40 + i * 3;
  const spread = 30 + Math.abs(Math.sin(i * 1.9)) * 55;
  return { day: `Feb ${i + 1}`, min: Math.round(mid - spread), max: Math.round(mid + spread) };
});

function RangeChartDemo({ compact }: DemoProps) {
  return (
    <RangeChart
      height={compact ? 170 : undefined}
      label="Daily active users, lowest to highest"
      data={activeRange}
      index="day"
      low="min"
      high="max"
    />
  );
}

const latency = Array.from({ length: 30 }, (_, i) => ({
  day: `Oct ${i + 1}`,
  p95: Math.round(180 + 60 * Math.sin(i / 3.1) + 45 * Math.sin(i * 1.7) + (i % 9 === 4 ? 140 : 0)),
}));

function ThresholdChartDemo({ compact }: DemoProps) {
  return (
    <ThresholdChart
      height={compact ? 170 : undefined}
      label="p95 latency in ms, last 30 days"
      data={latency}
      index="day"
      value="p95"
      valueLabel="p95"
      defaultThreshold={300}
      caption="days would have alerted"
    />
  );
}

const routes = ["GET /orders", "GET /users", "POST /checkout", "GET /search"];

function TickTapeDemo({ compact }: DemoProps) {
  const tape = useRef<TickTapeHandle>(null);
  useEffect(() => {
    let timer = 0;
    const tick = () => {
      const error = Math.random() < 0.04;
      const route = routes[Math.floor(Math.random() * routes.length)];
      tape.current?.push({
        value: error ? 400 + Math.random() * 600 : 30 + Math.random() ** 3 * 480,
        error,
        label: `${route} · ${error ? 500 : 200}`,
      });
      timer = window.setTimeout(tick, 60 + Math.random() * 240);
    };
    tick();
    return () => window.clearTimeout(timer);
  }, []);
  return <TickTape ref={tape} label="Requests" height={compact ? 80 : undefined} className="bg-background" />;
}

export const DEMOS: Record<string, ComponentType<DemoProps>> = {
  "tick-tape": TickTapeDemo,
  "threshold-chart": ThresholdChartDemo,
  "range-chart": RangeChartDemo,
  "radial-bar-chart": RadialBarChartDemo,
  "rose-chart": RoseChartDemo,
  "gantt-chart": GanttChartDemo,
  "flow-hub": FlowHubDemo,
  "sankey-chart": SankeyChartDemo,
  "calendar-heatmap": CalendarHeatmapDemo,
  "funnel-chart": FunnelChartDemo,
  "radar-chart": RadarChartDemo,
  "waffle-chart": WaffleChartDemo,
  "segmented-bar": SegmentedBarDemo,
  "activity-rings": ActivityRingsDemo,
  "gauge": GaugeDemo,
  "comb-chart": CombChartDemo,
  "dot-matrix-chart": DotMatrixChartDemo,
  "lollipop-chart": LollipopChartDemo,
  "horizontal-bar-chart": HorizontalBarChartDemo,
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
