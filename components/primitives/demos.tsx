"use client";

import { useState, type ComponentType } from "react";
import { ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

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

export const DEMOS: Record<string, ComponentType> = {
  button: ButtonDemo,
};

export default function PrimitiveDemo({ slug }: { slug: string }) {
  const Demo = DEMOS[slug];
  return Demo ? <Demo /> : null;
}
