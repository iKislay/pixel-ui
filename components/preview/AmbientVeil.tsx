import { cn } from "@/lib/utils";

// soft frosted halo that sits between an ambient background and the content on top
export default function AmbientVeil({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 bg-[#F5F5F7]/75 backdrop-blur-md dark:bg-[#121212]/75",
        className,
      )}
      style={{
        maskImage: "radial-gradient(ellipse 50% 42% at 50% 50%, black 35%, transparent 100%)",
        WebkitMaskImage: "radial-gradient(ellipse 50% 42% at 50% 50%, black 35%, transparent 100%)",
      }}
    />
  );
}
