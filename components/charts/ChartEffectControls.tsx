"use client";

import { useState, type ReactNode } from "react";
import { Lock } from "lucide-react";
import InstallCommand from "@/components/Description/InstallCommand";
import ProDialog from "@/components/ProDialog";
import SectionHeader from "@/components/preview/SectionHeader";
import Tag from "@/components/Tag";
import { CHART_EFFECTS, effectUnlocked, useChartEffect, type ChartEffectChoice } from "@/lib/chart-effects";
import { cn } from "@/lib/utils";

function EffectDialog({ effect, open, onClose }: { effect: ChartEffectChoice; open: boolean; onClose: () => void }) {
  return (
    <ProDialog
      open={open}
      onClose={onClose}
      title={`${effect.label} is Pro`}
      description={`Every chart is free. The ${effect.label.toLowerCase()} effect is a Pro add-on: install it with your license key and pass it to any chart's effect prop.`}
    >
      <InstallCommand item={{ registry: effect.registry, pro: true }} />
    </ProDialog>
  );
}

export function ChartEffectControls() {
  const { choice, setName } = useChartEffect();
  const [locked, setLocked] = useState<ChartEffectChoice | null>(null);
  const options = [{ id: "none", label: "None", registry: "" }, ...CHART_EFFECTS];

  return (
    <div className="flex flex-col gap-2">
      <SectionHeader title="Effect" />
      <div className="flex rounded-xl bg-muted/60 p-1">
        {options.map((option) => {
          const active = (choice?.id ?? "none") === option.id;
          const pro = option.id !== "none";
          const open = !pro || effectUnlocked(option.id);
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              onClick={() => (open ? setName(option.id) : setLocked(option))}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                active ? "bg-popover font-semibold text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
              {pro && <Tag tone="pro" />}
              {!open && <Lock aria-label="Locked" className="size-3" />}
            </button>
          );
        })}
      </div>
      {locked && <EffectDialog effect={locked} open onClose={() => setLocked(null)} />}
    </div>
  );
}

// stands in for the install command and source while a pro effect is on
export function ChartEffectNotice({ children }: { children: ReactNode }) {
  const { choice } = useChartEffect();
  const [open, setOpen] = useState(false);
  if (!choice) return null;

  return (
    <div className="flex flex-col items-start gap-3 rounded-lg bg-muted p-4">
      <p className="flex items-center gap-2 text-sm leading-relaxed text-foreground/70">
        <Tag tone="pro" />
        {children}
      </p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition-colors duration-150 ease-out hover:bg-brand-hover"
      >
        Install {choice.label.toLowerCase()}
      </button>
      <EffectDialog effect={choice} open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
