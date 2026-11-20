import {
  components,
  type ComponentItem,
  installCommand,
  REGISTRY_HOMEPAGE,
} from "@/lib/components";
import { charts } from "@/lib/charts";
import { primitives } from "@/lib/primitives";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export function GET() {
  const describe = (item: ComponentItem) => {
    const lines = [
      `### ${item.name}`,
      "",
      `- Page: ${SITE_URL}${item.href}`,
    ];
    if (item.description) lines.push(`- Description: ${item.description}`);
    if (item.interaction) lines.push(`- Interaction: ${item.interaction}`);
    const install = installCommand(item);
    if (install) lines.push(`- Install: \`${install}\``);
    if (item.source) lines.push(`- Source: ${item.source}`);
    if (item.pro) lines.push(`- Pro: needs a license key, see ${SITE_URL}/pricing`);
    if (item.dependencies?.length) {
      lines.push(
        `- Dependencies: ${item.dependencies.map((d) => d.name).join(", ")}`,
      );
    }
    return lines.join("\n");
  };

  const body = [
    "# Pixel UI",
    "",
    `> A shadcn registry of pixel-perfect, animated React components: frosted-glass, springy, Apple-flavored UI built with Tailwind CSS and Motion (Framer Motion). Components are installable with one command via the shadcn CLI. Most are free; Pro components need a license key from ${SITE_URL}/pricing.`,
    "",
    "Install any component into a React / Next.js project:",
    "",
    "```",
    "npx shadcn@latest add ikislay/pixel-ui/<component-name>",
    "```",
    "",
    "MCP (Claude Code, Cursor, Codex, VS Code):",
    "",
    "Add this to the consumer project's components.json:",
    "",
    "```",
    '{',
    '  "registries": {',
    '    "@pixel-ui": "https://raw.githubusercontent.com/ikislay/pixel-ui/main/public/r/{name}.json"',
    "  }",
    "}",
    "```",
    "",
    "```",
    "npx shadcn@latest mcp init --client claude",
    "```",
    "",
    "Then ask either:",
    "",
    "add @pixel-ui/<component-name>",
    "",
    "or a plain sentence, for example: Add the toast from Pixel UI",
    "",
    "Do not ask only: add toast. That looks in the default shadcn registry.",
    "",
    `Setup page: ${SITE_URL}/mcp`,
    "",
    `Source code for all components: ${REGISTRY_HOMEPAGE}`,
    "",
    "## Components",
    "",
    components.map(describe).join("\n\n"),
    "",
    "## Primitives",
    "",
    "Small building blocks: buttons, fields, menus and overlays. Interactive ones take an optional onFeedback prop that reports moments like press, toggle, open, close, select and error.",
    "",
    primitives.map(describe).join("\n\n"),
    "",
    "## Charts",
    "",
    "SVG charts drawn by hand, with no charting library. Each one takes a label for screen readers; the plotted ones also render a hidden data table and read out values from the keyboard. They color series with the --chart-1 to --chart-5 tokens.",
    "",
    charts.map(describe).join("\n\n"),
    "",
    "## Notes",
    "",
    "- Components are TypeScript + Tailwind CSS, following shadcn/ui conventions (cn + className merging, prop spreading, data-slot attributes).",
    "- Free for personal and commercial use. Attribution appreciated; please don't resell as your own kit.",
    "",
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
