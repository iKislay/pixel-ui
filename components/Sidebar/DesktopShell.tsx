"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { activeComponent } from "@/lib/components";
import Sidebar from "./Sidebar";
import { DescriptionPanel } from "../Description/DescriptionPanel";
import DescriptionContent from "../Description/DescriptionContent";
import { CommandSearchBar } from "../CommandSearchBar";

const DEFAULT_NAV_WIDTH = 288;
const DEFAULT_INFO_WIDTH = 300;

export default function DesktopShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const item = activeComponent(pathname);

  const [navOpen, setNavOpen] = useState(true);
  const [navWidth, setNavWidth] = useState(DEFAULT_NAV_WIDTH);
  const [isNavResizing, setIsNavResizing] = useState(false);

  const [infoOpen, setInfoOpen] = useState(true);
  const [infoWidth, setInfoWidth] = useState(DEFAULT_INFO_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const [codeDrawerOpen, setCodeDrawerOpen] = useState(false);

  const handleOpenCode = () => {
    setInfoOpen(true);
    if (infoWidth < 420) {
      setInfoWidth(440);
    }
    setCodeDrawerOpen(true);
  };

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
        codeOpen={codeDrawerOpen}
        onCodeOpenChange={setCodeDrawerOpen}
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
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar scroll-smooth flex flex-col gap-8">
          <div
            className="relative z-0 shrink-0 min-h-[calc(100vh-140px)] rounded-[45px] bg-card p-4 flex flex-col justify-center"
            style={{ cornerShape: "squircle" } as React.CSSProperties}
          >
            {children}
          </div>

          {item && (
            <div
              id="component-docs"
              className="max-w-4xl mx-auto w-full px-6 pb-24"
            >
              <DescriptionContent
                item={item}
                onOpenCode={handleOpenCode}
              />
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
