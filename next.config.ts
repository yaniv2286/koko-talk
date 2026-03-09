import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Force Webpack instead of Turbopack for stability
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Simplified chunk configuration to prevent memory issues
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
          },
        },
      };
    }
    return config;
  },
  experimental: {
    // Optimize package imports to prevent aggressive code splitting
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
};

export default nextConfig;
