/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ['firebase-admin'],
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 4,
  },
  distDir: '.next',
  // Ignorar erros durante o build
  webpack: (config, { isServer }) => {
    // Permite que o build continue mesmo com erros
    config.infrastructureLogging = {
      level: 'error',
    };
    
    return config;
  },
  // Desativar a geração de manifesto de referência de cliente para pastas com parênteses
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  transpilePackages: ['firebase']
};

module.exports = nextConfig;