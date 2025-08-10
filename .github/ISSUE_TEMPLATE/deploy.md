# Déploiement GitHub Pages

## Configuration requise

1. **Repository public** : Le repository doit être public pour GitHub Pages
2. **Branche main** : Le déploiement se fait depuis la branche main
3. **Workflow Actions** : Le workflow `.github/workflows/deploy.yml` doit être activé

## Étapes de déploiement

1. Pousser le code vers la branche main
2. Le workflow GitHub Actions se déclenche automatiquement
3. Le site est construit et déployé sur GitHub Pages
4. L'URL sera : `https://mf338898.github.io/ALV-FORMULAIRES/`

## Vérification

- [ ] Le workflow Actions s'est exécuté avec succès
- [ ] Le site est accessible sur GitHub Pages
- [ ] Les assets statiques se chargent correctement 