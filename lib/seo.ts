import type { Metadata } from "next";
import { type ComponentItem, components } from "@/lib/components";
import {
  SITE_ALT_NAMES,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_REPO,
  SITE_URL,
} from "@/lib/site";

export const SITE_KEYWORDS = [
  "pixelui",
  "pixel ui",
  "pixel ui components",
  "react components",
  "next.js components",
  "shadcn registry",
  "shadcn components",
  "animated ui components",
  "framer motion components",
  "motion react",
  "tailwind css components",
  "free ui components",
  "copy paste components",
  "ui component library",
  "microinteractions",
];

const COMPONENT_INTERACTION_SNIPPETS: Record<string, string> = {
  "/components/audio-chat-room":
    "Click to open, join with live voice badges, and toggle mic controls.",
  "/components/toast":
    "Stack in a corner, fan out on hover, and morph in place.",
  "/components/member-selector":
    "Tap avatars to select, or search and filter members with keyboard navigation.",
  "/components/ascii-jellyfish":
    "Swims away from pointers and ripples on click.",
  "/components/ascii-butterflies":
    "Flits away on pointer proximity and scatters on click.",
  "/components/comic-glitch-text":
    "Watch each word flicker in through comic panels and torn color slices.",
  "/components/swarm-reveal":
    "Cursors fly in, draw selection boxes, and build each element.",
  "/components/theme-toggle":
    "Click the button to switch themes with an expanding circular reveal.",
  "/components/pull-to-refresh":
    "Pull down to watch a masked pixel hero climb in and hold up the page.",
  "/components/tracked-butterfly-ascii":
    "Move to pull the tracking target across a pixel butterfly, and click to send a ring over its wings.",
  "/components/spider-cursor":
    "Scroll to swing the page on a web line, click to throw webs, and drag items by a thread.",
  "/components/otp-input":
    "Type a code into animated slots and watch it verify in place.",
};

export function componentMetaDescription(item: ComponentItem): string {
  const snippet = COMPONENT_INTERACTION_SNIPPETS[item.href];
  if (snippet && item.description) {
    return `${item.description} ${snippet}`;
  }
  if (!item.interaction || !item.description) {
    return item.description ?? "";
  }
  const firstSentence = item.interaction.split(". ")[0]?.trim();
  if (firstSentence) {
    const candidate = `${item.description} ${firstSentence}.`;
    if (candidate.length <= 160) return candidate;
  }
  return item.description;
}

export function componentPageMetadata(href: string): Metadata {
  const item = components.find((c) => c.href === href);
  if (!item) return {};

  const name = item.name.toLowerCase();
  const description = componentMetaDescription(item);
  const title = `${item.name}: Animated React Component`;

  return {
    title,
    description,
    keywords: [
      name,
      `${name} react`,
      `${name} component`,
      `animated ${name}`,
      `${name} shadcn`,
      `${name} interaction`,
      ...SITE_KEYWORDS,
    ],
    alternates: {
      canonical: item.href,
    },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url: item.href,
      siteName: SITE_NAME,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
    },
  };
}

export function componentJsonLd(href: string) {
  const item = components.find((c) => c.href === href);
  if (!item) return null;

  const url = `${SITE_URL}${item.href}`;
  const description = componentMetaDescription(item);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          {
            "@type": "ListItem",
            position: 2,
            name: "Components",
            item: `${SITE_URL}/components`,
          },
          { "@type": "ListItem", position: 3, name: item.name, item: url },
        ],
      },
      {
        "@type": "SoftwareSourceCode",
        name: item.name,
        description,
        url,
        codeRepository: item.source ?? SITE_REPO,
        programmingLanguage: "TypeScript",
        runtimePlatform: "React",
        isPartOf: { "@id": `${SITE_URL}/#website` },
        license: `${SITE_REPO}/blob/main/LICENSE`,
        author: { "@id": `${SITE_URL}/#organization` },
      },
    ],
  };
}

export function siteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        alternateName: SITE_ALT_NAMES,
        url: SITE_URL,
        logo: `${SITE_URL}/logos/Pixelui.svg`,
        sameAs: [SITE_REPO],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: SITE_NAME,
        alternateName: SITE_ALT_NAMES,
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        publisher: { "@id": `${SITE_URL}/#organization` },
        inLanguage: "en",
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${SITE_URL}/#software`,
        name: SITE_NAME,
        alternateName: SITE_ALT_NAMES,
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Web",
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        softwareHelp: `${SITE_URL}/components`,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
    ],
  };
}

export function componentsJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${SITE_NAME} Components`,
    url: `${SITE_URL}/components`,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: components.length,
      itemListElement: components.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        description: componentMetaDescription(item),
        url: `${SITE_URL}${item.href}`,
      })),
    },
  };
}
