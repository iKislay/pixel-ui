"use client";

import { AsciiButterflies } from "@/components/ui/ascii-butterflies";
import DemoSearch from "@/components/preview/DemoSearch";
import { usePreviewControl } from "@/components/preview/PreviewControls";

export default function Page() {
  const [variantStr] = usePreviewControl("variant", "color");
  const [countStr] = usePreviewControl("count", "3");

  const variant = (variantStr === "mono" ? "mono" : "color") as "color" | "mono";
  const count = Number(countStr) || 3;

  return (
    <div className="relative h-full min-h-[500px] w-full overflow-hidden font-runde">
      <AsciiButterflies variant={variant} count={count} className="absolute inset-0" />
      <div className="relative flex h-full min-h-[500px] items-center justify-center pb-16">
        <DemoSearch />
      </div>
    </div>
  );
}
