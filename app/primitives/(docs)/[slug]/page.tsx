import JsonLd from "@/components/JsonLd";
import PrimitiveDemo from "@/components/primitives/demos";
import { primitives } from "@/lib/primitives";
import { componentJsonLd, componentPageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return primitives.map((item) => ({ slug: item.registry }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return componentPageMetadata(`/primitives/${slug}`);
}

export default async function Page({ params }: Props) {
  const { slug } = await params;

  return (
    <>
      <JsonLd data={componentJsonLd(`/primitives/${slug}`)} />
      <div className="flex min-h-[500px] w-full items-center justify-center px-6">
        <PrimitiveDemo slug={slug} />
      </div>
    </>
  );
}
