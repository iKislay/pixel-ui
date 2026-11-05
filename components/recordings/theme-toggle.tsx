"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { useTheme } from "next-themes";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";
import Player, { type RecordingProps, type Script } from "./Player";

const WIDTH = 400;
const HEIGHT = 260;
// matches top-4 right-4 size-11 on the toggle
const ORIGIN = `${WIDTH - 16 - 22}px ${16 + 22}px`;
const RADIUS = Math.hypot(WIDTH, HEIGHT);

// the toggle icons follow the site theme, so the window pins them to its own
const ICONS = {
  light:
    "bg-neutral-100 text-neutral-700 [&>svg:first-of-type]:rotate-0 [&>svg:first-of-type]:scale-100 [&>svg:last-of-type]:rotate-90 [&>svg:last-of-type]:scale-0",
  dark: "bg-neutral-800 text-neutral-200 [&>svg:first-of-type]:-rotate-90 [&>svg:first-of-type]:scale-0 [&>svg:last-of-type]:rotate-0 [&>svg:last-of-type]:scale-100",
};

function Window({ dark }: { dark: boolean }) {
  const line = dark ? "bg-white/10" : "bg-black/[0.07]";
  return (
    <div
      className={cn(
        "absolute inset-0 flex flex-col gap-3 p-6",
        dark ? "bg-neutral-950" : "bg-white",
      )}
    >
      <div className={cn("size-8 rounded-full", line)} />
      <div className={cn("mt-2 h-4 w-40 rounded-full", line)} />
      <div className={cn("h-3 w-64 rounded-full", line)} />
      <div className={cn("h-3 w-52 rounded-full", line)} />
      <div className="mt-auto flex gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className={cn("h-16 flex-1 rounded-xl", line)} />
        ))}
      </div>
    </div>
  );
}

function Demo() {
  const [dark, setDark] = useState(useTheme().resolvedTheme === "dark");
  const [turns, setTurns] = useState(0);

  return (
    <div className="flex h-full items-center justify-center">
      <div
        style={{ width: WIDTH, height: HEIGHT }}
        className="relative overflow-hidden rounded-2xl shadow-xl ring-1 ring-black/10 dark:ring-white/10"
      >
        <Window dark={!dark} />
        <motion.div
          key={turns}
          initial={turns ? { clipPath: `circle(0px at ${ORIGIN})` } : false}
          animate={{ clipPath: `circle(${RADIUS}px at ${ORIGIN})` }}
          transition={{ duration: 0.45, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <Window dark={dark} />
        </motion.div>
        <ThemeToggle
          onClick={(event) => {
            event.preventDefault();
            setDark(!dark);
            setTurns(turns + 1);
          }}
          className={cn(
            "absolute right-4 top-4 size-11 [&_svg]:size-5",
            ICONS[dark ? "dark" : "light"],
          )}
        />
      </div>
    </div>
  );
}

const script: Script = async (cursor) => {
  await cursor.wait(300);
  await cursor.click('[data-slot="theme-toggle"]');
  await cursor.move({ x: 0.6, y: 0.62 });
  await cursor.wait(900);
  await cursor.click('[data-slot="theme-toggle"]');
  await cursor.wait(1300);
};

export default function ThemeToggleRecording(props: RecordingProps) {
  return (
    <Player width={440} height={300} script={script} {...props}>
      <Demo />
    </Player>
  );
}
