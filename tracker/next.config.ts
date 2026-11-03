import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Internal, login-gated app: every page is per-request, so Cache Components is off.
  serverExternalPackages: ["@libsql/client", "libsql"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
