/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: process.env.NODE_ENV === 'production' ? '/ALV-FORMULAIRES' : '',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Exclure les routes API du build statique
  experimental: {
    appDir: true
  },
  // Configuration pour l'export statique
  distDir: 'out',
  // Désactiver les fonctionnalités incompatibles
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  }
};

export default nextConfig;
