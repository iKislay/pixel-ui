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
  primitive("input", {
    name: "Input",
    category: "inputs",
    description: "A soft text field that lifts on focus and shakes when invalid.",
    interaction:
      "Focus the field and it brightens with a blue ring. When it turns invalid the ring goes red and the field gives a short shake. Honors prefers-reduced-motion: the shake is skipped.",
    props: [
      {
        name: "invalid",
        type: "boolean",
        default: "false",
        description: "Marks the field invalid with a red ring and aria-invalid.",
      },
      feedbackProp('"error"'),
      classNameProp,
    ],
    usage: `import { Input } from "@/components/ui/input"

export function Demo() {
  return <Input type="email" placeholder="you@example.com" aria-label="Email" />
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
];
