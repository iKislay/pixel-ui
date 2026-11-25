import { createElement, type ReactNode } from "react";
import { MotionIcon } from "@/components/Description/icons";
import { PRO_REGISTRY } from "@/lib/pro";
import { charts } from "@/lib/charts";
import { primitives } from "@/lib/primitives";

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
  | "sections"
  | "text"
  | "buttons"
  | "overlays"
  | "trends"
  | "comparison"
  | "composition"
  | "progress"
  | "flow";

export const CATEGORY_LABELS: Record<ComponentCategory, string> = {
  ai: "AI kit",
  navigation: "Navigation",
  inputs: "Inputs",
  feedback: "Feedback",
  display: "Display",
  sections: "Sections",
  text: "Text",
  buttons: "Buttons",
  overlays: "Overlays",
  trends: "Trends",
  comparison: "Comparison",
  composition: "Parts of a whole",
  progress: "Progress",
  flow: "Flow",
};

export const CATEGORY_ORDER: ComponentCategory[] = [
  "display",
  "sections",
  "text",
  "buttons",
  "ai",
  "navigation",
  "inputs",
  "overlays",
  "feedback",
  "trends",
  "comparison",
  "composition",
  "progress",
  "flow",
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
  pro?: boolean;
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
    name: "Voice Bar",
    href: "/components/voice-bar",
    released: "2026-11-25",
    category: "ai",
    registry: "voice-bar",
    description:
      "A prompt bar for typing or talking to an AI, with a dithered wave that listens, thinks and speaks.",
    source: `${REGISTRY_HOMEPAGE}/blob/main/components/ui/voice-bar.tsx`,
    dependencies: [{ name: "lucide-react" }],
    interaction:
      "Type and the prompt grows line by line up to six lines, with a tick in the wave under each key; Enter sends and Shift+Enter adds a line. Tap the waveform and it splits into a mic and a close button while sparks fly out to light a wave along the bottom edge. The wave moves with your voice, and each new word you say forms out of it before the text appears. Muting flattens it into a dotted line. While the reply is worked out, the wave cools into a beam that sweeps side to side, then swells in the middle as the reply is spoken. Press the X or Escape to pull everything back into the button. Honors prefers-reduced-motion: the wave holds still and controls swap without sparks.",
    usage: `import { useState } from "react";
import { VoiceBar, useVoiceAudio } from "@/components/ui/voice-bar";

export default function Demo() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const audio = useVoiceAudio(stream);

  return (
    <VoiceBar
      {...audio}
      onSubmit={(prompt) => fetch("/api/chat", { method: "POST", body: prompt })}
      onVoiceStart={async () => setStream(await navigator.mediaDevices.getUserMedia({ audio: true }))}
      onCancel={() => {
        stream?.getTracks().forEach((t) => t.stop());
        setStream(null);
      }}
    />
  );
}`,
    props: [
      {
        name: "state",
        type: '"idle" | "listening" | "thinking" | "speaking"',
        options: ["idle", "listening", "thinking", "speaking"],
        description:
          "Controls the mode yourself, with onStateChange. Leave it out and the bar moves on its own: the waveform starts listening, X returns to idle.",
      },
      {
        name: "onSubmit",
        type: "(value: string) => unknown",
        description:
          "Runs when a typed prompt is sent. Return a promise to show Thinking until it settles; a rejection puts the prompt back and shows the error's message.",
      },
      {
        name: "onVoiceStart",
        type: "() => void",
        description: "Runs when the waveform button starts voice mode. Start the microphone here.",
      },
      {
        name: "onCancel",
        type: "() => void",
        description: "Runs when voice mode ends through the X button or Escape.",
      },
      {
        name: "transcript",
        type: "string",
        description:
          "Live dictation or the streamed reply. Each new word forms out of the wave while listening or speaking.",
      },
      {
        name: "getLevel",
        type: "() => number",
        description:
          "Read every frame for loudness from 0 to 1. Spread useVoiceAudio(stream) to get it and getSpectrum. Without it, the wave plays a simulated voice.",
      },
      {
        name: "getSpectrum",
        type: "() => ArrayLike<number>",
        description: "Read every frame for 8 frequency bands from 0 to 1, low to high. Shapes the crest of the wave.",
      },
      {
        name: "muted",
        type: "boolean",
        default: "false",
        description: "Controls the mic toggle yourself, with onMutedChange.",
      },
      {
        name: "value",
        type: "string",
        description: "Controls the typed prompt yourself, with onValueChange.",
      },
      {
        name: "attachments",
        type: "ReactNode",
        description: "Chips shown above the prompt. The row folds open when set and closed when empty.",
      },
      {
        name: "error",
        type: "ReactNode",
        description: "A message shown under the prompt, such as a blocked microphone.",
      },
      {
        name: "leading",
        type: "ReactNode",
        description: "Replaces the + button on the left, for example with a mode picker. Pass null to hide it.",
      },
      {
        name: "onAttach",
        type: "() => void",
        description: "Runs when the + button is pressed. A ripple runs out of the button into the wave.",
      },
      {
        name: "placeholder",
        type: "string",
        default: '"Ask me anything..."',
        description: "Placeholder and accessible label of the prompt.",
      },
      {
        name: "disabled",
        type: "boolean",
        default: "false",
        description: "Turns off typing and every button.",
      },
      {
        name: "ref",
        type: "Ref<{ pulse(options?) }>",
        description:
          'Call pulse({ kind, origin }) to send a "ripple", "wipe" or "tick" through the wave from an element or a 0 to 1 position.',
      },
    ],
  },
  {
    name: "Passkey Button",
    href: "/components/passkey-button",
    released: "2026-11-25",
    category: "buttons",
    registry: "passkey-button",
    description:
      "A passkey sign-in button with a fingerprint that scans while it waits and draws into a check once verified.",
    source: `${REGISTRY_HOMEPAGE}/blob/main/components/ui/passkey-button.tsx`,
    interaction:
      "Hover and a dithered glow follows your cursor while the fingerprint wakes. Press and the sensor gives under your finger. While it verifies, the print is captured ridge by ridge from the core outward, a scan line sweeps it and the label shimmers. On success the ridges fold into a green check, a ring pulses out and a wave sweeps the pill. On failure the ridges jitter out of line, the button shakes and the reason appears below. Labels change letter by letter while the button eases to its new width. Honors prefers-reduced-motion: the print shows fully captured and states swap without glow, sweeps or shake.",
    usage: `import { PasskeyButton } from "@/components/ui/passkey-button";
import { startAuthentication } from "@simplewebauthn/browser";

export default function Demo() {
  return (
    <PasskeyButton
      onVerify={async () => {
        const options = await fetch("/api/passkey/options").then((r) => r.json());
        const response = await startAuthentication({ optionsJSON: options });
        const res = await fetch("/api/passkey/verify", {
          method: "POST",
          body: JSON.stringify(response),
        });
        if (!res.ok) throw new Error("That passkey wasn't recognized.");
      }}
    />
  );
}`,
    props: [
      {
        name: "onVerify",
        type: "() => unknown",
        description:
          "Runs on click. Return a promise to scan until it settles: resolve to verify, throw an Error to show its message. A plain return verifies at once.",
      },
      {
        name: "status",
        type: '"idle" | "scanning" | "verified" | "error"',
        options: ["idle", "scanning", "verified", "error"],
        description:
          "Controls the state yourself. Leave it out and onVerify drives it.",
      },
      {
        name: "onStatusChange",
        type: "(status) => void",
        description: "Called whenever the state changes.",
      },
      {
        name: "labels",
        type: "Partial<Record<status, string>>",
        description:
          'Overrides the text per state. Defaults are "Sign in with passkey", "Verifying passkey", "Verified" and "Try again".',
      },
      {
        name: "errorMessage",
        type: "ReactNode",
        description:
          "Shown under the button on error, in place of the thrown error's message.",
      },
      {
        name: "variant",
        type: '"surface" | "primary" | "outline"',
        default: '"surface"',
        options: ["surface", "primary", "outline"],
        description: "The button's surface.",
      },
      {
        name: "size",
        type: '"default" | "lg"',
        default: '"default"',
        options: ["default", "lg"],
        description: "46px or 54px tall.",
      },
      {
        name: "fullWidth",
        type: "boolean",
        default: "false",
        description: "Stretches the button to fill its container.",
      },
      {
        name: "resetAfter",
        type: "number",
        default: "0",
        description:
          "Milliseconds after Verified to return to idle. 0 keeps it verified until clicked.",
      },
      {
        name: "className",
        type: "string",
        description: "Classes applied to the root element.",
      },
    ],
  },
  {
    name: "Metal Button",
    href: "/components/metal-button",
    released: "2026-11-20",
    category: "buttons",
    registry: "metal-button",
    description:
      "A liquid metal ring with a wandering halo for buttons, icons, text and badges.",
    source: `${REGISTRY_HOMEPAGE}/blob/main/components/ui/metal-button.tsx`,
    interaction:
      "A thin ring of liquid metal flows around the button, with a soft halo of light drifting slowly around its edge. Hover the ring and it dents under the cursor; press and the dent goes deeper. Nearby elements and text catch a tint of the halo as it passes them. Text and badges shimmer with the same metal. Honors prefers-reduced-motion: the metal and halo hold still, and only the dent follows the cursor. On slow loads, older machines or browsers without WebGL, a still metal ring shows instead.",
    props: [
      {
        name: "preset",
        type: '"chromatic" | "silver" | "gold"',
        default: '"chromatic"',
        options: ["chromatic", "silver", "gold"],
        description: "The metal. Each one has a dark and a light tuning.",
      },
      {
        name: "variant",
        type: '"button" | "circle"',
        default: '"button"',
        options: ["button", "circle"],
        description: "Button follows the child's corner radius; circle rounds the ring fully.",
      },
      {
        name: "strength",
        type: "number",
        default: "1",
        description: "From 0 to 1. Scales the opacity of the metal and its glow.",
      },
      {
        name: "theme",
        type: '"light" | "dark"',
        options: ["light", "dark"],
        description: "Picks the preset's tuning. Left unset, it follows the page's text color.",
      },
      {
        name: "innerShadow",
        type: "boolean",
        default: "false",
        options: ["true", "false"],
        description: "Adds a light rim along the top inside edge of the ring.",
      },
      {
        name: "reflectionTargets",
        type: "RefObject<HTMLElement>[]",
        description: "Neighbouring elements that catch a light rim on the edge facing the metal. It sets their box-shadow.",
      },
      {
        name: "disableGlow",
        type: "boolean",
        default: "false",
        options: ["true", "false"],
        description: "Turns off the halo and the reflections.",
      },
      {
        name: "glowGain",
        type: "number",
        default: "1",
        description: "Multiplies the halo's brightness.",
      },
      {
        name: "paused",
        type: "boolean",
        default: "false",
        options: ["true", "false"],
        description: "Freezes the flow. The cursor dent still works.",
      },
      {
        name: "MetalText font",
        type: "string",
        description: "CSS font shorthand for the metal text, like \"500 24px/1.2 Inter\". Takes preset, theme, strength and paused too.",
      },
      {
        name: "MetalText color",
        type: "string",
        default: '"#e2e2e2"',
        description: "Tints the metal text, and colors it when WebGL is missing.",
      },
      {
        name: "useMetalBend(ref)",
        type: "RefObject<HTMLElement>",
        description: "Pass the ref you gave MetalButton to dent the ring under the cursor.",
      },
      {
        name: "useMetalTextReflection(metalRef, textRef)",
        type: "RefObject<HTMLElement>",
        description: "Makes a text element catch the halo with a soft colored text shadow.",
      },
    ],
    usage: `import { useRef } from "react"
import { ArrowUp } from "lucide-react"
import { MetalBadge, MetalButton, MetalText, useMetalBend } from "@/components/ui/metal-button"

export function Demo() {
  const ref = useRef<HTMLDivElement>(null)
  useMetalBend(ref)

  return (
    <div className="flex items-center gap-6">
      <MetalButton preset="chromatic">
        <button className="rounded-full bg-black px-6 py-3 text-white">Upgrade to Pro</button>
      </MetalButton>
      <MetalButton ref={ref} variant="circle" innerShadow>
        <button aria-label="Send" className="flex size-12 items-center justify-center rounded-full bg-black text-white">
          <ArrowUp />
        </button>
      </MetalButton>
      <MetalText font="500 24px/1.2 Inter">Pro</MetalText>
      <MetalBadge>New</MetalBadge>
    </div>
  )
}`,
  },
  {
    name: "Voice Glow",
    href: "/components/voice-glow",
    released: "2026-11-20",
    category: "ai",
    pro: true,
    registry: "voice-glow",
    description:
      "A colorful glow that rises from the bottom edge of any element and blooms with a voice.",
    interaction:
      "Talk and soft lobes of color climb up from the bottom edge, taller in the middle, then sink back when you stop. While the reply is being worked out, the lobes gather into one beam that sweeps side to side. The glow follows the rounded corners of whatever it wraps. Honors prefers-reduced-motion: the lobes stop drifting and the beam holds still in the middle.",
    usage: `import { useRef } from "react";
import { VoiceGlow, useMicrophone } from "@/components/ui/voice-glow";

export default function Demo({ thinking }: { thinking: boolean }) {
  const mic = useMicrophone();

  return (
    <>
      <VoiceGlow stream={mic.stream} processing={thinking} className="w-[350px]">
        <input className="h-14 w-full rounded-2xl border px-4" placeholder="Ask anything" />
      </VoiceGlow>
      <button onClick={mic.state === "live" ? mic.stop : mic.start}>
        {mic.state === "live" ? "Stop" : "Listen"}
      </button>
    </>
  );
}

// without a mic, drive it yourself with 0 to 1, as a number or a per-frame getter
export function Driven() {
  const meter = useRef(0);
  return (
    <VoiceGlow level={() => meter.current}>
      <div className="h-40 rounded-3xl border" />
    </VoiceGlow>
  );
}`,
    props: [
      {
        name: "type",
        type: '"default" | "pill" | "mobile"',
        default: '"default"',
        options: ["default", "pill", "mobile"],
        description: "Geometry preset: a chat input, a small recording pill, or the bottom of a phone screen. Sets the default reach and blur.",
      },
      {
        name: "stream",
        type: "MediaStream | null",
        description: "Audio to react to, usually from useMicrophone. Wins over level.",
      },
      {
        name: "level",
        type: "number | (() => number)",
        description: "Input from 0 to 1 when there is no stream. Pass a function to have it read every frame.",
      },
      {
        name: "processing",
        type: "boolean",
        default: "false",
        description: "Gathers the glow into one beam that sweeps side to side.",
      },
      {
        name: "colorVariant",
        type: '"colorful" | "mono" | "ocean" | "sunset" | "forest" | "candy" | "ice" | "gold"',
        default: '"colorful"',
        options: ["colorful", "mono", "ocean", "sunset", "forest", "candy", "ice", "gold"],
        description: "Named palette for the lobes.",
      },
      {
        name: "colors",
        type: "string[]",
        description: "Your own lobe colors, up to 7. Overrides colorVariant.",
      },
      {
        name: "bandColors",
        type: "{ core?: string; above?: string; mid?: string; below?: string }",
        description: "Extra bands: core is a bright line on the edge, mid a band just above it, above a haze higher up, and below a spill under the element. Each shows only when set.",
      },
      {
        name: "sensitivity",
        type: "number",
        default: "1.5",
        description: "Gain applied to the input before the threshold.",
      },
      {
        name: "threshold",
        type: "number",
        default: "0.05",
        description: "Input below this, from 0 to 1, is treated as silence.",
      },
      {
        name: "attack",
        type: "number",
        default: "0.06",
        description: "Seconds the glow takes to rise toward a louder input.",
      },
      {
        name: "release",
        type: "number",
        default: "0.35",
        description: "Seconds the glow takes to fall back after the input drops.",
      },
      {
        name: "reach",
        type: "number",
        description: "How high the glow can climb, as a share of the element's height. Defaults to 0.9, 1 or 0.4 for default, pill and mobile.",
      },
      {
        name: "spread",
        type: "number",
        default: "0.8",
        description: "How far apart the lobes sit across the width, from 0 to 1.",
      },
      {
        name: "flow",
        type: "number",
        default: "0.5",
        description: "How fast and far the lobes drift and wobble, from 0 to 1.",
      },
      {
        name: "bend",
        type: "number",
        default: "0.5",
        description: "How much shorter the lobes are toward the sides, from 0 to 1.",
      },
      {
        name: "idle",
        type: "number",
        default: "0.12",
        description: "Height the glow rests at during silence, from 0 to 1.",
      },
      {
        name: "theme",
        type: '"dark" | "light" | "auto" | "dither"',
        default: '"auto"',
        options: ["auto", "dark", "light", "dither"],
        description: "dark lightens what it covers, light paints over it, auto follows the dark class. dither draws the glow in 4 pixel dots that thin out toward its edges.",
      },
      {
        name: "strength",
        type: "number",
        default: "1",
        description: "Opacity of the effect, from 0 to 1.",
      },
      {
        name: "active",
        type: "boolean",
        default: "true",
        description: "Turn off to fade the glow out.",
      },
      {
        name: "paused",
        type: "boolean",
        default: "false",
        description: "Freezes the glow where it is.",
      },
      {
        name: "scale",
        type: "number",
        default: "1",
        description: "Multiplies the size and blur of the lobes.",
      },
      {
        name: "className",
        type: "string",
        description: "Classes applied to the root, which wraps your element.",
      },
    ],
  },
  {
    name: "Poster Sphere",
    href: "/components/poster-sphere",
    released: "2026-11-19",
    category: "sections",
    registry: "poster-sphere",
    description:
      "A movie browser that swells an endless wall of posters under a lens and opens each film in a full screen view.",
    source: `${REGISTRY_HOMEPAGE}/blob/main/components/ui/poster-sphere.tsx`,
    dependencies: [
      {
        name: "motion",
        icon: createElement(MotionIcon, { className: "h-4 w-4" }),
      },
    ],
    interaction:
      "Drag the wall in any direction; posters swell as they slide under the bulge in the middle, squeeze around its edge and never run out. The bulge leans and stretches the way you drag, then eases back to round. Let go and it glides on, then settles with a poster in the middle. With hover movement, the bulge drifts toward the cursor, and pushing it toward an edge slides the wall that way. Click a poster or press Enter and it peels off the wall like a sheet of paper, rising and tilting as it morphs from its warped shape into a full screen view that stops the page from scrolling. Close it with the button, Escape or a click outside and it lays itself back into its spot. Arrow keys step one poster at a time. Honors prefers-reduced-motion: the wall follows your drag without gliding, the bulge stays still and round, hover sliding is off, and the full screen view fades in and out instead of lifting.",
    props: [
      {
        name: "movies",
        type: "{ title: string; year: number; genre: string; rating: number; tagline: string; synopsis: string; poster: string }[]",
        default: "24 sample films",
        description:
          "The films on the wall, repeated to fill it. poster is an image URL; rating is out of 100.",
      },
      {
        name: "size",
        type: '"sm" | "md" | "lg"',
        default: '"md"',
        options: ["sm", "md", "lg"],
        description: "Poster width on the flat wall: 22, 30 or 42 pixels; the centre of the bulge magnifies about three times. Smaller posters fit more but cost more to draw.",
      },
      {
        name: "smoothness",
        type: '"snappy" | "smooth" | "floaty"',
        default: '"smooth"',
        options: ["snappy", "smooth", "floaty"],
        description: "How closely the wall trails your drag and how far it glides after you let go.",
      },
      {
        name: "movement",
        type: '"drag" | "hover"',
        default: '"drag"',
        options: ["drag", "hover"],
        description: "drag moves only while dragging. hover also drifts the bulge toward the cursor and slides the wall near its edges.",
      },
      {
        name: "className",
        type: "string",
        description: "Classes applied to the root. Give it a height; the wall fills it.",
      },
    ],
    usage: `import { PosterSphere } from "@/components/ui/poster-sphere"

export function Demo() {
  return <PosterSphere movement="hover" className="h-[640px] w-full" />
}`,
  },
  {
    name: "Distortion Wave",
    href: "/components/distortion-wave",
    released: "2026-11-16",
    category: "feedback",
    pro: true,
    registry: "distortion-wave",
    description:
      "A wrapper that carries one view into another with a colourful WebGL wave.",
    dependencies: [{ name: "distortion-waves" }],
    interaction:
      "Press the control that changes the view and a wave opens from it, bending the old view as it passes and leaving the new one behind. Pressing it again collapses the wave back into the control. The controls in the overlay stay sharp and clickable the whole time. Honors prefers-reduced-motion: the views crossfade instead.",
    usage: `import { useState } from "react";
import { DistortionWave } from "@/components/ui/distortion-wave";

export default function Demo() {
  const [sent, setSent] = useState(false);

  return (
    <DistortionWave
      revealed={sent}
      revealedContent={<Receipt />}
      overlay={
        <button className="absolute inset-x-6 bottom-6" onClick={() => setSent(!sent)}>
          {sent ? "Done" : "Confirm"}
        </button>
      }
      className="w-[420px] rounded-3xl"
    >
      {/* both views need an opaque background */}
      <Review />
    </DistortionWave>
  );
}`,
    props: [
      {
        name: "children",
        type: "ReactNode",
        required: true,
        description: "The view that shows first. Give it an opaque background.",
      },
      {
        name: "revealedContent",
        type: "ReactNode",
        description:
          "The view the wave leaves behind. Without one, the wave passes over children and leaves them as they were.",
      },
      {
        name: "revealed",
        type: "boolean",
        description:
          "Which view shows. Setting it to true sends the wave out; false collapses it back. Leave it out to drive the wave with ref.play().",
      },
      {
        name: "overlay",
        type: "ReactNode",
        description:
          "Content that stays above the wave, sharp and clickable, such as the button that starts it. Position its children absolutely.",
      },
      {
        name: "type",
        type: '"vertical" | "horizontal" | "center"',
        default: '"vertical"',
        options: ["vertical", "horizontal", "center"],
        description:
          "The shape of the front: up from a button, across from a side edge, or a ring from an avatar or icon.",
      },
      {
        name: "source",
        type: "Element | RefObject | { x, y, w, h }",
        description:
          "Where the wave opens. By default, the control that was just pressed.",
      },
      {
        name: "palette",
        type: '"colorful" | "green" | "ocean" | "sunset" | "mono" | string',
        options: ["colorful", "green", "ocean", "sunset", "mono"],
        description: "A named palette or one hex colour. By default, the type's own.",
      },
      {
        name: "waveStyle",
        type: "Partial<WaveStyle>",
        description:
          "Fine tuning over the type's defaults, such as travel, amplitude, blur, aberration and particleCount.",
      },
      {
        name: "onFinish",
        type: "(revealed: boolean) => void",
        description: "Called when a wave ends, with the view now showing.",
      },
      {
        name: "ref",
        type: "Ref<DistortionWaveHandle>",
        description:
          "Exposes play(), reverse(), reset() and prepare() to run the wave by hand.",
      },
      {
        name: "className",
        type: "string",
        description:
          "Classes applied to the wrapper. Give it a border radius; the wave follows it.",
      },
    ],
  },
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
    name: "Dimension Hero",
    href: "/components/dimension-hero",
    released: "2026-11-15",
    category: "sections",
    registry: "dimension-hero",
    description:
      "A bold headline hero with a pill that turns the page into a black wireframe world of extruded letters.",
    source: `${REGISTRY_HOMEPAGE}/blob/main/components/ui/dimension-hero.tsx`,
    dependencies: [{ name: "three" }],
    interaction:
      "On load each word starts as a small square or circle beside it, which grows in steps until the word pops in, small, then larger, then full size. The words land 0.12 seconds apart. At 1.1 seconds, tiles flicker open from the centre for 2 seconds, showing glimpses of a blue, colour-split world behind the page, while the headline rises toward the top and the tagline fades up under it. Press the pill in the corner and the headline peels off the page, letter by letter, sinking into depth while a crackling ring spreads from the centre and warps the page into black. Inside, the letters are solids with white edges, hanging in a wireframe room where grid lines, light streaks and specks keep rushing past. Move the pointer and the view swings around the letters, showing each one at a different depth. Scroll to fly forward through them. Press the pill again or Escape and the ring collapses while the letters fly back and flatten into the headline. Honors prefers-reduced-motion: the words and tagline appear without animation, the tiles are skipped, the 3D view switches in and out without the ring, nothing in it drifts, and it moves only with the pointer.",
    props: [
      {
        name: "headline",
        type: "string",
        default: '"Draw outside the frame"',
        description: "The headline. Each word reveals on its own and becomes 3D letters in the pill view.",
      },
      {
        name: "tagline",
        type: "string",
        default: '"Every flat page hides a little depth. The pill knows where."',
        description: "The line under the headline. It also floats in the 3D view.",
      },
      {
        name: "className",
        type: "string",
        description: "Classes applied to the root. Give it a height; the headline scales to its width.",
      },
    ],
    usage: `import { DimensionHero } from "@/components/ui/dimension-hero"

export function Demo() {
  return <DimensionHero className="h-[640px] w-full" />
}`,
    credits: ["Inspired by the shopify.design hero"],
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
    category: "sections",
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
  item: Pick<ComponentItem, "registry" | "pro">,
  pm: PackageManager = "npm",
): string | null {
  if (!item.registry) return null;
  // @latest matters: npx otherwise picks a stale local shadcn, and github registries need 4.16+
  const registry = item.pro ? PRO_REGISTRY : REGISTRY_REPO;
  return `${PM_EXECUTORS[pm]} shadcn@latest add ${registry}/${item.registry}`;
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

// every page that renders in the docs shell: components, primitives and charts
export const docsItems = [...components, ...primitives, ...charts];

export function activeComponent(pathname: string): ComponentItem | undefined {
  return docsItems.find((c) => c.href === pathname);
}

export function registryComponent(name: string): ComponentItem | undefined {
  return docsItems.find((c) => c.registry === name);
}

export function swatchProp(item?: ComponentItem): ComponentProp | undefined {
  return item?.props?.find((p) => p.control === "swatch" && p.optionColors);
}

export function cleanDefault(prop?: ComponentProp): string | undefined {
  return prop?.default?.replace(/^["']|["']$/g, "");
}
