"use client";

import { ComicGlitchText } from "@/components/ui/comic-glitch-text";
import Player, { type RecordingProps, type Script } from "./Player";

// one full cycle for these 10 words: reveal, hold, scramble out
const script: Script = async (cursor) => {
  await cursor.wait(6700);
};

export default function ComicGlitchTextRecording(props: RecordingProps) {
  return (
    <Player width={420} height={320} script={script} showCursor={false} {...props}>
      <div className="flex h-full items-center justify-center p-8">
        <ComicGlitchText className="text-xl leading-relaxed text-foreground">
          With great power there must also come… great responsibility!
        </ComicGlitchText>
      </div>
    </Player>
  );
}
