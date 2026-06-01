import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  async redirects() {
    return [
      // Align legacy/alias auth path to the canonical /login route
      { source: "/signin", destination: "/login", permanent: false },
    ]
  },
};

export default nextConfig;
