import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16's caching model: "use cache" + cacheTag + cacheLife.
  cacheComponents: true,
};

export default nextConfig;
