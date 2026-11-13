"use client";

import { GalleryCorridor } from "@/components/ui/gallery-corridor";
import Player, { type RecordingProps, type Script } from "./Player";

// the first piece hangs on the right wall at this stage size
const FIRST_PIECE = { x: 0.8, y: 0.5 };

const script: Script = async (cursor) => {
  const canvas = cursor.find("[data-slot=gallery-corridor] canvas");
  await cursor.wait(2600);
  await cursor.move({ x: 0.42, y: 0.38 }, { track: canvas });
  await cursor.move(FIRST_PIECE, { track: canvas });
  await cursor.wait(500);
  await cursor.click(FIRST_PIECE, canvas);
  await cursor.wait(2400);
  await cursor.click({ x: 0.22, y: 0.3 }, canvas);
  await cursor.wait(1300);
  await cursor.click(cursor.find("[data-slot=gallery-corridor] li button", "Map of a Nap"));
  await cursor.wait(3000);
};

export default function GalleryCorridorRecording(props: RecordingProps) {
  return (
    <Player width={420} height={320} script={script} {...props}>
      <GalleryCorridor className="h-full w-full" />
    </Player>
  );
}
