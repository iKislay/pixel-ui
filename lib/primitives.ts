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
    description: "A squircle button that changes shape to show its state.",
    interaction:
      "Press and the button squashes a little under your finger. While it works, the label blurs away and the button springs down into a round spinner; when the work is done it lands on a green tick or a red cross, then grows back to its label. Focus stays on it the whole time. Honors prefers-reduced-motion: the states swap without movement.",
    props: [
      {
        name: "status",
        type: '"idle" | "loading" | "success" | "error"',
        default: '"idle"',
        options: ["idle", "loading", "success", "error"],
        description: "What the button is doing. Anything but idle shows an icon and ignores clicks.",
      },
      {
        name: "variant",
        type: '"primary" | "secondary" | "ghost" | "destructive"',
        default: '"primary"',
        options: ["primary", "secondary", "ghost", "destructive"],
        description: "The look while idle. Primary uses the brand blue.",
      },
      {
        name: "size",
        type: '"sm" | "md" | "lg" | "icon"',
        default: '"md"',
        options: ["sm", "md", "lg", "icon"],
        description: "Height and padding. Icon is a square for a single icon.",
      },
      feedbackProp('"press" | "error"'),
      classNameProp,
    ],
    usage: `import { useState } from "react"
import { Button, type ButtonStatus } from "@/components/ui/button"

export function Demo() {
  const [status, setStatus] = useState<ButtonStatus>("idle")

  async function save() {
    setStatus("loading")
    await fetch("/api/save", { method: "POST" })
    setStatus("success")
    setTimeout(() => setStatus("idle"), 1500)
  }

  return <Button status={status} onClick={save}>Save changes</Button>
}`,
  }),
  primitive("input", {
    name: "Input",
    category: "inputs",
    description: "A text field whose label floats up out of the way as you type.",
    interaction:
      "The label sits inside the empty field. Focus it and the label lifts into a small blue tag above your text, with a slight overshoot. When there is an error the field shakes once, its ring turns red, and the message slides out from underneath. Honors prefers-reduced-motion: no shake, and the message appears in place.",
    props: [
      {
        name: "label",
        type: "string",
        required: true,
        description: "The field's name. It doubles as the placeholder and stays visible once filled.",
      },
      {
        name: "error",
        type: "ReactNode",
        description: "An error message. Setting it marks the field invalid and announces the message.",
      },
      feedbackProp('"error"'),
      { name: "className", type: "string", description: "Merged onto the wrapper. Other props go to the input." },
    ],
    usage: `import { Input } from "@/components/ui/input"

export function Demo() {
  return <Input label="Email" type="email" />
}`,
  }),
  primitive("textarea", {
    name: "Textarea",
    category: "inputs",
    description: "A soft multi-line field that grows with its text.",
    interaction:
      "Type and the field grows a line at a time instead of scrolling. Focus shows a blue ring; an invalid field shows a red one.",
    props: [
      {
        name: "invalid",
        type: "boolean",
        default: "false",
        description: "Marks the field invalid with a red ring and aria-invalid.",
      },
      {
        name: "rows",
        type: "number",
        description: "Sets the starting height. The field still grows past it as you type.",
      },
      classNameProp,
    ],
    usage: `import { Textarea } from "@/components/ui/textarea"

export function Demo() {
  return <Textarea placeholder="Leave a note" aria-label="Note" />
}`,
  }),
  primitive("checkbox", {
    name: "Checkbox",
    category: "inputs",
    description: "A squircle checkbox whose tick draws itself in.",
    interaction:
      "Click or press Space and the box fills blue while the tick draws in stroke by stroke. A half-checked box shows a dash. Wrap it in a label to make the text clickable too. Honors prefers-reduced-motion: the tick appears at once.",
    props: [
      {
        name: "checked",
        type: 'boolean | "indeterminate"',
        description: "Controls the state. Leave it unset to let the checkbox manage itself.",
      },
      {
        name: "defaultChecked",
        type: 'boolean | "indeterminate"',
        default: "false",
        description: "The starting state when uncontrolled.",
      },
      {
        name: "onCheckedChange",
        type: "(checked: boolean) => void",
        description: "Called with the new state. Indeterminate always turns checked.",
      },
      feedbackProp('"toggle"'),
      classNameProp,
    ],
    usage: `import { Checkbox } from "@/components/ui/checkbox"

export function Demo() {
  return (
    <label className="flex items-center gap-3">
      <Checkbox defaultChecked />
      Email me about new releases
    </label>
  )
}`,
  }),
  primitive("switch", {
    name: "Switch",
    category: "inputs",
    description: "An on and off switch with a springy thumb.",
    interaction:
      "Click or press Space and the thumb springs across as the track fills blue. Hold it down and the thumb stretches a little, like a finger pressing it. Honors prefers-reduced-motion: the thumb jumps across.",
    props: [
      {
        name: "checked",
        type: "boolean",
        description: "Controls the state. Leave it unset to let the switch manage itself.",
      },
      {
        name: "defaultChecked",
        type: "boolean",
        default: "false",
        description: "The starting state when uncontrolled.",
      },
      {
        name: "onCheckedChange",
        type: "(checked: boolean) => void",
        description: "Called with the new state.",
      },
      feedbackProp('"toggle"'),
      classNameProp,
    ],
    usage: `import { Switch } from "@/components/ui/switch"

export function Demo() {
  return (
    <label className="flex items-center gap-3">
      <Switch defaultChecked />
      Airplane mode
    </label>
  )
}`,
  }),
  primitive("radio-group", {
    name: "Radio Group",
    category: "inputs",
    description: "A list of options where exactly one can be picked.",
    interaction:
      "Click an option and its dot pops in with a small spring. Tab lands on the group once; the arrow keys move between options and pick as they go. Honors prefers-reduced-motion: the dot appears at once.",
    props: [
      {
        name: "options",
        type: "{ value: string; label: ReactNode; description?: ReactNode; disabled?: boolean }[]",
        required: true,
        description: "The choices, in order. A description shows under its label.",
      },
      {
        name: "value",
        type: "string",
        description: "Controls the picked option. Leave it unset to let the group manage itself.",
      },
      {
        name: "defaultValue",
        type: "string",
        description: "The starting pick when uncontrolled. Nothing is picked by default.",
      },
      {
        name: "onValueChange",
        type: "(value: string) => void",
        description: "Called with the newly picked value.",
      },
      feedbackProp('"select"'),
      classNameProp,
    ],
    usage: `import { RadioGroup } from "@/components/ui/radio-group"

export function Demo() {
  return (
    <RadioGroup
      aria-label="Plan"
      defaultValue="monthly"
      options={[
        { value: "monthly", label: "Monthly" },
        { value: "yearly", label: "Yearly", description: "Two months free" },
      ]}
    />
  )
}`,
  }),
  primitive("slider", {
    name: "Slider",
    category: "inputs",
    description: "A single-value slider with a soft round thumb.",
    interaction:
      "Drag the thumb or click anywhere on the track and the blue fill follows. The thumb swells a little while held. With focus, the arrow keys step it and Home and End jump to the ends. Honors prefers-reduced-motion: the thumb does not swell.",
    props: [
      {
        name: "value",
        type: "number",
        description: "Controls the value. Leave it unset to let the slider manage itself.",
      },
      {
        name: "defaultValue",
        type: "number",
        description: "The starting value when uncontrolled. Defaults to min.",
      },
      { name: "min", type: "number", default: "0", description: "The lowest value." },
      { name: "max", type: "number", default: "100", description: "The highest value." },
      { name: "step", type: "number", default: "1", description: "The size of each step." },
      {
        name: "onValueChange",
        type: "(value: number) => void",
        description: "Called on every step while the value moves.",
      },
      feedbackProp('"select"'),
      {
        name: "className",
        type: "string",
        description: "Merged onto the root. Other props, like aria-label, go to the inner range input.",
      },
    ],
    usage: `import { Slider } from "@/components/ui/slider"

export function Demo() {
  return <Slider aria-label="Volume" defaultValue={40} />
}`,
  }),
  primitive("select", {
    name: "Select",
    category: "inputs",
    description: "A dropdown list for picking one value.",
    interaction:
      "Click the field and a soft list springs open below it, with the current pick ticked. Use the arrow keys, Home and End to move, a letter to jump, and Enter to pick. Escape or a click outside closes it. Honors prefers-reduced-motion: the list fades instead of springing.",
    props: [
      {
        name: "options",
        type: "{ value: string; label: ReactNode; disabled?: boolean }[]",
        required: true,
        description: "The choices, in order.",
      },
      {
        name: "value",
        type: "string",
        description: "Controls the picked value. Leave it unset to let the select manage itself.",
      },
      {
        name: "defaultValue",
        type: "string",
        description: "The starting pick when uncontrolled.",
      },
      {
        name: "onValueChange",
        type: "(value: string) => void",
        description: "Called with the newly picked value.",
      },
      {
        name: "placeholder",
        type: "ReactNode",
        default: '"Choose…"',
        description: "Shown while nothing is picked.",
      },
      feedbackProp('"open" | "close" | "select"'),
      classNameProp,
    ],
    usage: `import { Select } from "@/components/ui/select"

export function Demo() {
  return (
    <Select
      aria-label="Theme"
      options={[
        { value: "light", label: "Light" },
        { value: "dark", label: "Dark" },
        { value: "system", label: "System" },
      ]}
    />
  )
}`,
  }),
  primitive("tabs", {
    name: "Tabs",
    category: "navigation",
    description: "A row of tabs with a sliding pill that switches between panels.",
    interaction:
      "Click a tab and a soft pill glides under it while the panel below cross-fades. With focus on the tabs, the arrow keys, Home and End move and switch together. Honors prefers-reduced-motion: the pill jumps and the panel only fades.",
    props: [
      {
        name: "items",
        type: "{ value: string; label: ReactNode; content: ReactNode }[]",
        required: true,
        description: "The tabs and the panel each one shows.",
      },
      {
        name: "value",
        type: "string",
        description: "Controls the open tab. Leave it unset to let the tabs manage themselves.",
      },
      {
        name: "defaultValue",
        type: "string",
        description: "The starting tab when uncontrolled. Defaults to the first one.",
      },
      {
        name: "onValueChange",
        type: "(value: string) => void",
        description: "Called with the newly opened tab.",
      },
      feedbackProp('"select"'),
      classNameProp,
    ],
    usage: `import { Tabs } from "@/components/ui/tabs"

export function Demo() {
  return (
    <Tabs
      aria-label="Account"
      items={[
        { value: "profile", label: "Profile", content: <p>Your public details.</p> },
        { value: "billing", label: "Billing", content: <p>Plans and invoices.</p> },
      ]}
    />
  )
}`,
  }),
  primitive("tooltip", {
    name: "Tooltip",
    category: "overlays",
    description: "A small label that floats beside an element on hover or focus.",
    interaction:
      "Rest the pointer on the element and, after a short pause, a label springs out beside it. Focus with the keyboard and it shows at once. Escape or moving away hides it. Honors prefers-reduced-motion: the label only fades.",
    props: [
      {
        name: "content",
        type: "ReactNode",
        required: true,
        description: "What the label says.",
      },
      {
        name: "children",
        type: "ReactElement",
        required: true,
        description: "One focusable element. It gets the hover and focus handlers and aria-describedby.",
      },
      {
        name: "side",
        type: '"top" | "bottom" | "left" | "right"',
        default: '"top"',
        options: ["top", "bottom", "left", "right"],
        description: "Where the label sits. It does not flip at the screen edge.",
      },
      {
        name: "delay",
        type: "number",
        default: "300",
        description: "Milliseconds of hover before it shows.",
      },
      feedbackProp('"open" | "close"'),
      { name: "className", type: "string", description: "Merged onto the label." },
    ],
    usage: `import { Tooltip } from "@/components/ui/tooltip"

export function Demo() {
  return (
    <Tooltip content="Copy link">
      <button type="button">Share</button>
    </Tooltip>
  )
}`,
  }),
  primitive("popover", {
    name: "Popover",
    category: "overlays",
    description: "A floating panel anchored to a trigger, for small forms and details.",
    interaction:
      "Click the trigger and a soft panel grows out of it, taking focus. Escape closes it and returns focus to the trigger; a click outside closes it too. Honors prefers-reduced-motion: the panel only fades.",
    props: [
      {
        name: "trigger",
        type: "ReactElement",
        required: true,
        description: "One focusable element that toggles the panel. It gets aria-expanded.",
      },
      {
        name: "open",
        type: "boolean",
        description: "Controls the panel. Leave it unset to let the popover manage itself.",
      },
      {
        name: "defaultOpen",
        type: "boolean",
        default: "false",
        description: "The starting state when uncontrolled.",
      },
      {
        name: "onOpenChange",
        type: "(open: boolean) => void",
        description: "Called whenever the panel opens or closes.",
      },
      {
        name: "side",
        type: '"top" | "bottom"',
        default: '"bottom"',
        options: ["top", "bottom"],
        description: "Which side of the trigger the panel opens on. It does not flip at the screen edge.",
      },
      {
        name: "align",
        type: '"start" | "center" | "end"',
        default: '"center"',
        options: ["start", "center", "end"],
        description: "How the panel lines up with the trigger.",
      },
      feedbackProp('"open" | "close"'),
      { name: "className", type: "string", description: "Merged onto the panel." },
    ],
    usage: `import { Popover } from "@/components/ui/popover"

export function Demo() {
  return (
    <Popover aria-label="Details" trigger={<button type="button">Details</button>}>
      Shipping takes four to six days.
    </Popover>
  )
}`,
  }),
  primitive("dialog", {
    name: "Dialog",
    category: "overlays",
    description: "A modal window that dims the page and holds focus until it is closed.",
    interaction:
      "Open it and the page dims while the window rises gently into place. Tab stays inside it and the page behind cannot be scrolled. Escape, the close button or a click on the dimmed page closes it, and focus returns to where it was. Honors prefers-reduced-motion: the window only fades.",
    props: [
      {
        name: "title",
        type: "ReactNode",
        required: true,
        description: "The heading. It also names the dialog for screen readers.",
      },
      {
        name: "description",
        type: "ReactNode",
        description: "A line under the title, read out when the dialog opens.",
      },
      {
        name: "trigger",
        type: "ReactElement",
        description: "An element that opens the dialog. Leave it out when you control open yourself.",
      },
      {
        name: "open",
        type: "boolean",
        description: "Controls the dialog. Leave it unset to let the dialog manage itself.",
      },
      {
        name: "defaultOpen",
        type: "boolean",
        default: "false",
        description: "The starting state when uncontrolled.",
      },
      {
        name: "onOpenChange",
        type: "(open: boolean) => void",
        description: "Called whenever the dialog opens or closes.",
      },
      feedbackProp('"open" | "close"'),
      { name: "className", type: "string", description: "Merged onto the window." },
    ],
    usage: `import { Dialog } from "@/components/ui/dialog"

export function Demo() {
  return (
    <Dialog
      title="Invite people"
      description="They will get an email with a link."
      trigger={<button type="button">Invite</button>}
    >
      <input type="email" placeholder="name@example.com" aria-label="Email" />
    </Dialog>
  )
}`,
  }),
  primitive("dropdown-menu", {
    name: "Dropdown Menu",
    category: "overlays",
    description: "A menu of actions that drops from a trigger.",
    interaction:
      "Click the trigger, or press the down arrow on it, and the menu springs open with the first action focused. Move with the arrow keys, Home and End, and pick with Enter. Escape closes it and returns focus to the trigger. Honors prefers-reduced-motion: the menu only fades.",
    props: [
      {
        name: "trigger",
        type: "ReactElement",
        required: true,
        description: "One focusable element that toggles the menu.",
      },
      {
        name: "items",
        type: '({ label: ReactNode; icon?: ReactNode; shortcut?: string; onSelect?: () => void; destructive?: boolean; disabled?: boolean } | "separator")[]',
        required: true,
        description: "The actions, in order. A separator draws a thin line; destructive turns an action red.",
      },
      {
        name: "align",
        type: '"start" | "end"',
        default: '"start"',
        options: ["start", "end"],
        description: "Which edge of the trigger the menu lines up with.",
      },
      feedbackProp('"open" | "close" | "select"'),
      { name: "className", type: "string", description: "Merged onto the menu." },
    ],
    usage: `import { DropdownMenu } from "@/components/ui/dropdown-menu"

export function Demo() {
  return (
    <DropdownMenu
      trigger={<button type="button">Options</button>}
      items={[
        { label: "Rename", onSelect: () => console.log("rename") },
        "separator",
        { label: "Delete", destructive: true },
      ]}
    />
  )
}`,
  }),
  primitive("badge", {
    name: "Badge",
    category: "display",
    description: "A small tinted label for status, counts and tags.",
    interaction: "A quiet, tinted label. An optional dot in the same color marks live status.",
    props: [
      {
        name: "tone",
        type: '"neutral" | "brand" | "success" | "warning" | "danger"',
        default: '"neutral"',
        options: ["neutral", "brand", "success", "warning", "danger"],
        description: "The tint.",
      },
      {
        name: "dot",
        type: "boolean",
        default: "false",
        description: "Shows a small dot before the text.",
      },
      classNameProp,
    ],
    usage: `import { Badge } from "@/components/ui/badge"

export function Demo() {
  return <Badge tone="success" dot>Live</Badge>
}`,
  }),
  primitive("avatar", {
    name: "Avatar",
    category: "display",
    description: "A squircle portrait with initials as a fallback and an optional status dot.",
    interaction:
      "The photo fades in once it loads. Until then, or if it fails, the person's initials show on a soft blue tile. A colored dot in the corner shows whether they are online.",
    props: [
      {
        name: "name",
        type: "string",
        required: true,
        description: "The person's name. It gives the initials and the accessible label.",
      },
      { name: "src", type: "string", description: "The photo URL." },
      {
        name: "size",
        type: '"sm" | "md" | "lg"',
        default: '"md"',
        options: ["sm", "md", "lg"],
        description: "32, 44 or 64 pixels square.",
      },
      {
        name: "status",
        type: '"online" | "away" | "offline"',
        options: ["online", "away", "offline"],
        description: "Shows a status dot and adds it to the label.",
      },
      classNameProp,
    ],
    usage: `import { Avatar } from "@/components/ui/avatar"

export function Demo() {
  return <Avatar name="Mira Okafor" src="/mira.jpg" status="online" />
}`,
  }),
  primitive("card", {
    name: "Card",
    category: "display",
    description: "A large soft squircle surface for grouping related content.",
    interaction: "A calm surface with generous squircle corners. Title and description parts keep the type consistent.",
    props: [
      {
        name: "Card",
        type: "ComponentProps<\"div\">",
        description: "The surface. Children stack with an even gap.",
      },
      {
        name: "CardTitle",
        type: "ComponentProps<\"h3\">",
        description: "The heading inside a card.",
      },
      {
        name: "CardDescription",
        type: "ComponentProps<\"p\">",
        description: "Muted body text under the title.",
      },
    ],
    usage: `import { Card, CardDescription, CardTitle } from "@/components/ui/card"

export function Demo() {
  return (
    <Card>
      <CardTitle>Storage</CardTitle>
      <CardDescription>You have used 3.2 GB of 10 GB.</CardDescription>
    </Card>
  )
}`,
  }),
  primitive("separator", {
    name: "Separator",
    category: "display",
    description: "A hairline that divides content, across or down.",
    interaction: "A thin, quiet line. By default screen readers skip it.",
    props: [
      {
        name: "orientation",
        type: '"horizontal" | "vertical"',
        default: '"horizontal"',
        options: ["horizontal", "vertical"],
        description: "Across the full width, or down the full height of its row.",
      },
      {
        name: "decorative",
        type: "boolean",
        default: "true",
        description: "Turn it off when the line marks a real break, so it is announced as a separator.",
      },
      classNameProp,
    ],
    usage: `import { Separator } from "@/components/ui/separator"

export function Demo() {
  return (
    <div className="flex h-5 items-center gap-3">
      Docs <Separator orientation="vertical" /> Blog
    </div>
  )
}`,
  }),
  primitive("progress", {
    name: "Progress",
    category: "feedback",
    description: "A slim bar that shows how far along a task is.",
    interaction:
      "The blue fill springs forward each time the value moves. With no value, a short bar sweeps across on a loop to show work is happening. Honors prefers-reduced-motion: the fill jumps and the sweep holds still.",
    props: [
      {
        name: "value",
        type: "number",
        description: "How far along, from 0 to max. Leave it unset for an indeterminate sweep.",
      },
      { name: "max", type: "number", default: "100", description: "The value that means done." },
      classNameProp,
    ],
    usage: `import { Progress } from "@/components/ui/progress"

export function Demo() {
  return <Progress value={64} aria-label="Upload" />
}`,
  }),
  primitive("skeleton", {
    name: "Skeleton",
    category: "feedback",
    description: "A soft placeholder block that stands in for content while it loads.",
    interaction:
      "A muted block with a gentle sheen that sweeps across it now and then. Screen readers skip it. Honors prefers-reduced-motion: the sheen is off.",
    props: [
      {
        name: "className",
        type: "string",
        description: "Set the size and shape here, for example h-4 w-32 or size-11 rounded-full.",
      },
    ],
    usage: `import { Skeleton } from "@/components/ui/skeleton"

export function Demo() {
  return <Skeleton className="h-4 w-40" />
}`,
  }),
];
