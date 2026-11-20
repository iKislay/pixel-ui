"use client";

import { useState, type ComponentType } from "react";
import { ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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

export const DEMOS: Record<string, ComponentType> = {
  button: ButtonDemo,
  input: InputDemo,
  "textarea": TextareaDemo,
};

export default function PrimitiveDemo({ slug }: { slug: string }) {
  const Demo = DEMOS[slug];
  return Demo ? <Demo /> : null;
}
