# 🔧 Résolution : Erreur validate_unified_promotion

**Date:** 28 Janvier 2025  
**Problème:** `function validate_unified_promotion() does not exist`

---

## ✅ Vérification Rapide

Si vous voyez dans Supabase que la requête suivante retourne la fonction :

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'validate_unified_promotion';
```

Alors **la fonction existe déjà** ! Le problème vient probablement d'autre chose.

---

## 🎯 Solutions selon le contexte

### Solution 1 : La fonction existe mais l'appel échoue

Si vous essayez d'appeler la fonction et que vous obtenez une erreur, utilisez la **signature complète** :

```sql
-- ✅ CORRECT - Avec tous les paramètres
SELECT validate_unified_promotion(
  'CODE123'::TEXT,
  NULL::UUID,
  NULL::UUID[],
  NULL::UUID[],
  NULL::UUID[],
  0::NUMERIC,
  NULL::UUID,
  FALSE::BOOLEAN
);
```

---

### Solution 2 : Recréer la fonction proprement

Si vous voulez être sûr que tout est correct, exécutez ce script complet :

**Fichier:** `supabase/migrations/20250128_SIMPLE_FIX_validate_function.sql`

1. Ouvrez ce fichier
2. Copiez **TOUT** le contenu
3. Collez dans Supabase SQL Editor
4. Exécutez (Run ou CTRL+Enter)

Ce script :

- Supprime toutes les anciennes versions
- Recrée la fonction complète
- Ajoute le commentaire avec la bonne signature
- Affiche un message de confirmation

---

### Solution 3 : Ajouter seulement le commentaire

Si la fonction existe déjà et que vous voulez juste ajouter le commentaire, utilisez :

```sql
COMMENT ON FUNCTION public.validate_unified_promotion(
  TEXT, UUID, UUID[], UUID[], UUID[], NUMERIC, UUID, BOOLEAN
) IS 'Fonction unifiée de validation de code promotionnel qui fonctionne avec product_promotions pour tous les types de promotions.';
```

**Important :** Il faut spécifier **tous les types de paramètres** dans l'ordre exact.

---

## 📋 Test Complet

Pour tester que tout fonctionne, exécutez cette séquence :

```sql
-- 1. Vérifier que la fonction existe
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'validate_unified_promotion'
  AND routine_schema = 'public';

-- 2. Vérifier la signature de la fonction
SELECT
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'validate_unified_promotion';

-- 3. Tester un appel (même avec un code qui n'existe pas)
SELECT validate_unified_promotion(
  'TESTCODE'::TEXT,
  NULL::UUID,
  NULL::UUID[],
  NULL::UUID[],
  NULL::UUID[],
  10000::NUMERIC,
  NULL::UUID,
  FALSE::BOOLEAN
);
```

---

## 🐛 Dépannage

### Erreur : "function validate_unified_promotion() does not exist"

**Causes possibles :**

1. La fonction n'a pas été créée
2. Vous essayez d'appeler la fonction sans paramètres
3. Le schéma n'est pas spécifié

**Solutions :**

- Vérifiez que la fonction existe avec la requête de vérification
- Utilisez toujours la signature complète avec tous les paramètres
- Préfixez avec `public.` si nécessaire

---

### Erreur lors du COMMENT ON FUNCTION

**Cause :** La signature dans le COMMENT ne correspond pas à la fonction réelle

**Solution :** Utilisez exactement la même signature :

```sql
-- Obtenir la signature exacte
SELECT pg_get_function_identity_arguments(oid)
FROM pg_proc
WHERE proname = 'validate_unified_promotion'
  AND pronamespace = 'public'::regnamespace;

-- Utiliser cette signature dans le COMMENT
COMMENT ON FUNCTION public.validate_unified_promotion(TEXT, UUID, UUID[], UUID[], UUID[], NUMERIC, UUID, BOOLEAN) IS '...';
```

---

## 📞 Si le problème persiste

1. Vérifiez que vous êtes sur le bon projet Supabase
2. Vérifiez que vous êtes sur le bon schéma (`public`)
3. Exécutez le script complet `20250128_SIMPLE_FIX_validate_function.sql`
4. Consultez les logs d'erreur détaillés dans Supabase

---

**Dernière mise à jour :** 28 Janvier 2025
