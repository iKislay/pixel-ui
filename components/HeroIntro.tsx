"use client";

import { motion, useReducedMotion } from "motion/react";

const spring = { type: "spring", stiffness: 300, damping: 22 } as const;

const STEP = 0.09;

const rise = {
  hidden: { y: 18, filter: "blur(4px)" },
  shown: { y: 0, filter: "blur(0px)" },
};

export default function HeroIntro({
  headline,
  sub,
  badge,
  children,
}: {
  headline: React.ReactNode;
  sub: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();

  const step = (index: number) =>
    reduceMotion ? { duration: 0 } : { ...spring, delay: index * STEP };

  return (
    <>
      {badge && (
        <motion.div
          initial={reduceMotion ? false : rise.hidden}
          animate={rise.shown}
          transition={step(0)}
          className="mb-1"
        >
          {badge}
        </motion.div>
      )}

      <motion.h1
        initial={reduceMotion ? false : rise.hidden}
        animate={rise.shown}
        transition={step(badge ? 1 : 0)}
        className="max-w-5xl text-balance font-serif text-4xl font-normal tracking-tight text-black dark:text-white sm:text-6xl md:text-7xl lg:text-8xl"
      >
        {headline}
      </motion.h1>

      <motion.p
        initial={reduceMotion ? false : rise.hidden}
        animate={rise.shown}
        transition={step(badge ? 2 : 1)}
        className="max-w-xl font-medium text-black/60 dark:text-white/60 sm:text-lg"
      >
        {sub}
      </motion.p>

      <motion.div
        initial={reduceMotion ? false : rise.hidden}
        animate={rise.shown}
        transition={step(badge ? 3 : 2)}
      >
        {children}
      </motion.div>
    </>
  );
}
