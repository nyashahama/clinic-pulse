import type { NextConfig } from "next";

import { validateFrontendRuntimeEnv } from "./lib/runtime/frontend-env";

const frontendEnv = validateFrontendRuntimeEnv();
const clinicPulseApiBaseUrl = frontendEnv.apiBaseUrl;

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  devIndicators: false,
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
