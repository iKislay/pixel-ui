import { cn } from "@/lib/utils";

const TONES = {
  new: "bg-brand/20 text-brand",
  pro: "bg-[#E9B949]/20 text-[#A87A06] dark:text-[#F2C94C]",
};

export default function Tag({
  tone,
  className,
}: {
  tone: keyof typeof TONES;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider",
        TONES[tone],
        className,
      )}
    >
      {tone}
    </span>
  );
}
