
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
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer, webpack }) => { // Added 'webpack' to destructuring
    // Fix for 'async_hooks' module not found error, often from OpenTelemetry
    if (!isServer) {
      // Ensure config.resolve object exists
      if (!config.resolve) {
        config.resolve = {};
      }
      // Ensure config.resolve.fallback object exists
      if (!config.resolve.fallback) {
        config.resolve.fallback = {};
      }
      // Set the fallback for async_hooks to false
      config.resolve.fallback.async_hooks = false;

      // Add IgnorePlugin as a more forceful measure for async_hooks
      // The 'webpack' object here is the webpack instance provided by Next.js
      if (webpack && typeof webpack.IgnorePlugin === 'function') {
        config.plugins.push(
          new webpack.IgnorePlugin({
            resourceRegExp: /^async_hooks$/,
          })
        );
      }
    }
    return config;
  },
};

export default nextConfig;
