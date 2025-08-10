import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "phimimg.com",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
      },
      {
        protocol: "https",
        hostname: "img.phimapi.com",
      },
      {
        protocol: "https",
        hostname: "*.phimapi.com",
      },
    ],
    unoptimized: false,
  },
};

export default nextConfig;
