"use client";

import CopyButton from "@/components/CopyButton";
import Tooltip from "@/components/Tooltip";
import { cn } from "@/lib/utils";

export default function McpCode({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-[14px] bg-[#F4F5F8] py-1.5 pr-1.5 pl-4 shadow-[inset_0_0_0_1px_rgb(0_0_0/0.04)] dark:bg-[#0F1011] dark:border-apple",
        className,
      )}
      style={{ cornerShape: "squircle" } as React.CSSProperties}
    >
      <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-[12.5px] text-foreground/80 [scrollbar-width:none]">
        {value}
      </code>
      <Tooltip label="Copy" align="end">
        <CopyButton
          value={value}
          title=""
          className="hover:text-foreground"
        />
      </Tooltip>
    </div>
  );
}
