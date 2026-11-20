import JsonLd from "@/components/JsonLd";
import ChartDemo from "@/components/charts/demos";
import { charts } from "@/lib/charts";
import { componentJsonLd, componentPageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return charts.map((item) => ({ slug: item.registry }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return componentPageMetadata(`/charts/${slug}`);
}

export default async function Page({ params }: Props) {
  const { slug } = await params;

  return (
    <>
      <JsonLd data={componentJsonLd(`/charts/${slug}`)} />
      <div className="flex min-h-[500px] w-full items-center justify-center px-6 py-10">
        <div className="w-full max-w-2xl">
          <ChartDemo slug={slug} />
        </div>
      </div>
    </>
  );
}
