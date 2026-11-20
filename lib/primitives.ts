import type { ComponentItem, ComponentProp } from "@/lib/components";
import { SITE_REPO } from "@/lib/site";

const source = (slug: string) => `${SITE_REPO}/blob/main/components/ui/${slug}.tsx`;

const feedbackProp = (events: string): ComponentProp => ({
  name: "onFeedback",
  type: `(event: ${events}) => void`,
  description: "Called at each semantic moment, for wiring sound or haptics.",
});

const classNameProp: ComponentProp = {
  name: "className",
  type: "string",
  description: "Merged onto the root element.",
};

const primitive = (
  slug: string,
  item: Omit<ComponentItem, "href" | "registry" | "source" | "released"> & { released?: string },
): ComponentItem => ({
  href: `/primitives/${slug}`,
  registry: slug,
  source: source(slug),
  released: "2026-11-21",
  ...item,
});

export const primitives: ComponentItem[] = [
  primitive("button", {
    name: "Button",
    category: "buttons",
    description: "A soft squircle button in four variants and four sizes.",
    interaction:
      "Press and the button gives a little under your finger. While loading, a spinner blurs in over the label and the button keeps focus. Honors prefers-reduced-motion: the press holds still.",
    props: [
      {
        name: "variant",
        type: '"primary" | "secondary" | "ghost" | "destructive"',
        default: '"primary"',
        options: ["primary", "secondary", "ghost", "destructive"],
        description: "The look. Primary uses the brand blue.",
      },
      {
        name: "size",
        type: '"sm" | "md" | "lg" | "icon"',
        default: '"md"',
        options: ["sm", "md", "lg", "icon"],
        description: "Height and padding. Icon is a square for a single icon.",
      },
      {
        name: "loading",
        type: "boolean",
        default: "false",
        description: "Swaps the label for a spinner and ignores clicks, without dropping focus.",
      },
      feedbackProp('"press"'),
      classNameProp,
    ],
    usage: `import { Button } from "@/components/ui/button"

export function Demo() {
  return <Button onClick={() => console.log("saved")}>Save changes</Button>
}`,
  }),
];
