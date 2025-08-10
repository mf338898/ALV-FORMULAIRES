# 🚫 Prévention des Régressions de Design - ALV-FORMULAIRES

## 🚨 Pourquoi les Régressions de Design se Produisent

Les régressions de design dans ce projet Next.js sont principalement causées par :

### 1. **Corruption du Cache Next.js (`.next`)**
- Le dossier `.next` contient le cache de compilation et les assets statiques
- Quand il se corrompt, les styles CSS ne sont plus correctement générés
- Les composants shadcn/ui perdent leurs animations et styles

### 2. **Conflits de Fichiers CSS**
- Présence d'un dossier `styles/` concurrent avec `app/globals.css`
- Modification manuelle de `app/globals.css` qui supprime les directives Tailwind
- Conflits entre différents fichiers de configuration CSS

### 3. **Dépendances Manquantes ou Corrompues**
- `tailwindcss-animate` manquant (nécessaire pour les animations shadcn/ui)
- `node_modules` corrompus ou incomplets
- Versions incompatibles de Tailwind CSS

## 🛡️ Solutions Mises en Place

### Scripts de Prévention Automatique

#### `pre-build-check.sh`
- **Exécution automatique** avant chaque `npm run dev` et `npm run build`
- Vérifie l'intégrité de `app/globals.css`
- Restaure automatiquement le fichier s'il est corrompu
- Supprime le dossier `styles/` conflictuel
- Détecte et nettoie le cache corrompu

#### `health-check.sh`
- Vérification complète de la santé du projet
- Test de démarrage du serveur
- Diagnostic des problèmes potentiels

### Scripts NPM Améliorés

```bash
# Vérification de santé
npm run health

# Nettoyage du cache
npm run clean

# Reconstruction complète
npm run fresh

# Reset complet (en cas de problème majeur)
npm run reset
```

## 🔧 Utilisation Recommandée

### 1. **Avant de Commencer à Travailler**
```bash
npm run health
```

### 2. **En Cas de Problème de Design**
```bash
npm run clean
npm run dev
```

### 3. **Si le Problème Persiste**
```bash
npm run fresh
```

### 4. **En Dernier Recours**
```bash
npm run reset
```

## 📋 Checklist de Prévention

- [ ] Ne jamais modifier manuellement `app/globals.css`
- [ ] Ne jamais créer de dossier `styles/` concurrent
- [ ] Toujours utiliser `npm run clean` avant de commencer à travailler
- [ ] Vérifier que `tailwind.config.ts` contient `tailwindcss-animate`
- [ ] Utiliser `npm run health` pour diagnostiquer les problèmes

## 🚫 Ce qu'il NE FAUT PAS Faire

1. **Modifier `app/globals.css` manuellement** - Utiliser les composants Tailwind à la place
2. **Créer un dossier `styles/`** - Tout doit aller dans `app/globals.css`
3. **Supprimer les directives `@tailwind`** - Elles sont essentielles
4. **Ignorer les erreurs de build** - Toujours les résoudre avant de continuer

## 🔍 Diagnostic des Problèmes

### Symptômes de Régression de Design
- Les composants shadcn/ui perdent leurs animations
- Les couleurs et styles reviennent à l'état par défaut
- Les boutons et formulaires perdent leur apparence
- Erreurs `Cannot find module` dans la console

### Causes Probables
- Cache Next.js corrompu (`.next` folder)
- `app/globals.css` modifié ou supprimé
- Dossier `styles/` conflictuel
- Dépendances manquantes

## 🚀 Maintenance Préventive

### Quotidien
- Utiliser `npm run health` au début de la session
- Vérifier que le design est correct avant de commencer

### Hebdomadaire
- Exécuter `npm run clean` pour nettoyer le cache
- Vérifier l'intégrité des fichiers critiques

### Mensuel
- Exécuter `npm run fresh` pour une reconstruction complète
- Vérifier les mises à jour des dépendances

## 📞 En Cas de Problème Persistant

1. **Exécuter le diagnostic complet** : `npm run health`
2. **Nettoyer le cache** : `npm run clean`
3. **Reconstruire** : `npm run fresh`
4. **Si rien ne fonctionne** : `npm run reset`

## 🔒 Fichiers Critiques à Protéger

- `app/globals.css` - Styles globaux et directives Tailwind
- `tailwind.config.ts` - Configuration Tailwind CSS
- `next.config.mjs` - Configuration Next.js
- `package.json` - Dépendances et scripts

---

**💡 Rappel** : Les scripts de prévention s'exécutent automatiquement. En cas de problème, utilisez toujours `npm run health` pour diagnostiquer avant d'agir manuellement. 