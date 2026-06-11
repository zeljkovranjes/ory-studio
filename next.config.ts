import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone tracing needs symlinks, which Windows dev boxes typically
  // forbid — only the Docker image build (Linux) sets STANDALONE.
  output: process.env.STANDALONE ? "standalone" : undefined,
};

export default nextConfig;
