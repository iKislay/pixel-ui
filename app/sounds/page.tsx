import type { Metadata } from "next";
import Footer from "@/components/Footer";
import GooeyNavbar from "@/components/GooeyNavbar";
import ProDemo from "@/components/ProDemo";
import { fetchStarCount } from "@/lib/github";
import { SITE_KEYWORDS } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Sounds",
  description: "UI sounds made in code, not audio files. Tap a blob to hear it, open it to retune it, copy its code.",
  keywords: SITE_KEYWORDS,
  alternates: { canonical: "/sounds" },
};

export default async function SoundsPage() {
  const stars = await fetchStarCount();

  return (
    <>
      <GooeyNavbar stars={stars} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 pt-32 sm:px-6 md:pt-40">
        <header className="flex flex-col items-center gap-3 text-center">
          <h1 className="font-serif text-3xl font-normal tracking-tight sm:text-4xl md:text-5xl">
            Interface <span className="italic">sounds</span>
          </h1>
          <p className="text-sm font-medium text-muted-foreground sm:text-base">Tap to hear. Open to retune.</p>
        </header>

        <ProDemo name="sounds" />
      </main>

      <Footer />
    </>
  );
}
