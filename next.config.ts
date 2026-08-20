import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const backendHost = process.env.BACKEND_INTERNAL_URL || "https://backend-production-873b.up.railway.app";
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendHost}/api/v1/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
