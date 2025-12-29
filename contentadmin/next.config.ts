/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Allow production builds to successfully complete even if ESLint errors exist
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true, // avoids next/image strict optimization warnings
  },
};

export default nextConfig;
