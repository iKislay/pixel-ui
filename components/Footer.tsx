import { Fragment } from "react";
import Link from "next/link";
import { SUPPORT_EMAIL } from "@/lib/legal";
import AsciiSkyline from "./AsciiSkyline";
import { BrandLogo } from "./BrandLogo";
import { GithubLogo, PixelUILogo, XLogo, type LogoProps } from "./logos";

const GITHUB_URL = "https://github.com/ikislay/pixel-ui";
const X_URL = "https://x.com/pixeluiHQ";

type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
  icon?: (props: LogoProps) => React.ReactElement;
};

const LINKS: FooterLink[] = [
  { label: "Home", href: "/" },
  { label: "Components", href: "/components" },
  { label: "MCP", href: "/mcp" },
  { label: "GitHub", href: GITHUB_URL, external: true, icon: GithubLogo },
  { label: "X / Twitter", href: X_URL, external: true, icon: XLogo },
];

const UTILITY_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Sitemap", href: "/sitemap.xml" },
  { label: "robots.txt", href: "/robots.txt" },
];

const HOVER =
  "transition-colors duration-150 ease-out hover:text-black dark:hover:text-white";

const MUTED = "text-black/50 dark:text-white/50";

function NavLink({ label, href, external, icon: Icon }: FooterLink) {
  const className = `w-fit ${Icon ? "flex items-center" : "text-lg"} ${MUTED} ${HOVER}`;
  const content = Icon ? <Icon className="h-[1.375rem] w-[1.375rem]" /> : label;

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={className}
        aria-label={Icon ? label : undefined}
      >
        {content}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className={className}
      aria-label={Icon ? label : undefined}
    >
      {content}
    </Link>
  );
}

export default function Footer() {
  return (
    <footer className="relative w-full p-1.5 md:p-2.5">
      <div
        className="relative flex w-full flex-col justify-between overflow-hidden rounded-[45px] border border-black/[0.04] bg-[#F4F5F8] px-6 pt-8 pb-0 text-black sm:px-10 sm:pt-10 lg:px-12 lg:pt-12 dark:border-transparent dark:border-apple dark:bg-[#0F1011] dark:text-white"
        style={{ cornerShape: "squircle" } as React.CSSProperties}
      >
        <PixelUILogo className="pointer-events-none absolute -bottom-10 -right-10 size-64 select-none opacity-5 sm:-bottom-14 sm:-right-14 sm:size-80 lg:-bottom-16 lg:-right-16 lg:size-[24rem] dark:opacity-[0.07]" />

        <div className="relative mx-auto flex w-full max-w-[96rem] flex-col">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <Link href="/" className="group flex h-fit w-fit items-center">
              <BrandLogo />
            </Link>

            <nav className="flex flex-wrap items-center gap-x-7 gap-y-2">
              {LINKS.map((link, index) => (
                <Fragment key={link.label}>
                  {link.icon && !LINKS[index - 1]?.icon && (
                    <span
                      aria-hidden="true"
                      className="-mx-3 text-lg text-black/25 dark:text-white/25"
                    >
                      |
                    </span>
                  )}
                  <NavLink {...link} />
                </Fragment>
              ))}
            </nav>
          </div>

          <div className="pt-4 sm:pt-6">
            <h2 className="selection-contrast font-serif text-[clamp(1.5rem,4vw,3.5rem)] font-normal leading-none tracking-tight">
              Crafted with <span className="italic">precision</span>
            </h2>
          </div>
        </div>

        <div className="relative -mx-6 -mb-px mt-6 sm:-mx-10 sm:mt-8 lg:-mx-12">
          <AsciiSkyline className="h-14 w-full sm:h-16 md:h-20 lg:h-24" />
        </div>
      </div>

      <div
        className={`selection-contrast mx-auto flex w-full max-w-[96rem] flex-wrap items-center justify-between gap-3 px-4 pt-3 pb-2 text-xs ${MUTED}`}
      >
        <span className="flex flex-wrap items-center gap-2.5">
          <span>Pixel UI &copy; {new Date().getFullYear()}</span>
          <span
            aria-hidden="true"
            className="text-black/25 dark:text-white/25"
          >
            &middot;
          </span>
          <a href={`mailto:${SUPPORT_EMAIL}`} className={HOVER}>
            Support: {SUPPORT_EMAIL}
          </a>
        </span>
        <span className="flex flex-wrap items-center gap-2.5">
          {UTILITY_LINKS.map((link, index) => (
            <Fragment key={link.href}>
              {index > 0 && (
                <span
                  aria-hidden="true"
                  className="text-black/25 dark:text-white/25"
                >
                  &middot;
                </span>
              )}
              <a href={link.href} className={HOVER}>
                {link.label}
              </a>
            </Fragment>
          ))}
        </span>
      </div>
    </footer>
  );
}
