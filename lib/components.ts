import { createElement, type ReactNode } from "react";
import { MotionIcon } from "@/components/Description/icons";

export type Dependency = {
  name: string;
  icon?: ReactNode;
};

export type ComponentProp = {
  name: string;
  type: string;
  default?: string;
  required?: boolean;
  options?: string[];
  control?: "swatch";
  optionColors?: Record<string, string>;
  description: string;
};

export type ComponentCategory =
  | "ai"
  | "navigation"
  | "inputs"
  | "feedback"
  | "display";

export const CATEGORY_LABELS: Record<ComponentCategory, string> = {
  ai: "AI kit",
  navigation: "Navigation",
  inputs: "Inputs",
  feedback: "Feedback",
  display: "Display",
};

export const CATEGORY_ORDER: ComponentCategory[] = [
  "display",
  "ai",
  "navigation",
  "inputs",
  "feedback",
];

export type ComponentItem = {
  name: string;
  href: string;
  category: ComponentCategory;
  isNew?: boolean;
  description?: string;
  registry?: string;
  source?: string;
  preview?: string;
  previewScale?: number;
  featured?: boolean;
  dependencies?: Dependency[];
  interaction?: string;
  usage?: string;
  props?: ComponentProp[];
  credits?: string[];
};

export const REGISTRY_HOMEPAGE = "https://github.com/ikislay/pixel-ui";
export const REGISTRY_REPO = "ikislay/pixel-ui";

export const PANEL_INFO = {
  sourceHint:
    "Click the code icon in the top-right corner to view the source code.",
  keepInMind:
    "Most components here are recreations of great work from around the web. I don't claim to be the original creator - this is my attempt to reverse-engineer, replicate, and often add a few extra features. I've tried to credit everyone; if I missed someone, let me know.",
  contactEmail: "hello@pixelui.dev",
  contactNote: "Found a bug or issue? Feel free to drop a DM.",
  license: [
    "MIT with the Commons Clause and an attribution requirement. Free to use, modify and ship in personal and commercial projects, closed source included. You own the code once it is in your project.",
    "Credit is required. Any project shipping a Pixel UI component must credit Pixel UI with a visible link back to pixelui.dev, in a footer, an about page, a credits screen or a README.",
    "Don't strip the credit or the copyright notice from the source you copied.",
    "Don't sell, sublicense or redistribute the components themselves, on their own, bundled into a template, kit, theme or paid course, or ported to another framework.",
    "Don't republish them. No mirrors, no re-uploads, no listing them as your own work.",
    "Don't repackage the registry as a competing component library.",
    "Don't claim authorship of a component or of Pixel UI itself.",
    "The LICENSE file in the repository is the full text and governs. Ask first if your use doesn't fit these rules.",
  ],
} as const;

export const components: ComponentItem[] = [
  {
    name: "Audio Chat Room",
    href: "/components/audio-chat-room",
    category: "display",
    isNew: true,
    registry: "audio-chat-room",
    description:
      "A voice chat pill that morphs into a card showing everyone in the room.",
    source: `${REGISTRY_HOMEPAGE}/blob/main/components/ui/audio-chat-room.tsx`,
    interaction:
      "Click the pill to open the room. The avatars glide out into a grid, the names fade in and anyone speaking gets a live level badge. Press Join now and your avatar pops into the grid, while the button turns into a mic toggle and a Leave button. Unmute to show your own level badge. Close it with the X button or Escape. Honors prefers-reduced-motion: the layout snaps and content cross-fades, and the level bars stop moving.",
    props: [
      {
        name: "participants",
        type: "{ id: string; name: string; avatar?: string; speaking?: boolean }[]",
        required: true,
        description:
          "Who is in the room. The pill stacks the first 4 avatars and counts the rest. Without an avatar, initials show instead.",
      },
      {
        name: "title",
        type: "string",
        default: '"Voice chat"',
        description: "The heading of the open card.",
      },
      {
        name: "joinLabel",
        type: "string",
        default: '"Join now"',
        description: "Text of the join button.",
      },
      {
        name: "helperText",
        type: "string",
        default: '"Mic will be muted initially."',
        description: "Muted line under the join button, before you join.",
      },
      {
        name: "you",
        type: "{ id: string; name: string; avatar?: string }",
        default: '{ id: "you", name: "You" }',
        description: "The avatar added to the grid when you join.",
      },
      {
        name: "defaultMuted",
        type: "boolean",
        default: "true",
        description: "Whether your mic starts muted on join. Leaving resets it.",
      },
      {
        name: "mutedText",
        type: "string",
        default: '"You\'re in. Your mic is muted."',
        description: "The line under the controls while you are muted.",
      },
      {
        name: "liveText",
        type: "string",
        default: '"You\'re live. Everyone can hear you."',
        description: "The line under the controls while your mic is on.",
      },
      {
        name: "onJoin",
        type: "() => void",
        description: "Runs when the join button is pressed.",
      },
      {
        name: "onLeave",
        type: "() => void",
        description: "Runs when the Leave button is pressed.",
      },
      {
        name: "onMutedChange",
        type: "(muted: boolean) => void",
        description: "Runs when the mic toggle is pressed.",
      },
      {
        name: "expanded",
        type: "boolean",
        description: "Controls the open state. Pair it with onExpandedChange.",
      },
      {
        name: "defaultExpanded",
        type: "boolean",
        default: "false",
        description: "Starts the room open when the state is not controlled.",
      },
      {
        name: "onExpandedChange",
        type: "(expanded: boolean) => void",
        description: "Runs when the room opens or closes.",
      },
    ],
    usage: `import { AudioChatRoom } from "@/components/ui/audio-chat-room"

const people = [
  { id: "1", name: "Ana", avatar: "/ana.jpg", speaking: true },
  { id: "2", name: "Sam" },
]

export function Demo() {
  return <AudioChatRoom
      participants={people}
      onJoin={() => {}}
      onLeave={() => {}}
      onMutedChange={(muted) => {}}
    />
}`,
    credits: ["Inspired by morphin.dev"],
  },
  {
    name: "Toast",
    href: "/components/toast",
    category: "feedback",
    isNew: true,
    registry: "toast",
    description:
      "A toast notification whose status lands with a rippling pulse and whose text morphs word by word.",
    source: `${REGISTRY_HOMEPAGE}/blob/main/components/ui/toast.tsx`,
    preview: "/componentdemos/toast.mp4",
    dependencies: [
      {
        name: "motion",
        icon: createElement(MotionIcon, { className: "h-4 w-4" }),
      },
      { name: "lucide-react" },
    ],
    interaction:
      "Toasts stack in a corner and fan out when you hover them. When a toast lands on success, error, warning or info, its badge pops and a ripple washes across the card and its text. Updating a toast in place morphs its words into the new message. Hover it to show the close button. Honors prefers-reduced-motion.",
    props: [
      {
        name: "toast(title, options)",
        type: "(title: ReactNode, options?: ToastOptions) => string | number",
        description:
          "Shows a plain toast and returns its id. toast.success, toast.error, toast.warning, toast.info and toast.loading take the same arguments and add a status badge.",
      },
      {
        name: "toast.promise",
        type: "(task: Promise<T> | (() => Promise<T>), messages, options?) => Promise<T>",
        description:
          "Shows messages.loading until the task settles, then swaps to messages.success or messages.error in the same toast. Either can be a function of the result.",
      },
      {
        name: "description",
        type: "ReactNode",
        description:
          "Muted text under the title. A line break in a string starts a new line.",
      },
      {
        name: "icon",
        type: "ReactNode",
        description:
          "Fills the round tile the status badge sits on. Defaults to a bell.",
      },
      {
        name: "action",
        type: "{ label: string; onClick: () => void }",
        description:
          "A button on the right. Clicking it runs onClick and closes the toast.",
      },
      {
        name: "duration",
        type: "number",
        default: "5000",
        description:
          "Milliseconds before the toast closes. Loading toasts stay until updated or dismissed.",
      },
      {
        name: "id",
        type: "string | number",
        description:
          "Reuse an id to update a toast that is already showing instead of adding a new one. String text morphs into the new message.",
      },
      {
        name: "dismissible",
        type: "boolean",
        default: "true",
        description: "Shows the close button on hover.",
      },
      {
        name: "position",
        type: '"top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right"',
        default: '"bottom-right"',
        description:
          "On Toaster, where the stack sits. Up to 3 toasts show at once. Dark mode follows your .dark class.",
      },
      {
        name: "gap",
        type: "number",
        default: "12",
        description: "On Toaster, the space in pixels between expanded toasts.",
      },
    ],
    usage: `"use client"

import { Toaster, toast } from "@/components/ui/toast"

const save = () => fetch("/api/save", { method: "POST" })

// mount Toaster once, in your root layout
export function Demo() {
  return (
    <>
      <button
        onClick={() =>
          toast.promise(save(), {
            loading: "Saving",
            success: "Saved",
            error: "Couldn't save",
          })
        }
      >
        Save
      </button>
      <Toaster />
    </>
  )
}`,
    credits: ["Ripple inspired by morphin.dev"],
  },
  {
    name: "Member Selector",
    href: "/components/member-selector",
    category: "inputs",
    isNew: true,
    registry: "member-selector",
    description:
      "An avatar row for picking people, with a searchable dropdown to add more.",
    source: `${REGISTRY_HOMEPAGE}/blob/main/components/ui/member-selector.tsx`,
    interaction:
      "Tap an avatar to select or deselect it; selected people glide to the front and unselected ones fade to grayscale with a small plus badge. Tap Add and the circle morphs into a card with a search field; type to filter by name or email, use the arrow keys and Enter, or click anyone to toggle them. A hairline scrollbar shows only while you scroll. When the row is full, avatars pushed out shrink away as new ones pop in. Press Escape, the esc key in the field, or click outside to fold the card back. Honors prefers-reduced-motion.",
    props: [
      {
        name: "members",
        type: "Member[]",
        required: true,
        description:
          "Everyone who can be picked. Each member has an id and name, plus an optional email and avatar url; without an avatar, initials show instead.",
      },
      {
        name: "selected",
        type: "string[]",
        required: true,
        description: "Ids of the selected members.",
      },
      {
        name: "onChange",
        type: "(selected: string[]) => void",
        required: true,
        description: "Called with the new list of ids when someone is toggled.",
      },
      {
        name: "max",
        type: "number",
        description:
          "Most members that can be selected. Extra picks are ignored. Unlimited by default.",
      },
      {
        name: "maxVisible",
        type: "number",
        default: "5",
        description:
          "How many avatars show in the row. Selected members fill it first.",
      },
      {
        name: "label",
        type: "string",
        description: "Small uppercase heading above the row.",
      },
    ],
    usage: `"use client"

import { useState } from "react"
import { MemberSelector, type Member } from "@/components/ui/member-selector"

const members: Member[] = [
  {
    id: "1",
    name: "Yuki Tanaka",
    email: "yuki@company.com",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&h=160&fit=crop&crop=faces",
  },
  {
    id: "2",
    name: "Matt Cooper",
    email: "matt@company.com",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&h=160&fit=crop&crop=faces",
  },
  {
    id: "3",
    name: "Sofia Martinez",
    email: "sofia@company.com",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop&crop=faces",
  },
]

export function Demo() {
  const [selected, setSelected] = useState(["1"])

  return (
    <MemberSelector
      members={members}
      selected={selected}
      onChange={setSelected}
      label="Participants"
    />
  )
}`,
  },
  {
    name: "Ascii Jellyfish",
    href: "/components/ascii-jellyfish",
    category: "display",
    isNew: true,
    registry: "ascii-jellyfish",
    description:
      "Translucent jellyfish drawn as ASCII glyphs, pulsing through the water with trailing tentacles.",
    source: `${REGISTRY_HOMEPAGE}/blob/main/components/ui/ascii-jellyfish.tsx`,
    interaction:
      "Jellyfish squeeze their see-through bells, glide, and drift while their tentacles sway behind. Light ripples through each bell and every pulse pushes the plankton aside. Move the pointer near one and it swims away. Click to send a ripple and startle the ones close by. Honors prefers-reduced-motion.",
    props: [
      {
        name: "variant",
        type: '"color" | "mono"',
        default: '"color"',
        options: ["color", "mono"],
        description:
          "Color tints them in pale and deep blues. Mono uses greys only. Both follow your light or dark theme.",
      },
      {
        name: "count",
        type: 'number',
        default: '4',
        description:
          "How many to put in the water.",
      },
    ],
    usage: `import { AsciiJellyfish } from "@/components/ui/ascii-jellyfish"

export function Demo() {
  return <AsciiJellyfish variant="color" className="h-96 w-full rounded-2xl" />
}`,
    credits: ["Inspired by stackedlol/ascii-sharks"],
  },
  {
    name: "Ascii Butterflies",
    href: "/components/ascii-butterflies",
    category: "display",
    isNew: true,
    registry: "ascii-butterflies",
    description:
      "A few butterflies drawn as ASCII glyphs, flapping on wandering paths and landing now and then.",
    source: `${REGISTRY_HOMEPAGE}/blob/main/components/ui/ascii-butterflies.tsx`,
    interaction:
      "Butterflies fly sideways on wandering paths, beating their wings up and down and turning to face where they go. Now and then one lands and slowly opens and closes its wings. Move the pointer near one and it flits away. Click to scatter the ones close by. Honors prefers-reduced-motion.",
    props: [
      {
        name: "variant",
        type: '"color" | "mono"',
        default: '"color"',
        options: ["color", "mono"],
        description:
          "Color mixes blue, teal, pink, yellow and orange wings. Mono uses greys only. Both follow your light or dark theme.",
      },
      {
        name: "count",
        type: 'number',
        default: '3',
        description:
          "How many to release. Keep it small so the sky stays calm.",
      },
    ],
    usage: `import { AsciiButterflies } from "@/components/ui/ascii-butterflies"

export function Demo() {
  return <AsciiButterflies variant="color" className="h-96 w-full rounded-2xl" />
}`,
    credits: ["Inspired by stackedlol/ascii-sharks"],
  },
];

export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

const PM_EXECUTORS: Record<PackageManager, string> = {
  npm: "npx",
  pnpm: "pnpm dlx",
  yarn: "yarn dlx",
  bun: "bunx --bun",
};

export const PACKAGE_MANAGERS = Object.keys(PM_EXECUTORS) as PackageManager[];

export function installCommand(
  item: ComponentItem,
  pm: PackageManager = "npm",
): string | null {
  if (!item.registry) return null;
  // @latest matters: npx otherwise picks a stale local shadcn, and github registries need 4.16+
  return `${PM_EXECUTORS[pm]} shadcn@latest add ${REGISTRY_REPO}/${item.registry}`;
}

export type ComponentSection = {
  id: string;
  label: string;
  items: ComponentItem[];
};

// gallery sections: New repeats its members so they still appear under their own category
export const gallerySections: ComponentSection[] = [
  {
    id: "new",
    label: "New releases",
    items: components
      .filter((c) => c.isNew)
      .reverse()
      .sort(
        (a, b) =>
          Number(b.href === "/components/toast") -
          Number(a.href === "/components/toast"),
      ),
  },
  ...CATEGORY_ORDER.map((id) => ({
    id,
    label: CATEGORY_LABELS[id],
    items: components.filter((c) => c.category === id),
  })),
].filter((section) => section.items.length > 0);

export function activeComponent(pathname: string): ComponentItem | undefined {
  return components.find((c) => c.href === pathname);
}

export function registryComponent(name: string): ComponentItem | undefined {
  return components.find((c) => c.registry === name);
}

export function swatchProp(item?: ComponentItem): ComponentProp | undefined {
  return item?.props?.find((p) => p.control === "swatch" && p.optionColors);
}

export function cleanDefault(prop?: ComponentProp): string | undefined {
  return prop?.default?.replace(/^["']|["']$/g, "");
}
