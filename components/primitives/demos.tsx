"use client";

import { useState, type ComponentType } from "react";
import { Archive, ArrowRight, ChevronDown, Copy, Plus, Share, Trash2 } from "lucide-react";
import { Button, type ButtonStatus } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { RadioGroup } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Select } from "@/components/ui/select";
import { Tabs } from "@/components/ui/tabs";
import { Tooltip } from "@/components/ui/tooltip";
import { Popover } from "@/components/ui/popover";
import { Dialog } from "@/components/ui/dialog";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

function ButtonDemo() {
  const [status, setStatus] = useState<ButtonStatus>("idle");
  const [fail, setFail] = useState<ButtonStatus>("idle");

  const run = (set: (s: ButtonStatus) => void, end: ButtonStatus) => {
    set("loading");
    setTimeout(() => set(end), 1400);
    setTimeout(() => set("idle"), 2800);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-3">
        <Button status={status} onClick={() => run(setStatus, "success")}>
          Publish site <ArrowRight />
        </Button>
        <Button variant="secondary" status={fail} onClick={() => run(setFail, "error")}>
          Retry payment
        </Button>
      </div>
      <div className="flex items-center gap-3">
        <Button size="sm" variant="ghost">
          Skip
        </Button>
        <Button size="sm" variant="secondary">
          Cancel
        </Button>
        <Button size="icon" variant="secondary" aria-label="Add">
          <Plus />
        </Button>
      </div>
    </div>
  );
}

function InputDemo() {
  const [email, setEmail] = useState("");
  const [tried, setTried] = useState(false);
  const invalid = tried && !/^\S+@\S+\.\S+$/.test(email);

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setTried(true);
      }}
      className="flex w-full max-w-sm flex-col gap-3"
    >
      <Input label="Full name" autoComplete="name" />
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={invalid ? "That email looks incomplete." : undefined}
      />
      <Button type="submit" className="self-end">
        Continue
      </Button>
    </form>
  );
}

function TextareaDemo() {
  return (
    <Textarea
      className="max-w-sm"
      maxLength={80}
      defaultValue="Ship the squircle cards on Friday, then"
      placeholder="What should we build next?"
      aria-label="Feedback"
    />
  );
}

function CheckboxDemo() {
  const [items, setItems] = useState([true, false, false]);
  const labels = ["Squircle corners", "Spring motion", "Dark mode"];
  const all = items.every(Boolean);
  const some = items.some(Boolean);

  return (
    <div className="flex flex-col gap-3 text-sm font-medium">
      <label className="flex cursor-pointer items-center gap-3">
        <Checkbox
          checked={all ? true : some ? "indeterminate" : false}
          onCheckedChange={(next) => setItems(items.map(() => next))}
        />
        Everything
      </label>
      {labels.map((label, index) => (
        <label key={label} className="ml-8 flex cursor-pointer items-center gap-3 text-foreground/70">
          <Checkbox
            checked={items[index]}
            onCheckedChange={(next) => setItems(items.map((value, i) => (i === index ? next : value)))}
          />
          {label}
        </label>
      ))}
    </div>
  );
}

function SwitchDemo() {
  const rows = [
    ["Notifications", true],
    ["Sync over cellular", false],
    ["Reduce transparency", false],
  ] as const;

  return (
    <div className="flex w-full max-w-xs flex-col gap-4 text-sm font-medium">
      {rows.map(([label, on]) => (
        <label key={label} className="flex cursor-pointer items-center justify-between gap-6">
          {label}
          <Switch defaultChecked={on} />
        </label>
      ))}
    </div>
  );
}

function RadioGroupDemo() {
  return (
    <RadioGroup
      aria-label="Delivery"
      defaultValue="standard"
      className="w-full max-w-xs"
      options={[
        { value: "standard", label: "Standard", description: "Four to six days, free" },
        { value: "express", label: "Express", description: "Next day, $12" },
        { value: "pickup", label: "Pick up", description: "Not offered in your area", disabled: true },
      ]}
    />
  );
}

function SliderDemo() {
  const [warmth, setWarmth] = useState(62);

  return (
    <div className="flex w-full max-w-sm flex-col gap-10 pt-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1 text-sm font-medium">
          <span>Warmth</span>
          <span className="font-mono text-xs text-foreground/50 tabular-nums">{warmth}%</span>
        </div>
        <Slider aria-label="Warmth" value={warmth} onValueChange={setWarmth} formatValue={(v) => `${v}%`} />
      </div>
      <Slider aria-label="Tempo" min={60} max={180} defaultValue={120} ticks={28} formatValue={(v) => `${v} bpm`} />
    </div>
  );
}

function SelectDemo() {
  return (
    <Select
      aria-label="Time zone"
      placeholder="Time zone"
      defaultValue="lisbon"
      options={[
        { value: "honolulu", label: "Honolulu" },
        { value: "denver", label: "Denver" },
        { value: "lisbon", label: "Lisbon" },
        { value: "nairobi", label: "Nairobi" },
        { value: "kathmandu", label: "Kathmandu" },
        { value: "auckland", label: "Auckland", disabled: true },
      ]}
    />
  );
}

function TabsDemo() {
  const panel = (title: string, body: string) => (
    <div className="flex flex-col gap-1 px-1">
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-sm text-foreground/55">{body}</p>
    </div>
  );

  return (
    <Tabs
      aria-label="Project"
      className="max-w-sm"
      items={[
        { value: "overview", label: "Overview", content: panel("Overview", "Three deploys today, all green.") },
        { value: "activity", label: "Activity", content: panel("Activity", "Mira merged the onboarding branch.") },
        { value: "settings", label: "Settings", content: panel("Settings", "Preview links expire after a week.") },
      ]}
    />
  );
}

function TooltipDemo() {
  return (
    <div className="flex items-center gap-3">
      <Tooltip content="Bold">
        <Button size="icon" variant="secondary" aria-label="Bold">
          <span className="font-bold">B</span>
        </Button>
      </Tooltip>
      <Tooltip content="Italic" side="bottom">
        <Button size="icon" variant="secondary" aria-label="Italic">
          <span className="font-serif text-lg italic">i</span>
        </Button>
      </Tooltip>
      <Tooltip content="Publish to the web" side="right">
        <Button>Publish</Button>
      </Tooltip>
    </div>
  );
}

function PopoverDemo() {
  return (
    <Popover aria-label="Rename" align="start" trigger={<Button variant="secondary">Rename file</Button>}>
      <form onSubmit={(event) => event.preventDefault()} className="flex flex-col gap-3">
        <p className="font-semibold">Rename</p>
        <Input label="File name" defaultValue="moodboard-final-v2.fig" />
        <Button size="sm" type="submit" className="self-end">
          Save
        </Button>
      </form>
    </Popover>
  );
}

function DialogDemo() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title="Delete this project?"
      description="Its pages, deploys and preview links go with it. This cannot be undone."
      trigger={<Button variant="destructive">Delete project</Button>}
    >
      <div className="mt-2 flex justify-end gap-2">
        <Button variant="secondary" onClick={() => setOpen(false)}>
          Keep it
        </Button>
        <Button variant="destructive" onClick={() => setOpen(false)}>
          Delete
        </Button>
      </div>
    </Dialog>
  );
}

function DropdownMenuDemo() {
  return (
    <DropdownMenu
      trigger={
        <Button variant="secondary">
          Actions <ChevronDown />
        </Button>
      }
      items={[
        { label: "Duplicate", icon: <Copy />, shortcut: "⌘D" },
        { label: "Share", icon: <Share />, shortcut: "⌘S" },
        { label: "Archive", icon: <Archive />, disabled: true },
        "separator",
        { label: "Delete", icon: <Trash2 />, destructive: true },
      ]}
    />
  );
}

function BadgeDemo() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Badge>Draft</Badge>
      <Badge tone="brand">New</Badge>
      <Badge tone="success" dot>
        Live
      </Badge>
      <Badge tone="warning">Pending</Badge>
      <Badge tone="danger">Failed</Badge>
    </div>
  );
}

function AvatarDemo() {
  return (
    <div className="flex items-end gap-4">
      <Avatar name="Mira Okafor" size="lg" status="online" />
      <Avatar name="Theo Lindqvist" status="away" />
      <Avatar name="Ana Ruiz" size="sm" status="offline" />
    </div>
  );
}

function CardDemo() {
  return (
    <Card className="w-full max-w-sm bg-background shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_32px_-12px_rgba(0,0,0,0.12)]">
      <div className="flex items-center justify-between">
        <CardTitle>Weekly digest</CardTitle>
        <Badge tone="brand">Beta</Badge>
      </div>
      <CardDescription>A short summary of what changed across your projects, every Monday morning.</CardDescription>
      <Button size="sm" variant="secondary" className="self-start">
        Turn on
      </Button>
    </Card>
  );
}

function SeparatorDemo() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-4 text-sm">
      <div className="flex flex-col gap-1">
        <p className="font-semibold">Pixel UI</p>
        <p className="text-foreground/55">Small parts, carefully made.</p>
      </div>
      <Separator />
      <div className="flex h-5 items-center gap-4 font-medium text-foreground/70">
        Docs
        <Separator orientation="vertical" />
        Primitives
        <Separator orientation="vertical" />
        Blog
      </div>
    </div>
  );
}

function ProgressDemo() {
  const [value, setValue] = useState(32);

  return (
    <div className="flex w-full max-w-xs flex-col gap-5">
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-sm font-medium">
          <span>Uploading</span>
          <span className="font-mono text-xs text-foreground/50 tabular-nums">{value}%</span>
        </div>
        <Progress value={value} aria-label="Upload" />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Preparing</span>
        <Progress aria-label="Preparing" />
      </div>
      <Button size="sm" variant="secondary" className="self-start" onClick={() => setValue((v) => (v >= 100 ? 0 : Math.min(v + 23, 100)))}>
        Step
      </Button>
    </div>
  );
}

function SkeletonDemo() {
  return (
    <div className="flex w-full max-w-xs items-center gap-4" aria-busy aria-label="Loading profile">
      <Skeleton className="size-12 rounded-[38%]" />
      <div className="flex flex-1 flex-col gap-2.5">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3.5 w-1/2" />
      </div>
    </div>
  );
}

export const DEMOS: Record<string, ComponentType> = {
  button: ButtonDemo,
  input: InputDemo,
  "textarea": TextareaDemo,
  "checkbox": CheckboxDemo,
  "switch": SwitchDemo,
  "radio-group": RadioGroupDemo,
  "slider": SliderDemo,
  "select": SelectDemo,
  "tabs": TabsDemo,
  "tooltip": TooltipDemo,
  "popover": PopoverDemo,
  "dialog": DialogDemo,
  "dropdown-menu": DropdownMenuDemo,
  "badge": BadgeDemo,
  "avatar": AvatarDemo,
  "card": CardDemo,
  "separator": SeparatorDemo,
  "progress": ProgressDemo,
  "skeleton": SkeletonDemo,
};

export default function PrimitiveDemo({ slug }: { slug: string }) {
  const Demo = DEMOS[slug];
  return Demo ? <Demo /> : null;
}
