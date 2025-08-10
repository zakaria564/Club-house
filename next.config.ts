
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'image.noelshack.com',
      },
      {
        protocol: 'https',
        hostname: 'liguefootcasa.ma',
      },
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
      }
    ],
  },
};

export default nextConfig;
