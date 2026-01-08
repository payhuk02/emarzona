# 🚀 Guide de Redéploiement - Fonction Supabase Moneroo

**Date**: 2025-01-30  
**Fonction**: `moneroo`  
**Problème**: Erreurs CORS pour `api.emarzona.com`

---

## ⚠️ URGENCE

**Les erreurs CORS persistent car la fonction Supabase n'a pas été redéployée.**

Le code a été corrigé localement mais **Supabase utilise encore l'ancienne version** qui ne supporte pas `api.emarzona.com`.

---

## 📋 Méthode 1 : Supabase Dashboard (Recommandé - 2 minutes)

### ⚠️ IMPORTANT : Utiliser Edge Functions, PAS l'éditeur SQL !

**Ne pas utiliser** : Database → SQL Editor ❌  
**Utiliser** : Edge Functions → moneroo → Code ✅

### Étape 1 : Accéder à l'éditeur Edge Functions

1. **Dans Supabase Dashboard**, cliquer sur **"Edge Functions"** dans la barre latérale gauche (icône ⚡)
2. **Cliquer sur la fonction** `moneroo` dans la liste
3. **Cliquer sur l'onglet "Code"** (pas "Logs" ni "Settings")

**URL directe** : https://supabase.com/dashboard/project/hbdnzajbyjakdhuavrvb/functions/moneroo/code

### Étape 2 : Copier le code mis à jour

1. Dans votre projet local, ouvrir : `supabase/functions/moneroo/index.ts`
2. Sélectionner tout le contenu (Ctrl+A)
3. Copier (Ctrl+C)

### Étape 3 : Coller dans Supabase Dashboard

1. Dans l'éditeur Supabase Dashboard, sélectionner tout (Ctrl+A)
2. Coller le nouveau code (Ctrl+V)
3. Vérifier que le code est correct (lignes 29-36 doivent contenir la gestion de `api.emarzona.com`)

### Étape 4 : Déployer

1. Cliquer sur le bouton **"Deploy"** (ou **"Save"**)
2. Attendre le message de confirmation
3. Vérifier les logs pour confirmer le déploiement

### Étape 5 : Vérifier

1. Tester sur `https://api.emarzona.com/checkout`
2. Vérifier dans la console qu'il n'y a plus d'erreurs CORS

---

## 📋 Méthode 2 : Supabase CLI (Alternative)

### Prérequis

```bash
# Installer Supabase CLI (si pas déjà fait)
npm install -g supabase
```

### Commandes

```bash
# 1. Se connecter à Supabase
supabase login

# 2. Lier le projet (si pas déjà fait)
supabase link --project-ref hbdnzajbyjakdhuavrvb

# 3. Déployer la fonction
supabase functions deploy moneroo

# 4. Vérifier le déploiement
supabase functions list
```

---

## ✅ Code à Vérifier

Après le redéploiement, vérifier que la fonction contient bien :

```typescript
// Autoriser api.emarzona.com (sous-domaine API)
if (origin === 'https://api.emarzona.com' || origin === 'https://api.emarzona.com/') {
  return origin;
}

// Autoriser tout sous-domaine *.emarzona.com
if (origin.includes('.emarzona.com')) {
  return origin;
}
```

Ces lignes doivent être présentes dans la fonction `getCorsOrigin()` (lignes 29-36).

---

## 🔍 Vérification Post-Déploiement

### Test 1 : Vérifier les logs Supabase

1. Aller sur : https://supabase.com/dashboard/project/hbdnzajbyjakdhuavrvb/functions/moneroo/logs
2. Faire une requête depuis `https://api.emarzona.com/checkout`
3. Vérifier dans les logs que l'origine `https://api.emarzona.com` est acceptée

### Test 2 : Tester le paiement

1. Ouvrir `https://api.emarzona.com/checkout?productId=...`
2. Cliquer sur "Procéder au paiement"
3. Vérifier dans la console qu'il n'y a **plus d'erreurs CORS**
4. Le paiement devrait fonctionner

---

## 🐛 Dépannage

### Problème : "Function not found"

**Solution** : Vérifier que vous êtes sur le bon projet Supabase (hbdnzajbyjakdhuavrvb)

### Problème : "Deployment failed"

**Solution** : 
1. Vérifier la syntaxe du code TypeScript
2. Vérifier les logs d'erreur dans Supabase Dashboard
3. Réessayer le déploiement

### Problème : CORS persiste après déploiement

**Solution** :
1. Vider le cache du navigateur (Ctrl+Shift+Delete)
2. Attendre 1-2 minutes (propagation)
3. Vérifier que le code déployé contient bien les lignes pour `api.emarzona.com`

---

## 📝 Notes Importantes

1. **Temps de propagation** : Les changements peuvent prendre 1-2 minutes pour être effectifs
2. **Cache navigateur** : Vider le cache si les erreurs persistent
3. **Logs Supabase** : Toujours vérifier les logs pour diagnostiquer les problèmes

---

_Dernière mise à jour: 2025-01-30_
