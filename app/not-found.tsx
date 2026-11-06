import type { Metadata } from "next";
import AsciiArt from "@/components/AsciiArt";
import Footer from "@/components/Footer";
import GooeyNavbar from "@/components/GooeyNavbar";
import HeroIntro from "@/components/HeroIntro";
import ComponentCard from "@/components/gallery/ComponentCard";
import ViewAllCard from "@/components/gallery/ViewAllCard";
import CtaLink from "@/components/not-found/CtaLink";
import { components } from "@/lib/components";
import { fetchStarCount } from "@/lib/github";

export const metadata: Metadata = {
  title: "Page not found",
  description: "This page does not exist. Browse the components instead.",
};

const DIGITS = [
  "&#B%            O8*8        @MHBHBZW*WWO        &WB#            SW&#  ",
  "WMB#.:          OB8X.:      WMZ%M@*#B&ZZ.:      #@#M.:          *&M&..",
  "&&8#:.          %8@&:.  SZZX  :..:::..:.WMWZ    %*#B..          ##BB.:",
  "SB8#.:          %ZHS..  &#@@..          #8MX..  M#Z&.:          B@8M.:",
  "W@@&..          %HBM::  88&Z::          Z@&8..  #SH8.:          O*M#.:",
  "H8S&::          @&#H::  @OS8..          %8@B:.  #8*S.:          OSOX..",
  "&*#&SWZ*@BW#@8%BM&ZB.:  8MM@::          W8@%.:  *&S*M#H%*W&H%HZWWSOX..",
  "#@%%HBM%M#%WBOB8#@8O::  #@M8::          %W##..  H%@8O*SWZBB*H&@B8@&H.:",
  "  ..::...:....::MBZW.:  WW8B:.          Z%O8::    :.::.:::.:..:.HS@X:.",
  "                HSB@::  H#Z8:.          WM&B.:                  #XOM.:",
  "                %#8#.:  HH%8::          @B#8::                  %%WM.:",
  "                &X&&:.  H8*M..          BWOB.:                  H%Z%:.",
  "                MWW@::    ..M8@@8&OMWW##  ..:.                  @8BS::",
  "                W@BS..      &8HMWMO%OWO%:.                      BBBM::",
  "                  :.::        .......:.:::                        :::.",
];

export default async function NotFound() {
  const stars = await fetchStarCount();

  return (
    <>
      <section className="relative w-full p-1.5 md:p-2.5">
        <div
          className="relative flex min-h-[min(88svh,52rem)] w-full items-center overflow-hidden rounded-[45px] border border-black/[0.04] bg-[#F4F5F8] dark:border-transparent dark:border-apple dark:bg-[#0F1011]"
          style={{ cornerShape: "squircle" } as React.CSSProperties}
        >
          <GooeyNavbar stars={stars} />

          <div className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(120%_75%_at_50%_-5%,rgba(255,255,255,0.07),transparent_60%)] dark:block" />

          <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 px-5 pb-20 pt-28 sm:px-6 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
            <AsciiArt
              lines={DIGITS}
              aria-hidden
              className="aspect-[70/30] w-full max-w-md justify-self-center lg:order-last lg:max-w-none"
            />

            <div className="flex flex-col items-center gap-3 text-center sm:gap-4 lg:items-start lg:text-left">
              <HeroIntro
                badge={
                  <span className="font-mono text-xs font-medium uppercase tracking-widest text-black/50 dark:text-white/50">
                    Error 404
                  </span>
                }
                headline={
                  <span className="lg:text-7xl">
                    This page <span className="italic">went missing.</span>
                  </span>
                }
                sub="The link is broken or the page moved. Every component is still right where you left it."
              >
                <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row">
                  <CtaLink href="/components" label="Browse components" primary />
                  <CtaLink href="/" label="Back home" />
                </div>
              </HeroIntro>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-6 md:py-28">
        <header className="flex flex-col items-start gap-1">
          <span className="text-sm font-medium text-muted-foreground">
            Lost?
          </span>
          <h2 className="text-3xl font-medium tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Start <span className="font-serif font-normal italic">here</span>
          </h2>
        </header>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {components.slice(0, 2).map((item) => (
            <ComponentCard key={item.href} item={item} autoPlay />
          ))}
          <ViewAllCard count={components.length} className="sm:col-span-2 lg:col-span-1" />
        </div>
      </section>

      <Footer />
    </>
  );
}
