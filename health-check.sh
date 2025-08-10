#!/bin/bash

echo "🔍 Vérification de santé du projet ALV-FORMULAIRES..."

# Vérifier que les fichiers critiques existent
echo "📁 Vérification des fichiers critiques..."
if [ ! -f "app/globals.css" ]; then
    echo "❌ app/globals.css manquant !"
    exit 1
fi

if [ ! -f "tailwind.config.ts" ]; then
    echo "❌ tailwind.config.ts manquant !"
    exit 1
fi

if [ ! -f "next.config.mjs" ]; then
    echo "❌ next.config.mjs manquant !"
    exit 1
fi

# Vérifier le contenu de globals.css
echo "📝 Vérification du contenu de globals.css..."
if ! grep -q "@tailwind base" "app/globals.css"; then
    echo "❌ @tailwind base manquant dans globals.css !"
    exit 1
fi

if ! grep -q "@tailwind components" "app/globals.css"; then
    echo "❌ @tailwind components manquant dans globals.css !"
    exit 1
fi

if ! grep -q "@tailwind utilities" "app/globals.css"; then
    echo "❌ @tailwind utilities manquant dans globals.css !"
    exit 1
fi

# Vérifier qu'il n'y a pas de dossier styles/ qui pourrait causer des conflits
if [ -d "styles" ]; then
    echo "⚠️  Dossier styles/ détecté - suppression..."
    rm -rf styles
fi

# Vérifier l'intégrité du cache Next.js
echo "🧹 Vérification du cache Next.js..."
if [ -d ".next" ]; then
    echo "📊 Taille du cache: $(du -sh .next | cut -f1)"
    
    # Vérifier s'il y a des erreurs dans le cache
    if [ -f ".next/build-manifest.json" ]; then
        echo "✅ build-manifest.json présent"
    else
        echo "⚠️  build-manifest.json manquant - cache corrompu détecté"
        echo "🧹 Nettoyage du cache..."
        rm -rf .next
    fi
else
    echo "ℹ️  Aucun cache Next.js détecté"
fi

# Vérifier les dépendances
echo "📦 Vérification des dépendances..."
if [ ! -d "node_modules" ]; then
    echo "❌ node_modules manquant !"
    echo "🔄 Installation des dépendances..."
    npm install
fi

# Vérifier que le serveur peut démarrer (version améliorée)
echo "🚀 Test de démarrage du serveur..."
# Arrêter tout serveur existant
pkill -f "next dev" 2>/dev/null || true
sleep 2

# Démarrer le serveur en arrière-plan
npm run dev > /dev/null 2>&1 &
SERVER_PID=$!

# Attendre plus longtemps pour le démarrage
echo "⏳ Attente du démarrage du serveur..."
sleep 8

# Vérifier si le serveur répond
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Serveur démarré et répond avec succès"
    # Arrêter le serveur de test
    kill $SERVER_PID 2>/dev/null || true
    sleep 2
else
    echo "❌ Échec du démarrage du serveur"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi

echo "✅ Vérification de santé terminée avec succès !"
echo ""
echo "💡 Conseils pour éviter les régressions de design :"
echo "   1. Utilisez 'npm run clean' pour nettoyer le cache"
echo "   2. Utilisez 'npm run fresh' pour reconstruire complètement"
echo "   3. Évitez de modifier app/globals.css manuellement"
echo "   4. Vérifiez que tailwind.config.ts est correct"
echo "   5. Assurez-vous qu'il n'y a pas de dossier styles/ concurrent"
echo "   6. Utilisez './health-check.sh' pour diagnostiquer les problèmes" 