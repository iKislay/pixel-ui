import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const TONES = {
  neutral: "bg-foreground/[0.07] text-foreground/70",
  brand: "bg-brand/15 text-brand",
  success: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  warning: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  danger: "bg-red-500/15 text-red-600 dark:text-red-400",
};

export type BadgeProps = ComponentProps<"span"> & {
  tone?: keyof typeof TONES;
  dot?: boolean;
};

export function Badge({ tone = "neutral", dot = false, className, children, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-[10px] px-2.5 text-xs font-semibold whitespace-nowrap [corner-shape:squircle] [&_svg]:size-3",
        TONES[tone],
        className,
      )}
      {...props}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}
