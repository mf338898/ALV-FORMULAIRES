#!/bin/bash

echo "🔧 Maintenance automatique du cache - Prévention des régressions de design"
echo "=================================================================="

# Arrêter tous les processus Next.js
echo "🛑 Arrêt des processus Next.js..."
pkill -f "next dev" > /dev/null 2>&1
pkill -f "next start" > /dev/null 2>&1
sleep 3

# Nettoyage complet du cache
echo "🧹 Nettoyage complet du cache..."
rm -rf .next
rm -rf node_modules/.cache
npm cache clean --force > /dev/null 2>&1

# Vérifier l'intégrité des fichiers critiques
echo "🔍 Vérification de l'intégrité des fichiers..."

# Vérifier globals.css
if ! grep -q "@tailwind base" "app/globals.css"; then
    echo "❌ ERREUR: globals.css corrompu - restauration..."
    # Restaurer le fichier (copie depuis le script pre-build-check.sh)
    cat > "app/globals.css" << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 3.9%;
    --primary: 0 0% 9%;
    --primary-foreground: 0 0% 98%;
    --secondary: 0 0% 96.1%;
    --secondary-foreground: 0 0% 9%;
    --muted: 0 0% 96.1%;
    --muted-foreground: 0 0% 45.1%;
    --accent: 0 0% 96.1%;
    --accent-foreground: 0 0% 9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 89.8%;
    --input: 0 0% 89.8%;
    --ring: 0 0% 3.9%;
    --chart-1: 12 76% 61%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;
    --chart-5: 27 87% 67%;
    --radius: 0.5rem;
    --sidebar-background: 0 0% 98%;
    --sidebar-foreground: 240 5.3% 26.1%;
    --sidebar-primary: 240 5.9% 10%;
    --sidebar-primary-foreground: 0 0% 98%;
    --sidebar-accent: 240 4.8% 95.9%;
    --sidebar-accent-foreground: 240 5.9% 10%;
    --sidebar-border: 220 13% 91%;
    --sidebar-ring: 217.2 91.2% 59.8%;
  }
  .dark {
    --background: 0 0% 3.9%;
    --foreground: 0 0% 98%;
    --card: 0 0% 3.9%;
    --card-foreground: 0 0% 98%;
    --popover: 0 0% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 0 0% 9%;
    --secondary: 0 0% 14.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 0 0% 14.9%;
    --muted-foreground: 0 0% 63.9%;
    --accent: 0 0% 14.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 14.9%;
    --input: 0 0% 14.9%;
    --ring: 0 0% 83.1%;
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;
    --sidebar-background: 240 5.9% 10%;
    --sidebar-foreground: 240 4.8% 95.9%;
    --sidebar-primary: 224.3 76.3% 48%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 240 3.7% 15.9%;
    --sidebar-accent-foreground: 240 4.8% 95.9%;
    --sidebar-border: 240 3.7% 15.9%;
    --sidebar-ring: 217.2 91.2% 59.8%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
EOF
    echo "✅ globals.css restauré"
fi

# Vérifier tailwind.config.ts
if ! grep -q "tailwindcss-animate" "tailwind.config.ts"; then
    echo "❌ ERREUR: tailwind.config.ts corrompu"
    exit 1
fi

# Supprimer les dossiers conflictuels
echo "🗑️  Suppression des dossiers conflictuels..."
rm -rf styles
rm -rf .cache

# Vérifier les dépendances
echo "📦 Vérification des dépendances..."
if [ ! -d "node_modules" ] || [ ! -f "package-lock.json" ]; then
    echo "⚠️  Dépendances manquantes - réinstallation..."
    npm install
fi

echo "✅ Maintenance terminée - le projet est prêt !"
echo ""
echo "💡 Pour démarrer le projet : npm run dev"
echo "💡 Pour un nettoyage complet : npm run fresh"
echo "💡 Pour la maintenance : ./maintenance-cache.sh" 