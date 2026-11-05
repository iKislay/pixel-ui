"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import Sidebar from "./Sidebar";
import { DescriptionPanel } from "../Description/DescriptionPanel";
import { CommandSearchBar } from "../CommandSearchBar";

const DEFAULT_NAV_WIDTH = 288;
const DEFAULT_INFO_WIDTH = 560;

export default function DesktopShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [navOpen, setNavOpen] = useState(true);
  const [navWidth, setNavWidth] = useState(DEFAULT_NAV_WIDTH);
  const [isNavResizing, setIsNavResizing] = useState(false);

  const [infoOpen, setInfoOpen] = useState(true);
  const [infoWidth, setInfoWidth] = useState(DEFAULT_INFO_WIDTH);
  const [isResizing, setIsResizing] = useState(false);

  // ?record hides the floating controls so a demo can be screen recorded clean
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has("record")) return;
    document.documentElement.dataset.record = "";
    return () => {
      delete document.documentElement.dataset.record;
    };
  }, []);

  return (
    <div className="relative h-full">
      <Sidebar
        open={navOpen}
        setOpen={setNavOpen}
        width={navWidth}
        onWidthChange={setNavWidth}
        isResizing={isNavResizing}
        setIsResizing={setIsNavResizing}
      />
      <DescriptionPanel
        open={infoOpen}
        setOpen={setInfoOpen}
        width={infoWidth}
        onWidthChange={setInfoWidth}
        isResizing={isResizing}
        setIsResizing={setIsResizing}
      />

      <motion.div
        initial={false}
        animate={{
          paddingLeft: navOpen ? navWidth + 8 : 0,
          paddingRight: infoOpen ? infoWidth + 16 : 0,
        }}
        transition={
          isResizing || isNavResizing
            ? { duration: 0 }
            : { type: "spring", stiffness: 300, damping: 30 }
        }
        className="flex h-full flex-col gap-2"
      >
        <CommandSearchBar className="relative z-40 shrink-0" />
        <div
          className="relative z-0 flex-1 min-h-0 rounded-[45px] bg-card p-4"
          style={{ cornerShape: "squircle" } as React.CSSProperties}
        >
          {children}
        </div>
      </motion.div>
    </div>
  );
}
