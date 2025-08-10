#!/bin/bash

echo "🧹 Nettoyage du cache Next.js..."
rm -rf .next

echo "🔨 Reconstruction du projet..."
npm run build

echo "🚀 Redémarrage du serveur..."
npm run dev 