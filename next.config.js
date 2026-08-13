/** @type {import('next').NextConfig} */

const nextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  productionBrowserSourceMaps: false,
  typescript: { ignoreBuildErrors: true },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "images.unsplash.com" }
    ]
  },
  serverExternalPackages: ["pdf-parse"],
};

module.exports = nextConfig;
