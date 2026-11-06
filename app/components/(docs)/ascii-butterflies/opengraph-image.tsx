import { componentOgAlt, componentOgImage } from "@/lib/og";

export { size, contentType } from "@/lib/og";

const HREF = "/components/ascii-butterflies";

export const alt = componentOgAlt(HREF);

export default function Image() {
  return componentOgImage(HREF);
}
