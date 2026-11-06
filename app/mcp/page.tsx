import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import Faq, { type FaqItem } from "@/components/Faq";
import Footer from "@/components/Footer";
import McpAsk from "@/components/mcp/McpAsk";
import McpClients from "@/components/mcp/McpClients";
import McpCode from "@/components/mcp/McpCode";
import McpText from "@/components/mcp/McpText";
import PageHero, { PageSection, ScrollCue } from "@/components/PageHero";
import CodeBlock from "@/components/ui/code-block";
import { fetchStarCount } from "@/lib/github";
import { MCP_CLI, MCP_COMPONENTS_JSON } from "@/lib/mcp";
import { SITE_NAME } from "@/lib/site";

const DESCRIPTION =
  "Add Pixel UI from Claude Code, Cursor, Codex, or VS Code. One registry in components.json, then ask for any component.";

export const metadata: Metadata = {
  title: "MCP",
  description: DESCRIPTION,
  alternates: {
    canonical: "/mcp",
  },
  openGraph: {
    title: `MCP | ${SITE_NAME}`,
    description: DESCRIPTION,
    url: "/mcp",
    siteName: SITE_NAME,
    locale: "en_US",
    type: "website",
  },
};

const STEPS: { heading: string; content: ReactNode }[] = [
  {
    heading: "Add the registry",
    content: (
      <>
        <McpText>
          {
            "Your project needs shadcn set up first: `components.json`, Tailwind, and the `cn` helper. Add this to `components.json` and keep `{name}` as written."
          }
        </McpText>
        <CodeBlock
          code={MCP_COMPONENTS_JSON}
          language="json"
          showHeader={false}
          showLineNumbers={false}
        />
      </>
    ),
  },
  {
    heading: "Connect your editor",
    content: <McpClients />,
  },
  {
    heading: "Ask for a component",
    content: (
      <>
        <McpText>
          {
            "Prefix the name with `@pixel-ui`, or ask in plain words. The file lands in `components/ui`, and it's yours from there."
          }
        </McpText>
        <McpAsk />
      </>
    ),
  },
];

const FAQ: FaqItem[] = [
  {
    question: "Does Pixel UI run its own MCP server?",
    answer:
      "No. Your editor talks to the shadcn MCP server, and Pixel UI is a registry it reads from.",
  },
  {
    question: "Which editors work?",
    answer:
      "Claude Code, Cursor, VS Code, and Codex. Any client that runs the shadcn MCP server works the same way.",
  },
  {
    question: "Why keep {name} in the registry URL?",
    answer:
      "shadcn swaps it for the component you ask for, so one entry covers every component.",
  },
  {
    question: "Is the code different from the CLI install?",
    answer: "No. MCP and the CLI install the same files into `components/ui`.",
  },
  {
    question: "My agent can't find a component. What now?",
    answer:
      "Check that `@pixel-ui` is in `components.json`, then restart your editor so the MCP server reloads.",
  },
];

export default async function McpPage() {
  const stars = await fetchStarCount();

  return (
    <>
      <PageHero
        stars={stars}
        headline={
          <>
            Pixel UI, <span className="italic">over MCP</span>
          </>
        }
        sub={DESCRIPTION}
      >
        <ScrollCue href="#setup" label="Scroll to setup" />
      </PageHero>

      <main className="flex-1 pb-20 md:pb-28">
        <PageSection
          id="setup"
          label="Setup"
          title={
            <>
              Three <span className="font-serif font-normal italic">steps</span>
            </>
          }
        >
          <ol className="flex flex-col">
            {STEPS.map((step, index) => (
              <li
                key={step.heading}
                className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-4 pb-12 last:pb-0"
              >
                <span className="flex size-6 items-center justify-center rounded-full bg-brand/10 font-mono text-xs font-medium text-brand">
                  {index + 1}
                </span>
                <section className="flex flex-col gap-3">
                  <h3 className="text-base font-medium leading-6">
                    {step.heading}
                  </h3>
                  {step.content}
                </section>
              </li>
            ))}
          </ol>
        </PageSection>

        <PageSection
          label="CLI"
          title={
            <>
              Without <span className="font-serif font-normal italic">MCP</span>
            </>
          }
        >
          <div className="flex flex-col gap-3">
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              The shadcn CLI installs the same files. Browse everything on the{" "}
              <Link
                href="/components"
                className="text-foreground underline decoration-foreground/25 underline-offset-4 transition-colors duration-150 ease-out hover:decoration-foreground"
              >
                components
              </Link>{" "}
              page.
            </p>
            <McpCode value={MCP_CLI} />
          </div>
        </PageSection>

        <PageSection
          label="FAQ"
          title={
            <>
              Common <span className="font-serif font-normal italic">questions</span>
            </>
          }
        >
          <Faq items={FAQ} />
        </PageSection>
      </main>

      <Footer />
    </>
  );
}
