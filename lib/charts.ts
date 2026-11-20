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
  chart("sparkline", {
    name: "Sparkline",
    category: "trends",
    description: "A tiny line with no axes that shows a trend at a glance.",
    interaction:
      "The line draws in and a dot settles on the latest value. Hover or tab in to read any point; the arrow keys step through them. A hidden table carries every value for screen readers. Honors prefers-reduced-motion: the line appears at once.",
    props: [
      {
        name: "data",
        type: "number[]",
        required: true,
        description: "The values, oldest first.",
      },
      {
        name: "labels",
        type: "string[]",
        description: "A label for each value, shown in the tooltip. Without it the tooltip shows only the value.",
      },
      labelProp,
      {
        name: "color",
        type: "string",
        default: '"var(--brand)"',
        description: "Any CSS color for the line and its fill.",
      },
      {
        name: "height",
        type: "number",
        default: "48",
        description: "Height in pixels. The width fills the parent.",
      },
      formatProp,
      classNameProp,
    ],
    usage: `import { Sparkline } from "@/components/ui/sparkline"

export function Demo() {
  return (
    <div className="w-40">
      <Sparkline label="Signups this week" data={[12, 18, 15, 22, 27, 24, 31]} />
    </div>
  )
}`,
  }),
  chart("donut-chart", {
    name: "Donut Chart",
    category: "composition",
    description: "A ring split into slices that shows how a total breaks down.",
    interaction:
      "The ring sweeps in clockwise, slice by slice. Hover a slice or its legend row, or tab in and use the arrow keys, and the slice lifts while the center shows its value and share. A hidden table carries every value for screen readers. Honors prefers-reduced-motion: the ring appears at once.",
    props: [
      {
        name: "data",
        type: "{ label: string; value: number; color?: string }[]",
        required: true,
        description: "One entry per slice. Colors follow the chart palette in order unless you set one.",
      },
      labelProp,
      formatProp,
      {
        name: "thickness",
        type: "number",
        default: "26",
        description: "Width of the ring, on a 200 unit wide chart.",
      },
      {
        name: "totalLabel",
        type: "string",
        default: '"Total"',
        description: "The caption under the total in the center.",
      },
      classNameProp,
    ],
    usage: `import { DonutChart } from "@/components/ui/donut-chart"

const data = [
  { label: "Direct", value: 4200 },
  { label: "Search", value: 3100 },
  { label: "Social", value: 1800 },
]

export function Demo() {
  return <DonutChart label="Traffic by source" data={data} totalLabel="Visits" />
}`,
  }),
  chart("radial-progress", {
    name: "Radial Progress",
    category: "composition",
    description: "A ring that fills toward a goal, with the value in its center.",
    interaction:
      "The ring sweeps round to its value as the number counts up beside it. Screen readers hear it as a meter with its value. Honors prefers-reduced-motion: the ring and number appear at once.",
    props: [
      {
        name: "value",
        type: "number",
        required: true,
        description: "The current value. It is clamped between 0 and max.",
      },
      {
        name: "max",
        type: "number",
        default: "100",
        description: "The value that fills the ring.",
      },
      {
        name: "label",
        type: "string",
        required: true,
        description: "Names the meter for screen readers.",
      },
      {
        name: "caption",
        type: "string",
        description: "A short line under the value.",
      },
      {
        name: "format",
        type: "(value: number) => string",
        description: "Formats the center value. Without it the ring shows a percentage.",
      },
      {
        name: "color",
        type: "string",
        default: '"var(--brand)"',
        description: "Any CSS color for the filled part of the ring.",
      },
      {
        name: "thickness",
        type: "number",
        default: "10",
        description: "Width of the ring, on a 100 unit wide meter.",
      },
      classNameProp,
    ],
    usage: `import { RadialProgress } from "@/components/ui/radial-progress"

export function Demo() {
  return <RadialProgress label="Storage used" value={72} caption="of 50 GB" />
}`,
  }),
  chart("scatter-chart", {
    name: "Scatter Chart",
    category: "comparison",
    description: "A dot plot that shows how two measures relate across many items.",
    interaction:
      "The dots pop in from left to right. Hover near a dot, or tab in and use the arrow keys, and it grows while a soft tooltip reads both of its values. A hidden table carries every point for screen readers. Honors prefers-reduced-motion: the dots appear at once.",
    props: [
      {
        name: "series",
        type: "{ label: string; color?: string; points: { x: number; y: number; label?: string }[] }[]",
        required: true,
        description: "Groups of points. Colors follow the chart palette in order unless you set one.",
      },
      labelProp,
      {
        name: "xLabel",
        type: "string",
        default: '"x"',
        description: "Names the horizontal measure under the axis and in the tooltip.",
      },
      {
        name: "yLabel",
        type: "string",
        default: '"y"',
        description: "Names the vertical measure in the tooltip.",
      },
      {
        name: "height",
        type: "number",
        default: "280",
        description: "Height in pixels. The width fills the parent.",
      },
      formatProp,
      {
        name: "formatX",
        type: "(value: number) => string",
        default: "compact",
        description: "Formats horizontal values, like format does for vertical ones.",
      },
      classNameProp,
    ],
    usage: `import { ScatterChart } from "@/components/ui/scatter-chart"

const series = [
  {
    label: "Pages",
    points: [
      { x: 1.2, y: 64, label: "Home" },
      { x: 2.8, y: 41, label: "Pricing" },
      { x: 0.6, y: 82, label: "Docs" },
    ],
  },
]

export function Demo() {
  return <ScatterChart label="Load time against conversion" series={series} xLabel="Load (s)" yLabel="Conversion" />
}`,
  }),
  chart("heatmap", {
    name: "Heatmap",
    category: "comparison",
    description: "A grid of soft cells whose shade shows each value.",
    interaction:
      "The cells fade in from the top left corner. Hover a cell, or tab in and use the arrow keys to move across and down, and a soft tooltip reads its row, column and value. A hidden table carries every value for screen readers. Honors prefers-reduced-motion: the grid appears at once.",
    props: [
      {
        name: "data",
        type: "number[][]",
        required: true,
        description: "One array of values per row, in column order.",
      },
      {
        name: "rows",
        type: "string[]",
        required: true,
        description: "Labels down the left side.",
      },
      {
        name: "columns",
        type: "string[]",
        required: true,
        description: "Labels across the top. Some are skipped when the grid is too narrow to fit them all.",
      },
      labelProp,
      formatProp,
      {
        name: "color",
        type: "string",
        default: '"var(--brand)"',
        description: "Any CSS color. The lowest value shows a faint tint of it and the highest shows it in full.",
      },
      {
        name: "gap",
        type: "number",
        default: "3",
        description: "Space between cells in pixels.",
      },
      classNameProp,
    ],
    usage: `import { Heatmap } from "@/components/ui/heatmap"

export function Demo() {
  return (
    <Heatmap
      label="Orders by day and shift"
      rows={["Mon", "Tue", "Wed"]}
      columns={["Morning", "Noon", "Evening"]}
      data={[
        [12, 30, 18],
        [9, 26, 22],
        [14, 34, 27],
      ]}
    />
  )
}`,
  }),
];
