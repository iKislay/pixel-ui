"use client";

import { DimensionHero } from "@/components/ui/dimension-hero";
import Player, { type RecordingProps, type Script } from "./Player";

const script: Script = async (cursor) => {
  const hero = cursor.find("[data-slot=dimension-hero]");
  const pill = "[data-slot=dimension-hero] button";
  await cursor.wait(3600);
  await cursor.click(pill);
  await cursor.wait(1400);
  await cursor.move({ x: 0.22, y: 0.25 }, { track: hero, duration: 1200 });
  await cursor.wait(900);
  await cursor.move({ x: 0.8, y: 0.35 }, { track: hero, duration: 1400 });
  await cursor.wait(900);
  await cursor.click(pill);
  await cursor.wait(1600);
};

export default function DimensionHeroRecording(props: RecordingProps) {
  return (
    <Player width={420} height={320} script={script} {...props}>
      <DimensionHero className="h-full w-full" />
    </Player>
  );
}
