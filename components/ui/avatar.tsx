"use client";

import { useState, type ComponentProps } from "react";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: "size-8 text-[11px]",
  md: "size-11 text-sm",
  lg: "size-16 text-lg",
};

const STATUS = {
  online: "bg-emerald-500",
  away: "bg-amber-400",
  offline: "bg-foreground/30",
};

export type AvatarProps = ComponentProps<"span"> & {
  src?: string;
  name: string;
  size?: keyof typeof SIZES;
  status?: keyof typeof STATUS;
};

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

export function Avatar({ src, name, size = "md", status, className, ...props }: AvatarProps) {
  const [state, setState] = useState<"loading" | "loaded" | "error">("loading");

  return (
    <span data-slot="avatar" className={cn("relative inline-flex shrink-0", SIZES[size], className)} {...props}>
      <span
        role="img"
        aria-label={status ? `${name}, ${status}` : name}
        className="relative flex size-full items-center justify-center overflow-hidden rounded-[38%] bg-brand/15 font-semibold text-brand [corner-shape:squircle]"
      >
        {state !== "loaded" && <span aria-hidden>{initials(name)}</span>}
        {src && state !== "error" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            // a cached image can finish before hydration and never fire onLoad
            ref={(img) => {
              if (img?.complete && img.naturalWidth) setState("loaded");
            }}
            onLoad={() => setState("loaded")}
            onError={() => setState("error")}
            className={cn(
              "absolute inset-0 size-full object-cover transition-opacity duration-300 motion-reduce:transition-none",
              state === "loaded" ? "opacity-100" : "opacity-0",
            )}
          />
        )}
      </span>
      {status && (
        <span
          aria-hidden
          className={cn("absolute -bottom-0.5 -right-0.5 size-[30%] rounded-full ring-2 ring-background", STATUS[status])}
        />
      )}
    </span>
  );
}
