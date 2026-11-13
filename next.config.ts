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
