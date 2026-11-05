import {
  components,
  installCommand,
  REGISTRY_HOMEPAGE,
} from "@/lib/components";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export function GET() {
  const componentSections = components.map((item) => {
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
    if (item.dependencies?.length) {
      lines.push(
        `- Dependencies: ${item.dependencies.map((d) => d.name).join(", ")}`,
      );
    }
    return lines.join("\n");
  });

  const body = [
    "# Pixel UI",
    "",
    "> A shadcn registry of pixel-perfect, animated React components: frosted-glass, springy, Apple-flavored UI built with Tailwind CSS and Motion (Framer Motion). Every component is free to use and installable with one command via the shadcn CLI.",
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
    componentSections.join("\n\n"),
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
