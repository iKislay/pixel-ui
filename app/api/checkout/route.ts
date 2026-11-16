import { POLAR_API, PRO_PRODUCT_ID } from "@/lib/pro";

export async function POST(request: Request) {
  const pricing = new URL("/pricing", request.url);

  try {
    const res = await fetch(`${POLAR_API}/v1/checkouts/`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        products: [PRO_PRODUCT_ID],
        success_url: `${pricing}?checkout=success`,
      }),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);

    const { url } = await res.json();
    return Response.redirect(url, 303);
  } catch (error) {
    console.error("checkout not created", error);
    return Response.redirect(`${pricing}?checkout=failed`, 303);
  }
}
