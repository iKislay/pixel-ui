export default function Fallback() {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div className="pointer-events-none absolute inset-x-[-25%] bottom-[-40%] top-1/4 bg-[radial-gradient(circle_at_50%_100%,color-mix(in_srgb,var(--brand)_22%,transparent),transparent_65%)] dark:bg-[radial-gradient(circle_at_50%_100%,color-mix(in_srgb,var(--brand)_40%,transparent),transparent_65%)]" />
      <span className="relative rounded-full bg-black/[0.04] px-3.5 py-1.5 text-xs font-medium text-neutral-500 shadow-[inset_0_1px_0_0_rgba(0,0,0,0.06)] dark:bg-white/[0.06] dark:text-white/60 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)]">
        Recording soon
      </span>
    </div>
  );
}
