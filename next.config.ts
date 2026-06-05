import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/settlement/form16": ["./templates/settlement/form16.xlsx"],
  },
};

export default nextConfig;
