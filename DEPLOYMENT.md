# 🚀 Déploiement sur GitHub Pages

## 📋 Prérequis

- Repository GitHub public
- Token d'accès GitHub avec permissions appropriées
- Node.js 18+ installé

## 🔧 Configuration

### 1. Variables d'environnement

Le projet est configuré pour utiliser automatiquement le bon `basePath` selon l'environnement :

- **Développement** : Pas de basePath
- **Production** : `/ALV-FORMULAIRES`

### 2. Configuration Next.js

Le fichier `next.config.mjs` est configuré pour :
- Exporter en statique (`output: 'export'`)
- Utiliser le bon basePath
- Désactiver l'optimisation des images
- Ajouter le trailing slash

## 🚀 Déploiement automatique

### Via GitHub Actions (Recommandé)

1. **Pousser le code** vers la branche `main`
2. **Le workflow se déclenche** automatiquement
3. **Le site est construit** et déployé
4. **URL finale** : `https://mf338898.github.io/ALV-FORMULAIRES/`

### Via ligne de commande

```bash
# Déploiement manuel
npm run deploy:gh-pages

# Ou étape par étape
npm run build:static
gh-pages -d out --dotfiles
```

## 📁 Structure de déploiement

```
out/
├── .nojekyll          # Désactive Jekyll
├── index.html         # Page d'accueil
├── _next/            # Assets Next.js
└── ...               # Autres pages et assets
```

## 🔍 Vérification

Après le déploiement, vérifiez :

- [ ] Le workflow GitHub Actions s'est exécuté avec succès
- [ ] Le site est accessible sur l'URL GitHub Pages
- [ ] Tous les assets se chargent correctement
- [ ] La navigation fonctionne
- [ ] Les formulaires et fonctionnalités marchent

## 🐛 Résolution de problèmes

### Erreur 404 sur les routes
- Vérifiez que `basePath` est correctement configuré
- Assurez-vous que `trailingSlash: true` est activé

### Assets non chargés
- Vérifiez que `assetPrefix` est configuré
- Assurez-vous que `images.unoptimized: true` est activé

### Problèmes de build
- Vérifiez que tous les composants sont compatibles avec l'export statique
- Assurez-vous que les API routes ne sont pas utilisées

## 📚 Ressources

- [Documentation GitHub Pages](https://docs.github.com/en/pages)
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [GitHub Actions pour Pages](https://github.com/actions/deploy-pages) 