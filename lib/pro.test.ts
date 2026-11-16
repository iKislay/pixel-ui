import { afterEach, describe, expect, it, vi } from "vitest";
import { isBlocked, isLicensed, recordFailure, retryAfter } from "@/lib/pro";

function polar(status: number, body: unknown = {}) {
  const fetchMock = vi.fn(async () => Response.json(body, { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe("isLicensed", () => {
  it("accepts a granted key and caches it", async () => {
    const fetchMock = polar(200, { status: "granted" });
    expect(await isLicensed("granted-key", 0)).toBe(true);
    expect(await isLicensed("granted-key", 1000)).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("checks the key again once the cache expires", async () => {
    const fetchMock = polar(200, { status: "granted" });
    await isLicensed("expiring-key", 0);
    await isLicensed("expiring-key", 5 * 60_000 + 1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("rejects a key polar does not know", async () => {
    polar(404, { error: "ResourceNotFound" });
    expect(await isLicensed("unknown-key", 0)).toBe(false);
  });

  it("throws instead of granting when polar is down", async () => {
    polar(500);
    await expect(isLicensed("outage-key", 0)).rejects.toThrow();
  });

  it("scopes the check to the pro benefit", async () => {
    vi.stubEnv("POLAR_PRO_BENEFIT_ID", "benefit-1");
    const fetchMock = polar(200, { status: "granted" });
    await isLicensed("scoped-key", 0);
    const init = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(String(init[1].body)).benefit_id).toBe("benefit-1");
    vi.unstubAllEnvs();
  });
});

describe("failure limit", () => {
  it("blocks an ip after 20 bad keys until the window ends", () => {
    for (let i = 0; i < 19; i++) recordFailure("1.1.1.1", 0);
    expect(isBlocked("1.1.1.1", 0)).toBe(false);
    recordFailure("1.1.1.1", 0);
    expect(isBlocked("1.1.1.1", 0)).toBe(true);
    expect(retryAfter("1.1.1.1", 0)).toBe(600);
    expect(isBlocked("1.1.1.1", 10 * 60_000 + 1)).toBe(false);
  });
});
