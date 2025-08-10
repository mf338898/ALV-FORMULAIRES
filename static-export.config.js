/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: process.env.NODE_ENV === 'production' ? '/ALV-FORMULAIRES' : '',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Configuration spécifique pour GitHub Pages
  assetPrefix: process.env.NODE_ENV === 'production' ? '/ALV-FORMULAIRES' : '',
  // Désactiver la compression pour GitHub Pages
  compress: false,
  // Configuration des en-têtes pour GitHub Pages
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          }
        ]
      }
    ]
  }
};

module.exports = nextConfig; 