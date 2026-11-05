"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import HalloweenLogo from "@/components/HalloweenLogo";
import { NavbarActions } from "@/components/NavbarActions";
import { cn } from "@/lib/utils";

const LINKS = [
  { label: "Home", href: "/" },
  { label: "Components", href: "/components" },
];

const pill = "rounded-full border-apple bg-neutral-900";
const inPill = "md:bg-transparent md:shadow-none";

export default function GooeyNavbar({ stars }: { stars?: number | null }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [logoHovered, setLogoHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  const popSpring = { type: "spring", stiffness: 320, damping: 15 } as const;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const spring = { type: "spring", stiffness: 300, damping: 30 } as const;
  const animateLayout = !reduceMotion;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-5 md:top-4 z-50 flex justify-center px-5  sm:px-6 md:top-7.5">
      <motion.nav
        layout={animateLayout}
        transition={spring}
        style={{ borderRadius: 9999 }}
        className={cn(
          "relative z-10 flex w-full max-w-3xl items-center justify-between md:bg-neutral-900 md:border-apple",
          !scrolled && "md:w-auto md:gap-2",
        )}
      >
        <motion.div
          layout={animateLayout}
          transition={spring}
          className="pointer-events-auto"
        >
          <Link
            href="/"
            onMouseEnter={() => setLogoHovered(true)}
            onMouseLeave={() => setLogoHovered(false)}
            onFocus={() => setLogoHovered(true)}
            onBlur={() => setLogoHovered(false)}
            className={cn(pill, inPill, "flex h-12 items-center gap-2 px-4")}
          >
            <HalloweenLogo hovered={logoHovered} />
            <span className="font-runde text-md font-semibold text-white">
              Pixel UI
            </span>
          </Link>
        </motion.div>

        <motion.div
          layout={animateLayout}
          transition={spring}
          className="pointer-events-auto hidden h-12 items-center rounded-full px-2 md:flex"
        >
          {LINKS.map((link, i) => (
            <Fragment key={link.href}>
              {i > 0 && <span className="h-4 w-px bg-white/15" />}
              <Link
                href={link.href}
                className={cn(
                  "px-3.5 text-sm",
                  pathname === link.href
                    ? "text-white"
                    : "text-white/60 transition-colors duration-150 ease-out hover:text-white",
                )}
              >
                {link.label}
              </Link>
            </Fragment>
          ))}
        </motion.div>

        <motion.div
          layout={animateLayout}
          transition={spring}
          className="pointer-events-auto hidden items-center gap-2 md:flex"
        >
          <NavbarActions stars={stars} inNavbar variant="default" />
        </motion.div>

        <motion.button
          layout={animateLayout}
          transition={spring}
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          className={cn(
            pill,
            "pointer-events-auto flex h-12 w-12 items-center justify-center md:hidden",
          )}
        >
          <span className="flex h-4 w-5 flex-col justify-between">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                initial={false}
                animate={{
                  rotate: menuOpen ? (i === 0 ? 45 : i === 2 ? -45 : 0) : 0,
                  y: menuOpen ? (i === 0 ? 7 : i === 2 ? -7 : 0) : 0,
                  opacity: menuOpen && i === 1 ? 0 : 1,
                }}
                transition={reduceMotion ? { duration: 0 } : spring}
                className="h-0.5 w-full bg-white"
              />
            ))}
          </span>
        </motion.button>
      </motion.nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.25, ease: "easeOut" }}
            className="pointer-events-auto fixed inset-0 z-0 bg-neutral-950/85 backdrop-blur-2xl md:hidden"
          >
            <div className="flex h-full flex-col items-center justify-center gap-7 px-6">
              {LINKS.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: 8, filter: "blur(6px)" }}
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { ...popSpring, delay: 0.06 + i * 0.06 }
                  }
                >
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "font-runde text-3xl font-semibold transition-colors duration-150 ease-out",
                      pathname === link.href ? "text-white" : "text-white/50",
                    )}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: 8, filter: "blur(6px)" }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { ...popSpring, delay: 0.06 + LINKS.length * 0.06 }
                }
                className="mt-3 flex items-center gap-2"
              >
                <NavbarActions stars={stars} variant="default" />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
