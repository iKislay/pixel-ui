"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { activeComponent } from "@/lib/components";
import { cn } from "@/lib/utils";
import SidebarControls from "./SidebarControls";
import CodeDrawer from "./CodeDrawer";

const MIN_PANEL_WIDTH = 260;
const MAX_PANEL_WIDTH = 560;
const COLLAPSE_THRESHOLD = 60;
const SNAP_OPEN_THRESHOLD = 70;

type DescriptionPanelProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  width?: number;
  onWidthChange?: (width: number) => void;
  isResizing?: boolean;
  setIsResizing?: (resizing: boolean) => void;
  codeOpen?: boolean;
  onCodeOpenChange?: (open: boolean) => void;
};

export default function DescriptionPanel({
  open,
  setOpen,
  width = 300,
  onWidthChange,
  isResizing = false,
  setIsResizing,
  codeOpen: externalCodeOpen,
  onCodeOpenChange,
}: DescriptionPanelProps) {
  const pathname = usePathname();
  const item = activeComponent(pathname);
  const reduceMotion = useReducedMotion();

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(900);

  const [internalCodeOpen, setInternalCodeOpen] = useState(false);
  const codeOpen = externalCodeOpen !== undefined ? externalCodeOpen : internalCodeOpen;
  const setCodeOpen = (next: boolean) => {
    setInternalCodeOpen(next);
    onCodeOpenChange?.(next);
  };

  const handleOpenCode = () => {
    setOpen(true);
    if (onWidthChange && width < 420) {
      onWidthChange(440);
    }
    setCodeOpen(true);
  };

  const [isHovered, setIsHovered] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [pullOffset, setPullOffset] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const dragStartTimeRef = useRef(0);
  const snapBackRafRef = useRef<number | null>(null);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight || window.innerHeight);
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => {
      window.removeEventListener("resize", updateSize);
      if (snapBackRafRef.current) cancelAnimationFrame(snapBackRafRef.current);
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("user-select");
    };
  }, []);

  const animateSnapBack = (startPull: number) => {
    const startTime = performance.now();
    const duration = 260;

    const step = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - t, 3);
      const nextPull = startPull * (1 - ease);
      setPullOffset(nextPull);

      if (t < 1) {
        snapBackRafRef.current = requestAnimationFrame(step);
      } else {
        setPullOffset(0);
        setIsPulling(false);
        snapBackRafRef.current = null;
      }
    };

    snapBackRafRef.current = requestAnimationFrame(step);
  };

  const handleButtonDragStart = (e: React.PointerEvent) => {
    e.preventDefault();
    if (!onWidthChange || !setIsResizing) return;

    if (snapBackRafRef.current) {
      cancelAnimationFrame(snapBackRafRef.current);
      snapBackRafRef.current = null;
    }

    const startX = e.clientX;
    dragStartTimeRef.current = Date.now();
    const startOpen = open;
    const startWidth = width;
    let didSnapOpen = false;
    let hasCollapsed = false;
    let currentDragWidth = startWidth;

    if (!startOpen) {
      setIsPulling(true);
    } else {
      setIsResizing(true);
    }

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!startOpen) {
        const pull = Math.max(0, startX - moveEvent.clientX);

        if (didSnapOpen) {
          const maxAllowed = Math.min(MAX_PANEL_WIDTH, window.innerWidth - 400);
          const cursorWidth = window.innerWidth - moveEvent.clientX;
          if (cursorWidth > MIN_PANEL_WIDTH) {
            setIsResizing(true);
            currentDragWidth = Math.min(maxAllowed, cursorWidth);
            onWidthChange(currentDragWidth);
          }
          return;
        }

        setPullOffset(pull);

        if (pull >= SNAP_OPEN_THRESHOLD) {
          didSnapOpen = true;
          setIsPulling(false);
          setPullOffset(0);
          setOpen(true);
          onWidthChange(MIN_PANEL_WIDTH);
        }
      } else {
        if (hasCollapsed) return;

        const delta = startX - moveEvent.clientX;
        const maxAllowed = Math.min(MAX_PANEL_WIDTH, window.innerWidth - 400);

        if (delta >= 0) {
          const nextWidth = Math.min(maxAllowed, startWidth + delta);
          onWidthChange(nextWidth);
        } else {
          const rawWidth = startWidth + delta;
          if (rawWidth >= MIN_PANEL_WIDTH) {
            onWidthChange(rawWidth);
          } else {
            const overdrag = MIN_PANEL_WIDTH - rawWidth;
            if (overdrag >= COLLAPSE_THRESHOLD) {
              hasCollapsed = true;
              setIsResizing(false);
              setOpen(false);
              onWidthChange(MIN_PANEL_WIDTH);
              cleanup();
              return;
            }
            const resistedWidth = MIN_PANEL_WIDTH - overdrag * 0.2;
            onWidthChange(resistedWidth);
          }
        }
      }
    };

    const cleanup = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("user-select");
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      cleanup();

      if (!startOpen) {
        if (!didSnapOpen) {
          const elapsed = Date.now() - dragStartTimeRef.current;
          const moved = Math.abs(upEvent.clientX - startX);
          if (moved < 8 && elapsed < 350) {
            setIsPulling(false);
            setPullOffset(0);
            setIsResizing(false);
            setOpen(true);
            onWidthChange(300);
          } else {
            setIsResizing(false);
            animateSnapBack(pullOffset);
          }
        } else {
          setIsPulling(false);
          setPullOffset(0);
          setIsResizing(false);
          onWidthChange(Math.max(MIN_PANEL_WIDTH, currentDragWidth));
        }
      } else {
        setIsResizing(false);
        if (hasCollapsed) return;

        if (width < MIN_PANEL_WIDTH) {
          const overdrag = MIN_PANEL_WIDTH - width;
          if (overdrag >= 15) {
            setOpen(false);
          }
          onWidthChange(MIN_PANEL_WIDTH);
        }
      }
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  const isPullActive = !open && (isPulling || pullOffset > 0);
  const apexPull = Math.max(14, pullOffset * 1.45 + 14);
  const midY = containerHeight / 2;

  const cp1X = Math.max(0, apexPull - apexPull * 0.05);
  const cp1Y = midY * 0.35;
  const cp2X = apexPull * 0.06;
  const cp2Y = midY * 0.72;

  const cp3X = apexPull * 0.06;
  const cp3Y = midY + (containerHeight - midY) * 0.28;
  const cp4X = Math.max(0, apexPull - apexPull * 0.05);
  const cp4Y = midY + (containerHeight - midY) * 0.65;

  const clipPathD = `M ${apexPull} 0 C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, 0 ${midY} C ${cp3X} ${cp3Y}, ${cp4X} ${cp4Y}, ${apexPull} ${containerHeight} L ${width + 50} ${containerHeight} L ${width + 50} 0 Z`;

  const currentPanelX = open
    ? 0
    : isPullActive
      ? width - apexPull
      : width - 14;

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute right-0 top-0 z-40 h-full"
    >
      <svg width="0" height="0" className="pointer-events-none absolute">
        <defs>
          <clipPath id="sidebarCurveClip" clipPathUnits="userSpaceOnUse">
            <path d={clipPathD} />
          </clipPath>
        </defs>
      </svg>

      <motion.div
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        initial={false}
        animate={{ x: currentPanelX }}
        transition={
          isResizing || isPulling
            ? { duration: 0 }
            : { type: "spring", stiffness: 320, damping: 28, mass: 0.8 }
        }
        style={{ width }}
        className="group/sidebar pointer-events-auto relative flex h-full flex-col"
      >
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onPointerDown={handleButtonDragStart}
          role="button"
          aria-label={
            open
              ? "Drag to resize or collapse controls panel"
              : "Drag to open controls panel"
          }
          className="group pointer-events-auto absolute -left-3.5 top-1/2 -translate-y-1/2 z-50 flex h-24 w-7 cursor-col-resize items-center justify-center select-none"
        >
          <motion.div
            initial={false}
            animate={{
              opacity: open ? 0 : isPullActive ? Math.max(0, 1 - pullOffset / 20) : 1,
              scale: open ? 0.85 : 1,
            }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute inset-0 rounded-l-2xl bg-[#F4F4F9] dark:bg-neutral-900"
          />

          <div
            className={cn(
              "relative z-10 h-9 w-1 rounded-full bg-foreground/25 transition-all duration-200 group-hover:h-11 group-hover:bg-foreground/50",
              open &&
                (isSidebarHovered || isResizing
                  ? "opacity-100"
                  : "opacity-0 group-hover/sidebar:opacity-100"),
            )}
          />

          <AnimatePresence>
            {isHovered && !isPulling && !isResizing && (
              <motion.div
                initial={{ opacity: 0, x: 8, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 8, scale: 0.95 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-3.5 flex items-center"
              >
                <span className="whitespace-nowrap rounded-xl bg-popover px-3 py-1.5 text-xs font-medium text-foreground shadow-xl dark:bg-[#1E1E1E]">
                  {open ? "Drag to resize or close" : "Drag to open"}
                </span>
                <div className="absolute -right-1 top-1/2 -translate-y-1/2 h-2 w-2 rotate-45 bg-popover dark:bg-[#1E1E1E]" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {open && onWidthChange && (
          <div
            onPointerDown={handleButtonDragStart}
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize or collapse controls panel"
            className="group absolute -left-2.5 inset-y-0 z-40 flex w-5 cursor-col-resize select-none"
          />
        )}

        <div
          style={{
            clipPath: isPullActive && !reduceMotion ? "url(#sidebarCurveClip)" : undefined,
            WebkitClipPath: isPullActive && !reduceMotion ? "url(#sidebarCurveClip)" : undefined,
          }}
          className={cn(
            "relative flex h-full flex-col overflow-hidden bg-background",
            open && "rounded-2xl",
          )}
        >
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-12 bg-gradient-to-t from-background to-transparent" />

          <div
            style={{
              transform: isPullActive ? `translateX(${Math.min(24, pullOffset * 0.25)}px)` : "none",
              transition: isPulling ? "none" : "transform 0.2s ease-out",
            }}
            className="no-scrollbar flex flex-1 flex-col overflow-y-auto"
          >
            <SidebarControls
              item={item}
              onOpenCode={handleOpenCode}
              className="p-6 pb-16"
            />
          </div>

          <CodeDrawer
            open={open && codeOpen}
            onClose={() => setCodeOpen(false)}
            item={item}
          />
        </div>
      </motion.div>
    </div>
  );
}
export { DescriptionPanel };
