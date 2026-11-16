import { SITE_URL } from "@/lib/site";

export const PRO_PRICE = 99;

export const PRO_REGISTRY = "@pixel-ui-pro";

export const PRO_KEY_ENV = "PIXEL_UI_PRO_KEY";

export const PRO_REGISTRY_URL = `${SITE_URL}/r/pro/{name}`;

export const PRO_COMPONENTS_JSON = `{
  "registries": {
    "${PRO_REGISTRY}": {
      "url": "${PRO_REGISTRY_URL}",
      "headers": { "Authorization": "Bearer \${${PRO_KEY_ENV}}" }
    }
  }
}`;

export const PRO_ENV = `${PRO_KEY_ENV}=your_license_key`;

export const PRO_PRODUCT_ID =
  process.env.POLAR_PRO_PRODUCT_ID ?? "eed65490-f302-4b17-b709-2b36972d95c0";

export const POLAR_API = process.env.POLAR_API_URL ?? "https://api.polar.sh";

const VALID_TTL = 5 * 60_000;

const INVALID_TTL = 60_000;

const MAX_CACHED = 10_000;

const cache = new Map<string, { valid: boolean; until: number }>();

// shortcut: cache lives per server instance, move to a shared store if polar rate limits us
export async function isLicensed(key: string, now = Date.now()) {
  const hit = cache.get(key);
  if (hit && hit.until > now) return hit.valid;

  const res = await fetch(`${POLAR_API}/v1/license-keys/validate`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      key,
      organization_id: process.env.POLAR_ORGANIZATION_ID,
      benefit_id: process.env.POLAR_PRO_BENEFIT_ID,
    }),
    cache: "no-store",
  });

  // polar answers 404 for unknown, revoked, disabled, expired or other-benefit keys
  if (res.status !== 200 && res.status !== 404) {
    throw new Error(`polar validate failed: ${res.status}`);
  }
  const valid =
    res.status === 200 && (await res.json()).status === "granted";

  if (cache.size >= MAX_CACHED) cache.clear();
  cache.set(key, { valid, until: now + (valid ? VALID_TTL : INVALID_TTL) });
  return valid;
}

const FAILURE_WINDOW = 10 * 60_000;

const MAX_FAILURES = 20;

const failures = new Map<string, { count: number; until: number }>();

export function isBlocked(ip: string, now = Date.now()) {
  const entry = failures.get(ip);
  return Boolean(entry && entry.until > now && entry.count >= MAX_FAILURES);
}

export function recordFailure(ip: string, now = Date.now()) {
  const entry = failures.get(ip);
  if (failures.size >= MAX_CACHED) failures.clear();
  failures.set(
    ip,
    entry && entry.until > now
      ? { count: entry.count + 1, until: entry.until }
      : { count: 1, until: now + FAILURE_WINDOW },
  );
}

export function retryAfter(ip: string, now = Date.now()) {
  const entry = failures.get(ip);
  return entry ? Math.max(1, Math.ceil((entry.until - now) / 1000)) : 1;
}
