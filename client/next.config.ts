import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  env: {
    NEXT_API_URL: process.env.NEXT_API_URL || process.env.NEXT_PUBLIC_API_URL || '',
    NEXT_PUBLIC_API_URL: process.env.NEXT_API_URL || process.env.NEXT_PUBLIC_API_URL || '',
  },
  async rewrites() {
    const rawBackendUrl = process.env.NEXT_API_URL || process.env.NEXT_PUBLIC_API_URL;
    if (!rawBackendUrl) return [];

    const backendOrigin = rawBackendUrl.replace(/\/api(\/v1)?\/?$/, '').replace(/\/+$/, '');
    if (!backendOrigin || backendOrigin.includes('localhost') || backendOrigin.includes('127.0.0.1')) {
      return [];
    }

    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendOrigin}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
