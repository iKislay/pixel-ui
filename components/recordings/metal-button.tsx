"use client";

import { useRef } from "react";
import { ArrowUp, ChevronDown, Plus } from "lucide-react";
import { MetalButton, useMetalBend } from "@/components/ui/metal-button";
import Player, { type RecordingProps, type Script } from "./Player";

const PILL = "flex items-center gap-1.5 rounded-full bg-neutral-800/80 px-4 py-2 text-sm text-neutral-200";

function Demo() {
  const metal = useRef<HTMLDivElement>(null);
  const auto = useRef<HTMLButtonElement>(null);
  useMetalBend(metal);

  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="flex w-full flex-col gap-4 rounded-3xl bg-neutral-900 p-4 text-neutral-200">
        <p className="px-1 text-sm text-neutral-500">Build anything...</p>
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-neutral-800/80">
            <Plus className="size-5" />
          </span>
          <span className={`${PILL} ml-auto`}>
            Agent <ChevronDown className="size-4" />
          </span>
          <button ref={auto} type="button" className={PILL}>
            Auto <ChevronDown className="size-4" />
          </button>
          <MetalButton ref={metal} variant="circle" innerShadow reflectionTargets={[auto]}>
            <button
              type="button"
              aria-label="Send"
              className="flex size-10 items-center justify-center rounded-full bg-neutral-950 text-neutral-100"
            >
              <ArrowUp className="size-5" />
            </button>
          </MetalButton>
        </div>
      </div>
    </div>
  );
}

// the dent follows pointermove, so the cursor tracks the metal while it moves over it
const script: Script = async (cursor) => {
  const metal = cursor.find('[data-slot="metal-button"]');
  await cursor.wait(900);
  await cursor.move(metal, { track: metal });
  await cursor.wait(700);
  await cursor.click(metal, metal);
  await cursor.wait(600);
  await cursor.move(cursor.find("button", "Auto"));
  await cursor.wait(1500);
};

export default function MetalButtonRecording(props: RecordingProps) {
  return (
    <Player width={460} height={240} script={script} {...props}>
      <Demo />
    </Player>
  );
}
