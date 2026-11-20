import type { ComponentItem, ComponentProp } from "@/lib/components";
import { SITE_REPO } from "@/lib/site";

const chart = (
  slug: string,
  item: Omit<ComponentItem, "href" | "registry" | "source" | "released">,
): ComponentItem => ({
  href: `/charts/${slug}`,
  registry: slug,
  source: `${SITE_REPO}/blob/main/components/ui/${slug}.tsx`,
  released: "2026-11-21",
  ...item,
});

const classNameProp: ComponentProp = {
  name: "className",
  type: "string",
  description: "Merged onto the root element.",
};

const labelProp: ComponentProp = {
  name: "label",
  type: "string",
  required: true,
  description: "Names the chart for screen readers and captions its data table.",
};

const formatProp: ComponentProp = {
  name: "format",
  type: "(value: number) => string",
  default: "compact",
  description: "Formats values on the axis and in the tooltip. Defaults to short numbers like 12.4K.",
};

const cartesianProps: ComponentProp[] = [
  {
    name: "data",
    type: "Record<string, string | number>[]",
    required: true,
    description: "One object per point along the x axis.",
  },
  {
    name: "index",
    type: "string",
    required: true,
    description: "The key in each object that labels the x axis.",
  },
  {
    name: "series",
    type: "{ key: string; label?: string; color?: string }[]",
    required: true,
    description: "The keys to plot. Colors follow the chart palette in order unless you set one.",
  },
  labelProp,
  {
    name: "height",
    type: "number",
    default: "240",
    description: "Height in pixels. The width fills the parent.",
  },
  formatProp,
];

const cartesianInteraction = (marks: string) =>
  `Hover or tab into the chart to read ${marks} in a soft tooltip; the arrow keys step through them and Escape lets go. A hidden table carries every value for screen readers. Honors prefers-reduced-motion: the chart appears without drawing in.`;

export const charts: ComponentItem[] = [
  chart("line-chart", {
    name: "Line Chart",
    category: "trends",
    description: "A smooth line chart for one or more series over time.",
    interaction: `The lines draw themselves in from left to right. ${cartesianInteraction("each point")}`,
    props: [
      ...cartesianProps,
      {
        name: "curve",
        type: '"smooth" | "linear"',
        default: '"smooth"',
        options: ["smooth", "linear"],
        description: "Smooth bends through every point without overshooting it; linear joins them with straight lines.",
      },
      classNameProp,
    ],
    usage: `import { LineChart } from "@/components/ui/line-chart"

const data = [
  { month: "Jan", visits: 1200 },
  { month: "Feb", visits: 1900 },
  { month: "Mar", visits: 1600 },
]

export function Demo() {
  return (
    <LineChart
      label="Visits by month"
      data={data}
      index="month"
      series={[{ key: "visits", label: "Visits" }]}
    />
  )
}`,
  }),
  chart("area-chart", {
    name: "Area Chart",
    category: "trends",
    description: "A line chart with a soft fill that fades down to its baseline.",
    interaction: `The lines draw in and the fill rises softly beneath them. ${cartesianInteraction("each point")}`,
    props: [
      ...cartesianProps,
      {
        name: "curve",
        type: '"smooth" | "linear"',
        default: '"smooth"',
        options: ["smooth", "linear"],
        description: "Smooth bends through every point without overshooting it; linear joins them with straight lines.",
      },
      classNameProp,
    ],
    usage: `import { AreaChart } from "@/components/ui/area-chart"

const data = [
  { day: "Mon", revenue: 4200 },
  { day: "Tue", revenue: 5100 },
  { day: "Wed", revenue: 4800 },
]

export function Demo() {
  return (
    <AreaChart
      label="Revenue by day"
      data={data}
      index="day"
      series={[{ key: "revenue", label: "Revenue" }]}
      format={(n) => "$" + n.toLocaleString()}
    />
  )
}`,
  }),
  chart("bar-chart", {
    name: "Bar Chart",
    category: "comparison",
    description: "A bar chart with soft rounded ends, grouped when there are several series.",
    interaction: `The bars rise from the baseline one after another. ${cartesianInteraction("each group of bars")} The group you are reading stays bright while the rest fade back.`,
    props: [
      ...cartesianProps,
      {
        name: "radius",
        type: "number",
        default: "6",
        description: "Corner radius at the value end of each bar. It shrinks to fit thin or short bars.",
      },
      classNameProp,
    ],
    usage: `import { BarChart } from "@/components/ui/bar-chart"

const data = [
  { quarter: "Q1", web: 320, mobile: 210 },
  { quarter: "Q2", web: 410, mobile: 290 },
  { quarter: "Q3", web: 380, mobile: 350 },
]

export function Demo() {
  return (
    <BarChart
      label="Signups by quarter"
      data={data}
      index="quarter"
      series={[
        { key: "web", label: "Web" },
        { key: "mobile", label: "Mobile" },
      ]}
    />
  )
}`,
  }),
  chart("stacked-bar-chart", {
    name: "Stacked Bar Chart",
    category: "comparison",
    description: "A bar chart that stacks each series into one column per label.",
    interaction: `Each column builds upward, one after another, with a thin gap between its parts. ${cartesianInteraction("each column and its total")}`,
    props: [
      ...cartesianProps.map((prop) =>
        prop.name === "series" ? { ...prop, description: `${prop.description} Negative values count as zero.` } : prop,
      ),
      {
        name: "radius",
        type: "number",
        default: "6",
        description: "Corner radius at the top of each column. It shrinks to fit a short column.",
      },
      classNameProp,
    ],
    usage: `import { StackedBarChart } from "@/components/ui/stacked-bar-chart"

const data = [
  { month: "Jan", free: 120, pro: 40, team: 12 },
  { month: "Feb", free: 150, pro: 52, team: 18 },
  { month: "Mar", free: 170, pro: 61, team: 25 },
]

export function Demo() {
  return (
    <StackedBarChart
      label="Plans by month"
      data={data}
      index="month"
      series={[
        { key: "free", label: "Free" },
        { key: "pro", label: "Pro" },
        { key: "team", label: "Team" },
      ]}
    />
  )
}`,
  }),
];
