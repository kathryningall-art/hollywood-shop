import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
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
      {
        protocol: "https",
        hostname: "kbeklbykufiifvzknihw.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  // 301 redirect old singular look URLs to the canonical plural route.
  // Keeps Pinterest pins, bookmarks, and any external links working.
  async redirects() {
    return [
      {
        source: "/star/:starSlug/:lookSlug",
        destination: "/stars/:starSlug/looks/:lookSlug",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
