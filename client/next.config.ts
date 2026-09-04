import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  env: {
    NEXT_API_URL: process.env.NEXT_API_URL || process.env.NEXT_PUBLIC_API_URL || '',
    NEXT_PUBLIC_API_URL: process.env.NEXT_API_URL || process.env.NEXT_PUBLIC_API_URL || '',
  },
  async rewrites() {
    const rawBackendUrl = (process.env.NEXT_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://ss.api.sumoraai.in').trim();
    const backendOrigin = rawBackendUrl.replace(/\/api(\/v1)?\/?$/, '').replace(/\/+$/, '');

    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendOrigin}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
