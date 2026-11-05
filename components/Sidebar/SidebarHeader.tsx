import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { cn } from "@/lib/utils";

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
        className="group flex items-center rounded-lg transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand/60"
      >
        <BrandLogo textClassName="truncate" />
      </Link>
    </div>
  );
}

