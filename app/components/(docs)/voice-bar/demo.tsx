"use client";

import * as React from "react";
import { FileText, X } from "lucide-react";
import { VoiceBar, useVoiceAudio, type VoiceBarState } from "@/components/ui/voice-bar";

const QUESTION = "What should I pack for a weekend in Lisbon?";
const REPLY = "Light layers, comfy shoes for the hills, and a jacket for the evening breeze.";

export default function VoiceBarDemo() {
  const [state, setState] = React.useState<VoiceBarState>("idle");
  const [transcript, setTranscript] = React.useState("");
  const [stream, setStream] = React.useState<MediaStream | null>(null);
  const [file, setFile] = React.useState(false);
  const audio = useVoiceAudio(stream);
  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([]);

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  React.useEffect(() => clear, []);
  React.useEffect(() => () => stream?.getTracks().forEach((t) => t.stop()), [stream]);

  const at = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms));

  const streamWords = (text: string, start: number, step: number) => {
    const words = text.split(" ");
    words.forEach((_, i) => at(start + i * step, () => setTranscript(words.slice(0, i + 1).join(" "))));
    return start + words.length * step;
  };

  const session = React.useRef(0);

  const stop = () => {
    session.current++;
    clear();
    setTranscript("");
    setStream(null);
  };

  const startVoice = () => {
    clear();
    setTranscript("");
    const id = ++session.current;
    // a denied mic still plays the scripted conversation on a simulated voice
    navigator.mediaDevices
      ?.getUserMedia({ audio: true })
      .then((s) => (id === session.current ? setStream(s) : s.getTracks().forEach((t) => t.stop())))
      .catch(() => {});
    const heard = streamWords(QUESTION, 900, 280);
    at(heard + 700, () => {
      setTranscript("");
      setState("thinking");
    });
    at(heard + 2500, () => setState("speaking"));
    const spoken = streamWords(REPLY, heard + 2700, 240);
    at(spoken + 1600, () => {
      setState("idle");
      stop();
    });
  };

  return (
    <div className="relative flex h-full min-h-[500px] items-center justify-center px-4">
      <div className="flex w-full max-w-[520px] flex-col items-center gap-3">
        <VoiceBar
          state={state}
          onStateChange={setState}
          transcript={transcript}
          onVoiceStart={startVoice}
          onCancel={stop}
          onSubmit={() => new Promise((resolve) => setTimeout(resolve, 1800))}
          onAttach={() => setFile(true)}
          attachments={
            file ? (
              <span className="flex h-7 items-center gap-1.5 rounded-full border border-border bg-muted pr-1 pl-2.5 text-xs text-foreground">
                <FileText className="size-3.5" />
                trip-notes.pdf
                <button
                  type="button"
                  aria-label="Remove trip-notes.pdf"
                  onClick={() => setFile(false)}
                  className="flex size-5 cursor-pointer items-center justify-center rounded-full hover:bg-foreground/10"
                >
                  <X className="size-3" />
                </button>
              </span>
            ) : null
          }
          {...(stream ? audio : {})}
        />
        <span className="text-xs text-muted-foreground select-none">
          Type and press Enter, or tap the waveform to talk
        </span>
      </div>
    </div>
  );
}
