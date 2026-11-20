"use client";

import { useState, type ComponentType } from "react";
import { ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { RadioGroup } from "@/components/ui/radio-group";

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

export const DEMOS: Record<string, ComponentType> = {
  button: ButtonDemo,
  input: InputDemo,
  "textarea": TextareaDemo,
  "checkbox": CheckboxDemo,
  "switch": SwitchDemo,
  "radio-group": RadioGroupDemo,
};

export default function PrimitiveDemo({ slug }: { slug: string }) {
  const Demo = DEMOS[slug];
  return Demo ? <Demo /> : null;
}
