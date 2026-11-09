"use client";

import { SwarmReveal } from "@/components/ui/swarm-reveal";
import Player, { type RecordingProps, type Script } from "./Player";

const script: Script = async (cursor) => {
  await cursor.wait(10000);
};

export default function SwarmRevealRecording(props: RecordingProps) {
  return (
    <Player width={420} height={320} script={script} showCursor={false} {...props}>
      <SwarmReveal
        cursors={10}
        status={false}
        className="flex h-full flex-col gap-3 p-6 text-foreground"
      >
        <div data-swarm="image" className="h-20 rounded-xl bg-[linear-gradient(180deg,#1e3a8a,#6d28d9_55%,#f97316)]" />
        <div className="flex items-center gap-3">
          <div data-swarm="image" className="size-10 shrink-0 rounded-full bg-[conic-gradient(#ff5f57,#ffd60a,#30d158,#0a84ff,#bf5af2,#ff5f57)]" />
          <div>
            <h1 data-swarm className="text-base font-semibold">Mira Okafor</h1>
            <p data-swarm className="text-xs text-muted-foreground">Creative developer, Lagos</p>
          </div>
        </div>
        <p data-swarm="text" className="text-xs leading-5 text-foreground/80">
          I build playful interfaces that feel alive. Most of my work sits between design and engineering: small tools,
          odd games, and websites that reward a second look.
        </p>
      </SwarmReveal>
    </Player>
  );
}
