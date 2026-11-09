import type { NextConfig } from "next";

const release = process.env.NEXT_DEPLOYMENT_ID ?? "local-dev";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  deploymentId: release,
  env: { NEXT_PUBLIC_RELEASE: release },
};

export default nextConfig;
