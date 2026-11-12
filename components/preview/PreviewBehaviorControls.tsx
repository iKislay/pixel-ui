"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";
import {
  setPreviewReducedMotion,
  usePreviewReducedMotion,
  useSystemReducedMotion,
} from "@/lib/preview-reduced-motion";
import { usePreviewKeyboard } from "./PreviewKeyboard";
import SectionHeader from "./SectionHeader";

const STEP_BUTTON =
  "h-8 flex-1 cursor-pointer rounded-lg text-xs font-medium transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:text-foreground/35 disabled:hover:text-foreground/35";

function Switch({
  checked,
  onChange,
  labelId,
  descriptionId,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  labelId: string;
  descriptionId: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelId}
      aria-describedby={descriptionId}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "motion-reduce:transition-none",
        checked ? "bg-brand" : "bg-muted/70",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute left-0.5 top-0.5 size-4 rounded-full bg-background shadow-xs transition-transform",
          "motion-reduce:transition-none",
          checked && "translate-x-4",
        )}
      />
    </button>
  );
}

export default function PreviewBehaviorControls() {
  const uid = useId();
  const reduce = usePreviewReducedMotion();
  const system = useSystemReducedMotion();
  const { enabled, setEnabled, next, back, reset, index, total, label } = usePreviewKeyboard();

  const reduceLabel = `${uid}-reduce-label`;
  const reduceHint = `${uid}-reduce-hint`;
  const keyboardLabel = `${uid}-keyboard-label`;
  const keyboardHint = `${uid}-keyboard-hint`;

  const position = index < 0 ? "-" : String(index + 1);
  const status =
    total === 0
      ? "No focusable elements in this demo"
      : index < 0
        ? `0 of ${total}, not focused`
        : `${index + 1} of ${total}: ${label}`;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <SectionHeader title="Preview" />

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-3">
            <span id={reduceLabel} className="text-xs font-medium text-foreground">
              Reduced motion
            </span>
            <Switch
              checked={reduce}
              onChange={setPreviewReducedMotion}
              labelId={reduceLabel}
              descriptionId={reduceHint}
            />
          </div>
          <p id={reduceHint} className="text-[11px] leading-snug text-muted-foreground">
            {system && !reduce
              ? "Your system already reduces motion, so the demo follows it. This switch forces it on."
              : "Simulates prefers-reduced-motion for the demo. Off follows your system setting."}
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-3">
            <span id={keyboardLabel} className="text-xs font-medium text-foreground">
              Keyboard stepping
            </span>
            <Switch
              checked={enabled}
              onChange={setEnabled}
              labelId={keyboardLabel}
              descriptionId={keyboardHint}
            />
          </div>
          <p id={keyboardHint} className="text-[11px] leading-snug text-muted-foreground">
            Steps focus through the demo with ] and [. Tab, arrows, and Escape stay native so the
            component behaves as shipped.
          </p>
        </div>
      </div>

      {enabled && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-1.5 rounded-xl bg-muted/60 p-1">
            <button
              type="button"
              onClick={back}
              disabled={total === 0}
              className={cn(STEP_BUTTON, "text-muted-foreground")}
            >
              Back
            </button>
            <span className="grid h-8 flex-1 place-items-center text-xs font-semibold tabular-nums text-foreground/70">
              {position} / {total}
            </span>
            <button
              type="button"
              onClick={next}
              disabled={total === 0}
              className={cn(STEP_BUTTON, "text-muted-foreground")}
            >
              Next
            </button>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span
              role="status"
              aria-live="polite"
              className="min-w-0 truncate text-[11px] text-muted-foreground"
            >
              {status}
            </span>
            <button
              type="button"
              onClick={reset}
              className="shrink-0 cursor-pointer text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
