"use client";

import { SwarmReveal } from "@/components/ui/swarm-reveal";
import { usePreviewControl } from "@/components/preview/PreviewControls";

const PROJECTS = [
  { name: "Tidepool", note: "A shared canvas for sketching with friends.", art: "linear-gradient(135deg,#40c8e0,#5e5ce6)" },
  { name: "Night Market", note: "A pixel game about selling noodles after dark.", art: "linear-gradient(135deg,#ff9f0a,#ff375f)" },
  { name: "Hollow", note: "A tiny journaling app that only opens at dusk.", art: "linear-gradient(135deg,#30d158,#0a84ff)" },
  { name: "Driftwood", note: "Ambient soundscapes generated from tide charts.", art: "linear-gradient(135deg,#bf5af2,#40c8e0)" },
];

const STACK = ["TypeScript", "React", "Rust", "WebGL", "Figma"];

export default function Demo() {
  const [cursors] = usePreviewControl("cursors", "24");
  const [replay] = usePreviewControl("replay", "0");
  const [variant] = usePreviewControl("variant", "color");
  const [status] = usePreviewControl("status", "on");

  return (
    <div className="relative h-full min-h-[500px] w-full">
      <div className="no-scrollbar absolute inset-0 overflow-y-auto">
        <SwarmReveal
          key={`${cursors}-${replay}-${variant}`}
          cursors={Number(cursors) || 24}
          variant={variant === "mono" ? "mono" : "color"}
          status={status === "on"}
          className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-10 text-foreground"
        >
          <div
            data-swarm="image"
            className="h-32 rounded-2xl"
            style={{
              background:
                "repeating-linear-gradient(90deg,#0000 0 14px,#0001 14px 16px),linear-gradient(180deg,#1e3a8a 0%,#6d28d9 55%,#f97316 100%)",
            }}
          />
          <div className="flex items-center gap-4">
            <div data-swarm="image" className="size-14 shrink-0 rounded-full bg-[conic-gradient(#ff5f57,#ffd60a,#30d158,#0a84ff,#bf5af2,#ff5f57)]" />
            <div className="flex flex-col gap-0.5">
              <h1 data-swarm className="text-xl font-semibold tracking-tight">Mira Okafor</h1>
              <p data-swarm className="text-sm text-muted-foreground">Creative developer, Lagos</p>
            </div>
          </div>
          <section className="flex flex-col gap-2">
            <h2 data-swarm className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">About</h2>
            <p data-swarm="text" className="text-sm leading-6 text-foreground/80">
              I build playful interfaces that feel alive. Most of my work sits between design and engineering: small tools,
              odd games, and websites that reward a second look. Right now I am exploring multiplayer canvases and
              generative sound.
            </p>
          </section>
          <section className="flex flex-col gap-2">
            <h2 data-swarm className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Stack</h2>
            <div className="flex flex-wrap gap-1.5">
              {STACK.map((s) => (
                <span key={s} data-swarm className="rounded-full bg-muted px-2.5 py-1 text-xs">
                  {s}
                </span>
              ))}
            </div>
          </section>
          <section className="flex flex-col gap-3">
            <h2 data-swarm className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Projects</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {PROJECTS.map((p) => (
                <article key={p.name} data-swarm="carry" className="overflow-hidden rounded-xl border bg-card">
                  <div className="h-24" style={{ background: p.art }} />
                  <div className="p-3">
                    <h3 className="text-sm font-medium">{p.name}</h3>
                    <p className="text-xs text-muted-foreground">{p.note}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
          <section className="flex flex-col gap-2">
            <h2 data-swarm className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Contact</h2>
            <p data-swarm="text" className="text-sm leading-6 text-foreground/80">
              Say hi at mira@example.com. I reply to every note, usually with a sketch.
            </p>
          </section>
        </SwarmReveal>
      </div>
    </div>
  );
}
