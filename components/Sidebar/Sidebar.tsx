"use client";

import { useEffect } from "react";
import { motion } from "motion/react";
import SidebarNav from "./SidebarNav";
import SidebarHeader from "./SidebarHeader";
import SidebarScroll from "./SidebarScroll";
import { ClosedIcon, OpenIcon } from "./icons";
import { Squircle } from "@squircle-js/react";
import Tooltip from "../Tooltip";
import { NavbarActions } from "../NavbarActions";
import { cn } from "@/lib/utils";

const PANEL_SHIFT = 320;
const MIN_NAV_WIDTH = 200;
const MAX_NAV_WIDTH = 288;
const COLLAPSE_THRESHOLD = 50;

type SidebarProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  width?: number;
  onWidthChange?: (width: number) => void;
  isResizing?: boolean;
  setIsResizing?: (resizing: boolean) => void;
};

const Sidebar = ({
  open,
  setOpen,
  width = MAX_NAV_WIDTH,
  onWidthChange,
  isResizing = false,
  setIsResizing,
}: SidebarProps) => {
  useEffect(() => {
    return () => {
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("user-select");
    };
  }, []);

  const handleDragStart = (e: React.PointerEvent) => {
    e.preventDefault();
    if (!onWidthChange || !setIsResizing) return;

    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = width;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const delta = moveEvent.clientX - startX;
      const nextWidth = startWidth + delta;

      if (nextWidth > MAX_NAV_WIDTH) {
        onWidthChange(MAX_NAV_WIDTH);
      } else if (nextWidth < MIN_NAV_WIDTH) {
        const underdrag = MIN_NAV_WIDTH - nextWidth;
        if (underdrag >= COLLAPSE_THRESHOLD) {
          cleanup();
          setIsResizing(false);
          setOpen(false);
          onWidthChange(MAX_NAV_WIDTH);
          return;
        }
        onWidthChange(MIN_NAV_WIDTH - underdrag * 0.2);
      } else {
        onWidthChange(nextWidth);
      }
    };

    const cleanup = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("user-select");
    };

    const onPointerUp = () => {
      cleanup();
      setIsResizing(false);
      if (width < MIN_NAV_WIDTH) {
        if (MIN_NAV_WIDTH - width >= 15) {
          setOpen(false);
        }
        onWidthChange(MIN_NAV_WIDTH);
      }
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

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
          transition={
            isResizing
              ? { duration: 0 }
              : { type: "spring", stiffness: 300, damping: 30 }
          }
          style={{ width }}
          className="pointer-events-auto relative flex h-full flex-col bg-background p-4"
        >
          {open && onWidthChange && (
            <div
              onPointerDown={handleDragStart}
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize left sidebar"
              className="group absolute -right-2 inset-y-0 z-50 flex w-4 cursor-col-resize items-center justify-center select-none"
            >
              <div
                className={cn(
                  "h-8 w-1 rounded-full bg-foreground/25 transition-opacity duration-150",
                  isResizing ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                )}
              />
            </div>
          )}

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

          <div className="mt-4 shrink-0">
            <NavbarActions />
          </div>
        </motion.div>
      </Squircle>
    </div>
  );
};

export default Sidebar;
