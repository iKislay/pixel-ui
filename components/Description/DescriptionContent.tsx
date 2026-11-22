"use client";

import Link from "next/link";
import { type ComponentItem } from "@/lib/components";
import { cn } from "@/lib/utils";
import PanelCode from "./PanelCode";
import InstallCommand from "./InstallCommand";
import SourceCodePreview from "./SourceCodePreview";
import DependencyPill from "./DependencyPill";
import PropsTable from "./PropsTable";
import { ChartEffectNotice } from "../charts/ChartEffectControls";
import { useChartEffect } from "@/lib/chart-effects";

type DescriptionContentProps = {
  item?: ComponentItem;
  onOpenCode?: () => void;
  className?: string;
};

function SectionLabel({
  as: Tag = "p",
  children,
}: {
  as?: "p" | "h1" | "h2";
  children: React.ReactNode;
}) {
  return (
    <Tag className="text-xs font-medium uppercase tracking-normal text-foreground/40">
      {children}
    </Tag>
  );
}

export default function DescriptionContent({
  item,
  onOpenCode,
  className,
}: DescriptionContentProps) {
  const { choice: effect } = useChartEffect();
  return (
    <div className={cn("flex flex-col gap-12 text-left", className)}>
      <div className="flex flex-col gap-4">
        <SectionLabel as="h1">{item?.name ?? "Component"}</SectionLabel>
        <p className="text-2xl font-semibold leading-relaxed font-sans text-foreground/90">
          {item?.description ?? "This component is not available yet."}
        </p>
      </div>

      {item?.dependencies && item.dependencies.length > 0 && (
        <div className="flex flex-col gap-3">
          <SectionLabel as="h2">Dependencies</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {item.dependencies.map((dep) => (
              <DependencyPill key={dep.name} name={dep.name} icon={dep.icon} />
            ))}
          </div>
        </div>
      )}

      {item?.registry && (
        <div className="flex flex-col gap-3">
          <SectionLabel as="h2">Installation</SectionLabel>
          {effect ? (
            <ChartEffectNotice>The {effect.label.toLowerCase()} effect installs from the Pro registry.</ChartEffectNotice>
          ) : (
            <InstallCommand item={item} />
          )}
        </div>
      )}

      {item?.usage && (
        <div className="flex flex-col gap-3">
          <SectionLabel as="h2">How to use</SectionLabel>
          <PanelCode code={item.usage} maxLines={15} />
        </div>
      )}

      {item?.registry && (
        <div className="flex flex-col gap-3">
          <SectionLabel as="h2">Source Code</SectionLabel>
          {item.pro ? (
            <div className="flex flex-col items-start gap-3 rounded-lg bg-muted p-4">
              <p className="text-sm leading-relaxed text-foreground/70">
                The source comes with Pro. Install it with your license key and
                the file is yours to edit.
              </p>
              <Link
                href="/pricing"
                className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition-colors duration-150 ease-out hover:bg-brand-hover"
              >
                Get Pro
              </Link>
            </div>
          ) : (
            effect ? (
              <ChartEffectNotice>The {effect.label.toLowerCase()} source comes with Pro.</ChartEffectNotice>
            ) : (
              <SourceCodePreview item={item} onOpenCode={onOpenCode} />
            )
          )}
        </div>
      )}

      {item?.props && item.props.length > 0 && (
        <div className="flex flex-col gap-3">
          <SectionLabel as="h2">Props</SectionLabel>
          <p className="-mt-1 text-sm leading-relaxed text-foreground/70">
            Options you can pass to customize this component.
          </p>
          <PropsTable props={item.props} />
        </div>
      )}

      {item?.credits && item.credits.length > 0 && (
        <div className="flex flex-col gap-3">
          <SectionLabel as="h2">Credits</SectionLabel>

          <ul className="flex flex-col gap-2 text-sm leading-relaxed text-foreground/70">
            {item.credits.map((credit) => (
              <li key={credit} className="flex gap-2">
                <span className="text-foreground/40">•</span>
                <span>{credit}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
