import type { Metadata } from "next";
import Link from "next/link";
import GooeyNavbar from "@/components/GooeyNavbar";
import { fetchStarCount } from "@/lib/github";
import HeroCta from "@/components/HeroCta";
import HeroIntro from "@/components/HeroIntro";
import ComponentsShowcase from "@/components/ComponentsShowcase";
import Footer from "@/components/Footer";
import SpiderWebs from "@/components/SpiderWebs";
import { AsciiJellyfish } from "@/components/ui/ascii-jellyfish";
import AmbientVeil from "@/components/preview/AmbientVeil";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default async function Home() {
  const stars = await fetchStarCount();

  return (
    <>
      <section className="relative w-full p-1.5 md:p-2.5">
        <div
          className="relative flex min-h-[min(100svh_-_0.75rem,60rem)] w-full items-center justify-center overflow-hidden rounded-[45px] border border-black/[0.04] bg-[#F5F5F7] dark:border-transparent dark:border-apple dark:bg-[#121212] md:min-h-[min(100svh_-_1.25rem,60rem)]"
          style={{ cornerShape: "squircle" } as React.CSSProperties}
        >
          <GooeyNavbar stars={stars} />
          <SpiderWebs />
          <AsciiJellyfish variant="color" count={3} className="absolute inset-0" />
          <AmbientVeil />

          <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-3 px-4 pb-20 pt-28 text-center sm:gap-4 sm:px-6">
            <HeroIntro
              headline={
                <>
                  <span className="block">Pixel-Perfect Components,</span>
                  <span className="block">For Modern Products.</span>
                </>
              }
              sub={
                <>
                  Pixel UI is a free, open-source collection of pixel-perfect animated React components. Preview every one live below, then install it with the shadcn CLI or let your AI agent add it over {" "}
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
      </section>
      <ComponentsShowcase />
      <Footer />
    </>
  );
}
