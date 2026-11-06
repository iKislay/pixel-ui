import { componentOgAlt, componentOgImage } from "@/lib/og";

export { size, contentType } from "@/lib/og";

const HREF = "/components/theme-toggle";

export const alt = componentOgAlt(HREF);

export default function Image() {
  return componentOgImage(HREF);
}
