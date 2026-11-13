"use client";

import { GalleryCorridor } from "@/components/ui/gallery-corridor";
import Player, { type RecordingProps, type Script } from "./Player";

// the intro: the light front races down and the pieces flicker on
const script: Script = async (cursor) => {
  await cursor.wait(4000);
};

export default function GalleryCorridorRecording(props: RecordingProps) {
  return (
    <Player width={420} height={320} script={script} showCursor={false} {...props}>
      <GalleryCorridor className="h-full w-full" />
    </Player>
  );
}
