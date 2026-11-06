import { ogImage } from "@/lib/og";

export { size, contentType } from "@/lib/og";
export const alt = "Pixel UI over MCP";

export default function Image() {
  return ogImage({
    title: "Pixel UI,",
    italic: "over MCP",
    description:
      "Add Pixel UI from Claude Code, Cursor, Codex, or VS Code. One registry in components.json, then ask for any component.",
    pills: ["Claude Code", "Cursor", "Codex", "VS Code"],
  });
}
