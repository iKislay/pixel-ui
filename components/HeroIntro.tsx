import type { CSSProperties, ReactNode } from "react";

// css, not motion: the intro starts on first paint instead of waiting for the page's js to hydrate
const rise = (index: number): CSSProperties => ({ animationDelay: `${index * 90}ms` });

export default function HeroIntro({
  headline,
  sub,
  badge,
  children,
}: {
  headline: ReactNode;
  sub: ReactNode;
  badge?: ReactNode;
  children: ReactNode;
}) {
  const first = badge ? 1 : 0;

  return (
    <>
      {badge && (
        <div className="hero-rise mb-1" style={rise(0)}>
          {badge}
        </div>
      )}

      <h1
        className="hero-rise max-w-5xl text-balance font-serif text-4xl font-normal tracking-tight text-black dark:text-white sm:text-6xl md:text-7xl lg:text-8xl"
        style={rise(first)}
      >
        {headline}
      </h1>

      <p
        className="hero-rise max-w-xl font-medium text-black/60 dark:text-white/60 sm:text-lg"
        style={rise(first + 1)}
      >
        {sub}
      </p>

      <div className="hero-rise" style={rise(first + 2)}>
        {children}
      </div>
    </>
  );
}
