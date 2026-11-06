import { ogImage } from "@/lib/og";

export { size, contentType } from "@/lib/og";
export const alt = "Pixel UI brand assets";

export default function Image() {
  return ogImage({
    title: "Brand",
    italic: "assets",
    description:
      "The Pixel UI logo and colors. Download an SVG or PNG, or copy the SVG straight into your design tool.",
    pills: ["SVG", "PNG", "Light and dark"],
  });
}
