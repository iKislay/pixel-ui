import GooeyNavbar from "@/components/GooeyNavbar";
import HeroIntro from "@/components/HeroIntro";
import { PixelUILogo } from "@/components/logos";

export default function PageHero({
  stars,
  headline,
  sub,
  children,
}: {
  stars: number | null;
  headline: React.ReactNode;
  sub: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="relative w-full p-1.5 md:p-2.5">
      <div
        className="relative flex min-h-[min(78svh,50rem)] w-full items-center justify-center overflow-hidden rounded-[45px] border border-black/[0.04] bg-[#F4F5F8] dark:border-transparent dark:border-apple dark:bg-[#0F1011]"
        style={{ cornerShape: "squircle" } as React.CSSProperties}
      >
        <GooeyNavbar stars={stars} />

        <PixelUILogo className="pointer-events-none absolute left-1/2 top-[68%] w-[860px] max-w-none -translate-x-1/2 -translate-y-1/2 select-none opacity-[0.05] dark:opacity-[0.07]" />

        <div className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(120%_75%_at_50%_-5%,rgba(255,255,255,0.07),transparent_60%)] dark:block" />

        <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-3 px-4 pb-20 pt-28 text-center sm:gap-4 sm:px-6">
          <HeroIntro headline={headline} sub={sub}>
            {children}
          </HeroIntro>
        </div>
      </div>
    </section>
  );
}

export function ScrollCue({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="flex flex-col items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors duration-150 ease-out hover:text-foreground"
    >
      {label}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        xmlns="http://www.w3.org/2000/svg"
        className="size-4 animate-bounce motion-reduce:animate-none"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </a>
  );
}

export function PageSection({
  id,
  label,
  title,
  children,
}: {
  id?: string;
  label: string;
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="mx-auto grid w-full max-w-6xl scroll-mt-24 gap-8 px-5 pt-20 sm:px-6 md:grid-cols-[1fr_2fr] md:pt-28"
    >
      <header className="flex flex-col items-start gap-1">
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
        <h2 className="text-3xl font-medium tracking-tight text-foreground sm:text-4xl md:text-5xl">
          {title}
        </h2>
      </header>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
