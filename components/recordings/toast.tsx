"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ToastCard, type ToastType } from "@/components/ui/toast";
import Player, { type RecordingProps, type Script } from "./Player";

type Step = { type: ToastType; title: string; description: string };

const QUEUED: Step = {
  type: "default",
  title: "Queued for deploy",
  description: "Your build is waiting for a free runner.",
};
const LOADING: Step = {
  type: "loading",
  title: "Deploying to production...",
  description: "Build 214 is uploading and\nwill go live in a moment.",
};
const RESULTS: Record<"success" | "error", Step> = {
  success: {
    type: "success",
    title: "Deployment live",
    description: "Build 214 is now serving\nall of your traffic.",
  },
  error: {
    type: "error",
    title: "Deployment failed",
    description: "Build 214 could not start.\nCheck the logs and try again.",
  },
};

const BUTTON =
  "h-9 cursor-pointer rounded-full bg-white px-4 text-[13px] font-semibold text-black shadow-sm transition-[transform,background-color] active:scale-95 motion-reduce:transition-none dark:bg-[#262626] dark:text-white";

// a toast that updates in place, like toast.loading then toast.success with the same id
function Demo() {
  const [toast, setToast] = useState<Step & { pulse: number }>();
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const deploy = (result: keyof typeof RESULTS) => {
    timers.current.forEach(clearTimeout);
    const steps: [number, Step | undefined][] = [
      [0, QUEUED],
      [600, LOADING],
      [2800, RESULTS[result]],
      [5600, undefined],
    ];
    timers.current = steps.map(([ms, step], pulse) =>
      setTimeout(() => setToast(step && { ...step, pulse }), ms),
    );
  };

  return (
    <div className="relative flex h-full justify-center pt-16">
      <div className="flex h-fit gap-2">
        <button type="button" onClick={() => deploy("success")} className={BUTTON}>
          Deploy
        </button>
        <button type="button" onClick={() => deploy("error")} className={BUTTON}>
          Deploy fails
        </button>
      </div>
      <div className="absolute inset-x-0 bottom-5 mx-auto w-sm">
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ y: 64, opacity: 0, scale: 0.88 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 64, opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 380, damping: 30, mass: 0.8 }}
            >
              <ToastCard
                type={toast.type}
                title={toast.title}
                description={toast.description}
                pulse={toast.pulse}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const script: Script = async (cursor) => {
  await cursor.wait(300);
  await cursor.click(cursor.find("button", "Deploy"));
  await cursor.move({ x: 0.74, y: 0.48 });
  await cursor.wait(4800);
  await cursor.click(cursor.find("button", "Deploy fails"));
  await cursor.move({ x: 0.26, y: 0.5 });
  await cursor.wait(4800);
};

export default function ToastRecording(props: RecordingProps) {
  return (
    <Player width={420} height={320} script={script} {...props}>
      <Demo />
    </Player>
  );
}
