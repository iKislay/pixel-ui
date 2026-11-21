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
  description: "Formats values wherever the chart shows them. Defaults to short numbers like 12.4K.",
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
    description: "A ring of soft rounded slices that shows how a total breaks down.",
    interaction:
      "The ring sweeps in clockwise as soft, round-ended slices. Hover a slice or its legend row, or tab in and use the arrow keys, and the slice thickens while the center shows its value and share. A hidden table carries every value for screen readers. Honors prefers-reduced-motion: the ring appears at once.",
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
        default: "24",
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
    category: "progress",
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
  chart("stat-tile", {
    name: "Stat Tile",
    category: "trends",
    description: "A soft card with one headline number, its change and a small trend line.",
    interaction:
      "The number counts up while the trend line draws in beside it. The change shows an arrow and a sign as well as a color, so it never relies on color alone. Screen readers hear the label, value and change as one sentence. Honors prefers-reduced-motion: everything appears at once.",
    props: [
      {
        name: "label",
        type: "string",
        required: true,
        description: "What the number measures.",
      },
      {
        name: "value",
        type: "number",
        required: true,
        description: "The headline number.",
      },
      {
        name: "change",
        type: "number",
        description: "The change in percent, like 12.4 or -3. Hidden when unset.",
      },
      {
        name: "caption",
        type: "string",
        description: "A short note after the change, like vs last month.",
      },
      {
        name: "trend",
        type: "number[]",
        description: "Recent values, oldest first, drawn as a small line beside the number.",
      },
      {
        name: "format",
        type: "(value: number) => string",
        default: "compact",
        description: "Formats the headline number. Defaults to short numbers like 12.4K.",
      },
      {
        name: "invert",
        type: "boolean",
        default: "false",
        description: "Treats a fall as good news, for measures like churn or load time.",
      },
      {
        name: "color",
        type: "string",
        default: '"var(--brand)"',
        description: "Any CSS color for the trend line.",
      },
      classNameProp,
    ],
    usage: `import { StatTile } from "@/components/ui/stat-tile"

export function Demo() {
  return (
    <StatTile
      label="Revenue"
      value={48210}
      change={12.4}
      caption="vs last month"
      trend={[31, 34, 33, 38, 41, 40, 46, 48]}
      format={(n) => "$" + Math.round(n).toLocaleString()}
    />
  )
}`,
  }),
  chart("pill-bar-chart", {
    name: "Pill Bar Chart",
    category: "comparison",
    description: "Rounded pill bars with one bar lit and the rest softly hatched.",
    interaction: `The pills rise one after another and the lit bar wears its value in a small tag. ${cartesianInteraction("each bar")} The bar you are reading lights up and the others fall back to hatching.`,
    props: [
      ...cartesianProps,
      {
        name: "highlight",
        type: "number",
        description: "Index of the bar to light when nothing is hovered. Defaults to the last one.",
      },
      classNameProp,
    ],
    usage: `import { PillBarChart } from "@/components/ui/pill-bar-chart"

const data = [
  { day: "Mon", hours: 5.2 },
  { day: "Tue", hours: 6.8 },
  { day: "Wed", hours: 4.9 },
]

export function Demo() {
  return (
    <PillBarChart
      label="Focus hours by day"
      data={data}
      index="day"
      series={[{ key: "hours", label: "Hours" }]}
      highlight={1}
    />
  )
}`,
  }),
  chart("horizontal-bar-chart", {
    name: "Horizontal Bar Chart",
    category: "comparison",
    description: "A ranked list of labelled bars that fill along soft rounded tracks.",
    interaction:
      "The bars fill from the left one after another. Hover a row and the others fade back. Every label and value is plain text, so screen readers read it as a list. Honors prefers-reduced-motion: the bars appear filled.",
    props: [
      {
        name: "data",
        type: "{ label: string; value: number; color?: string }[]",
        required: true,
        description: "One row per entry, drawn in the order given.",
      },
      labelProp,
      formatProp,
      {
        name: "max",
        type: "number",
        description: "The value that fills a track. Defaults to the largest value.",
      },
      {
        name: "color",
        type: "string",
        default: '"var(--brand)"',
        description: "Any CSS color for the bars. A row's own color wins.",
      },
      classNameProp,
    ],
    usage: `import { HorizontalBarChart } from "@/components/ui/horizontal-bar-chart"

const data = [
  { label: "United States", value: 4120 },
  { label: "Germany", value: 2380 },
  { label: "India", value: 1960 },
]

export function Demo() {
  return <HorizontalBarChart label="Visitors by country" data={data} />
}`,
  }),
  chart("lollipop-chart", {
    name: "Lollipop Chart",
    category: "comparison",
    description: "Thin stems topped with dots, a lighter take on the bar chart.",
    interaction: `Each dot rises on its stem from the baseline, one after another. ${cartesianInteraction("each stem")} The stem you are reading stays bright and its dot grows.`,
    props: [...cartesianProps, classNameProp],
    usage: `import { LollipopChart } from "@/components/ui/lollipop-chart"

const data = [
  { team: "Design", score: 82 },
  { team: "Support", score: 91 },
  { team: "Sales", score: 74 },
]

export function Demo() {
  return (
    <LollipopChart
      label="Satisfaction by team"
      data={data}
      index="team"
      series={[{ key: "score", label: "Score" }]}
    />
  )
}`,
  }),
  chart("dot-matrix-chart", {
    name: "Dot Matrix Chart",
    category: "comparison",
    description: "Columns of small dots that light up from the bottom, stacked by series.",
    interaction: `The dots light up from the bottom, column by column, like a pixel display. ${cartesianInteraction("each column and its total")}`,
    props: [
      ...cartesianProps,
      {
        name: "rows",
        type: "number",
        default: "12",
        description: "Dots per column. Each dot stands for the same amount, so fewer rows means coarser steps.",
      },
      classNameProp,
    ],
    usage: `import { DotMatrixChart } from "@/components/ui/dot-matrix-chart"

const data = [
  { hour: "09", reads: 18, writes: 6 },
  { hour: "10", reads: 26, writes: 9 },
  { hour: "11", reads: 22, writes: 12 },
]

export function Demo() {
  return (
    <DotMatrixChart
      label="Requests by hour"
      data={data}
      index="hour"
      series={[
        { key: "reads", label: "Reads" },
        { key: "writes", label: "Writes" },
      ]}
    />
  )
}`,
  }),
  chart("comb-chart", {
    name: "Comb Chart",
    category: "trends",
    description: "A dense row of thin rounded teeth for long runs of values.",
    interaction: `The teeth rise from left to right, older ones fainter so the latest values stand out. ${cartesianInteraction("each tooth")} The tooth you are reading lights up while the rest dim.`,
    props: [
      ...cartesianProps.map((prop) =>
        prop.name === "series" ? { ...prop, description: "The key to plot. Only the first series is drawn." } : prop,
      ),
      classNameProp,
    ],
    usage: `import { CombChart } from "@/components/ui/comb-chart"

const data = Array.from({ length: 30 }, (_, i) => ({
  day: String(i + 1),
  commits: Math.round(4 + Math.random() * 10),
}))

export function Demo() {
  return (
    <CombChart
      label="Commits per day"
      data={data}
      index="day"
      series={[{ key: "commits", label: "Commits" }]}
    />
  )
}`,
  }),
  chart("gauge", {
    name: "Gauge",
    category: "progress",
    description: "A half dial of tick marks that light up to show a value within a range.",
    interaction:
      "The ticks light up one by one from the left as the number counts up beneath them. Screen readers hear it as a meter with its value. Honors prefers-reduced-motion: the dial and number appear at once.",
    props: [
      {
        name: "value",
        type: "number",
        required: true,
        description: "The current value. It is clamped between min and max.",
      },
      {
        name: "min",
        type: "number",
        default: "0",
        description: "The value at the left end of the dial.",
      },
      {
        name: "max",
        type: "number",
        default: "100",
        description: "The value at the right end of the dial.",
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
      formatProp,
      {
        name: "color",
        type: "string",
        default: '"var(--brand)"',
        description: "Any CSS color for the lit ticks.",
      },
      {
        name: "ticks",
        type: "number",
        default: "41",
        description: "How many tick marks make up the dial.",
      },
      classNameProp,
    ],
    usage: `import { Gauge } from "@/components/ui/gauge"

export function Demo() {
  return <Gauge label="Server load" value={68} caption="CPU load" format={(n) => Math.round(n) + "%"} />
}`,
  }),
  chart("activity-rings", {
    name: "Activity Rings",
    category: "progress",
    description: "Nested rings that each close toward their own goal.",
    interaction:
      "The rings sweep round one after another, outermost first. Hover a ring's row and the other rings fade back. Each goal and value is plain text beside the rings, so screen readers read it as a list. Honors prefers-reduced-motion: the rings appear filled.",
    props: [
      {
        name: "data",
        type: "{ label: string; value: number; max?: number; color?: string }[]",
        required: true,
        description: "One ring per entry, outermost first. Max defaults to 100.",
      },
      labelProp,
      {
        name: "format",
        type: "(value: number) => string",
        default: "rounded",
        description: "Formats each value and goal in the list. Defaults to whole numbers.",
      },
      {
        name: "thickness",
        type: "number",
        default: "14",
        description: "Width of each ring, on a 200 unit wide chart.",
      },
      classNameProp,
    ],
    usage: `import { ActivityRings } from "@/components/ui/activity-rings"

const data = [
  { label: "Move", value: 420, max: 600 },
  { label: "Exercise", value: 24, max: 30 },
  { label: "Stand", value: 9, max: 12 },
]

export function Demo() {
  return <ActivityRings label="Today's goals" data={data} />
}`,
  }),
  chart("segmented-bar", {
    name: "Segmented Bar",
    category: "composition",
    description: "One rounded bar split into parts, with each part's value and share below.",
    interaction:
      "The bar stretches out from the left with every part in place. Hover a part or its row and the others fade back. Each label, value and share is plain text, so screen readers read it as a list. Honors prefers-reduced-motion: the bar appears at full width.",
    props: [
      {
        name: "data",
        type: "{ label: string; value: number; color?: string }[]",
        required: true,
        description: "One part per entry, left to right. Colors follow the chart palette in order unless you set one.",
      },
      labelProp,
      formatProp,
      classNameProp,
    ],
    usage: `import { SegmentedBar } from "@/components/ui/segmented-bar"

const data = [
  { label: "Photos", value: 48 },
  { label: "Apps", value: 31 },
  { label: "Music", value: 12 },
]

export function Demo() {
  return <SegmentedBar label="Storage by type" data={data} format={(n) => n + " GB"} />
}`,
  }),
  chart("waffle-chart", {
    name: "Waffle Chart",
    category: "composition",
    description: "A grid of soft squares where each square stands for an equal share.",
    interaction:
      "The squares fill in row by row. Hover a square or a row of the list and the other parts fade back. Each label, value and share is plain text beside the grid, so screen readers read it as a list. Honors prefers-reduced-motion: the grid appears filled.",
    props: [
      {
        name: "data",
        type: "{ label: string; value: number; color?: string }[]",
        required: true,
        description: "One part per entry, filled in order. Squares are rounded so the parts always fill the grid exactly.",
      },
      labelProp,
      {
        name: "total",
        type: "number",
        description: "The amount the whole grid stands for. Above the sum of the parts, the rest of the grid stays empty.",
      },
      {
        name: "columns",
        type: "number",
        default: "10",
        description: "Squares per row.",
      },
      {
        name: "rows",
        type: "number",
        default: "10",
        description: "Rows of squares.",
      },
      formatProp,
      classNameProp,
    ],
    usage: `import { WaffleChart } from "@/components/ui/waffle-chart"

const data = [
  { label: "Renewed", value: 62 },
  { label: "Upgraded", value: 14 },
]

export function Demo() {
  return <WaffleChart label="Subscriptions this year" data={data} total={100} />
}`,
  }),
];
