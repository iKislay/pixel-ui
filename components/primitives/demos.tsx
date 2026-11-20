"use client";

import { useState, type ComponentType } from "react";
import { ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

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

export const DEMOS: Record<string, ComponentType> = {
  button: ButtonDemo,
  input: InputDemo,
  "textarea": TextareaDemo,
  "checkbox": CheckboxDemo,
};

export default function PrimitiveDemo({ slug }: { slug: string }) {
  const Demo = DEMOS[slug];
  return Demo ? <Demo /> : null;
}
