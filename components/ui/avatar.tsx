"use client";

import { Children, useState, type ComponentProps, type ReactNode } from "react";
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
              "absolute inset-0 size-full object-cover transition-[opacity,scale,filter] duration-500 ease-out motion-reduce:transition-none",
              state === "loaded" ? "scale-100 opacity-100 blur-0" : "scale-110 opacity-0 blur-sm",
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

export type AvatarGroupProps = ComponentProps<"div"> & {
  max?: number;
  size?: keyof typeof SIZES;
  children: ReactNode;
};

export function AvatarGroup({ max = 4, size = "md", className, children, ...props }: AvatarGroupProps) {
  const all = Children.toArray(children);
  const shown = all.slice(0, max);
  const extra = all.length - shown.length;
  const overlap = size === "sm" ? "-ml-2.5" : size === "lg" ? "-ml-5" : "-ml-3.5";

  return (
    <div data-slot="avatar-group" className={cn("group/avatars flex items-center", className)} {...props}>
      {[...shown, ...(extra > 0 ? [`+${extra}`] : [])].map((child, index) => (
        <span
          key={index}
          style={{ zIndex: all.length - index }}
          className={cn(
            "relative rounded-[38%] ring-[3px] ring-background transition-[margin,translate] duration-300 ease-[cubic-bezier(0.3,1.4,0.5,1)] [corner-shape:squircle] first:ml-0 hover:-translate-y-1 group-hover/avatars:ml-1 motion-reduce:transition-none",
            overlap,
          )}
        >
          {typeof child === "string" ? (
            <span
              aria-label={`${extra} more`}
              className={cn(
                "flex items-center justify-center rounded-[38%] bg-foreground/[0.08] font-semibold text-foreground/60 [corner-shape:squircle]",
                SIZES[size],
              )}
            >
              {child}
            </span>
          ) : (
            child
          )}
        </span>
      ))}
    </div>
  );
}
