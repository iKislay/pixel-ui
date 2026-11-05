"use client";

import { useEffect, useState } from "react";
import type { ComponentItem } from "@/lib/components";
import PanelCode from "./PanelCode";
import { fetchSource, SOURCE_LOADING } from "./fetchSource";

type SourceCodePreviewProps = {
  item: ComponentItem;
  onOpenCode?: () => void;
};

export default function SourceCodePreview({
  item,
  onOpenCode,
}: SourceCodePreviewProps) {
  const [sourceCode, setSourceCode] = useState<string | null>(null);

  useEffect(() => {
    if (!item.registry) return;
    let cancelled = false;
    fetchSource(item.registry).then((text) => {
      if (!cancelled) setSourceCode(text);
    });
    return () => {
      cancelled = true;
    };
  }, [item.registry]);

  return (
    <PanelCode
      code={sourceCode ?? SOURCE_LOADING}
      language="tsx"
      showLineNumbers
      maxLines={10}
      onSeeCompleteCode={onOpenCode}
    />
  );
}
