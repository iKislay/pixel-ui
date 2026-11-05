"use client";

import { motion } from "motion/react";
import SidebarNav from "./SidebarNav";
import SidebarHeader from "./SidebarHeader";
import SidebarScroll from "./SidebarScroll";
import { ClosedIcon, OpenIcon } from "./icons";
import { Squircle } from "@squircle-js/react";
import CarbonAds from "../CarbonAds";
import Tooltip from "../Tooltip";
import { NavbarActions } from "../NavbarActions";

const PANEL_SHIFT = 320;

const Sidebar = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  return (
    <div className="pointer-events-none absolute left-0 top-0 z-40 h-full">
      {!open && (
        <Tooltip label="Open sidebar">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open sidebar"
            data-chrome
            className="pointer-events-auto absolute left-4 top-4 z-50 cursor-pointer rounded-lg bg-[#F4F4F9] p-2 text-[#868593] transition-[color,transform] duration-200 hover:text-black active:scale-95 motion-reduce:transition-none dark:bg-popover dark:text-[#A1A0AB] dark:hover:text-white"
          >
            <ClosedIcon className="size-5" />
          </button>
        </Tooltip>
      )}

      <Squircle asChild cornerRadius={23} cornerSmoothing={1}>
        <motion.div
          initial={false}
          animate={{ x: open ? 0 : -PANEL_SHIFT }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="pointer-events-auto flex h-full w-72 flex-col bg-background p-4 pl-6"
        >
          <div className="flex items-center justify-between gap-3 pt-1">
            <SidebarHeader />
            <Tooltip label="Collapse sidebar" align="end">
              <Squircle asChild cornerRadius={8} cornerSmoothing={1}>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Collapse sidebar"
                  className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center bg-[#F4F4F9] text-[#868593] outline-none transition-[color,transform] duration-200 hover:text-black focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/60 active:scale-95 motion-reduce:transition-none dark:bg-popover dark:text-[#A1A0AB] dark:hover:text-white"
                >
                  <OpenIcon className="size-4" />
                </button>
              </Squircle>
            </Tooltip>
          </div>
          <SidebarScroll className="mt-4 min-h-0 flex-1">
            <SidebarNav />
          </SidebarScroll>

          <CarbonAds className="mt-4 shrink-0" />

          <div className="mt-4 shrink-0">
            <NavbarActions />
          </div>
        </motion.div>
      </Squircle>
    </div>
  );
};

export default Sidebar;
