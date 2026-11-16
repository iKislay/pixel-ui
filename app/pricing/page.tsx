import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import Faq, { type FaqItem } from "@/components/Faq";
import Footer from "@/components/Footer";
import McpCode from "@/components/mcp/McpCode";
import McpText from "@/components/mcp/McpText";
import PageHero, { PageSection, ScrollCue } from "@/components/PageHero";
import CodeBlock from "@/components/ui/code-block";
import { fetchStarCount } from "@/lib/github";
import { SUPPORT_EMAIL } from "@/lib/legal";
import {
  PRO_COMPONENTS_JSON,
  PRO_ENV,
  PRO_KEY_ENV,
  PRO_PRICE,
  PRO_REGISTRY,
} from "@/lib/pro";
import { SITE_NAME } from "@/lib/site";

const DESCRIPTION = `Every ${SITE_NAME} component is free. Pro adds premium components for a one-time $${PRO_PRICE}, including every one released later.`;

export const metadata: Metadata = {
  title: "Pricing",
  description: DESCRIPTION,
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: `Pricing | ${SITE_NAME}`,
    description: DESCRIPTION,
    url: "/pricing",
    siteName: SITE_NAME,
    locale: "en_US",
    type: "website",
  },
};

const PORTAL_URL = `https://polar.sh/${process.env.POLAR_ORGANIZATION_SLUG}/portal`;

const INSTALL = `npx shadcn@latest add ${PRO_REGISTRY}/<name>`;

const PLANS = [
  {
    name: "Free",
    price: "$0",
    note: "forever",
    features: [
      "Every component in the public registry",
      "Install with the shadcn CLI or MCP",
      "Personal and commercial projects",
    ],
  },
  {
    name: "Pro",
    price: `$${PRO_PRICE}`,
    note: "one time",
    features: [
      "Every Pro component, including future ones",
      "Lifetime access and updates, no subscription",
      "Install with the shadcn CLI or MCP",
      "Personal and commercial projects",
    ],
  },
];

const LINK =
  "text-foreground underline decoration-foreground/25 underline-offset-4 transition-colors duration-150 ease-out hover:decoration-foreground";

const STEPS: { heading: string; content: ReactNode }[] = [
  {
    heading: "Copy your license key",
    content: (
      <p className="text-[15px] leading-relaxed text-muted-foreground">
        Polar emails your receipt after checkout. Your key is on your{" "}
        <a href={PORTAL_URL} className={LINK}>
          purchases page
        </a>
        , where you can also rotate it.
      </p>
    ),
  },
  {
    heading: "Add the key and the registry",
    content: (
      <>
        <McpText>
          {
            "Put the key in `.env.local`, which stays out of git. Then add the registry to `components.json` and keep `{name}` as written."
          }
        </McpText>
        <CodeBlock
          code={PRO_ENV}
          language="bash"
          showHeader={false}
          showLineNumbers={false}
        />
        <CodeBlock
          code={PRO_COMPONENTS_JSON}
          language="json"
          showHeader={false}
          showLineNumbers={false}
        />
      </>
    ),
  },
  {
    heading: "Install a Pro component",
    content: (
      <>
        <McpText>
          {
            "The file lands in `components/ui`, like every free component. MCP clients read the same registry, so you can also just ask for it."
          }
        </McpText>
        <McpCode value={INSTALL} />
      </>
    ),
  },
];

const FAQ: FaqItem[] = [
  {
    question: "Do I get components released after I buy?",
    answer:
      "Yes. One purchase unlocks every Pro component, now and later, with no renewal.",
  },
  {
    question: "Do the free components stay free?",
    answer:
      "Yes. Pro adds new components; nothing in the free registry moves behind it.",
  },
  {
    question: "The CLI says my key is invalid. What now?",
    answer: `Check that ${PRO_KEY_ENV} is in .env.local at your project root and matches the key on your purchases page. If you rotated it, use the new one.`,
  },
  {
    question: "Can I use my key in CI?",
    answer: `Yes. Set ${PRO_KEY_ENV} as a secret in your CI environment. Keep it out of your repository.`,
  },
  {
    question: "Can I share my key or the Pro source?",
    answer:
      "No. A key is for you. Redistributing Pro components or sharing a key gets the key revoked.",
  },
  {
    question: "Can I get a refund?",
    answer: `If Pro is faulty or not as described, email ${SUPPORT_EMAIL} within 14 days of purchase for a full refund. The key is revoked with the refund.`,
  },
];

const CHECKOUT_NOTICE: Record<string, string> = {
  success:
    "You're in. Your license key is on your Polar purchases page; the setup is below.",
  failed: `Checkout didn't open. Try again, or email ${SUPPORT_EMAIL}.`,
};

export default async function PricingPage({
  searchParams,
}: PageProps<"/pricing">) {
  const [stars, { checkout }] = await Promise.all([
    fetchStarCount(),
    searchParams,
  ]);
  const notice = typeof checkout === "string" ? CHECKOUT_NOTICE[checkout] : null;

  return (
    <>
      <PageHero
        stars={stars}
        headline={
          <>
            Free, with a <span className="italic">Pro</span> tier
          </>
        }
        sub={DESCRIPTION}
      >
        <ScrollCue href="#plans" label="Scroll to plans" />
      </PageHero>

      <main className="flex-1 pb-20 md:pb-28">
        <PageSection
          id="plans"
          label="Plans"
          title={
            <>
              Pay <span className="font-serif font-normal italic">once</span>
            </>
          }
        >
          <div className="flex flex-col gap-4">
            {notice && (
              <p
                role="status"
                className="rounded-2xl bg-brand/10 px-4 py-3 text-[15px] text-foreground"
              >
                {notice}
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {PLANS.map((plan) => (
                <section
                  key={plan.name}
                  className="flex flex-col gap-6 rounded-3xl border border-black/[0.06] bg-[#F4F5F8] p-6 dark:border-white/[0.06] dark:bg-[#0F1011]"
                >
                  <header className="flex flex-col gap-2">
                    <h3 className="text-base font-medium">{plan.name}</h3>
                    <p className="flex items-baseline gap-2">
                      <span className="text-4xl font-medium tracking-tight">
                        {plan.price}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {plan.note}
                      </span>
                    </p>
                  </header>

                  <ul className="flex flex-1 flex-col gap-2 text-[15px] text-muted-foreground">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-2">
                        <span aria-hidden className="text-brand">
                          ✓
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {plan.name === "Pro" ? (
                    <form action="/api/checkout" method="post">
                      <button
                        type="submit"
                        className="h-12 w-full rounded-2xl bg-brand text-sm font-semibold text-white transition-colors duration-150 ease-out hover:bg-brand-hover"
                      >
                        Get Pro for ${PRO_PRICE}
                      </button>
                    </form>
                  ) : (
                    <Link
                      href="/components"
                      className="flex h-12 items-center justify-center rounded-2xl bg-neutral-900 text-sm font-semibold text-white transition-colors duration-150 ease-out hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-white/90"
                    >
                      Browse components
                    </Link>
                  )}
                </section>
              ))}
            </div>
          </div>
        </PageSection>

        <PageSection
          id="setup"
          label="Setup"
          title={
            <>
              After you <span className="font-serif font-normal italic">buy</span>
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
