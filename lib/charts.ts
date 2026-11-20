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
];
