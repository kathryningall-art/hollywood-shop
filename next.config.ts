import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/wikipedia/commons/**",
        search: "",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
        // allow ?text= query strings for placeholder images
      },
    ],
  },
};

export default nextConfig;
