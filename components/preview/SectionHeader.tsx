export default function SectionHeader({ title }: { title: string }) {
  return (
    <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground/45 select-none">
      {title}
    </span>
  );
}
