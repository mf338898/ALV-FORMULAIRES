#!/bin/bash

echo "🦮 Démarrage du watchdog pour surveiller l'intégrité du projet..."

# Fonction pour vérifier l'intégrité
check_integrity() {
    local issues=0
    
    # Vérifier app/globals.css
    if [ ! -f "app/globals.css" ]; then
        echo "🚨 ALERTE: app/globals.css manquant !"
        issues=$((issues + 1))
    elif ! grep -q "@tailwind base" "app/globals.css"; then
        echo "🚨 ALERTE: app/globals.css corrompu - directives Tailwind manquantes !"
        issues=$((issues + 1))
    fi
    
    # Vérifier le dossier styles/ conflictuel
    if [ -d "styles" ]; then
        echo "⚠️  ALERTE: Dossier styles/ détecté - conflit potentiel !"
        issues=$((issues + 1))
    fi
    
    # Vérifier tailwind.config.ts
    if [ ! -f "tailwind.config.ts" ]; then
        echo "🚨 ALERTE: tailwind.config.ts manquant !"
        issues=$((issues + 1))
    elif ! grep -q "tailwindcss-animate" "tailwind.config.ts"; then
        echo "🚨 ALERTE: tailwindcss-animate manquant dans tailwind.config.ts !"
        issues=$((issues + 1))
    fi
    
    # Vérifier l'intégrité du cache
    if [ -d ".next" ] && [ ! -f ".next/build-manifest.json" ]; then
        echo "🚨 ALERTE: Cache Next.js corrompu détecté !"
        issues=$((issues + 1))
    fi
    
    if [ $issues -gt 0 ]; then
        echo ""
        echo "🚨 $issues problème(s) détecté(s) !"
        echo "💡 Exécutez 'npm run health' pour diagnostiquer et 'npm run clean' pour résoudre"
        return 1
    else
        echo "✅ Intégrité vérifiée - tout est en ordre"
        return 0
    fi
}

# Vérification initiale
echo "🔍 Vérification initiale..."
check_integrity

# Surveillance continue
echo "👀 Surveillance continue activée (Ctrl+C pour arrêter)..."
echo "⏰ Vérification toutes les 30 secondes..."
echo ""

while true; do
    sleep 30
    
    # Vérification silencieuse
    if ! check_integrity > /dev/null 2>&1; then
        echo ""
        echo "🚨 PROBLÈME DÉTECTÉ ! Exécution de la vérification complète..."
        check_integrity
        
        echo ""
        echo "🔄 Tentative de résolution automatique..."
        
        # Supprimer le dossier styles/ s'il existe
        if [ -d "styles" ]; then
            echo "🧹 Suppression du dossier styles/ conflictuel..."
            rm -rf styles
        fi
        
        # Nettoyer le cache corrompu
        if [ -d ".next" ] && [ ! -f ".next/build-manifest.json" ]; then
            echo "🧹 Nettoyage du cache corrompu..."
            rm -rf .next
        fi
        
        echo "✅ Résolution automatique terminée"
        echo "💡 Redémarrez le serveur avec 'npm run dev' si nécessaire"
    fi
done 