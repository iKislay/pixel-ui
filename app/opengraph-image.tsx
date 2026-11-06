import { ogImage } from "@/lib/og";

export { size, contentType } from "@/lib/og";
export const alt = "Pixel UI: pixel-perfect animated React components";

export default function Image() {
  return ogImage({
    title: "Crafted with",
    italic: "precision",
    description:
      "Pixel-perfect animated React components, built with Tailwind CSS and Motion. Copy them into your codebase and own every frame.",
    pills: ["Free and open source", "npx shadcn add", "MCP ready", "Reduced-motion aware"],
  });
}
