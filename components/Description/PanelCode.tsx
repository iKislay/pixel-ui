"use client";

import { useMemo, useState } from "react";
import { ChevronUp, CodeXml } from "lucide-react";
import CodeBlock from "@/components/ui/code-block";
import { useIsMobile } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";

type PanelCodeProps = {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  maxLines?: number;
  onSeeCompleteCode?: () => void;
  className?: string;
};

export default function PanelCode({
  code,
  language = "tsx",
  showLineNumbers = false,
  maxLines,
  onSeeCompleteCode,
  className,
}: PanelCodeProps) {
  const isMobile = useIsMobile();
  const [expanded, setExpanded] = useState(false);

  const trimmed = useMemo(() => {
    return (code ?? "").replace(/^\n+/, "").trimEnd();
  }, [code]);

  const lines = useMemo(() => {
    return trimmed ? trimmed.split("\n") : [];
  }, [trimmed]);

  const hasOverflow = maxLines != null && lines.length > maxLines;
  const isTruncated = hasOverflow && !expanded;

  const displayCode = useMemo(() => {
    if (!isTruncated || !maxLines) return code;
    return lines.slice(0, maxLines).join("\n");
  }, [isTruncated, maxLines, lines, code]);

  const handleSeeCompleteCode = () => {
    if (onSeeCompleteCode) {
      onSeeCompleteCode();
    } else {
      setExpanded(true);
    }
  };

  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden",
        !isMobile && "rounded-xl bg-muted p-3",
        className,
        isMobile && "p-0",
      )}
    >
      <CodeBlock
        code={displayCode}
        copyCode={code}
        language={language}
        showFrame={isMobile}
        showLineNumbers={showLineNumbers}
        className="min-h-0 w-full flex-1"
      />

      {isTruncated && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-24 items-end justify-center pb-3 bg-gradient-to-t from-muted via-muted/90 to-transparent">
          <button
            type="button"
            onClick={handleSeeCompleteCode}
            className="pointer-events-auto inline-flex items-center gap-2 rounded-xl border border-black/[0.08] bg-background/95 px-4 py-1.5 text-xs font-medium text-foreground shadow-sm backdrop-blur-md transition-all hover:border-black/20 hover:bg-background dark:border-white/15 dark:hover:border-white/30"
          >
            <CodeXml className="size-3.5 text-foreground/70" />
            <span>See complete code</span>
          </button>
        </div>
      )}

      {hasOverflow && expanded && !onSeeCompleteCode && (
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-black/[0.08] bg-background/95 px-3 py-1 text-xs font-medium text-foreground/70 shadow-sm backdrop-blur-md transition-all hover:bg-background hover:text-foreground dark:border-white/15"
          >
            <ChevronUp className="size-3.5" />
            <span>Show less</span>
          </button>
        </div>
      )}
    </div>
  );
}
