"use client";

import { AsciiButterflies } from "@/components/ui/ascii-butterflies";
import { AsciiJellyfish } from "@/components/ui/ascii-jellyfish";
import Player, { type RecordingProps, type Script } from "./Player";

// the canvas reacts to pointer moves and taps, so the cursor drives it directly
const wander: Script = async (cursor) => {
  const canvas = cursor.find("canvas");
  await cursor.move({ x: 0.34, y: 0.42 }, { track: canvas, duration: 1800 });
  await cursor.move({ x: 0.62, y: 0.6 }, { track: canvas, duration: 2000 });
  await cursor.click({ x: 0.5, y: 0.46 }, canvas);
  await cursor.wait(1400);
  await cursor.move({ x: 0.7, y: 0.34 }, { track: canvas, duration: 1800 });
  canvas.dispatchEvent(new PointerEvent("pointerleave"));
  await cursor.wait(600);
};

export function Jellyfish(props: RecordingProps) {
  return (
    <Player script={wander} {...props}>
      <AsciiJellyfish count={4} className="absolute inset-0" />
    </Player>
  );
}

export function Butterflies(props: RecordingProps) {
  return (
    <Player script={wander} {...props}>
      <AsciiButterflies count={3} className="absolute inset-0" />
    </Player>
  );
}
