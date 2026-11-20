"use client";

import { useState, type ComponentProps } from "react";
import { cn } from "@/lib/utils";

export type SliderFeedback = "select";

export type SliderProps = Omit<ComponentProps<"input">, "type" | "value" | "defaultValue" | "onChange"> & {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  onValueChange?: (value: number) => void;
  onFeedback?: (event: SliderFeedback) => void;
};

export function Slider({
  value,
  defaultValue,
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  onFeedback,
  className,
  disabled,
  ...props
}: SliderProps) {
  const [inner, setInner] = useState(defaultValue ?? min);
  const current = value ?? inner;
  const percent = ((current - min) / (max - min)) * 100;

  return (
    // the native range sits invisibly on top, so keyboard, touch and screen readers come for free
    <div
      data-slot="slider"
      className={cn(
        "group relative flex h-7 w-full touch-none items-center has-disabled:opacity-45",
        className,
      )}
    >
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-foreground/[0.1]">
        <div className="btn-primary absolute inset-y-0 left-0 rounded-full" style={{ width: `${percent}%` }} />
      </div>
      <div
        className="pointer-events-none absolute size-[22px] -translate-x-1/2 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.25),0_0_0_0.5px_rgba(0,0,0,0.06)] transition-transform duration-150 group-active:scale-115 group-has-focus-visible:outline-2 group-has-focus-visible:outline-offset-2 group-has-focus-visible:outline-brand motion-reduce:transition-none motion-reduce:group-active:scale-100"
        style={{ left: `calc(11px + (100% - 22px) * ${percent / 100})` }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={current}
        disabled={disabled}
        onChange={(event) => {
          const next = Number(event.target.value);
          setInner(next);
          onValueChange?.(next);
          onFeedback?.("select");
        }}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        {...props}
      />
    </div>
  );
}
