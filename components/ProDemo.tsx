import Link from "next/link";
import { PRO_DEMOS } from "@pro/demos";
import Tag from "@/components/Tag";

export default function ProDemo({ name }: { name: string }) {
  const Demo = PRO_DEMOS[name];
  if (Demo) return <Demo />;

  return (
    <div className="flex h-full min-h-[500px] flex-col items-center justify-center gap-3 px-6 text-center">
      <Tag tone="pro" />
      <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
        This preview loads from the private Pro repo, which is not checked out
        in this build.
      </p>
      <Link
        href="/pricing"
        className="text-sm font-medium text-foreground underline decoration-foreground/25 underline-offset-4 transition-colors duration-150 ease-out hover:decoration-foreground"
      >
        See Pro
      </Link>
    </div>
  );
}
