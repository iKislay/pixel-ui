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
  | "display"
  | "text";

export const CATEGORY_LABELS: Record<ComponentCategory, string> = {
  ai: "AI kit",
  navigation: "Navigation",
  inputs: "Inputs",
  feedback: "Feedback",
  display: "Display",
  text: "Text",
};

export const CATEGORY_ORDER: ComponentCategory[] = [
  "display",
  "text",
  "ai",
  "navigation",
  "inputs",
  "feedback",
];

export type ComponentItem = {
  name: string;
  href: string;
  released: string;
  category: ComponentCategory;
  description?: string;
  registry?: string;
  source?: string;
  featured?: boolean;
  dependencies?: Dependency[];
  interaction?: string;
  usage?: string;
  props?: ComponentProp[];
  credits?: string[];
};

export const REGISTRY_HOMEPAGE = "https://github.com/ikislay/pixel-ui";
export const REGISTRY_REPO = "ikislay/pixel-ui";


export const components: ComponentItem[] = [
  {
    name: "Theme Toggle",
    href: "/components/theme-toggle",
    released: "2026-11-05",
    category: "inputs",
    registry: "theme-toggle",
    description:
      "A toggle button that flips between light and dark mode with an expanding circular reveal.",
    source: `${REGISTRY_HOMEPAGE}/blob/main/components/ui/theme-toggle.tsx`,
    dependencies: [
      { name: "next-themes" },
      { name: "lucide-react" },
    ],
    interaction:
      "Click the button to switch themes. A soft tick plays, the sun and moon icons rotate into place, and the new theme radiates outward across the screen. Honors prefers-reduced-motion: the theme switches instantly without the expanding circle.",
    usage: `import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function Demo() {
  return <ThemeToggle />;
}`,
    props: [
      {
        name: "className",
        type: "string",
        description: "Classes applied to the root button element.",
      },
      {
        name: "sound",
        type: "boolean",
        default: "true",
        description: "Plays a soft tick on click. Set to false to keep it silent.",
      },
    ],
  },
  {
    name: "OTP Input",
    href: "/components/otp-input",
    released: "2026-11-06",
    category: "inputs",
    registry: "otp-input",
    description:
      "A one-time code input that grows out of a button and settles into a verified badge.",
    source: `${REGISTRY_HOMEPAGE}/blob/main/components/ui/otp-input.tsx`,
    dependencies: [
      {
        name: "motion",
        icon: createElement(MotionIcon, { className: "h-4 w-4" }),
      },
      { name: "lucide-react" },
      { name: "react-use-measure" },
    ],
    interaction:
      "Click Enter code and the pill stretches into a row of slots. Type or paste your code: each digit rises into place and the outline follows the next empty slot. The full code collapses into a Verifying pill. A wrong code turns the slots red, shakes, and drops the digits so you can retry. A right one turns the pill green with a quick shine. Honors prefers-reduced-motion: states swap instantly without blur, shake or shine.",
    usage: `import { OtpInput } from "@/components/ui/otp-input";

export default function Demo() {
  return (
    <OtpInput
      onVerify={async (code) => {
        const res = await fetch("/api/verify", {
          method: "POST",
          body: JSON.stringify({ code }),
        });
        return res.ok;
      }}
    />
  );
}`,
    props: [
      {
        name: "onVerify",
        type: "(code: string) => boolean | Promise<boolean>",
        description:
          "Runs once every slot is filled. Return true to show Verified, or false to reject the code. A thrown error counts as false. Without it, every code passes.",
      },
      {
        name: "length",
        type: "number",
        default: "6",
        description: "How many digits the code has.",
      },
      {
        name: "label",
        type: "string",
        default: '"Enter code"',
        description: "Text of the button shown before the slots open.",
      },
      {
        name: "className",
        type: "string",
        description: "Classes applied to the root element.",
      },
    ],
  },
  {
    name: "Audio Chat Room",
    href: "/components/audio-chat-room",
    released: "2026-11-05",
    category: "display",
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
  },
  {
    name: "Comic Glitch Text",
    href: "/components/comic-glitch-text",
    released: "2026-11-13",
    category: "text",
    registry: "comic-glitch-text",
    description:
      "A paragraph that glitches in word by word through comic panels, torn color slices and print misregistration.",
    source: `${REGISTRY_HOMEPAGE}/blob/main/components/ui/comic-glitch-text.tsx`,
    interaction:
      "Words appear one after another. Each one flickers through a few frames first: stamped on a tilted comic panel with halftone dots, torn into offset color strips, or doubled in pink and cyan. It lands bold, then settles into plain text. Once the paragraph is in, a random word glitches again now and then. After about 4 seconds the words drop out in random order and the reveal starts over. Honors prefers-reduced-motion: words fade in one by one with no glitch frames, and the reveal plays once.",
    props: [
      {
        name: "children",
        type: "string",
        required: true,
        description: "The text to reveal. It wraps like a normal paragraph.",
      },
      {
        name: "stagger",
        type: "number",
        default: "3",
        description: "Frames between one word and the next, at 24 frames a second.",
      },
      {
        name: "loop",
        type: "boolean",
        default: "true",
        options: ["true", "false"],
        description: "Scrambles the text out and plays the reveal again. Off, the text stays after the first reveal.",
      },
    ],
    usage: `import { ComicGlitchText } from "@/components/ui/comic-glitch-text"

export function Demo() {
  return (
    <ComicGlitchText className="max-w-md text-lg">
      With great power there must also come great responsibility.
    </ComicGlitchText>
  )
}`,
  },
  {
    name: "Tracked Butterfly Ascii",
    href: "/components/tracked-butterfly-ascii",
    released: "2026-11-13",
    category: "display",
    registry: "tracked-butterfly-ascii",
    description:
      "A butterfly drawn in WebGL as a fine grid of glowing cells, under a motion tracking overlay that marks points on its wings.",
    source: `${REGISTRY_HOMEPAGE}/blob/main/components/ui/tracked-butterfly-ascii.tsx`,
    interaction:
      "The butterfly hovers and slowly beats its wings. Its left wings are a sparse teal scan with cells that spark on and off; its right wings are solid, shading from blue to pink with a pale sheen drifting across. Twenty five markers ride the wings, some with live coordinates, and thin lines tie them to a lock box on the body. Move the pointer in and the box becomes a target that follows it: the lines swing over, nearby cells light up, and the butterfly leans toward it. Click and a bright ring spreads across the wings from that spot while the wings beat faster for a moment. Left alone, a ring pulses out from the lock every 3 seconds. Honors prefers-reduced-motion: the butterfly holds still with its wings open, nothing sparks or pulses, and the target and the glow under it still follow the pointer.",
    props: [
      {
        name: "className",
        type: "string",
        description: "Classes applied to the root. Give it a height; the butterfly scales to fit.",
      },
    ],
    usage: `import { TrackedButterflyAscii } from "@/components/ui/tracked-butterfly-ascii"

export function Demo() {
  return <TrackedButterflyAscii className="h-96 w-full rounded-2xl" />
}`,
    credits: ["Inspired by navedux on Threads"],
  },
  {
    name: "Gallery Corridor",
    href: "/components/gallery-corridor",
    released: "2026-11-13",
    category: "display",
    registry: "gallery-corridor",
    description:
      "A portfolio hero that walks you down a bending wireframe corridor hung with glowing pieces of work.",
    source: `${REGISTRY_HOMEPAGE}/blob/main/components/ui/gallery-corridor.tsx`,
    dependencies: [
      { name: "three" },
      {
        name: "motion",
        icon: createElement(MotionIcon, { className: "h-4 w-4" }),
      },
    ],
    interaction:
      "On load the grid races down the corridor and each piece flickers on as the light reaches it. Scroll, drag or use the arrow keys to walk from one piece to the next; the view banks into the bends, leans toward the piece beside you and settles on the nearest one when you stop. Each piece tints the grid around it in its own colour, and the title, number and details change as you pass. Hover a piece to light its frame, click it or press Enter and it peels off the wall to face you while the corridor dims; click anywhere, press Escape or use Close to put it back, and the arrow keys flip between pieces while one is open. The index on the right jumps straight to any piece. Honors prefers-reduced-motion: the view never travels; it cross-fades from one stop to the next, one piece per swipe or key press, pieces open with a cross-fade instead of a peel, and the artwork holds still.",
    props: [
      {
        name: "items",
        type: "{ title: string; meta: string; color: string }[]",
        default: "10 sample pieces",
        description:
          "The pieces, in walking order. color tints the artwork, its frame and the grid around it; the first 24 light the grid.",
      },
      {
        name: "className",
        type: "string",
        description: "Classes applied to the root. Give it a height; the corridor fills it.",
      },
    ],
    usage: `import { GalleryCorridor } from "@/components/ui/gallery-corridor"

export function Demo() {
  return <GalleryCorridor className="h-[640px] w-full" />
}`,
  },
  {
    name: "Spider Cursor",
    href: "/components/spider-cursor",
    released: "2026-11-10",
    category: "display",
    registry: "spider-cursor",
    description:
      "A scroll container whose cursor is a red spider mask that swings the page on a web line, webs up what you click, and hauls draggable items around on a thread.",
    source: `${REGISTRY_HOMEPAGE}/blob/main/components/ui/spider-cursor.tsx`,
    dependencies: [
      {
        name: "motion",
        icon: createElement(MotionIcon, { className: "h-4 w-4" }),
      },
    ],
    interaction:
      "Move the mouse inside and the pointer becomes the mask. Scroll and it shoots a web onto a spot further down the page, stretches, and pulls the page until that spot reaches it; scroll faster for a longer web, and keep scrolling to chain the next one. Click and the mask squishes while a web spins out from the spot, cycling between a net, a splat, and a loose spray. Click a button or link and one wide web lands over all of it. Hover text and the mask turns into a thin red line; press there to select text in a light red highlight, and no web is thrown. Hover a button or link and it shrinks to a small red dot. Press a draggable item and the mask grabs it with a web: the item trails behind, tilts as it swings, and reels in until it hangs just below the mask. Let go and it flies into the spot it lands in, or back home. Webs fade after 1.6 seconds, button covers after 2.6. Honors prefers-reduced-motion: scrolling stays native, webs appear fully drawn, and dragged items follow without lag.",
    usage: `import { SpiderCursor } from "@/components/ui/spider-cursor";

export default function Demo() {
  return (
    <SpiderCursor
      className="h-96"
      onWebDrop={(item, zone) => console.log(item.dataset.webDrag, zone?.dataset.webDrop)}
    >
      <div data-web-drop="inbox">
        <div data-web-drag="card-1">Drag me</div>
      </div>
      <div data-web-drop="done" />
    </SpiderCursor>
  );
}`,
    props: [
      {
        name: "onWebDrop",
        type: "(item: HTMLElement, zone: HTMLElement | null) => void",
        description:
          "Runs when a dragged item is released. Mark draggable items with data-web-drag set to a unique id and drop zones with data-web-drop. The zone is null when the item lands outside one.",
      },
      {
        name: "className",
        type: "string",
        description: "Classes applied to the root. Give it a height; the content scrolls inside it.",
      },
    ],
  },
  {
    name: "Pull to Refresh",
    href: "/components/pull-to-refresh",
    released: "2026-11-09",
    category: "feedback",
    registry: "pull-to-refresh",
    description:
      "A pull-to-refresh container with a masked pixel hero who climbs into the gap and holds up the page.",
    source: `${REGISTRY_HOMEPAGE}/blob/main/components/ui/pull-to-refresh.tsx`,
    dependencies: [
      {
        name: "motion",
        icon: createElement(MotionIcon, { className: "h-4 w-4" }),
      },
    ],
    interaction:
      "Drag the content down from the top, or scroll up while it is already at the top. A masked pixel hero's hands appear on the edge, then he leaps up and grabs the ceiling, hangs for a moment, and drops onto the page. Let go, or pause your scroll, and the page rises: he pushes back against the ceiling while it refreshes, then gets squashed flat as the gap closes. Let go before he jumps and the page just springs back. Honors prefers-reduced-motion: poses swap instantly without the shake or dust.",
    usage: `import { PullToRefresh } from "@/components/ui/pull-to-refresh";

export default function Demo() {
  return (
    <PullToRefresh className="h-96" onRefresh={() => fetch("/api/feed")}>
      {/* your scrollable content */}
    </PullToRefresh>
  );
}`,
    props: [
      {
        name: "onRefresh",
        type: "() => void | Promise<void>",
        description:
          "Runs when you let go after the hero jumps. The page stays open until it settles, for at least 1.1 seconds.",
      },
      {
        name: "className",
        type: "string",
        description: "Classes applied to the root. Give it a height; the content scrolls inside it.",
      },
    ],
  },
  {
    name: "Toast",
    href: "/components/toast",
    released: "2026-11-05",
    category: "feedback",
    registry: "toast",
    description:
      "A toast notification whose status lands with a rippling pulse and whose text morphs word by word.",
    source: `${REGISTRY_HOMEPAGE}/blob/main/components/ui/toast.tsx`,
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
  },
  {
    name: "Member Selector",
    href: "/components/member-selector",
    released: "2026-11-05",
    category: "inputs",
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
    released: "2026-11-05",
    category: "display",
    registry: "ascii-jellyfish",
    description:
      "Translucent jellyfish drawn as ASCII glyphs, pulsing through the water with trailing tentacles.",
    source: `${REGISTRY_HOMEPAGE}/blob/main/components/ui/ascii-jellyfish.tsx`,
    interaction:
      "Jellyfish squeeze their glowing bells, glide, and drift while their tentacles sway behind. Light shimmers across each bell and every pulse pushes the plankton aside. They wander anywhere inside their container but never leave it. Move the pointer near one and it swims away. Click to send a ripple and startle the ones close by. Honors prefers-reduced-motion.",
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
          "How many jellyfish swim at once.",
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
    released: "2026-11-05",
    category: "display",
    registry: "ascii-butterflies",
    description:
      "A few butterflies drawn as ASCII glyphs, flapping on wandering paths and landing now and then.",
    source: `${REGISTRY_HOMEPAGE}/blob/main/components/ui/ascii-butterflies.tsx`,
    interaction:
      "Butterflies drift slowly from one side of their container to the other, beating their wings up and down and turning to face where they go. They never leave the container. Now and then one lands and slowly opens and closes its wings. Move the pointer near one and it flits away. Click to scatter the ones close by. Honors prefers-reduced-motion.",
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
          "How many butterflies fly at once. Keep it small so the scene stays calm.",
      },
    ],
    usage: `import { AsciiButterflies } from "@/components/ui/ascii-butterflies"

export function Demo() {
  return <AsciiButterflies variant="color" className="h-96 w-full rounded-2xl" />
}`,
    credits: ["Inspired by stackedlol/ascii-sharks"],
  },
  {
    name: "Swarm Reveal",
    href: "/components/swarm-reveal",
    released: "2026-11-07",
    category: "display",
    registry: "swarm-reveal",
    description:
      "A wrapper that has a swarm of cursors build your page in front of the visitor when it loads.",
    source: `${REGISTRY_HOMEPAGE}/blob/main/components/ui/swarm-reveal.tsx`,
    interaction:
      "Colored cursors stream in from every side while the screen turns into a design canvas. Each cursor claims an element, drags a selection box over it, and builds it: text types in line by line, images paint over a grey placeholder, and cards are carried in from the edge. Once the screen is built the cursors fly away. Scroll to a part that is not built yet and they come back to build it. Honors prefers-reduced-motion.",
    props: [
      {
        name: "cursors",
        type: "number",
        default: "24",
        description:
          "How many cursors build the page at once.",
      },
      {
        name: "variant",
        type: '"color" | "mono"',
        default: '"color"',
        options: ["color", "mono"],
        description:
          "Color gives every cursor its own bright hue. Mono uses greys only.",
      },
      {
        name: "status",
        type: "boolean",
        default: "true",
        description:
          "Shows a pill at the bottom with how many cursors are building and how far along the page is.",
      },
      {
        name: "data-swarm",
        type: '"" | "text" | "image" | "carry"',
        description:
          "Put it on any child to have a cursor build it. Leave it empty to pop the element in; images, videos and svgs paint in by default.",
      },
    ],
    usage: `import { SwarmReveal } from "@/components/ui/swarm-reveal"

export function Demo() {
  return (
    <SwarmReveal className="flex flex-col gap-4 p-8">
      <img data-swarm src="/banner.png" alt="" className="rounded-xl" />
      <h1 data-swarm className="text-2xl font-semibold">Mira Okafor</h1>
      <p data-swarm="text">I build playful interfaces that feel alive.</p>
      <article data-swarm="carry" className="rounded-xl border p-4">Tidepool</article>
    </SwarmReveal>
  )
}`,
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

const NEW_FOR_DAYS = 30;

// shortcut: measured from the last deploy, so labels age out on the next deploy after 30 days
export const isNew = (item: ComponentItem) =>
  Number(process.env.BUILD_TIME) - Date.parse(item.released) < NEW_FOR_DAYS * 86_400_000;

// iso dates compare as strings, and the sort is stable so same day keeps list order
export const latest = [...components].sort((a, b) =>
  b.released.localeCompare(a.released),
);

// gallery sections: New repeats its members so they still appear under their own category
export const gallerySections: ComponentSection[] = [
  {
    id: "new",
    label: "New releases",
    items: latest.filter(isNew),
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
