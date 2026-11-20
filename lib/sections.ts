export type SectionGroup = "build" | "feel" | "studio";

export type Section = {
  id: string;
  label: string;
  href: string;
  group: SectionGroup;
  live: boolean;
};

// a section stays out of the nav and sitemap until it has something to show
export const SECTIONS: Section[] = [
  { id: "primitives", label: "Primitives", href: "/primitives", group: "build", live: true },
  { id: "components", label: "Components", href: "/components", group: "build", live: true },
  { id: "blocks", label: "Blocks", href: "/blocks", group: "build", live: false },
  { id: "screens", label: "Screens", href: "/screens", group: "build", live: false },
  { id: "charts", label: "Charts", href: "/charts", group: "build", live: false },
  { id: "styles", label: "Styles", href: "/styles", group: "feel", live: false },
  { id: "sounds", label: "Sounds", href: "/sounds", group: "feel", live: true },
  { id: "haptics", label: "Haptics", href: "/haptics", group: "feel", live: false },
  { id: "effects", label: "Effects", href: "/effects", group: "feel", live: false },
  { id: "studio", label: "Studio", href: "/studio", group: "studio", live: false },
];

export const liveSections = SECTIONS.filter((section) => section.live);

export const NAV_LINKS = [
  ...liveSections.map(({ label, href }) => ({ label, href })),
  { label: "MCP", href: "/mcp" },
  { label: "Pricing", href: "/pricing" },
];
