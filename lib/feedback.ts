"use client";

import { useEffect, useRef } from "react";

type Sound = "tick" | "open" | "close" | "copy";

let audio: AudioContext | undefined;
const lastPlayed: Partial<Record<Sound, number>> = {};

function tone(
  ctx: AudioContext,
  start: number,
  from: number,
  to: number,
  duration: number,
  peak: number,
  type: OscillatorType = "sine",
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, start);
  osc.frequency.exponentialRampToValueAtTime(to, start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

const SOUNDS: Record<Sound, (ctx: AudioContext, t: number) => void> = {
  tick: (ctx, t) => tone(ctx, t, 1600, 1000, 0.04, 0.035, "triangle"),
  open: (ctx, t) => tone(ctx, t, 420, 640, 0.13, 0.04),
  close: (ctx, t) => tone(ctx, t, 640, 420, 0.11, 0.035),
  copy: (ctx, t) => {
    tone(ctx, t, 1047, 1047, 0.14, 0.03);
    tone(ctx, t + 0.06, 1568, 1568, 0.2, 0.025);
  },
};

function haptic() {
  if (!window.matchMedia("(pointer: coarse)").matches) return;
  if (navigator.vibrate) return void navigator.vibrate(8);
  // ios safari has no vibrate api, but toggling a native switch input fires a system haptic
  const label = document.createElement("label");
  const input = document.createElement("input");
  input.type = "checkbox";
  input.setAttribute("switch", "");
  label.style.display = "none";
  label.append(input);
  document.body.append(label);
  label.click();
  label.remove();
}

export function feedback(sound: Sound) {
  try {
    audio ??= new AudioContext();
    if (audio.state === "suspended") void audio.resume();
    // opening the code drawer also opens its panel; one cue is enough
    if (performance.now() - (lastPlayed[sound] ?? -Infinity) < 80) return;
    lastPlayed[sound] = performance.now();
    SOUNDS[sound](audio, audio.currentTime);
    haptic();
  } catch {}
}

export function useOpenSound(open: boolean) {
  const previous = useRef(open);

  useEffect(() => {
    if (previous.current === open) return;
    previous.current = open;
    feedback(open ? "open" : "close");
  }, [open]);
}
