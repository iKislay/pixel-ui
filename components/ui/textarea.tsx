import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = ComponentProps<"textarea"> & {
  invalid?: boolean;
};

export function Textarea({ invalid = false, className, ...props }: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      aria-invalid={invalid || undefined}
      className={cn(
        "min-h-24 w-full resize-none rounded-[22px] bg-foreground/[0.05] px-4 py-3 text-sm leading-relaxed text-foreground outline-none ring-1 ring-inset ring-foreground/[0.06] transition-[box-shadow,background-color] duration-150 [field-sizing:content] [corner-shape:squircle] placeholder:text-foreground/35 hover:bg-foreground/[0.07] focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-brand/60 disabled:cursor-not-allowed disabled:opacity-45 aria-invalid:ring-2 aria-invalid:ring-red-500/60 motion-reduce:transition-none",
        className,
      )}
      {...props}
    />
  );
}
