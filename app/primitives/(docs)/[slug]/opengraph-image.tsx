import { componentOgImage } from "@/lib/og";

export { size, contentType } from "@/lib/og";

export const alt = "A Pixel UI primitive";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return componentOgImage(`/primitives/${slug}`);
}
