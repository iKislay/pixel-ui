import { cn } from "@/lib/utils";

const FADE = "radial-gradient(closest-side, black 40%, transparent 100%)";

// stacked rings, weakest outside, so the blur fades in instead of ending at a hard rim
const RINGS = [
  { inset: "-inset-x-24 -inset-y-16", blur: "backdrop-blur-[1px]" },
  { inset: "-inset-x-14 -inset-y-10", blur: "backdrop-blur-[2px]" },
  { inset: "-inset-x-4 -inset-y-4", blur: "backdrop-blur-[3px]" },
];

// soft frosted halo hugging its parent content, so an ambient background blurs only behind it
export default function AmbientVeil({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 [--veil:#F5F5F7] dark:[--veil:#121212]",
        className,
      )}
    >
      {RINGS.map((ring) => (
        <div
          key={ring.inset}
          className={cn("absolute rounded-[50%]", ring.inset, ring.blur)}
          style={{ maskImage: FADE, WebkitMaskImage: FADE }}
        />
      ))}
      <div
        className="absolute -inset-x-28 -inset-y-20"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in srgb, var(--veil) 55%, transparent) 30%, transparent 100%)",
        }}
      />
    </div>
  );
}
