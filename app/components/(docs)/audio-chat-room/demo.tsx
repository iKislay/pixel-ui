"use client";

import {
  AudioChatRoom,
  type AudioChatParticipant,
} from "@/components/ui/audio-chat-room";
import { usePreviewControl } from "@/components/preview/PreviewControls";

const photo = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=160&h=160&fit=crop&crop=faces&auto=format&q=80`;

export const PARTICIPANTS: AudioChatParticipant[] = [
  { id: "1", name: "Lena", avatar: photo("1494790108377-be9c29b29330") },
  { id: "2", name: "Kai", avatar: photo("1507003211169-0a1dd7228f2d") },
  { id: "3", name: "Priya", avatar: photo("1438761681033-6461ffad8d80") },
  { id: "4", name: "Mateo", avatar: photo("1500648767791-00dcc994a43e") },
  { id: "5", name: "Zoe", avatar: photo("1534528741775-53994a69daeb") },
  { id: "6", name: "Ravi", avatar: photo("1506794778202-cad84cf45f1d") },
  { id: "7", name: "Iris", avatar: photo("1544005313-94ddf0286df2") },
];

export const YOU: AudioChatParticipant = {
  id: "you",
  name: "You",
  avatar: photo("1472099645785-5658abf4ff4e"),
};

export default function AudioChatRoomPage() {
  const [speakingStr] = usePreviewControl("speaking", "1,6");
  const [mutedStr] = usePreviewControl("muted", "false");
  const speakingIds = speakingStr ? speakingStr.split(",") : [];

  const participants = PARTICIPANTS.map((p) => ({
    ...p,
    speaking: speakingIds.includes(p.id),
  }));

  return (
    <div className="relative flex h-full min-h-[500px] items-center justify-center px-6">
      <AudioChatRoom
        participants={participants}
        you={{
          ...YOU,
          speaking: mutedStr !== "true" && speakingIds.includes("you"),
        }}
      />
    </div>
  );
}
