import { cn } from "@/lib/utils";

const FADE = "radial-gradient(closest-side, black 55%, transparent 100%)";

// soft frosted halo that sits between an ambient background and the content on top
export default function AmbientVeil({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute left-1/2 top-1/2 h-[62%] w-[min(78%,64rem)] -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-[#F5F5F7]/60 backdrop-blur-[6px] dark:bg-[#121212]/60",
        className,
      )}
      // the rounded box keeps the blur inside the oval, the mask feathers its rim
      style={{ maskImage: FADE, WebkitMaskImage: FADE }}
    />
  );
}
