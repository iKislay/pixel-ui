"use client";

import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export type CardProps = ComponentProps<"div"> & {
  spotlight?: boolean;
};

export function Card({ spotlight = false, className, children, onPointerMove, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      onPointerMove={(event) => {
        onPointerMove?.(event);
        if (!spotlight) return;
        const box = event.currentTarget.getBoundingClientRect();
        event.currentTarget.style.setProperty("--spot-x", `${event.clientX - box.left}px`);
        event.currentTarget.style.setProperty("--spot-y", `${event.clientY - box.top}px`);
      }}
      className={cn(
        "group/card relative isolate flex flex-col gap-4 overflow-hidden rounded-[36px] bg-card p-7 text-card-foreground [corner-shape:squircle]",
        className,
      )}
      {...props}
    >
      {spotlight && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 group-hover/card:opacity-100 motion-reduce:transition-none [background:radial-gradient(320px_circle_at_var(--spot-x,50%)_var(--spot-y,0%),rgb(var(--brand-rgb)/0.14),transparent_70%)]"
        />
      )}
      {children}
    </div>
  );
}

export function CardTitle({ className, ...props }: ComponentProps<"h3">) {
  return <h3 data-slot="card-title" className={cn("text-lg font-semibold tracking-tight", className)} {...props} />;
}

export function CardDescription({ className, ...props }: ComponentProps<"p">) {
  return <p data-slot="card-description" className={cn("text-sm leading-relaxed text-foreground/55", className)} {...props} />;
}
