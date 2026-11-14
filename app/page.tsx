import type { Metadata } from "next";
import Link from "next/link";
import GooeyNavbar from "@/components/GooeyNavbar";
import { fetchStarCount } from "@/lib/github";
import HeroCta from "@/components/HeroCta";
import HeroIntro from "@/components/HeroIntro";
import ComponentsShowcase from "@/components/ComponentsShowcase";
import Faq, { type FaqItem } from "@/components/Faq";
import Footer from "@/components/Footer";
import Sponsors from "@/components/Sponsors";
import { REGISTRY_REPO } from "@/lib/components";
import { AsciiJellyfish } from "@/components/ui/ascii-jellyfish";
import AmbientVeil from "@/components/preview/AmbientVeil";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

const FAQ: FaqItem[] = [
  {
    question: "What is Pixel UI?",
    answer:
      "A free, open-source collection of pixel-perfect animated React components. Each one is a single file you copy into your project and own.",
  },
  {
    question: "How do I install a component?",
    answer: `Use the shadcn CLI, for example \`npx shadcn@latest add ${REGISTRY_REPO}/toast\`. Or let your AI agent add it over MCP.`,
  },
  {
    question: "What does my project need?",
    answer:
      "React, Tailwind CSS, and shadcn set up with the `cn` helper. The CLI installs any other dependency a component uses, like Motion.",
  },
  {
    question: "Can I use it in commercial projects?",
    answer:
      "Yes. Ship it in any app, site, or product. Credit Pixel UI with a visible link to pixelui.dev, and don't sell or redistribute the components themselves.",
  },
  {
    question: "Can I change the code?",
    answer:
      "Yes. The file lands in `components/ui`, so edit anything. Props cover the common tweaks.",
  },
  {
    question: "Do the animations respect reduced motion?",
    answer:
      "Yes. Every interactive component honors your system's reduced motion setting.",
  },
];

export default async function Home() {
  const stars = await fetchStarCount();

  return (
    <>
      <GooeyNavbar stars={stars} />
      <section className="relative w-full p-2 pt-16">
        <div
          className="relative flex min-h-[min(100svh_-_4.5rem,60rem)] w-full items-center justify-center overflow-hidden rounded-[45px] border border-black/[0.04] bg-[#F4F5F8] dark:border-transparent dark:border-apple dark:bg-[#0F1011]"
          style={{ cornerShape: "squircle" } as React.CSSProperties}
        >
          <AsciiJellyfish variant="color" count={4} className="absolute inset-0" />

          <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-3 px-4 py-20 text-center sm:gap-4 sm:px-6">
            <div className="relative isolate flex w-full flex-col items-center justify-center gap-3 sm:gap-4">
              <AmbientVeil />
              <HeroIntro
                headline={
                  <>
                    <span className="block italic">Pixel-Perfect Components,</span>
                    <span className="block">For Modern Products.</span>
                  </>
                }
                sub={
                  <>
                    Free, animated React components crafted with Motion and Tailwind CSS. Try them below, then drop them into your project using the shadcn CLI or{" "}
                    <Link href="/mcp" className="text-inherit">
                      MCP
                    </Link>
                    .
                  </>
                }
              >
                <HeroCta />
              </HeroIntro>
            </div>
          </div>
        </div>
      </section>
      <ComponentsShowcase />
      <Sponsors />
      <section className="mx-auto grid w-full max-w-6xl gap-8 px-5 pb-20 sm:px-6 md:grid-cols-[1fr_2fr] md:pb-28">
        <header className="flex flex-col items-start gap-1">
          <span className="text-sm font-medium text-muted-foreground">FAQ</span>
          <h2 className="text-3xl font-medium tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Good to <span className="font-serif font-normal italic">know</span>
          </h2>
        </header>
        <Faq items={FAQ} />
      </section>
      <Footer />
    </>
  );
}
