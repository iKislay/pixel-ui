"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import McpText from "@/components/mcp/McpText";

export type FaqItem = { question: string; answer: string };

const spring = { type: "spring", stiffness: 380, damping: 32 } as const;

export default function Faq({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const reduceMotion = useReducedMotion();
  const id = useId();
  const transition = reduceMotion ? { duration: 0 } : spring;

  return (
    <ul className="isolate flex flex-col">
      {items.map((item, index) => {
        const expanded = open === index;
        return (
          <li key={item.question} className="relative">
            <AnimatePresence>
              {expanded ? (
                <motion.div
                  layoutId={`${id}-highlight`}
                  transition={transition}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 -z-10 rounded-2xl bg-muted"
                />
              ) : null}
            </AnimatePresence>
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={`${id}-${index}`}
              onClick={() => setOpen(expanded ? null : index)}
              className="flex w-full cursor-pointer items-center justify-between gap-6 px-4 py-4 text-left"
            >
              <span
                className={`font-serif text-lg tracking-tight transition-colors duration-150 ease-out sm:text-xl ${expanded ? "text-foreground" : "text-foreground/60 hover:text-foreground"}`}
              >
                {item.question}
              </span>
              <motion.svg
                aria-hidden
                viewBox="0 0 12 12"
                animate={{ rotate: expanded ? 45 : 0 }}
                transition={transition}
                className="size-3 shrink-0 text-foreground/50"
              >
                <path
                  d="M6 1v10M1 6h10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </motion.svg>
            </button>
            <AnimatePresence initial={false}>
              {expanded ? (
                <motion.div
                  id={`${id}-${index}`}
                  role="region"
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  transition={transition}
                  className="overflow-hidden"
                >
                  <motion.div
                    initial={reduceMotion ? false : { opacity: 0, y: -6, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, filter: "blur(4px)" }}
                    transition={reduceMotion ? { duration: 0 } : { duration: 0.25, ease: "easeOut" }}
                    className="max-w-2xl px-4 pb-5"
                  >
                    <McpText>{item.answer}</McpText>
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );
}
