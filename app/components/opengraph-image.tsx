import { CATEGORY_LABELS, CATEGORY_ORDER, components } from "@/lib/components";
import { ogImage } from "@/lib/og";

export { size, contentType } from "@/lib/og";
export const alt = "Every Pixel UI component";

export default function Image() {
  return ogImage({
    title: "Every",
    italic: "component",
    description: `${components.length} animated React components to try live, then install with the shadcn CLI or MCP.`,
    pills: CATEGORY_ORDER.filter((c) => components.some((item) => item.category === c)).map(
      (c) => CATEGORY_LABELS[c],
    ),
  });
}
