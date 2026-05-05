import type { NextConfig } from "next";

const clinicPulseApiBaseUrl =
  process.env.CLINICPULSE_API_BASE_URL || "http://localhost:8080";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
        pathname: "/**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/clinicpulse/:path*",
        destination: `${clinicPulseApiBaseUrl.replace(/\/+$/g, "")}/:path*`,
      },
    ];
  },
};

export default nextConfig;
