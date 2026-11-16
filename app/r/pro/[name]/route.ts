import {
  isBlocked,
  isLicensed,
  PRO_KEY_ENV,
  recordFailure,
  retryAfter,
} from "@/lib/pro";
import { SITE_URL } from "@/lib/site";

const PRIVATE = { "cache-control": "private, no-store" };

const NAME = /^[a-z0-9][a-z0-9-]*$/;

function fail(status: number, message: string, headers?: HeadersInit) {
  return Response.json(
    { error: message, message },
    { status, headers: { ...PRIVATE, ...headers } },
  );
}

export async function GET(
  request: Request,
  ctx: RouteContext<"/r/pro/[name]">,
) {
  const name = (await ctx.params).name.replace(/\.json$/, "");
  if (!NAME.test(name)) return fail(404, `No Pro component named "${name}".`);

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isBlocked(ip)) {
    return fail(429, "Too many invalid license keys. Try again later.", {
      "retry-after": String(retryAfter(ip)),
    });
  }

  const key = request.headers
    .get("authorization")
    ?.match(/^Bearer\s+(\S+)$/i)?.[1];
  if (!key) {
    return fail(
      401,
      `Missing license key. Set ${PRO_KEY_ENV} in .env.local, or buy Pro at ${SITE_URL}/pricing.`,
    );
  }

  try {
    if (!(await isLicensed(key))) {
      recordFailure(ip);
      return fail(
        401,
        `This license key is invalid or revoked. Check ${PRO_KEY_ENV}, or get yours at ${SITE_URL}/pricing.`,
      );
    }
  } catch (error) {
    console.error("pro license check failed", error);
    return fail(503, "License check is unavailable. Try again in a minute.", {
      "retry-after": "60",
    });
  }

  const res = await fetch(
    `https://api.github.com/repos/${process.env.PRO_REGISTRY_REPO}/contents/public/r/${name}.json`,
    {
      headers: {
        accept: "application/vnd.github.raw+json",
        authorization: `Bearer ${process.env.PRO_GITHUB_TOKEN}`,
      },
      cache: "no-store",
    },
  );
  if (res.status === 404) return fail(404, `No Pro component named "${name}".`);
  if (!res.ok) {
    console.error("pro registry fetch failed", res.status);
    return fail(502, "Could not load the component. Try again in a minute.");
  }

  return new Response(res.body, {
    headers: { ...PRIVATE, "content-type": "application/json" },
  });
}
