"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from "motion/react";
import { BrandLogo } from "@/components/BrandLogo";
import { NavbarActions } from "@/components/NavbarActions";
import { CommandSearchBar } from "@/components/CommandSearchBar";
import { cn } from "@/lib/utils";

const LINKS = [
  { label: "Components", href: "/components" },
  { label: "MCP", href: "/mcp" },
];

const pill = "rounded-full liquid-glass";

const morphSpring = {
  type: "spring",
  stiffness: 380,
  damping: 34,
  mass: 0.8,
} as const;

const softSpring = { type: "spring", stiffness: 420, damping: 30 } as const;

// the open card overhangs the navbar row by this much on the top and sides
const INSET = 12;

export default function GooeyNavbar({ stars }: { stars?: number | null }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuFrame, setMenuFrame] = useState({ top: 0, right: 0, width: 0 });
  const navRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();

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

  // the card grows out of the menu button until it spans the whole navbar row
  const toggleMenu = () => {
    const rect = navRef.current?.getBoundingClientRect();
    if (rect && !menuOpen) {
      setMenuFrame({
        top: rect.top - INSET,
        right: window.innerWidth - rect.right - INSET,
        width: rect.width + INSET * 2,
      });
    }
    setMenuOpen((open) => !open);
  };

  const spring = { type: "spring", stiffness: 300, damping: 30 } as const;
  const animateLayout = !reduceMotion;

  const collapsed = reduceMotion
    ? { opacity: 0 }
    : { width: 48, height: 48, borderRadius: 24, x: -INSET, y: INSET, opacity: 1 };

  const rise: Variants = reduceMotion
    ? { hidden: { opacity: 0 }, show: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 12, filter: "blur(6px)" },
        show: {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: softSpring,
        },
      };

  const stagger: Variants = {
    hidden: { transition: { duration: 0.1 } },
    show: {
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.05,
        delayChildren: reduceMotion ? 0 : 0.12,
      },
    },
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 top-5 md:top-4 z-50 flex justify-center px-5 sm:px-6 md:top-7.5">
      <motion.nav
        ref={navRef}
        layout={animateLayout}
        transition={spring}
        style={{ borderRadius: 9999 }}
        className={cn(
          // the equal side columns keep the search bar centered on the navbar
          "relative z-10 flex w-full max-w-5xl items-center justify-between md:grid md:grid-cols-[1fr_auto_1fr] md:gap-3 md:liquid-glass",
          !scrolled && "md:w-auto",
        )}
      >
        <motion.div
          layout={animateLayout}
          transition={spring}
          className="pointer-events-auto flex items-center"
        >
          <Link
            href="/"
            aria-label="Pixel UI home"
            className="group flex h-12 items-center rounded-full px-1 md:px-4"
          >
            <BrandLogo
              iconClassName="size-7 md:size-5"
              textClassName="hidden md:inline"
            />
          </Link>

          <div className="hidden h-12 items-center md:flex">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-sm transition-all duration-150 ease-out",
                  pathname === link.href
                    ? "bg-black/[0.08] text-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)] dark:bg-white/15 dark:text-white dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)]"
                    : "text-foreground/65 hover:bg-black/[0.04] hover:text-foreground dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white",
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </motion.div>

        <motion.div
          layout={animateLayout}
          transition={spring}
          className={cn(
            "mx-3 min-w-0 flex-1 transition-opacity duration-150 md:mx-0 md:w-60",
            menuOpen && "opacity-0 [&_button]:pointer-events-none",
          )}
        >
          <CommandSearchBar
            className="w-full"
            buttonClassName="border-(--glass-border) bg-(--glass-bg) shadow-(--glass-shadow) backdrop-blur-[24px] backdrop-saturate-[1.9] dark:border-(--glass-border) max-md:[&_kbd]:hidden md:max-w-none md:border-transparent md:bg-black/[0.04] md:shadow-none md:backdrop-blur-none dark:md:border-transparent dark:md:bg-white/[0.06]"
          />
        </motion.div>

        <motion.div
          layout={animateLayout}
          transition={spring}
          className="pointer-events-auto hidden items-center gap-2 justify-self-end md:flex md:pr-1"
        >
          <NavbarActions stars={stars} inNavbar variant="default" />
        </motion.div>

        <motion.button
          layout={animateLayout}
          transition={spring}
          type="button"
          onClick={toggleMenu}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          className={cn(
            menuOpen ? "rounded-full" : pill,
            "pointer-events-auto flex h-12 w-12 items-center justify-center md:hidden transition-colors duration-200 hover:bg-black/[0.04] active:bg-black/[0.08] dark:hover:bg-white/10 dark:active:bg-white/15",
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
                className="h-0.5 w-full bg-foreground"
              />
            ))}
          </span>
        </motion.button>
      </motion.nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.25, delay: 0.05 } }}
            transition={{ duration: reduceMotion ? 0 : 0.3, ease: "easeOut" }}
            onClick={() => setMenuOpen(false)}
            className="pointer-events-auto fixed inset-0 z-0 bg-black/25 backdrop-blur-lg dark:bg-black/55 md:hidden"
          />
        )}
        {menuOpen && (
          <motion.div
            key="menu"
            id="mobile-menu"
            initial={collapsed}
            animate={{
              opacity: 1,
              x: 0,
              y: 0,
              width: menuFrame.width,
              height: "auto",
              borderRadius: 28,
            }}
            exit={{
              ...collapsed,
              opacity: 0,
              transition: reduceMotion
                ? { duration: 0.15 }
                : { ...morphSpring, opacity: { duration: 0.12, delay: 0.16 } },
            }}
            transition={reduceMotion ? { duration: 0.15 } : morphSpring}
            style={{ top: menuFrame.top, right: menuFrame.right }}
            className="pointer-events-auto fixed z-0 overflow-hidden border border-black/[0.08] bg-white shadow-[0_2px_4px_rgba(0,0,0,0.04),0_24px_64px_rgba(0,0,0,0.18)] dark:border-white/10 dark:bg-[#1C1C1E] dark:shadow-[0_2px_4px_rgba(0,0,0,0.35),0_24px_64px_rgba(0,0,0,0.6)] md:hidden"
          >
            <motion.nav
              aria-label="Mobile"
              variants={stagger}
              initial="hidden"
              animate="show"
              exit="hidden"
              // fixed width so text doesn't reflow while the card widens
              style={{ width: menuFrame.width }}
              className="flex flex-col px-4 pb-4 pt-[76px]"
            >
              {LINKS.map((link) => (
                <motion.div key={link.href} variants={rise}>
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "block py-1 text-[28px] font-semibold tracking-[-0.02em] transition-colors duration-150 ease-out",
                      pathname === link.href
                        ? "text-foreground"
                        : "text-foreground/45 hover:text-foreground",
                    )}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}

              <motion.div
                variants={rise}
                className="mt-4 border-t border-black/[0.06] pt-4 dark:border-white/[0.08]"
              >
                <NavbarActions stars={stars} variant="default" />
              </motion.div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
