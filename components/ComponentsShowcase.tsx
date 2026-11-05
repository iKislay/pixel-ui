import { components } from "@/lib/components";
import ComponentCard from "./gallery/ComponentCard";
import ViewAllCard from "./gallery/ViewAllCard";

const SHOWN = 6;

// each slot differs in size so the grid reads unaligned; dense flow fills the gaps
const SLOTS = [
  { className: "sm:col-span-2 lg:row-span-2", large: true },
  { className: "", large: false },
  { className: "lg:row-span-2", large: true },
  { className: "", large: false },
  { className: "sm:col-span-2 lg:col-span-1", large: false },
  { className: "", large: false },
];

// seeded, so server and client agree on the same "random" order
function shuffled<T>(items: T[], seed: number) {
  const out = [...items];
  let t = seed;
  const next = () => {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export default function ComponentsShowcase() {
  const picks = shuffled(components, 7).slice(0, SHOWN);
  if (picks.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-24 sm:px-6 md:py-32">
      <header className="flex flex-col items-center gap-3 text-center">
        <h2 className="max-w-2xl text-balance font-runde text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
          {components.length}+ pixel-perfect and unique components
        </h2>
        <p className="max-w-lg text-balance text-sm font-medium text-muted-foreground sm:text-base">
          Just one file for each component. Add it with the shadcn CLI, using
          any package manager you like.
        </p>
      </header>

      <div className="mt-12 grid grid-flow-dense grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {picks.map((item, i) => (
          <ComponentCard
            key={item.href}
            item={item}
            large={SLOTS[i].large}
            autoPlay
            className={SLOTS[i].className}
          />
        ))}
        <ViewAllCard
          count={components.length}
          className="sm:col-span-2 lg:col-span-1"
        />
      </div>
    </section>
  );
}
