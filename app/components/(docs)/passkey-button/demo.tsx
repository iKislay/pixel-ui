"use client";

import { PasskeyButton } from "@/components/ui/passkey-button";

const pass = () => new Promise((resolve) => setTimeout(resolve, 1800));

const fail = () =>
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error("No passkey found on this device.")), 1600),
  );

export default function PasskeyButtonDemo() {
  return (
    <div className="relative flex h-full min-h-[500px] items-center justify-center">
      <div className="flex flex-col items-center gap-5">
        <PasskeyButton onVerify={pass} resetAfter={2400} />
        <PasskeyButton onVerify={pass} variant="primary" size="lg" resetAfter={2400} />
        <PasskeyButton onVerify={fail} variant="outline" />
        <span className="text-xs text-muted-foreground select-none">
          The outline button always fails, to show the error
        </span>
      </div>
    </div>
  );
}
