#!/bin/bash

echo "🔍 Vérification pré-build pour éviter les régressions de design..."

# Fonction de nettoyage complet du cache
clean_cache_completely() {
    echo "🧹 Nettoyage complet du cache..."
    rm -rf .next
    rm -rf node_modules/.cache
    npm cache clean --force > /dev/null 2>&1
    echo "✅ Cache complètement nettoyé"
}

# Vérifier que app/globals.css contient les directives Tailwind essentielles
if ! grep -q "@tailwind base" "app/globals.css"; then
    echo "❌ ERREUR CRITIQUE: @tailwind base manquant dans app/globals.css"
    echo "🔄 Restauration du fichier globals.css..."
    
    # Restaurer le contenu correct de globals.css
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
    
    echo "✅ app/globals.css restauré"
    # Forcer le nettoyage du cache après restauration
    clean_cache_completely
fi

# Vérifier que tailwind.config.ts est correct
if ! grep -q "tailwindcss-animate" "tailwind.config.ts"; then
    echo "❌ ERREUR: tailwindcss-animate manquant dans tailwind.config.ts"
    exit 1
fi

# Supprimer le dossier styles/ s'il existe (cause de conflits)
if [ -d "styles" ]; then
    echo "⚠️  Suppression du dossier styles/ conflictuel..."
    rm -rf styles
fi

# Vérifier l'intégrité du cache et forcer le nettoyage si nécessaire
if [ -d ".next" ]; then
    if [ ! -f ".next/build-manifest.json" ] || [ ! -f ".next/static/chunks" ]; then
        echo "⚠️  Cache corrompu détecté - nettoyage forcé..."
        clean_cache_completely
    else
        # Vérifier l'âge du cache (si plus de 1 heure, le nettoyer)
        cache_age=$(find .next -maxdepth 0 -type d -printf '%T@\n' 2>/dev/null | head -1)
        if [ ! -z "$cache_age" ]; then
            current_time=$(date +%s)
            cache_age_seconds=$((current_time - ${cache_age%.*}))
            if [ $cache_age_seconds -gt 3600 ]; then
                echo "⚠️  Cache ancien détecté (>1h) - nettoyage préventif..."
                clean_cache_completely
            fi
        fi
    fi
fi

# Vérifier qu'aucun processus Next.js ne tourne en arrière-plan
if pgrep -f "next dev" > /dev/null; then
    echo "⚠️  Processus Next.js détecté - arrêt..."
    pkill -f "next dev" > /dev/null 2>&1
    sleep 2
fi

# Vérifier que les composants n'utilisent pas d'anciennes classes CSS
echo "🔍 Vérification des composants pour anciennes classes CSS..."
if find app components lib -name "*.tsx" -o -name "*.ts" | xargs grep -l "text-gray-[0-9]" > /dev/null 2>&1; then
    echo "⚠️  Anciennes classes CSS détectées - nettoyage du cache..."
    clean_cache_completely
fi

echo "✅ Vérification pré-build terminée - le projet est prêt pour la compilation" 