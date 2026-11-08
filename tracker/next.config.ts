import { join } from "node:path";
import type { NextConfig } from "next";

// The skills live one level up, in the Curiously folder: trace from there so the hosted copy can show them.
const root = join(__dirname, "..");

const nextConfig: NextConfig = {
  // Internal, login-gated app: every page is per-request, so Cache Components is off.
  serverExternalPackages: ["@libsql/client", "libsql"],
  outputFileTracingRoot: root,
  outputFileTracingIncludes: { "/**": ["../.claude/skills/**/SKILL.md", "../.claude/skills/**/LICENSE"] },
  turbopack: {
    root,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
