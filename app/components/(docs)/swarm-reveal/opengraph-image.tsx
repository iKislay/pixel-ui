import { componentOgAlt, componentOgImage } from "@/lib/og";

export { size, contentType } from "@/lib/og";

const HREF = "/components/swarm-reveal";

export const alt = componentOgAlt(HREF);

export default function Image() {
  return componentOgImage(HREF);
}
