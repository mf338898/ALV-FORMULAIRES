# 🚀 Commandes Utiles - ALV-FORMULAIRES

## 🛡️ Prévention des Régressions de Design

### **Vérification de santé (recommandé au début de chaque session)**
```bash
npm run health
```

### **Nettoyage du cache (en cas de problème de design)**
```bash
npm run clean
npm run dev
```

### **Reconstruction complète (si le problème persiste)**
```bash
npm run fresh
```

### **Reset complet (en dernier recours)**
```bash
npm run reset
```

### **Surveillance continue (optionnel)**
```bash
npm run watchdog
```

## 🔧 Commandes de Développement

### **Démarrage du serveur**
```bash
npm run dev
```

### **Build de production**
```bash
npm run build
```

### **Démarrage en production**
```bash
npm run start
```

## 📚 Documentation

- **`PREVENTION-REGRESSIONS.md`** : Guide complet de prévention
- **`RESUME-PREVENTION.md`** : Résumé des mesures mises en place
- **`COMMANDES-UTILES.md`** : Ce guide des commandes

## 🚨 En Cas de Problème

1. **Le design a changé ?** → `npm run clean` puis `npm run dev`
2. **Erreur "Cannot find module" ?** → `npm run fresh`
3. **Problème persistant ?** → `npm run reset`
4. **Diagnostic ?** → `npm run health`

## 💡 Conseils

- **Toujours** utiliser `npm run health` au début de la session
- **Jamais** modifier manuellement `app/globals.css`
- **Jamais** créer de dossier `styles/`
- Les vérifications sont **automatiques** avant chaque build/dev

---

**🎯 Objectif : Plus jamais de régression de design !** 