"use client";

import { AudioChatRoom } from "@/components/ui/audio-chat-room";
import { PARTICIPANTS, YOU } from "@/app/components/(docs)/audio-chat-room/demo";
import Player, { type RecordingProps, type Script } from "./Player";

const PEOPLE = PARTICIPANTS.map((p) => ({
  ...p,
  speaking: p.id === "1" || p.id === "6",
}));

const script: Script = async (cursor) => {
  await cursor.wait(300);
  await cursor.click('[data-slot="audio-chat-room"]');
  await cursor.wait(900);
  await cursor.click(cursor.find("button", "Join now"));
  await cursor.wait(900);
  await cursor.click('button[aria-label="Unmute mic"]');
  await cursor.wait(1800);
  await cursor.click(cursor.find("button", "Leave"));
  await cursor.wait(900);
  await cursor.click('[data-slot="audio-chat-room"] button[aria-label="Close"]');
  await cursor.wait(1000);
};

export default function AudioChatRoomRecording(props: RecordingProps) {
  return (
    <Player width={400} height={450} script={script} {...props}>
      <div className="flex h-full items-center justify-center">
        <AudioChatRoom participants={PEOPLE} you={YOU} />
      </div>
    </Player>
  );
}
