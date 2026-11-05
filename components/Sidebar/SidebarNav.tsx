"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  components,
  type ComponentCategory,
  type ComponentItem,
} from "@/lib/components";
import { cn } from "@/lib/utils";
import { SCROLL_FADE, SCROLL_SELECTOR } from "./SidebarScroll";

// bucketing keeps a category that is missing from CATEGORY_ORDER in the nav
const buckets = new Map<ComponentCategory, ComponentItem[]>();
for (const component of components) {
  const bucket = buckets.get(component.category);
  if (bucket) bucket.push(component);
  else buckets.set(component.category, [component]);
}

const rank = (category: ComponentCategory) => {
  const index = CATEGORY_ORDER.indexOf(category);
  return index === -1 ? CATEGORY_ORDER.length : index;
};

const groups = [...buckets.entries()]
  .sort(([a], [b]) => rank(a) - rank(b))
  .map(([category, items]) => ({
    category,
    label: CATEGORY_LABELS[category],
    items,
  }));

const SidebarGroup = ({
  label,
  items,
  activeHref,
  onNavigate,
}: {
  label: string;
  items: ComponentItem[];
  activeHref: string;
  onNavigate?: () => void;
}) => {
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const activeIndex = items.findIndex((item) => item.href === activeHref);

  // reveals the active row when landing straight on a page whose entry sits off-screen
  useEffect(() => {
    const item = itemRefs.current[activeIndex];
    const scroller = item?.closest<HTMLElement>(SCROLL_SELECTOR);
    if (!item || !scroller) return;

    const itemBox = item.getBoundingClientRect();
    const scrollBox = scroller.getBoundingClientRect();
    const above = itemBox.top - (scrollBox.top + SCROLL_FADE);
    const below = itemBox.bottom - (scrollBox.bottom - SCROLL_FADE);

    if (above < 0) scroller.scrollTop += above;
    else if (below > 0) scroller.scrollTop += below;
  }, [activeIndex]);

  return (
    <div className="flex flex-col">
      <span className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/40 select-none">
        {label}
      </span>

      <div className="flex flex-col gap-1">
        {items.map((item, index) => {
          const isActive = item.href === activeHref;

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              onClick={onNavigate}
              data-active={isActive}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group flex items-center rounded-xl px-3.5 py-2 text-[13.5px] font-medium transition-all duration-150 outline-none select-none",
                isActive
                  ? "border border-foreground/10 bg-foreground/[0.07] text-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_1px_2px_rgba(0,0,0,0.06)] dark:border-white/12 dark:bg-gradient-to-b dark:from-white/[0.12] dark:to-white/[0.05] dark:text-white dark:hover:from-white/[0.14] dark:hover:to-white/[0.07] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.16),0_1px_2px_rgba(0,0,0,0.15)]"
                  : "border border-transparent text-foreground/50 hover:border-foreground/[0.06] hover:bg-foreground/[0.04] hover:text-foreground active:scale-[0.985] dark:text-zinc-400 dark:hover:border-white/[0.08] dark:hover:bg-white/[0.06] dark:hover:text-zinc-100 motion-reduce:transform-none",
                "focus-visible:ring-1 focus-visible:ring-brand/60",
              )}
            >
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

const SidebarNav = ({
  onNavigate,
  className,
}: {
  onNavigate?: () => void;
  className?: string;
}) => {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Components"
      data-slot="sidebar-nav"
      className={cn("flex flex-col gap-6 p-0.5", className)}
    >
      {groups.map((group) => (
        <SidebarGroup
          key={group.category}
          label={group.label}
          items={group.items}
          activeHref={pathname}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
};

export default SidebarNav;
