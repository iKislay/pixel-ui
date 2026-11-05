import { PixelUILogo } from "@/components/logos";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
};

export function BrandLogo({
  className,
  iconClassName,
  textClassName,
}: BrandLogoProps) {
  return (
    <span className={cn("group inline-flex items-center gap-2", className)}>
      <PixelUILogo
        className={cn(
          "size-5 shrink-0 text-foreground transition-transform duration-200 group-hover:scale-105 motion-reduce:transform-none",
          iconClassName,
        )}
      />
      <span
        className={cn(
          "font-runde text-base font-semibold text-foreground",
          textClassName,
        )}
      >
        Pixel UI
      </span>
    </span>
  );
}

export default BrandLogo;
