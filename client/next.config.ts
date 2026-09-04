import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  env: {
    NEXT_API_URL: process.env.NEXT_API_URL || process.env.NEXT_PUBLIC_API_URL || '',
    NEXT_PUBLIC_API_URL: process.env.NEXT_API_URL || process.env.NEXT_PUBLIC_API_URL || '',
  },
};

export default nextConfig;
