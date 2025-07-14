import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // Security headers (CSP removed for Next.js compatibility)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ]
  },
  
  // Security redirects
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/login',
        permanent: false,
      },
      {
        source: '/.env',
        destination: '/404',
        permanent: false,
      },
      {
        source: '/config',
        destination: '/404',
        permanent: false,
      },
    ]
  },
  
  // Webpack config for Tesseract.js
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Handle Tesseract.js worker files
      config.externals = config.externals || []
      config.externals.push({
        'tesseract.js': 'tesseract.js'
      })
    }
    
    return config
  },
  
  // Additional compression and security
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
