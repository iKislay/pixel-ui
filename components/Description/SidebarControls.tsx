"use client";

import { usePathname } from "next/navigation";
import { activeComponent, type ComponentItem } from "@/lib/components";
import { cn } from "@/lib/utils";
import { usePreviewControl } from "../preview/PreviewControls";
import { toast } from "../ui/toast";
import ColorSwatches from "../preview/ColorSwatches";

type SidebarControlsProps = {
  item?: ComponentItem;
  onOpenCode?: () => void;
  className?: string;
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function deployDemo(result: "success" | "error") {
  const id = toast("Queued for deploy", {
    description: "Your build is waiting for a free runner.",
    duration: Infinity,
  });
  setTimeout(
    () =>
      toast.loading("Deploying to production...", {
        id,
        description: "Build 214 is uploading and\nwill go live in a moment.",
      }),
    600,
  );
  setTimeout(
    () =>
      result === "success"
        ? toast.success("Deployment live", {
            id,
            description: "Build 214 is now serving\nall of your traffic.",
          })
        : toast.error("Deployment failed", {
            id,
            description: "Build 214 could not start.\nCheck the logs and try again.",
          }),
    2800,
  );
}

const TOAST_ACTIONS = [
  { label: "Deploy (Success)", run: () => deployDemo("success") },
  { label: "Deploy (Error)", run: () => deployDemo("error") },
  {
    label: "Success",
    run: () =>
      toast.success("Changes saved", {
        description: "Your profile is up to date.",
      }),
  },
  {
    label: "Error",
    run: () =>
      toast.error("Upload failed", {
        description: "The file is over 10 MB.",
        action: { label: "Retry", onClick: () => toast.success("Uploaded") },
      }),
  },
  {
    label: "Warning",
    run: () =>
      toast.warning("Storage almost full", {
        description: "You have used 92% of your 5 GB.",
      }),
  },
  {
    label: "Info",
    run: () =>
      toast.info("Update ready", {
        description: "Version 2.4 installs on restart.",
      }),
  },
  {
    label: "Promise",
    run: () =>
      toast.promise(wait(2000), {
        loading: "Publishing your post",
        success: "Post published",
        error: "Couldn't publish",
      }),
  },
  {
    label: "Undo",
    run: () =>
      toast("Message archived", {
        action: {
          label: "Undo",
          onClick: () => toast("Message restored"),
        },
      }),
  },
];

function SectionHeader({ title }: { title: string }) {
  return (
    <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground/45 select-none">
      {title}
    </span>
  );
}

function ButterfliesControls() {
  const [variant, setVariant] = usePreviewControl("variant", "color");
  const [countStr, setCount] = usePreviewControl("count", "3");
  const count = Number(countStr) || 3;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <SectionHeader title="Style" />
        <div className="flex rounded-xl bg-muted/60 p-1 border border-black/[0.06] dark:border-white/10">
          {(["color", "mono"] as const).map((v) => {
            const active = variant === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => setVariant(v)}
                className={cn(
                  "flex-1 py-1.5 px-3 text-xs font-medium rounded-lg capitalize transition-all",
                  active
                    ? "bg-popover text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {v}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <SectionHeader title="Number of Butterflies" />
        <div className="flex gap-1.5 rounded-xl bg-muted/60 p-1 border border-black/[0.06] dark:border-white/10">
          {[1, 2, 3, 4, 5].map((n) => {
            const active = count === n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => setCount(String(n))}
                className={cn(
                  "h-8 flex-1 rounded-lg text-xs font-medium transition-all",
                  active
                    ? "bg-popover text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {n}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function JellyfishControls() {
  const [variant, setVariant] = usePreviewControl("variant", "color");
  const [countStr, setCount] = usePreviewControl("count", "4");
  const count = Number(countStr) || 4;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <SectionHeader title="Style" />
        <div className="flex rounded-xl bg-muted/60 p-1 border border-black/[0.06] dark:border-white/10">
          {(["color", "mono"] as const).map((v) => {
            const active = variant === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => setVariant(v)}
                className={cn(
                  "flex-1 py-1.5 px-3 text-xs font-medium rounded-lg capitalize transition-all",
                  active
                    ? "bg-popover text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {v}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <SectionHeader title="Number of Jellyfish" />
        <div className="flex gap-1.5 rounded-xl bg-muted/60 p-1 border border-black/[0.06] dark:border-white/10">
          {[1, 2, 3, 4, 5, 6].map((n) => {
            const active = count === n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => setCount(String(n))}
                className={cn(
                  "h-8 flex-1 rounded-lg text-xs font-medium transition-all",
                  active
                    ? "bg-popover text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {n}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ToastControls() {
  return (
    <div className="flex flex-col gap-2">
      <SectionHeader title="Trigger Toasts" />
      <div className="flex flex-col gap-1.5">
        {TOAST_ACTIONS.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={action.run}
            className="flex items-center justify-between rounded-xl border border-black/[0.06] bg-muted/40 px-3 py-2 text-xs font-medium text-foreground transition-all hover:bg-muted/80 active:scale-[0.98] dark:border-white/10"
          >
            <span>{action.label}</span>
            <span className="text-[10px] text-muted-foreground">Trigger</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function MemberSelectorControls() {
  const [maxStr, setMax] = usePreviewControl("maxVisible", "5");
  const [, setSelected] = usePreviewControl("selected", "1,2");
  const max = Number(maxStr) || 5;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <SectionHeader title="Max Visible" />
        <div className="flex gap-1.5 rounded-xl bg-muted/60 p-1 border border-black/[0.06] dark:border-white/10">
          {[3, 4, 5].map((n) => {
            const active = max === n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => setMax(String(n))}
                className={cn(
                  "h-8 flex-1 rounded-lg text-xs font-medium transition-all",
                  active
                    ? "bg-popover text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {n}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <SectionHeader title="Selection Actions" />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSelected("1,2,3,4,5,6,7,8")}
            className="flex-1 rounded-lg border border-black/[0.06] bg-muted/40 py-2 text-xs font-medium text-foreground hover:bg-muted/80 transition-colors dark:border-white/10"
          >
            Select all
          </button>
          <button
            type="button"
            onClick={() => setSelected("")}
            className="flex-1 rounded-lg border border-black/[0.06] bg-muted/40 py-2 text-xs font-medium text-foreground hover:bg-muted/80 transition-colors dark:border-white/10"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

function AudioChatControls() {
  const [speakingStr, setSpeaking] = usePreviewControl("speaking", "1,6");
  const [mutedStr, setMuted] = usePreviewControl("muted", "false");
  const speaking = speakingStr ? speakingStr.split(",") : [];
  const isMuted = mutedStr === "true";

  const toggleSpeaker = (id: string) => {
    const next = speaking.includes(id)
      ? speaking.filter((s) => s !== id)
      : [...speaking, id];
    setSpeaking(next.join(","));
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <SectionHeader title="Simulate Speaking" />
        <div className="flex flex-col gap-1.5">
          {[
            { id: "1", name: "Lena" },
            { id: "6", name: "Ravi" },
            { id: "you", name: "You" },
          ].map((speaker) => {
            const active = speaking.includes(speaker.id);
            return (
              <button
                key={speaker.id}
                type="button"
                onClick={() => toggleSpeaker(speaker.id)}
                className={cn(
                  "flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-medium transition-all",
                  active
                    ? "border-brand/40 bg-brand/10 text-brand dark:border-brand/50 dark:bg-brand/20"
                    : "border-black/[0.06] bg-muted/40 text-foreground hover:bg-muted/80 dark:border-white/10",
                )}
              >
                <span>{speaker.name}</span>
                <span className="text-[10px]">{active ? "Speaking" : "Quiet"}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <SectionHeader title="Microphone" />
        <button
          type="button"
          onClick={() => setMuted(isMuted ? "false" : "true")}
          className={cn(
            "rounded-xl border py-2.5 px-3 text-xs font-semibold transition-all text-center",
            isMuted
              ? "border-destructive/40 bg-destructive/10 text-destructive"
              : "border-black/[0.06] bg-muted/40 text-foreground hover:bg-muted/80 dark:border-white/10",
          )}
        >
          {isMuted ? "Unmute microphone" : "Mute microphone"}
        </button>
      </div>
    </div>
  );
}

export default function SidebarControls({
  item,
  onOpenCode,
  className,
}: SidebarControlsProps) {
  const pathname = usePathname();
  const activeItem = item ?? activeComponent(pathname);

  const scrollToDocs = () => {
    document.getElementById("component-docs")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className={cn("flex flex-col gap-6 text-left", className)}>
      <div className="flex flex-col gap-1 pb-4 border-b border-black/[0.06] dark:border-white/10">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/40 select-none">
          Controls
        </span>
        <h2 className="text-base font-semibold text-foreground truncate">
          {activeItem?.name ?? "Component"}
        </h2>
      </div>

      {pathname === "/components/ascii-butterflies" && <ButterfliesControls />}
      {pathname === "/components/ascii-jellyfish" && <JellyfishControls />}
      {pathname === "/components/toast" && <ToastControls />}
      {pathname === "/components/member-selector" && <MemberSelectorControls />}
      {pathname === "/components/audio-chat-room" && <AudioChatControls />}

      <ColorSwatches showLabel />

      <div className="flex flex-col gap-2 pt-4 border-t border-black/[0.06] dark:border-white/10">
        {onOpenCode && (
          <button
            type="button"
            onClick={onOpenCode}
            className="flex w-full items-center justify-between rounded-xl border border-black/[0.06] bg-muted/40 px-3.5 py-2.5 text-xs font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground dark:border-white/10"
          >
            <span>View full code</span>
            <span className="text-xs text-foreground/40">↗</span>
          </button>
        )}
        <button
          type="button"
          onClick={scrollToDocs}
          className="flex w-full items-center justify-between rounded-xl border border-black/[0.06] bg-muted/40 px-3.5 py-2.5 text-xs font-medium text-foreground/70 transition-colors hover:bg-muted hover:text-foreground dark:border-white/10"
        >
          <span>Installation &amp; Props</span>
          <span className="text-xs text-foreground/40">↓</span>
        </button>
      </div>
    </div>
  );
}
