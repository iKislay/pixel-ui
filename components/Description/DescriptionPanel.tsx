"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { CodeXml, Maximize, Minimize, X } from "lucide-react";
import { activeComponent } from "@/lib/components";
import { cn } from "@/lib/utils";
import CodeDrawer from "./CodeDrawer";
import DescriptionContent from "./DescriptionContent";
import InstallBar from "./InstallBar";
import Tooltip from "../Tooltip";

const MIN_PANEL_WIDTH = 380;
const MAX_PANEL_WIDTH = 840;

type DescriptionPanelProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  width?: number;
  onWidthChange?: (width: number) => void;
  isResizing?: boolean;
  setIsResizing?: (resizing: boolean) => void;
};

export function DescriptionPanel({
  open,
  setOpen,
  width = 560,
  onWidthChange,
  isResizing = false,
  setIsResizing,
}: DescriptionPanelProps) {
  const pathname = usePathname();
  const item = activeComponent(pathname);

  const [rawCodeOpen, setCodeOpen] = useState(false);
  const codeOpen = open && rawCodeOpen;

  useEffect(() => {
    return () => {
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("user-select");
    };
  }, []);

  const toggleCode = () => {
    if (codeOpen) {
      setCodeOpen(false);
    } else {
      setOpen(true);
      setCodeOpen(true);
    }
  };

  const handleResizeStart = (e: React.PointerEvent) => {
    e.preventDefault();
    if (!onWidthChange || !setIsResizing) return;

    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = width;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const delta = startX - moveEvent.clientX;
      const maxAllowed = Math.min(MAX_PANEL_WIDTH, window.innerWidth - 400);
      const nextWidth = Math.max(MIN_PANEL_WIDTH, Math.min(maxAllowed, startWidth + delta));
      onWidthChange(nextWidth);
    };

    const onPointerUp = () => {
      setIsResizing(false);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("user-select");
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  const panelShift = Math.max(600, width + 40);

  return (
    <div className="pointer-events-none absolute right-0 top-0 z-40 h-full">
      <div
        data-chrome
        className="pointer-events-auto absolute right-4 top-4 z-50 flex items-stretch"
      >
        {item?.registry && <InstallBar key={item.href} item={item} />}

        <div
          className={cn(
            "flex items-center gap-2 border border-black/[0.06] bg-muted p-2 shadow-sm dark:border-transparent dark:border-apple",
            item?.registry ? "rounded-r-2xl border-l-0" : "rounded-2xl",
          )}
        >
          <Tooltip label={open ? "Close description" : "Open description"} align="end">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close description" : "Open description"}
              className="cursor-pointer rounded-full bg-popover p-1"
            >
              {open ? (
                <Maximize className="h-5 w-5" />
              ) : (
                <Minimize className="h-5 w-5" />
              )}
            </button>
          </Tooltip>

          {item?.registry && (
            <Tooltip label={codeOpen ? "Hide code" : "Get code"} align="end">
              <button
                type="button"
                onClick={toggleCode}
                aria-label={codeOpen ? "Hide code" : "Get code"}
                className="cursor-pointer rounded-full bg-popover p-1"
              >
                {codeOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <CodeXml className="h-5 w-5" />
                )}
              </button>
            </Tooltip>
          )}
        </div>
      </div>

      <motion.div
        initial={false}
        animate={{ x: open ? 0 : panelShift }}
        transition={
          isResizing
            ? { duration: 0 }
            : { type: "spring", stiffness: 300, damping: 30 }
        }
        style={{ width }}
        className="pointer-events-auto relative flex h-full flex-col overflow-hidden rounded-2xl bg-background"
      >
        {open && onWidthChange && (
          <div
            onPointerDown={handleResizeStart}
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize description panel"
            className="group absolute -left-2.5 inset-y-0 z-50 flex w-5 cursor-col-resize items-center justify-center select-none"
          >
            <div className="h-10 w-1 rounded-full bg-foreground/15 transition-colors group-hover:bg-foreground/40 group-active:bg-foreground/60" />
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-12 bg-gradient-to-b from-background to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-12 bg-gradient-to-t from-background to-transparent" />

        <div className="no-scrollbar flex flex-1 flex-col overflow-y-auto">
          <DescriptionContent item={item} className="p-8 pt-60" />
        </div>

        <CodeDrawer
          open={codeOpen}
          onClose={() => setCodeOpen(false)}
          item={item}
        />
      </motion.div>
    </div>
  );
}
