"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import SidebarNav from "./SidebarNav";
import SidebarHeader from "./SidebarHeader";
import SidebarScroll from "./SidebarScroll";
import { ClosedIcon, OpenIcon } from "./icons";
import { NavbarActions } from "../NavbarActions";

export default function MobileSidebar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open sidebar"
          className="absolute left-4 top-4 z-60 cursor-pointer rounded-lg bg-[#F4F4F9] p-2 text-[#868593] dark:bg-popover dark:text-[#A1A0AB]"
        >
          <ClosedIcon className="size-5" />
        </button>
      )}

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-50 touch-none bg-black/50 backdrop-blur-sm"
            />

            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col rounded-r-3xl bg-card p-4"
            >
              <div className="flex items-center justify-between gap-3 pt-2">
                <SidebarHeader onNavigate={() => setOpen(false)} />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close sidebar"
                  className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-[#F4F4F9] text-[#868593] transition-[color,transform] hover:text-black dark:bg-popover dark:hover:text-white"
                >
                  <OpenIcon className="size-4" />
                </button>
              </div>
              <SidebarScroll className="mt-4 min-h-0 flex-1">
                <SidebarNav onNavigate={() => setOpen(false)} />
              </SidebarScroll>

              <div className="mt-4 shrink-0">
                <NavbarActions />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
