import type { NextConfig } from "next";

// One release label for everything: Next.js uses deploymentId for version
// skew protection, and the vitals reporter sends it with every metric.
// (Next.js also writes it to <html data-dpl-id>, but its client runtime
// removes that attribute on startup, so the reporter can't read it there.)
const release = process.env.NEXT_DEPLOYMENT_ID ?? "local-dev";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  deploymentId: release,
  env: { NEXT_PUBLIC_RELEASE: release },
};

export default nextConfig;
