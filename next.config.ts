import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // Security headers
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    
    // More permissive CSP for development (Next.js needs unsafe-inline and unsafe-eval)
    const devCSP = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob:; font-src 'self' https://fonts.gstatic.com data:; connect-src 'self' https://*.supabase.co https://api.google.com wss://*.supabase.co ws://localhost:* http://localhost:*; worker-src 'self' blob: https://unpkg.com; object-src 'none'; base-uri 'self'; form-action 'self';";
    
    // Strict CSP for production
    const prodCSP = "default-src 'self'; script-src 'self' https://unpkg.com; style-src 'self' https://fonts.googleapis.com; img-src 'self' data: https: blob:; font-src 'self' https://fonts.gstatic.com data:; connect-src 'self' https://*.supabase.co https://api.google.com wss://*.supabase.co; worker-src 'self' blob: https://unpkg.com; object-src 'none'; base-uri 'self'; form-action 'self';";
    
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
          {
            key: 'Content-Security-Policy',
            value: isDev ? devCSP : prodCSP,
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
