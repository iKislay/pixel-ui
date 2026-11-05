"use client";

import { useState } from "react";
import { MemberSelector } from "@/components/ui/member-selector";
import { MEMBERS } from "@/app/components/(docs)/member-selector/demo";
import Player, { type RecordingProps, type Script } from "./Player";

function Demo() {
  const [selected, setSelected] = useState(["1", "2"]);
  return (
    <div className="flex h-full justify-center pt-4">
      <MemberSelector
        members={MEMBERS}
        selected={selected}
        onChange={setSelected}
      />
    </div>
  );
}

const option = (id: string) =>
  `[data-slot="member-selector-option"][data-key="${id}"]:not([data-exiting])`;

const script: Script = async (cursor) => {
  await cursor.wait(300);
  await cursor.click('[data-slot="member-selector-avatar"][data-key="3"]:not([data-exiting])');
  await cursor.wait(500);
  await cursor.click('[data-slot="member-selector-add"]');
  await cursor.wait(700);
  await cursor.click(option("4"));
  await cursor.wait(600);
  await cursor.click(option("2"));
  await cursor.wait(700);
  await cursor.click('[data-slot="member-selector-dropdown"] button[aria-label="Close"]');
  await cursor.wait(1200);
};

export default function MemberSelectorRecording(props: RecordingProps) {
  return (
    <Player width={400} height={450} script={script} {...props}>
      <Demo />
    </Player>
  );
}
