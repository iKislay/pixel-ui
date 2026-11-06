"use client";

import { useEffect, useRef, type ComponentProps } from "react";
import { charAlpha } from "@/lib/ascii";
import { cn } from "@/lib/utils";

export default function AsciiArt({
  lines,
  className,
  ...props
}: ComponentProps<"div"> & { lines: string[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const cssW = rect.width;
      const cssH = rect.height;
      if (cssW <= 0 || cssH <= 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const widthPx = Math.floor(cssW * dpr);
      const heightPx = Math.floor(cssH * dpr);

      if (canvas.width !== widthPx || canvas.height !== heightPx) {
        canvas.width = widthPx;
        canvas.height = heightPx;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, cssW, cssH);

      const isDark = document.documentElement.classList.contains("dark");
      const baseRgb = isDark ? "255, 255, 255" : "0, 0, 0";

      const cols = Math.max(...lines.map((line) => line.length));
      const cw = cssW / cols;
      const ch = cssH / lines.length;
      const fontSize = Math.max(5, Math.min(cw * 1.6, ch * 0.95));

      ctx.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (let r = 0; r < lines.length; r++) {
        const line = lines[r];
        const y = r * ch + ch / 2;
        for (let c = 0; c < line.length; c++) {
          const char = line[c];
          if (char === " ") continue;

          ctx.fillStyle = `rgba(${baseRgb}, ${charAlpha(char)})`;
          ctx.fillText(char, c * cw + cw / 2, y);
        }
      }

      ctx.restore();
    };

    render();

    const resizeObserver = new ResizeObserver(render);
    resizeObserver.observe(canvas);

    const themeObserver = new MutationObserver(render);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      resizeObserver.disconnect();
      themeObserver.disconnect();
    };
  }, [lines]);

  return (
    <div
      className={cn("relative w-full select-none overflow-hidden", className)}
      {...props}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
