"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { activeComponent } from "@/lib/components";
import { useOpenSound } from "@/lib/feedback";
import { cn } from "@/lib/utils";
import MobileSidebar from "./MobileSidebar";
import DescriptionContent from "../Description/DescriptionContent";
import SidebarControls from "../Description/SidebarControls";
import CodeDrawer from "../Description/CodeDrawer";
import { CommandSearchBar } from "../CommandSearchBar";

const CARD = "rounded-[32px] bg-card";

export default function MobileShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const item = activeComponent(pathname);
  const [codeDrawerOpen, setCodeDrawerOpen] = useState(false);
  useOpenSound(codeDrawerOpen);

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center gap-2 shrink-0">
        <MobileSidebar />
        <CommandSearchBar
          className="relative inset-auto top-0 z-40 flex-1 px-0"
          buttonClassName="sm:max-w-none"
        />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar scroll-smooth flex flex-col gap-3 pb-16">
        <div
          className={cn(
            CARD,
            "relative shrink-0 min-h-[72svh] p-4 flex flex-col justify-center overflow-hidden",
          )}
        >
          {children}
        </div>

        {item && (
          <div className={cn(CARD, "p-5 sm:p-6")}>
            <SidebarControls
              item={item}
              onOpenCode={() => setCodeDrawerOpen(true)}
            />
          </div>
        )}

        {item && (
          <div id="component-docs" className="px-3 py-6">
            <DescriptionContent
              item={item}
              onOpenCode={() => setCodeDrawerOpen(true)}
            />
          </div>
        )}
      </div>

      <AnimatePresence>
        {codeDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={() => setCodeDrawerOpen(false)}
              className="fixed inset-0 z-50 touch-none bg-black/60 backdrop-blur-xs"
            />
            <CodeDrawer
              open={codeDrawerOpen}
              onClose={() => setCodeDrawerOpen(false)}
              item={item}
              variant="modal"
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
