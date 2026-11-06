import type { Metadata } from "next";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { Download } from "lucide-react";
import CopyButton from "@/components/CopyButton";
import Footer from "@/components/Footer";
import PageHero, { PageSection, ScrollCue } from "@/components/PageHero";
import Tooltip from "@/components/Tooltip";
import { fetchStarCount } from "@/lib/github";
import { SITE_NAME } from "@/lib/site";
import { cn } from "@/lib/utils";

const DESCRIPTION =
  "The Pixel UI logo and colors. Download an SVG or PNG, or copy the SVG straight into your design tool.";

export const metadata: Metadata = {
  title: "Brand assets",
  description: DESCRIPTION,
  alternates: {
    canonical: "/brand-assets",
  },
  openGraph: {
    title: `Brand assets | ${SITE_NAME}`,
    description: DESCRIPTION,
    url: "/brand-assets",
    siteName: SITE_NAME,
    locale: "en_US",
    type: "website",
  },
};

const LOGOS = [
  { file: "pixelui-wordmark-light.svg", name: "Logo with text", theme: "light" },
  { file: "pixelui-wordmark-dark.svg", name: "Logo with text", theme: "dark" },
  { file: "pixelui-mark-light.svg", name: "Logo mark", theme: "light" },
  { file: "pixelui-mark-dark.svg", name: "Logo mark", theme: "dark" },
] as const;

const COLORS = [
  { name: "Brand", hex: "#4785FF", use: "Buttons, links and highlights." },
  { name: "Ink", hex: "#222326", use: "The logo on light backgrounds." },
  { name: "Snow", hex: "#F4F5F8", use: "The logo on dark backgrounds, light cards." },
  { name: "Night", hex: "#0F1011", use: "Dark cards and panels." },
  { name: "Black", hex: "#08090A", use: "The dark page background." },
  { name: "White", hex: "#FFFFFF", use: "The light page background." },
];

const ACTION =
  "inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors duration-150 ease-out hover:bg-foreground/5 hover:text-foreground";

const SURFACE = "rounded-[28px] border";

export default async function BrandAssetsPage() {
  const [stars, sources] = await Promise.all([
    fetchStarCount(),
    Promise.all(
      LOGOS.map((logo) =>
        readFile(path.join(process.cwd(), "public/brand", logo.file), "utf8"),
      ),
    ),
  ]);

  return (
    <>
      <PageHero
        stars={stars}
        headline={
          <>
            Brand <span className="italic">assets</span>
          </>
        }
        sub={DESCRIPTION}
      >
        <ScrollCue href="#logo" label="Scroll to the assets" />
      </PageHero>

      <main className="flex-1 pb-20 md:pb-28">
        <PageSection
          id="logo"
          label="Logo"
          title={
            <>
              The <span className="font-serif font-normal italic">mark</span>
            </>
          }
        >
          <ul className="grid gap-4 sm:grid-cols-2">
            {LOGOS.map((logo, index) => (
              <li key={logo.file} className="flex flex-col gap-2">
                <div
                  className={cn(
                    SURFACE,
                    "flex aspect-[16/10] items-center justify-center",
                    logo.theme === "light"
                      ? "border-black/[0.04] bg-[#F4F5F8]"
                      : "border-transparent bg-[#0F1011] border-apple",
                  )}
                  style={{ cornerShape: "squircle" } as React.CSSProperties}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/brand/${logo.file}`}
                    alt={`${logo.name}, ${logo.theme} background`}
                    className={logo.file.includes("wordmark") ? "h-10" : "h-16"}
                  />
                </div>
                <div className="flex items-center justify-between gap-2 px-2">
                  <span className="text-sm font-medium">
                    {logo.name}
                    <span className="text-muted-foreground">
                      {" "}
                      &middot; {logo.theme === "light" ? "Light" : "Dark"}
                    </span>
                  </span>
                  <span className="flex items-center gap-0.5">
                    <CopyButton
                      value={sources[index]}
                      label="Copy SVG"
                      title=""
                      className={ACTION}
                    >
                      Copy
                    </CopyButton>
                    {["svg", "png"].map((ext) => (
                      <a
                        key={ext}
                        href={`/brand/${logo.file.replace(".svg", `.${ext}`)}`}
                        download
                        className={ACTION}
                      >
                        <Download className="size-3.5" strokeWidth={2} />
                        {ext.toUpperCase()}
                      </a>
                    ))}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </PageSection>

        <PageSection
          label="Colors"
          title={
            <>
              The <span className="font-serif font-normal italic">palette</span>
            </>
          }
        >
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {COLORS.map((color) => (
              <li key={color.hex} className="flex flex-col gap-2">
                <div
                  className={cn(SURFACE, "aspect-[4/3] border-foreground/10")}
                  style={
                    {
                      backgroundColor: color.hex,
                      cornerShape: "squircle",
                    } as React.CSSProperties
                  }
                />
                <div className="flex items-start justify-between gap-2 px-2">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-sm font-medium">{color.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {color.use}
                    </span>
                  </div>
                  <Tooltip label="Copy hex" align="end">
                    <CopyButton
                      value={color.hex}
                      label={`Copy ${color.hex}`}
                      title=""
                      className={cn(ACTION, "-mr-2 font-mono")}
                    >
                      {color.hex}
                    </CopyButton>
                  </Tooltip>
                </div>
              </li>
            ))}
          </ul>
        </PageSection>
      </main>

      <Footer />
    </>
  );
}
