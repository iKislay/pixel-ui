import Link from "next/link";
import { cn } from "@/lib/utils";
import { PixelUILogo } from "@/components/logos";

export default function SidebarHeader({
  onNavigate,
  className,
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center min-w-0", className)}>
      <Link
        href="/"
        onClick={onNavigate}
        className="group flex items-center gap-2.5 rounded-lg transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand/60"
      >
        <PixelUILogo className="size-6 shrink-0 transition-transform duration-200 group-hover:scale-105 motion-reduce:transform-none" />
        <span className="font-runde text-[17px] font-semibold tracking-tight text-foreground truncate">
          Pixel UI
        </span>
      </Link>
    </div>
  );
}

