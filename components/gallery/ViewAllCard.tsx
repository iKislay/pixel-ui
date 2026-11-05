import Link from "next/link";
import { PixelUILogo } from "@/components/logos";
import { cn } from "@/lib/utils";

export default function ViewAllCard({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  return (
    <Link
      href="/components"
      className={cn(
        "group relative flex h-full min-h-45 flex-col justify-between overflow-hidden rounded-[44px] bg-brand p-6 text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)] transition-colors duration-200 ease-out hover:bg-brand-hover [transform:translateZ(0)] sm:rounded-[56px] sm:p-8 lg:rounded-[64px] lg:p-9",
        className,
      )}
      style={{ cornerShape: "squircle" } as React.CSSProperties}
    >
      <PixelUILogo className="pointer-events-none absolute -bottom-10 -right-10 size-56 select-none text-white opacity-10 sm:-bottom-14 sm:-right-14 sm:size-72 dark:text-white dark:opacity-10" />

      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        xmlns="http://www.w3.org/2000/svg"
        className="relative h-8 w-8 transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none"
        aria-hidden="true"
      >
        <path d="M7 17 17 7M8 7h9v9" />
      </svg>

      <span className="relative text-3xl font-medium tracking-tight sm:text-4xl">
        View <span className="font-serif font-normal italic">all</span>
        <br />
        {count} components
      </span>
    </Link>
  );
}
