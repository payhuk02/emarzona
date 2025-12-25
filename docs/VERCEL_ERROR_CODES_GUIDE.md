# 🔍 GUIDE DES CODES D'ERREUR VERCEL - PAYHUK

**Date** : 28 janvier 2025  
**Version** : 1.0  
**Objectif** : Référence rapide pour diagnostiquer et résoudre les erreurs Vercel courantes

---

## 📋 ERREURS D'APPLICATION COURANTES

### ❌ `DEPLOYMENT_BLOCKED` (403)

**Cause** : Déploiement bloqué par une règle de protection

**Solutions** :
1. Vérifier les règles de protection dans Vercel Dashboard
2. Vérifier les branches protégées
3. Vérifier les conditions de déploiement

---

### ❌ `FUNCTION_INVOCATION_FAILED` (502)

**Cause** : Erreur dans une fonction serverless

**Solutions** :
1. Vérifier les logs Vercel pour l'erreur spécifique
2. Vérifier que le dossier `api/` existe si configuré
3. Vérifier les variables d'environnement
4. Vérifier les limites de mémoire/durée

**Exemple** : Si `vercel.json` contient `functions: { "api/**/*.ts": ... }` mais le dossier `api/` n'existe pas

---

### ❌ `RESOURCE_NOT_FOUND` (404)

**Cause** : Ressource non trouvée

**Solutions** :
1. Vérifier que le fichier existe
2. Vérifier les `rewrites` dans `vercel.json`
3. Vérifier les routes de l'application

---

### ❌ `INVALID_REQUEST_METHOD` (405)

**Cause** : Méthode HTTP non supportée

**Solutions** :
1. Vérifier que la méthode HTTP est correcte (GET, POST, etc.)
2. Vérifier les routes API

---

### ❌ `URL_TOO_LONG` (414)

**Cause** : URL trop longue

**Solutions** :
1. Réduire la longueur de l'URL
2. Utiliser POST au lieu de GET pour les données longues

---

### ❌ `BODY_NOT_A_STRING_FROM_FUNCTION` (502)

**Cause** : Le body retourné par une fonction n'est pas une string

**Solutions** :
1. Vérifier que les fonctions retournent des strings
2. Utiliser `JSON.stringify()` si nécessaire

---

## 🔧 ERREURS DE PLATEFORME

### ❌ `FUNCTION_THROTTLED` (429)

**Cause** : Trop de requêtes vers une fonction

**Solutions** :
1. Attendre quelques minutes
2. Réduire la fréquence des appels
3. Implémenter un rate limiting côté client

---

### ❌ `INTERNAL_UNEXPECTED_ERROR` (500)

**Cause** : Erreur interne Vercel

**Solutions** :
1. Vérifier le statut Vercel : https://vercel-status.com
2. Contacter le support Vercel
3. Réessayer le déploiement

---

### ❌ `INTERNAL_DEPLOYMENT_FETCH_FAILED` (500)

**Cause** : Échec de récupération du déploiement

**Solutions** :
1. Vérifier la connexion réseau
2. Réessayer le déploiement
3. Vérifier les logs de build

---

## 🛠️ ERREURS SPÉCIFIQUES PAYHUK

### ❌ Erreur après Phase 4 : Configuration `functions` inexistante

**Symptôme** : `Deployment failed` après ajout de configuration multi-region

**Cause** : Configuration `functions` pointant vers `api/**/*.ts` mais le dossier n'existe pas

**Solution** : Retirer la section `functions` de `vercel.json` si le dossier `api/` n'existe pas

```json
// ❌ AVANT (problématique)
{
  "functions": {
    "api/**/*.ts": {
      "maxDuration": 10,
      "memory": 1024
    }
  }
}

// ✅ APRÈS (corrigé)
{
  "regions": ["iad1", "sfo1", "fra1"]
  // Pas de functions si le dossier n'existe pas
}
```

---

### ❌ `Cannot read properties of undefined (reading 'forwardRef')`

**Symptôme** : Application fonctionne localement mais pas sur Vercel

**Cause** : Problème de code splitting ou d'ordre de chargement

**Solution** : Vérifier `vite.config.ts` - code splitting peut-être trop agressif

---

### ❌ `Cannot access 'P' before initialization`

**Symptôme** : Erreur de référence circulaire en production

**Cause** : Tree shaking trop agressif ou problèmes CommonJS

**Solution** : Ajuster `treeshake.moduleSideEffects` dans `vite.config.ts`

---

## 📊 DIAGNOSTIC RAPIDE

### Checklist de Diagnostic

1. **Vérifier les logs Vercel**
   ```bash
   vercel logs
   ```

2. **Vérifier le build local**
   ```bash
   npm run build
   ```

3. **Vérifier la configuration**
   - `vercel.json` valide JSON
   - Pas de références à des dossiers inexistants
   - Variables d'environnement configurées

4. **Vérifier le statut Vercel**
   - https://vercel-status.com

---

## 🔗 RESSOURCES

- **Documentation Vercel** : https://vercel.com/docs/errors
- **Support Vercel** : https://vercel.com/support
- **Status Vercel** : https://vercel-status.com

---

**Dernière mise à jour** : 28 janvier 2025


