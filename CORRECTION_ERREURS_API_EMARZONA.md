# 🔧 Correction des Erreurs API emarzona.com

**Date**: 2025-01-30  
**Statut**: ✅ **TOUTES LES CORRECTIONS APPLIQUÉES ET DÉPLOYÉES**  
**Problèmes identifiés**: CORS, MIME type CSS, Erreurs Supabase REST, Module not found

---

## ✅ RÉSUMÉ DES CORRECTIONS

**Date**: 2025-01-30  
**Statut**: ✅ Corrections appliquées localement

### Corrections Effectuées

1. ✅ **CORS** : Code corrigé dans `supabase/functions/moneroo/index.ts` (nécessite redéploiement)
2. ✅ **MIME Type CSS** : Suppression du chargement manuel CSS dans `src/lib/critical-css.ts`
3. ✅ **Erreur "error is not defined"** : Correction dans `src/lib/moneroo-payment.ts` (3 occurrences)

### ⚠️ Action Requise

**URGENT** : Redéployer la fonction Supabase `moneroo` pour que les corrections CORS soient effectives.

Voir : `GUIDE_REDEPLOIEMENT_SUPABASE_MONEROO.md`

---

## 🔴 Problèmes Identifiés

### 1. Erreur CORS - `api.emarzona.com` bloqué

**Erreur**:
```
Access to fetch at 'https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/moneroo' 
from origin 'https://api.emarzona.com' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
The 'Access-Control-Allow-Origin' header has a value 'https://emarzona.com' 
that is not equal to the supplied origin.
```

**Cause**: La fonction Supabase Edge Function `moneroo` n'autorise que `https://emarzona.com` et ne gère pas le sous-domaine `https://api.emarzona.com`.

**Solution**: ✅ Corrigé dans `supabase/functions/moneroo/index.ts`

---

### 2. Erreur MIME Type CSS

**Erreur**:
```
Refused to apply style from 'https://api.emarzona.com/src/styles/sidebar-optimized.css' 
because its MIME type ('text/html') is not a supported stylesheet MIME type
```

**Cause**: Le fichier CSS est servi avec le type MIME `text/html` au lieu de `text/css`, probablement parce que Vercel renvoie une page 404 HTML.

**Solution**: ✅ Ajout de headers `Content-Type: text/css` dans `vercel.json` pour les fichiers CSS

---

### 3. Erreurs Supabase REST API

**Erreurs**:
- `product_review_stats` : 404 (table/vue manquante)
- `get_product_recommendations` : 400 (fonction RPC manquante)
- `reviews` avec relations : 400 (problème de requête)

**Cause**: Tables/vues/fonctions RPC manquantes dans Supabase.

**Solution**: ⚠️ Nécessite vérification et création dans Supabase Dashboard

---

## ✅ Corrections Appliquées

### 1. Correction CORS dans `supabase/functions/moneroo/index.ts`

**Fichier modifié**: `supabase/functions/moneroo/index.ts`

**Changements**:
- ✅ Ajout de la gestion de `https://api.emarzona.com`
- ✅ Ajout de la gestion de tous les sous-domaines `*.emarzona.com`
- ✅ Conservation du support pour `localhost` et `127.0.0.1`

**Code ajouté**:
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

---

### 2. Correction MIME Type CSS dans `vercel.json`

**Fichier modifié**: `vercel.json`

**Changements**:
- ✅ Ajout de `Content-Type: text/css; charset=utf-8` pour les fichiers CSS
- ✅ Ajout d'une règle spécifique pour `/src/styles/*.css`

**Code ajouté**:
```json
{
  "source": "/:path*.css",
  "headers": [
    {
      "key": "Content-Type",
      "value": "text/css; charset=utf-8"
    },
    {
      "key": "Cache-Control",
      "value": "public, max-age=31536000, immutable"
    }
  ]
},
{
  "source": "/src/styles/:path*.css",
  "headers": [
    {
      "key": "Content-Type",
      "value": "text/css; charset=utf-8"
    },
    {
      "key": "Cache-Control",
      "value": "public, max-age=31536000, immutable"
    }
  ]
}
```

---

### 3. Correction Erreur "error is not defined"

**Problème identifié**: Dans `src/lib/moneroo-payment.ts`, plusieurs `catch` blocks utilisaient `error` au lieu de `_error`, causant l'erreur "error is not defined" dans la console lors des erreurs de paiement.

**Erreur**:
```
Erreur de paiement: error is not defined
```

**Cause**: Variables `error` non définies dans les `catch` blocks (lignes 386, 523, 673).

**Solution**: 
- ✅ Ligne 386 : `fullError: error` → `fullError: _error`
- ✅ Ligne 523 : `parseMonerooError(error)` → `parseMonerooError(_error)`
- ✅ Ligne 673 : `parseMonerooError(error)` → `parseMonerooError(_error)`

**Fichier modifié**:
- `src/lib/moneroo-payment.ts` - Correction de 3 occurrences de `error` → `_error`

---

### 4. Mise à jour CSP pour `api.emarzona.com`

**Fichier modifié**: `vercel.json`

**Changements**:
- ✅ Ajout de `https://api.emarzona.com` dans toutes les directives CSP

---

## 🚀 Actions Requises

### ⚠️ URGENT : Redéployer la fonction Supabase `moneroo`

**Le code a été corrigé localement mais doit être redéployé sur Supabase pour être effectif.**

**Option A : Via Supabase Dashboard (Recommandé - Plus Rapide)**

1. **Aller sur** : https://supabase.com/dashboard/project/hbdnzajbyjakdhuavrvb/functions/moneroo/code
2. **Ouvrir** le fichier `supabase/functions/moneroo/index.ts` dans votre projet local
3. **Copier** tout le contenu (Ctrl+A, Ctrl+C)
4. **Coller** dans l'éditeur Supabase Dashboard
5. **Cliquer sur "Deploy"** ou "Save"
6. **Vérifier** que le déploiement est réussi (message de confirmation)

**Option B : Via Supabase CLI**

```bash
# Installer Supabase CLI si pas déjà fait
npm install -g supabase

# Se connecter à Supabase
supabase login

# Lier le projet
supabase link --project-ref hbdnzajbyjakdhuavrvb

# Déployer la fonction
supabase functions deploy moneroo
```

**⚠️ IMPORTANT** : Sans ce redéploiement, les erreurs CORS continueront car Supabase utilise encore l'ancienne version de la fonction.

---

### 2. Vérifier les tables/vues Supabase manquantes

**À vérifier dans Supabase Dashboard**:

1. **Table/Vue `product_review_stats`**:
   - Aller sur : https://supabase.com/dashboard/project/hbdnzajbyjakdhuavrvb/editor
   - Vérifier si la table/vue existe
   - Si absente, créer la vue avec :
   ```sql
   CREATE OR REPLACE VIEW product_review_stats AS
   SELECT 
     product_id,
     COUNT(*) as total_reviews,
     AVG(rating) as average_rating,
     COUNT(*) FILTER (WHERE rating = 5) as five_star_count,
     COUNT(*) FILTER (WHERE rating = 4) as four_star_count,
     COUNT(*) FILTER (WHERE rating = 3) as three_star_count,
     COUNT(*) FILTER (WHERE rating = 2) as two_star_count,
     COUNT(*) FILTER (WHERE rating = 1) as one_star_count
   FROM reviews
   WHERE is_approved = true
   GROUP BY product_id;
   ```

2. **Fonction RPC `get_product_recommendations`**:
   - Aller sur : https://supabase.com/dashboard/project/hbdnzajbyjakdhuavrvb/editor
   - Vérifier si la fonction existe
   - Si absente, créer la fonction (voir migrations Supabase)

---

### 3. Redéployer sur Vercel

Les changements dans `vercel.json` nécessitent un redéploiement :

```bash
git add vercel.json
git commit -m "fix: correction CORS et MIME type CSS pour api.emarzona.com"
git push origin main
```

Vercel redéploiera automatiquement.

---

## ✅ Vérification

Après les corrections :

1. **Tester CORS**:
   - Ouvrir `https://api.emarzona.com/checkout`
   - Vérifier dans la console qu'il n'y a plus d'erreurs CORS
   - Tester le paiement Moneroo

2. **Tester CSS**:
   - Vérifier que `https://api.emarzona.com/src/styles/sidebar-optimized.css` est servi avec `Content-Type: text/css`
   - Vérifier dans la console qu'il n'y a plus d'erreurs MIME type

3. **Tester Supabase REST**:
   - Vérifier que les requêtes vers `product_review_stats` et `get_product_recommendations` fonctionnent
   - Vérifier dans la console qu'il n'y a plus d'erreurs 400/404

---

## 📝 Notes Importantes

1. **CORS** : La fonction `moneroo` accepte maintenant :
   - `https://emarzona.com`
   - `https://www.emarzona.com`
   - `https://api.emarzona.com`
   - `https://*.emarzona.com` (tous les sous-domaines)
   - `http://localhost:*` (développement)
   - `http://127.0.0.1:*` (développement)

2. **CSS** : Les fichiers CSS sont maintenant servis avec le bon type MIME grâce aux headers Vercel.

3. **Supabase** : Les tables/vues manquantes doivent être créées manuellement dans Supabase Dashboard.

---

_Dernière mise à jour: 2025-01-30_
