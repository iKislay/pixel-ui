"use client";

import { useState } from "react";
import { MemberSelector, type Member } from "@/components/ui/member-selector";

const photo = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=160&h=160&fit=crop&crop=faces&auto=format&q=80`;

const MEMBERS: Member[] = [
  ["1", "Yuki Tanaka", "yuki.tanaka", "1544005313-94ddf0286df2"],
  ["2", "Matt Cooper", "matt.cooper", "1507003211169-0a1dd7228f2d"],
  ["3", "Sofia Martinez", "sofia.martinez", "1534528741775-53994a69daeb"],
  ["4", "Richard Weber", "richard.weber", "1500648767791-00dcc994a43e"],
  ["5", "Emma O'Brien", "emma.obrien", "1438761681033-6461ffad8d80"],
  ["6", "Jake Morrison", "jake.morrison", "1506794778202-cad84cf45f1d"],
  ["7", "Tony Russo", "tony.russo", "1472099645785-5658abf4ff4e"],
  ["8", "Luna Chen", "luna.chen", "1494790108377-be9c29b29330"],
].map(([id, name, handle, image]) => ({
  id,
  name,
  email: `${handle}@company.com`,
  avatar: photo(image),
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
