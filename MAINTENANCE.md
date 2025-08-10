# 🔧 Guide de Maintenance - Prévention des Régressions de Design

## 🚨 Problème Récurrent : Ancien Design qui Revient

**Symptômes :**
- L'ancien design (classes CSS `text-gray-800`, `text-gray-700`) réapparaît
- Le cache semble "se souvenir" de l'ancienne version
- Les modifications CSS ne sont pas prises en compte

## 🛠️ Solutions Automatiques

### 1. Script de Maintenance Principal
```bash
./maintenance-cache.sh
```
**Ce script :**
- Arrête tous les processus Next.js
- Nettoie complètement le cache
- Vérifie l'intégrité des fichiers critiques
- Restaure `globals.css` si corrompu
- Vérifie les dépendances

### 2. Commandes NPM Utiles

#### Nettoyage Simple
```bash
npm run clean          # Nettoie juste .next
npm run fresh          # Nettoie + rebuild + dev
npm run reset          # Reset complet (node_modules + cache)
```

#### Maintenance Avancée
```bash
npm run maintenance    # Exécute maintenance-cache.sh
npm run cache-clean    # Maintenance + redémarrage
npm run force-clean    # Force l'arrêt + maintenance + redémarrage
```

## 🔍 Vérification Pré-Build Automatique

Le script `pre-build-check.sh` s'exécute automatiquement avant chaque build et :
- ✅ Vérifie l'intégrité de `globals.css`
- ✅ Détecte les caches corrompus
- ✅ Nettoie les caches anciens (>1h)
- ✅ Vérifie les anciennes classes CSS
- ✅ Arrête les processus Next.js orphelins

## 🚀 Procédure Recommandée

### En Cas de Problème
1. **Arrêter le frontend** : `pkill -f "next dev"`
2. **Maintenance complète** : `npm run maintenance`
3. **Redémarrer** : `npm run dev`

### Maintenance Préventive
- Exécuter `npm run maintenance` une fois par jour
- Utiliser `npm run fresh` après des modifications importantes
- Vérifier que `app/globals.css` contient bien les directives Tailwind

## 📁 Fichiers Critiques

- `app/globals.css` - Styles globaux et variables CSS
- `tailwind.config.ts` - Configuration Tailwind
- `pre-build-check.sh` - Vérification automatique
- `maintenance-cache.sh` - Maintenance manuelle

## ⚠️ Points d'Attention

1. **Ne jamais modifier** `globals.css` manuellement sans vérifier le format
2. **Toujours utiliser** les variables CSS modernes (`--foreground`, `--background`)
3. **Éviter** les anciennes classes (`text-gray-800`, `text-gray-700`)
4. **Vérifier** que le cache est bien nettoyé après modifications

## 🔄 Cycle de Vie du Cache

```
Modification → Vérification pré-build → Cache nettoyé si nécessaire → Build → Nouveau cache
```

## 📞 En Cas de Problème Persistant

Si le problème persiste malgré la maintenance :
1. Vérifier qu'aucun processus Next.js ne tourne en arrière-plan
2. Redémarrer complètement l'ordinateur
3. Vérifier l'intégrité des fichiers avec `git status`
4. Exécuter `npm run reset` pour un reset complet

---

**💡 Conseil :** Utilisez toujours `npm run maintenance` avant de commencer à travailler sur le projet ! 