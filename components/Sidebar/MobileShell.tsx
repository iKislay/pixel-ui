"use client";

import { usePathname } from "next/navigation";
import { activeComponent } from "@/lib/components";
import { cn } from "@/lib/utils";
import MobileSidebar from "./MobileSidebar";
import DescriptionContent from "../Description/DescriptionContent";
import SidebarControls from "../Description/SidebarControls";
import { CommandSearchBar } from "../CommandSearchBar";

const CARD = "rounded-[32px] bg-card";

export default function MobileShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const item = activeComponent(pathname);

  return (
    <div className="no-scrollbar h-full overflow-y-auto">
      <div className="flex flex-col gap-4 pb-12">
        <div className={cn(CARD, "relative h-[80svh] shrink-0 p-4")}>
          <MobileSidebar />
          <CommandSearchBar />
          {children}
        </div>

        <div className={cn(CARD, "p-6")}>
          <SidebarControls item={item} />
        </div>

        <div className="px-4 py-8">
          <DescriptionContent item={item} />
        </div>
      </div>
    </div>
  );
}
