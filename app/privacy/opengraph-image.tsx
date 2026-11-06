import { ogImage } from "@/lib/og";

export { size, contentType } from "@/lib/og";
export const alt = "Pixel UI privacy policy";

export default function Image() {
  return ogImage({
    title: "Privacy",
    italic: "policy",
    description: "No accounts, no ads, no tracking cookies. What we collect, who processes it, and how long we keep it.",
  });
}
