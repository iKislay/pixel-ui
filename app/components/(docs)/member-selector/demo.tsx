"use client";

import { useState } from "react";
import { MemberSelector, type Member } from "@/components/ui/member-selector";

const avatar = (seed: string) =>
  `https://api.dicebear.com/9.x/micah/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

const MEMBERS: Member[] = [
  ["1", "Yuki Tanaka", "yuki.tanaka"],
  ["2", "Matt Cooper", "matt.cooper"],
  ["3", "Sofia Martinez", "sofia.martinez"],
  ["4", "Richard Weber", "richard.weber"],
  ["5", "Emma O'Brien", "emma.obrien"],
  ["6", "Jake Morrison", "jake.morrison"],
  ["7", "Tony Russo", "tony.russo"],
  ["8", "Luna Chen", "luna.chen"],
].map(([id, name, handle]) => ({
  id,
  name,
  email: `${handle}@company.com`,
  avatar: avatar(name),
}));

export default function MemberSelectorPage() {
  const [selected, setSelected] = useState(["1", "2"]);

  return (
    <div className="relative flex h-full items-center justify-center px-6 pb-64 font-runde">
      <MemberSelector
        members={MEMBERS}
        selected={selected}
        onChange={setSelected}
        maxVisible={5}
        label="Participants"
      />
    </div>
  );
}
