import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "lumashape-image-space.sfo3.cdn.digitaloceanspaces.com",
      "lumashape-image-space.sfo3.digitaloceanspaces.com",
      "axionbucketmlb.s3.eu-north-1.amazonaws.com",
    ],
  },
};

export default nextConfig;