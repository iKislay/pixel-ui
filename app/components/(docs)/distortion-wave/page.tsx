import JsonLd from "@/components/JsonLd";
import ProDemo from "@/components/ProDemo";
import { componentJsonLd, componentPageMetadata } from "@/lib/seo";

const HREF = "/components/distortion-wave";

export const metadata = componentPageMetadata(HREF);

export default function Page() {
  return (
    <>
      <JsonLd data={componentJsonLd(HREF)} />
      <ProDemo name="distortion-wave" />
    </>
  );
}
