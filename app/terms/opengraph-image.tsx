import { ogImage } from "@/lib/og";

export { size, contentType } from "@/lib/og";
export const alt = "Pixel UI terms of service";

export default function Image() {
  return ogImage({
    title: "Terms of",
    italic: "service",
    description: "The terms for using Pixel UI: the component registry, the license it ships under, and the sponsorship that funds it.",
  });
}
