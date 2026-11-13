"use client";

import { ComicGlitchText } from "@/components/ui/comic-glitch-text";
import { usePreviewControl } from "@/components/preview/PreviewControls";

const TEXT =
  "And a lean, silent figure slowly fades into the gathering darkness, aware at last that in this world, with great power there must also come… great responsibility!";

export default function Demo() {
  const [loop] = usePreviewControl("loop", "on");
  const [replay] = usePreviewControl("replay", "0");

  return (
    <div className="flex h-full min-h-[500px] w-full items-center justify-center px-6">
      <ComicGlitchText key={`${loop}-${replay}`} loop={loop === "on"} className="max-w-md text-lg leading-relaxed text-foreground">
        {TEXT}
      </ComicGlitchText>
    </div>
  );
}
