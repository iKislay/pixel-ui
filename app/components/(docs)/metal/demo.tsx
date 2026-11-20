"use client";

import { useRef, type RefObject } from "react";
import { ArrowUp } from "lucide-react";
import { MetalBadge, MetalFx, MetalText, useMetalBend, useMetalTextReflection } from "@/components/ui/metal";
import { usePreviewControl } from "@/components/preview/PreviewControls";
import { useMetalStyle } from "@/lib/metal-controls";

type Preset = "chromatic" | "silver" | "gold";

export default function Demo() {
  const [preset] = usePreviewControl("mt-preset", "chromatic");
  const [variant] = usePreviewControl("mt-variant", "button");
  const [theme] = usePreviewControl("mt-theme", "auto");
  const [inner] = usePreviewControl("mt-inner", "on");
  const [glow] = usePreviewControl("mt-glow", "on");
  const [bend] = usePreviewControl("mt-bend", "on");
  const [reflect] = usePreviewControl("mt-reflect", "on");
  const [paused] = usePreviewControl("mt-paused", "off");
  const [style] = useMetalStyle();

  const options = {
    preset: preset as Preset,
    theme: theme === "auto" ? undefined : (theme as "light" | "dark"),
    strength: style.strength ?? 1,
    paused: paused === "on",
  };

  return (
    <div className="flex h-full min-h-[500px] w-full flex-col items-center justify-center gap-12 px-6">
      <div className="flex items-center gap-3">
        <MetalText font="600 40px/1.2 Inter, sans-serif" {...options}>
          Pro
        </MetalText>
        <MetalBadge {...options}>New</MetalBadge>
      </div>
      <Hero
        key={`${variant}-${bend}-${reflect}`}
        variant={variant as "button" | "circle"}
        bend={bend === "on"}
        reflect={reflect === "on"}
        innerShadow={inner === "on"}
        disableGlow={glow === "off"}
        glowGain={style.glowGain ?? 1}
        {...options}
      />
    </div>
  );
}

type HeroProps = {
  variant: "button" | "circle";
  bend: boolean;
  reflect: boolean;
  innerShadow: boolean;
  disableGlow: boolean;
  glowGain: number;
  preset: Preset;
  theme?: "light" | "dark";
  strength: number;
  paused: boolean;
};

function Bend({ target }: { target: RefObject<HTMLDivElement | null> }) {
  useMetalBend(target);
  return null;
}

function Reflection({
  metal,
  text,
}: {
  metal: RefObject<HTMLDivElement | null>;
  text: RefObject<HTMLParagraphElement | null>;
}) {
  useMetalTextReflection(metal, text);
  return null;
}

function Hero({ variant, bend, reflect, ...metal }: HeroProps) {
  const ref = useRef<HTMLDivElement>(null);
  const caption = useRef<HTMLParagraphElement>(null);
  const neighbour = useRef<HTMLSpanElement>(null);

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex items-center gap-6">
        <MetalFx ref={ref} variant={variant} reflectionTargets={reflect ? [neighbour] : []} {...metal}>
          {variant === "circle" ? (
            <button
              type="button"
              aria-label="Send"
              className="flex size-12 items-center justify-center rounded-full bg-neutral-950 text-neutral-100"
            >
              <ArrowUp className="size-5" />
            </button>
          ) : (
            <button
              type="button"
              className="rounded-full bg-neutral-950 px-6 py-3 text-sm font-medium text-neutral-100"
            >
              Upgrade to Pro
            </button>
          )}
        </MetalFx>
        <span ref={neighbour} className="rounded-full bg-muted px-4 py-2 text-sm text-muted-foreground">
          Later
        </span>
      </div>
      <p ref={caption} className="text-sm text-muted-foreground">
        Unlimited projects, priority support.
      </p>
      {bend && <Bend target={ref} />}
      {reflect && <Reflection metal={ref} text={caption} />}
    </div>
  );
}
