import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Multi-document claims allow up to MAX_CLAIM_DOCS (10) files at 5MB each,
      // so the Server Action body must accommodate the full batch + overhead.
      bodySizeLimit: "55mb",
    },
  },
};

export default nextConfig;
