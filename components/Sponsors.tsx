import { MessageCircle, Plus } from "lucide-react";
import { fetchSponsors } from "@/lib/github";
import { GithubLogo, XLogo } from "./logos";

const SPONSOR_URL = "https://github.com/sponsors/iKislay";
const ROW = 6;

const TILE =
  "relative flex size-20 shrink-0 items-center justify-center rounded-[1.5rem] transition-transform duration-200 ease-out hover:-translate-y-0.5 motion-reduce:transform-none sm:size-[7.5rem] sm:rounded-[1.75rem]";
const SQUIRCLE = { cornerShape: "squircle" } as React.CSSProperties;
const PLAIN =
  "border border-black/[0.06] bg-black/[0.03] text-black/40 hover:text-black/60 dark:border-white/[0.06] dark:bg-white/[0.04] dark:text-white/40 dark:hover:text-white/60";
const BADGE =
  "absolute -top-1.5 -right-1.5 flex size-6 items-center justify-center rounded-full bg-black text-white ring-2 ring-background dark:bg-white dark:text-black";

function External(props: React.ComponentProps<"a">) {
  return <a target="_blank" rel="noreferrer" style={SQUIRCLE} {...props} />;
}

export default async function Sponsors() {
  const sponsors = await fetchSponsors();
  const empty = Math.max(1, ROW - sponsors.length);

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 pb-20 sm:px-6 md:pb-28">
      <header className="flex max-w-3xl flex-col gap-4">
        <h2 className="text-4xl font-medium tracking-tight text-foreground sm:text-5xl md:text-6xl">
          Sponsors.
        </h2>
        <p className="text-lg leading-relaxed text-muted-foreground sm:text-xl">
          You just scrolled to the good part of the page. Pixel UI is built by one student, for
          everyone, and it keeps going because of kind sponsors like you.
        </p>
      </header>

      <div className="flex flex-col gap-5">
        {sponsors.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Slots are empty, click any slot to add your logo
          </p>
        ) : null}
        <ul className="flex flex-wrap gap-4 sm:gap-6">
          {sponsors.map((sponsor) => (
            <li key={sponsor.login}>
              <External
                href={sponsor.href}
                aria-label={sponsor.name}
                title={sponsor.name}
                className={`${TILE} overflow-hidden border border-black/[0.06] dark:border-white/[0.06]`}
              >
                <img src={sponsor.avatarUrl} alt="" className="size-full object-cover" />
              </External>
            </li>
          ))}
          {Array.from({ length: empty }, (_, i) => (
            <li key={`empty-${i}`}>
              <External href={SPONSOR_URL} aria-label="Become a sponsor" className={`${TILE} ${PLAIN}`}>
                <Plus className="size-6 sm:size-7" strokeWidth={1.5} />
              </External>
            </li>
          ))}
        </ul>
        <ul className="flex flex-wrap gap-4 sm:gap-6">
          <li>
            <External
              href="https://github.com/iKislay"
              aria-label="Kislay on GitHub"
              className={`${TILE} ${PLAIN} text-foreground hover:text-foreground dark:text-foreground dark:hover:text-foreground`}
            >
              <GithubLogo className="size-7 sm:size-8" />
              <span className={BADGE}>
                <Plus className="size-3.5" strokeWidth={2.5} />
              </span>
            </External>
          </li>
          <li>
            <External
              href="https://x.com/whykislay"
              aria-label="Kislay on X"
              className={`${TILE} border border-black/[0.08] bg-black/[0.08] text-foreground dark:border-white/[0.08] dark:bg-white/[0.1]`}
            >
              <XLogo className="size-6 sm:size-7" />
              <span className={BADGE}>
                <MessageCircle className="size-3 fill-current" />
              </span>
            </External>
          </li>
        </ul>
      </div>

      <p className="text-lg leading-snug text-muted-foreground sm:text-xl">
        Thank you all.
        <br />
        Kislay.
      </p>
    </section>
  );
}
