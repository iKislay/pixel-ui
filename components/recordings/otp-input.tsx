"use client";

import { OtpInput } from "@/components/ui/otp-input";
import { verify } from "@/app/components/(docs)/otp-input/demo";
import Player, { type Cursor, type RecordingProps, type Script } from "./Player";

const setValue = Object.getOwnPropertyDescriptor(
  HTMLInputElement.prototype,
  "value",
)!.set!;

// the stage is inert, so focus and keystrokes are faked through the events react listens to
async function type(cursor: Cursor, digits: string) {
  const input = cursor.find('[data-slot="otp-input"] input') as HTMLInputElement;
  input.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
  for (const digit of digits) {
    setValue.call(input, input.value + digit);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await cursor.wait(190);
  }
}

const script: Script = async (cursor) => {
  await cursor.wait(300);
  await cursor.click('[data-slot="otp-input"] button');
  await cursor.move({ x: 0.62, y: 0.74 });
  await cursor.wait(250);
  await type(cursor, "213212");
  await cursor.wait(3400);
  await type(cursor, "123456");
  await cursor.wait(2600);
};

export default function OtpInputRecording(props: RecordingProps) {
  return (
    <Player width={400} height={260} script={script} {...props}>
      <div className="flex h-full items-center justify-center">
        <OtpInput onVerify={verify} />
      </div>
    </Player>
  );
}
