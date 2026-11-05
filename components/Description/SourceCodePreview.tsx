"use client";

import { useEffect, useState } from "react";
import { ChevronUp, CodeXml } from "lucide-react";
import type { ComponentItem } from "@/lib/components";
import CodeBlock from "@/components/ui/code-block";
import CopyButton from "../CopyButton";
import Tooltip from "../Tooltip";
import { fetchSource, SOURCE_LOADING } from "./fetchSource";

type SourceCodePreviewProps = {
  item: ComponentItem;
  onOpenCode?: () => void;
};

export default function SourceCodePreview({
  item,
  onOpenCode,
}: SourceCodePreviewProps) {
  const [fullCode, setFullCode] = useState<string | null>(null);
  const [inlineExpanded, setInlineExpanded] = useState(false);

  useEffect(() => {
    if (!item.registry) return;
    let cancelled = false;
    fetchSource(item.registry).then((text) => {
      if (!cancelled) setFullCode(text);
    });
    return () => {
      cancelled = true;
    };
  }, [item.registry]);

  const previewCode = fullCode
    ? fullCode.split("\n").slice(0, 5).join("\n")
    : SOURCE_LOADING;

  const handleClick = () => {
    if (onOpenCode) {
      onOpenCode();
    } else {
      setInlineExpanded(true);
    }
  };

  const isExpanded = inlineExpanded;
  const displayCode = isExpanded ? (fullCode || previewCode) : previewCode;

  return (
    <div className="relative min-h-[148px] overflow-hidden rounded-xl bg-muted p-3">
      <CodeBlock
        code={displayCode}
        language="tsx"
        showFrame={false}
        showLineNumbers={true}
        showCopyButton={false}
        className="min-h-0 w-full select-none"
      />

      <div className="absolute right-2.5 top-2.5 z-20">
        <Tooltip label="Copy code" align="end">
          <CopyButton
            value={fullCode || previewCode}
            title=""
            className="size-7 rounded-lg border border-black/[0.08] bg-background/80 text-foreground/60 shadow-sm backdrop-blur-md hover:bg-background hover:text-foreground dark:border-white/10"
          />
        </Tooltip>
      </div>

      {!isExpanded ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-24 items-end justify-center pb-3 bg-gradient-to-t from-muted via-muted/90 to-transparent">
          <button
            type="button"
            onClick={handleClick}
            className="pointer-events-auto inline-flex items-center gap-2 rounded-xl border border-black/[0.08] bg-background/95 px-4 py-1.5 text-xs font-medium text-foreground shadow-sm backdrop-blur-md transition-all hover:border-black/20 hover:bg-background dark:border-white/15 dark:hover:border-white/30"
          >
            <CodeXml className="size-3.5 text-foreground/70" />
            <span>See complete code</span>
          </button>
        </div>
      ) : (
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={() => setInlineExpanded(false)}
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
