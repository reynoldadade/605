import type { NextConfig } from "next";

// REACT_COMPILER=0 builds the same app without the compiler, into its own
// folder, so scripts/measure.mts can compare the two.
const compilerOn = process.env.REACT_COMPILER !== "0";

const nextConfig: NextConfig = {
  reactCompiler: compilerOn,
  distDir: compilerOn ? ".next" : ".next-no-compiler",
};

export default nextConfig;
