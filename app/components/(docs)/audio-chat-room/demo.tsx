"use client";

import {
  AudioChatRoom,
  type AudioChatParticipant,
} from "@/components/ui/audio-chat-room";

const PARTICIPANTS: AudioChatParticipant[] = [
  { id: "1", name: "Lena", avatar: "https://i.pravatar.cc/150?img=47", speaking: true },
  { id: "2", name: "Kai", avatar: "https://i.pravatar.cc/150?img=15" },
  { id: "3", name: "Priya", avatar: "https://i.pravatar.cc/150?img=44" },
  { id: "4", name: "Mateo", avatar: "https://i.pravatar.cc/150?img=60" },
  { id: "5", name: "Zoe", avatar: "https://i.pravatar.cc/150?img=25" },
  { id: "6", name: "Ravi", avatar: "https://i.pravatar.cc/150?img=68", speaking: true },
  { id: "7", name: "Iris", avatar: "https://i.pravatar.cc/150?img=36" },
];

const YOU: AudioChatParticipant = {
  id: "you",
  name: "You",
  avatar: "https://i.pravatar.cc/150?img=59",
};

export default function AudioChatRoomPage() {
  return (
    <div className="relative flex h-full items-center justify-center px-6 font-runde">
      <AudioChatRoom participants={PARTICIPANTS} you={YOU} />
    </div>
  );
}
