"use client";

import {
  AudioChatRoom,
  type AudioChatParticipant,
} from "@/components/ui/audio-chat-room";

const PARTICIPANTS: AudioChatParticipant[] = [
  { id: "1", name: "Oguz", avatar: "https://i.pravatar.cc/150?img=11", speaking: true },
  { id: "2", name: "Ashish", avatar: "https://i.pravatar.cc/150?img=12" },
  { id: "3", name: "Mariana", avatar: "https://i.pravatar.cc/150?img=32" },
  { id: "4", name: "MDS", avatar: "https://i.pravatar.cc/150?img=14" },
  { id: "5", name: "Ana", avatar: "https://i.pravatar.cc/150?img=5" },
  { id: "6", name: "Natko", avatar: "https://i.pravatar.cc/150?img=33", speaking: true },
  { id: "7", name: "Afshin", avatar: "https://i.pravatar.cc/150?img=51" },
];

export default function AudioChatRoomPage() {
  return (
    <div className="relative flex h-full items-center justify-center px-6 font-runde">
      <AudioChatRoom participants={PARTICIPANTS} />
    </div>
  );
}
