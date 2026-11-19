"use client";

import { PosterSphere } from "@/components/ui/poster-sphere";
import Player, { type RecordingProps, type Script } from "./Player";

// hover movement only: a scripted press never reaches react, and a click would open the full screen dialog
const script: Script = async (cursor) => {
  const wall = cursor.find("[data-slot=poster-sphere]");
  await cursor.wait(1200);
  await cursor.move({ x: 0.55, y: 0.45 }, { track: wall, duration: 1100 });
  await cursor.wait(600);
  await cursor.move({ x: 0.92, y: 0.4 }, { track: wall, duration: 1300 });
  await cursor.wait(1600);
  await cursor.move({ x: 0.3, y: 0.12 }, { track: wall, duration: 1400 });
  await cursor.wait(1400);
  await cursor.move({ x: 0.1, y: 0.75 }, { track: wall, duration: 1400 });
  await cursor.wait(1400);
  await cursor.move({ x: 0.5, y: 0.5 }, { track: wall, duration: 1200 });
  await cursor.wait(1800);
};

export default function PosterSphereRecording(props: RecordingProps) {
  return (
    <Player width={420} height={320} script={script} {...props}>
      <PosterSphere movement="hover" className="h-full w-full" />
    </Player>
  );
}
