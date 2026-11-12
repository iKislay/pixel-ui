const FOCUSABLE_SELECTOR = [
  "a[href]",
  "area[href]",
  "button",
  "input:not([type=hidden])",
  "select",
  "textarea",
  "summary",
  "iframe",
  "audio[controls]",
  "video[controls]",
  "[contenteditable]:not([contenteditable=false])",
  "[tabindex]",
].join(",");

const NON_TEXT_INPUT_TYPES = [
  "button",
  "checkbox",
  "color",
  "file",
  "image",
  "radio",
  "range",
  "reset",
  "submit",
];

function isTabbable(el: HTMLElement): boolean {
  if (el.tabIndex < 0) return false;
  if (el.matches(":disabled")) return false;
  if (el.hasAttribute("hidden")) return false;
  if (el.closest("[inert]")) return false;
  if (el.getClientRects().length === 0) return false;
  return getComputedStyle(el).visibility !== "hidden";
}

type Tabbable = { el: HTMLElement; domIndex: number };

// positive tabindex sorts first in ascending order, everything else in DOM order
function byTabOrder(a: Tabbable, b: Tabbable): number {
  const aPositive = a.el.tabIndex > 0;
  const bPositive = b.el.tabIndex > 0;
  if (aPositive !== bPositive) return aPositive ? -1 : 1;
  if (aPositive && bPositive && a.el.tabIndex !== b.el.tabIndex)
    return a.el.tabIndex - b.el.tabIndex;
  return a.domIndex - b.domIndex;
}

export function getTabbables(root: ParentNode): HTMLElement[] {
  const candidates = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  return candidates
    .map((el, domIndex) => ({ el, domIndex }))
    .filter((entry) => isTabbable(entry.el))
    .sort(byTabOrder)
    .map((entry) => entry.el);
}

export function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (target.tagName === "TEXTAREA" || target.tagName === "SELECT") return true;
  if (target.tagName === "INPUT") {
    const type = (target as HTMLInputElement).type;
    return !NON_TEXT_INPUT_TYPES.includes(type);
  }
  return false;
}

function shorten(text: string): string {
  return text.length > 48 ? `${text.slice(0, 47).trimEnd()}...` : text;
}

export function accessibleName(el: HTMLElement): string {
  const labelledBy = el.getAttribute("aria-labelledby");
  if (labelledBy) {
    const text = labelledBy
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent ?? "")
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (text) return shorten(text);
  }

  const ariaLabel = el.getAttribute("aria-label")?.trim();
  if (ariaLabel) return shorten(ariaLabel);

  const labels = (el as { labels?: NodeListOf<HTMLLabelElement> }).labels;
  if (labels && labels.length > 0) {
    const text = labels[0].textContent?.replace(/\s+/g, " ").trim();
    if (text) return shorten(text);
  }

  const placeholder = el.getAttribute("placeholder")?.trim();
  if (placeholder) return shorten(placeholder);

  if (el instanceof HTMLImageElement && el.alt.trim()) return shorten(el.alt.trim());

  const title = el.getAttribute("title")?.trim();
  if (title) return shorten(title);

  const text = el.textContent?.replace(/\s+/g, " ").trim();
  if (text) return shorten(text);

  return el.getAttribute("role") ?? el.tagName.toLowerCase();
}
