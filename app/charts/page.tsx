import type { Metadata } from "next";
import ChartDemo from "@/components/charts/demos";
import Footer from "@/components/Footer";
import PrimitiveCard from "@/components/gallery/PrimitiveCard";
import GooeyNavbar from "@/components/GooeyNavbar";
import { charts } from "@/lib/charts";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/components";
import { fetchStarCount } from "@/lib/github";
import { SITE_KEYWORDS } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Charts",
  description:
    "Hand-drawn SVG charts for React from Pixel UI: line, area, bar, donut, heatmap, sparkline and more, each one file with keyboard reading, a data table for screen readers and calm Motion.",
  keywords: SITE_KEYWORDS,
  alternates: {
    canonical: "/charts",
  },
};

const sections = CATEGORY_ORDER.map((id) => ({
  id,
  label: CATEGORY_LABELS[id],
  items: charts.filter((item) => item.category === id),
})).filter((section) => section.items.length > 0);

export default async function ChartsIndexPage() {
  const stars = await fetchStarCount();

  return (
    <>
      <GooeyNavbar stars={stars} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 pt-32 sm:px-6 md:pt-40">
        <header className="flex flex-col items-center gap-3 text-center">
          <h1 className="max-w-2xl text-balance font-serif text-3xl font-normal tracking-tight sm:text-4xl md:text-5xl">
            Numbers, <span className="italic">drawn</span>
          </h1>
          <p className="max-w-lg text-balance text-sm font-medium text-muted-foreground sm:text-base">
            Lines, bars, rings and tiles for dashboards. Each one is a single file of plain SVG, readable by keyboard and
            screen reader, and calm in motion.
          </p>
        </header>

        {sections.map((section) => (
          <section key={section.id} id={section.id} className="mt-14 scroll-mt-28 first:mt-10">
            <h2 className="text-2xl font-medium tracking-tight sm:text-3xl">
              {section.label}{" "}
              <span className="text-muted-foreground">
                <span className="text-brand">[</span>
                {section.items.length}
                <span className="text-brand">]</span>
              </span>
            </h2>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {section.items.map((item) => (
                <PrimitiveCard
                  key={item.href}
                  item={item}
                  preview={
                    <div className="w-full pb-10">
                      <ChartDemo slug={item.registry!} compact />
                    </div>
                  }
                />
              ))}
            </div>
          </section>
        ))}
      </main>

      <Footer />
    </>
  );
}
