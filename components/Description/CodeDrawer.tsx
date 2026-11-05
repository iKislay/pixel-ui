"use client";

import { useEffect, useState } from "react";
import { motion, useDragControls } from "motion/react";
import { X } from "lucide-react";
import type { ComponentItem } from "@/lib/components";
import { cn } from "@/lib/utils";
import PanelCode from "./PanelCode";
import { fetchSource, SOURCE_LOADING } from "./fetchSource";

type CodeDrawerProps = {
  open: boolean;
  onClose: () => void;
  item?: ComponentItem;
  variant?: "panel" | "modal";
  className?: string;
};

export default function CodeDrawer({
  open,
  onClose,
  item,
  variant = "panel",
  className,
}: CodeDrawerProps) {
  const dragControls = useDragControls();
  const [loaded, setLoaded] = useState<{ registry: string; code: string } | null>(null);

  useEffect(() => {
    if (!open || !item?.registry) return;
    const targetRegistry = item.registry;
    let cancelled = false;
    fetchSource(targetRegistry).then((text) => {
      if (!cancelled) setLoaded({ registry: targetRegistry, code: text });
    });
    return () => {
      cancelled = true;
    };
  }, [open, item?.registry]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const code = loaded && loaded.registry === item?.registry ? loaded.code : null;
  const loading = Boolean(open && item?.registry && code === null);
  const isModal = variant === "modal";

  return (
    <motion.div
      drag="y"
      dragListener={false}
      dragControls={dragControls}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.4 }}
      onDragEnd={(_, info) => {
        if (info.offset.y > 100 || info.velocity.y > 500) onClose();
      }}
      initial={{ y: "110%" }}
      animate={{ y: open ? "0%" : "110%" }}
      exit={{ y: "110%" }}
      transition={{ type: "spring", stiffness: 320, damping: 32 }}
      className={cn(
        isModal
          ? "fixed inset-x-0 bottom-0 z-50 flex h-[85svh] flex-col rounded-t-[32px] border-t border-black/[0.08] bg-card shadow-2xl dark:border-white/10"
          : "absolute inset-x-0 bottom-0 z-10 flex h-full flex-col rounded-2xl bg-card shadow-2xl shadow-black/30",
        className,
      )}
    >
      <div
        onPointerDown={(event) => dragControls.start(event)}
        className="shrink-0 cursor-grab touch-none px-4 pb-2 pt-3 active:cursor-grabbing"
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-foreground/25" />
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{item?.name ?? "Code"}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close code drawer"
            className="flex size-7 cursor-pointer items-center justify-center rounded-lg text-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      <PanelCode
        code={loading ? SOURCE_LOADING : code ?? ""}
        showLineNumbers
        className={cn(
          "mx-4 min-h-0 flex-1",
          isModal ? "mb-6 pb-[max(0.5rem,env(safe-area-inset-bottom))]" : "mb-4",
        )}
      />
    </motion.div>
  );
}
