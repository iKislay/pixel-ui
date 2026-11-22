import { existsSync } from "node:fs";
import type { NextConfig } from "next";

const PUBLIC_CACHE = [
  {
    key: "Cache-Control",
    value: "public, max-age=345600, stale-while-revalidate=604800",
  },
];

const nextConfig: NextConfig = {
  // one shared clock for server and browser, so the new label never mismatches on hydration
  env: { BUILD_TIME: String(Date.now()) },
  turbopack: {
    resolveAlias: {
      "@pro/demos": existsSync("pro/demos/index.ts")
        ? "./pro/demos/index.ts"
        : "./lib/pro-fallback/demos.ts",
      "@pro/recordings": existsSync("pro/recordings/index.ts")
        ? "./pro/recordings/index.ts"
        : "./lib/pro-fallback/recordings.ts",
      "@pro/effects": existsSync("pro/effects/index.ts")
        ? "./pro/effects/index.ts"
        : "./lib/pro-fallback/effects.ts",
    },
  },
  async headers() {
    return [
      {
        source: "/:dir(logos|assets|fonts|brand)/:path*",
        headers: PUBLIC_CACHE,
      },
    ];
  },
};

export default nextConfig;
