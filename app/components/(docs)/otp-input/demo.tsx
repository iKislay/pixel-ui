"use client";

import { OtpInput } from "@/components/ui/otp-input";

const verify = (code: string) =>
  new Promise<boolean>((resolve) =>
    setTimeout(() => resolve(code === "123456"), 1400),
  );

export default function OtpInputDemo() {
  return (
    <div className="relative flex h-full min-h-[500px] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <OtpInput onVerify={verify} />
        <span className="text-xs text-muted-foreground select-none">
          Try 123456, or any other code to see the error
        </span>
      </div>
    </div>
  );
}
