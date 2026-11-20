"use client";

import { useState, type ComponentType } from "react";
import { Archive, ArrowRight, ChevronDown, Copy, Plus, Share, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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

function ButtonDemo() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Button
        loading={loading}
        onClick={() => {
          setLoading(true);
          setTimeout(() => setLoading(false), 1600);
        }}
      >
        Continue <ArrowRight />
      </Button>
      <Button variant="secondary">Cancel</Button>
      <Button variant="ghost">Skip</Button>
      <Button size="icon" variant="secondary" aria-label="Add">
        <Plus />
      </Button>
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
      <Input
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        invalid={invalid}
        placeholder="you@example.com"
        aria-label="Email"
        aria-describedby="input-demo-hint"
      />
      <p id="input-demo-hint" className="px-1 text-xs text-foreground/45">
        {invalid ? "That email looks incomplete." : "Press Enter to check it."}
      </p>
    </form>
  );
}

function TextareaDemo() {
  return (
    <Textarea
      className="max-w-sm"
      placeholder="What should we build next? It grows as you write."
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
  const [volume, setVolume] = useState(64);

  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <div className="flex items-center justify-between text-sm font-medium">
        <span>Volume</span>
        <span className="font-mono text-xs text-foreground/50 tabular-nums">{volume}%</span>
      </div>
      <Slider aria-label="Volume" value={volume} onValueChange={setVolume} />
    </div>
  );
}

function SelectDemo() {
  return (
    <div className="flex h-72 items-start pt-6">
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
    </div>
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
    <div className="flex h-72 items-start pt-8">
      <Popover aria-label="Rename" align="start" trigger={<Button variant="secondary">Rename file</Button>}>
        <form onSubmit={(event) => event.preventDefault()} className="flex flex-col gap-3">
          <p className="font-semibold">Rename</p>
          <Input defaultValue="moodboard-final-v2.fig" aria-label="File name" />
          <Button size="sm" type="submit" className="self-end">
            Save
          </Button>
        </form>
      </Popover>
    </div>
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
    <div className="flex h-80 items-start pt-8">
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
    </div>
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
};

export default function PrimitiveDemo({ slug }: { slug: string }) {
  const Demo = DEMOS[slug];
  return Demo ? <Demo /> : null;
}
