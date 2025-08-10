/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration normale pour Vercel (toutes les fonctionnalités)
  images: {
    unoptimized: false
  },
  // Activer toutes les fonctionnalités
  serverExternalPackages: ['pdf-lib']
};

export default nextConfig;
