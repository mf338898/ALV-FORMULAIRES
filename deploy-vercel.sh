#!/bin/bash

echo "🚀 Déploiement Vercel - ALV FORMULAIRES"
echo "========================================"

# Vérifier que Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI non trouvé. Installation..."
    npm install -g vercel
fi

# Build du projet
echo "🔨 Construction du projet..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build réussi !"
else
    echo "❌ Erreur lors du build"
    exit 1
fi

# Déploiement
echo "🚀 Déploiement sur Vercel..."
vercel --prod

echo "🎉 Déploiement terminé !"
echo "📱 Vérifiez votre site sur Vercel"
echo "🔧 N'oubliez pas de configurer vos variables d'environnement" 