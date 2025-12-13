# 🚨 INSTRUCTIONS URGENTES : Correction des Politiques RLS

**Date** : 1 Février 2025  
**Problème** : Les fichiers sont uploadés comme JSON au lieu d'images

---

## ⚠️ PROBLÈME IDENTIFIÉ

Les fichiers sont correctement détectés comme étant uploadés en JSON, mais **les politiques RLS dans Supabase bloquent l'upload**. Le code détecte le problème et empêche maintenant les retries inutiles, mais **vous devez corriger les politiques RLS dans Supabase**.

---

## 🔧 SOLUTION IMMÉDIATE

### Étape 1 : Ouvrir Supabase Dashboard

1. Allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. Allez dans **SQL Editor**

### Étape 2 : Exécuter la Migration SQL

Copiez et collez le contenu du fichier suivant dans l'éditeur SQL :

**Fichier** : `supabase/migrations/20250201_diagnose_and_fix_rls_attachments.sql`

Ou exécutez directement cette requête SQL :

```sql
-- ============================================================
-- CORRECTION COMPLÈTE DES POLITIQUES RLS
-- ============================================================

-- ÉTAPE 1 : S'assurer que le bucket est PUBLIC
UPDATE storage.buckets
SET
  public = true,
  allowed_mime_types = NULL
WHERE id = 'attachments';

-- ÉTAPE 2 : Supprimer toutes les anciennes politiques
DO $$
DECLARE
  policy_record RECORD;
  policies_dropped INTEGER := 0;
BEGIN
  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND (
        policyname ILIKE '%attachment%'
        OR qual::text ILIKE '%attachment%'
        OR with_check::text ILIKE '%attachment%'
      )
  LOOP
    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
      policies_dropped := policies_dropped + 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Erreur lors de la suppression de %: %', policy_record.policyname, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE '✅ % politique(s) supprimée(s)', policies_dropped;
END $$;

-- ÉTAPE 3 : Créer les politiques RLS CORRECTES

-- Politique 1: Lecture PUBLIQUE (CRITIQUE - doit être TO public)
CREATE POLICY "Anyone can view attachments"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'attachments');

-- Politique 2: Upload pour utilisateurs authentifiés
CREATE POLICY "Authenticated users can upload attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'attachments');

-- Politique 3: Mise à jour
CREATE POLICY "Users can update their own attachments"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'attachments')
WITH CHECK (bucket_id = 'attachments');

-- Politique 4: Suppression
CREATE POLICY "Users can delete their own attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'attachments');

-- ÉTAPE 4 : Vérification
DO $$
DECLARE
  bucket_is_public BOOLEAN;
  select_policy_exists BOOLEAN;
  insert_policy_exists BOOLEAN;
BEGIN
  -- Vérifier le bucket
  SELECT public INTO bucket_is_public
  FROM storage.buckets
  WHERE id = 'attachments';

  -- Vérifier les politiques
  SELECT EXISTS(
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Anyone can view attachments'
      AND cmd = 'SELECT'
      AND roles::text = '{public}'
  ) INTO select_policy_exists;

  SELECT EXISTS(
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Authenticated users can upload attachments'
      AND cmd = 'INSERT'
      AND roles::text = '{authenticated}'
  ) INTO insert_policy_exists;

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'VÉRIFICATION DES POLITIQUES RLS';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'Bucket public: %', CASE WHEN bucket_is_public THEN '✅ OUI' ELSE '❌ NON' END;
  RAISE NOTICE 'Politique SELECT (public): %', CASE WHEN select_policy_exists THEN '✅ OUI' ELSE '❌ NON' END;
  RAISE NOTICE 'Politique INSERT (authenticated): %', CASE WHEN insert_policy_exists THEN '✅ OUI' ELSE '❌ NON' END;
  RAISE NOTICE '═══════════════════════════════════════════════════════════';

  IF bucket_is_public AND select_policy_exists AND insert_policy_exists THEN
    RAISE NOTICE '✅ TOUT EST CORRECT ! Les politiques RLS sont bien configurées.';
  ELSE
    RAISE WARNING '❌ PROBLÈME DÉTECTÉ ! Vérifiez les configurations ci-dessus.';
  END IF;
END $$;
```

### Étape 3 : Vérifier les Résultats

Après avoir exécuté la migration, vous devriez voir dans les résultats :

```
✅ X politique(s) supprimée(s)
✅ TOUT EST CORRECT ! Les politiques RLS sont bien configurées.
```

### Étape 4 : Vérifier Manuellement dans le Dashboard

1. Allez dans **Storage > Buckets > "attachments"**
   - ✅ Vérifiez que **"Public bucket"** est activé (checkbox cochée)
   - ✅ Vérifiez que **"Allowed MIME types"** est vide

2. Allez dans **Storage > Buckets > "attachments" > Policies**
   - ✅ Vous devez voir **4 politiques** :
     - `Anyone can view attachments` (SELECT, public)
     - `Authenticated users can upload attachments` (INSERT, authenticated)
     - `Users can update their own attachments` (UPDATE, authenticated)
     - `Users can delete their own attachments` (DELETE, authenticated)

### Étape 5 : Attendre et Tester

1. **Attendez 2-3 minutes** pour que les changements se propagent
2. **Rechargez la page** de l'application
3. **Essayez d'uploader une image**
4. Vérifiez que l'image s'affiche correctement

---

## 🔍 Vérification Alternative (Si la migration ne fonctionne pas)

### Vérifier les Politiques Actuelles

Exécutez cette requête SQL pour voir les politiques actuelles :

```sql
SELECT
  policyname,
  cmd,
  roles::text as target_roles,
  qual::text as using_expression,
  with_check::text as with_check_expression
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname ILIKE '%attachment%'
ORDER BY cmd;
```

### Vérifier le Bucket

```sql
SELECT
  id,
  name,
  public,
  allowed_mime_types,
  file_size_limit
FROM storage.buckets
WHERE id = 'attachments';
```

**Résultat attendu** :

- `public = true`
- `allowed_mime_types = NULL`

---

## ⚠️ Points Critiques

### 1. Politique SELECT doit être pour "public"

Si la politique SELECT est pour "authenticated" au lieu de "public", les URLs publiques ne fonctionneront pas.

**Vérification** :

```sql
SELECT roles::text
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname = 'Anyone can view attachments'
  AND cmd = 'SELECT';
```

**Résultat attendu** : `{public}` (pas `{authenticated}`)

### 2. Politique INSERT doit être pour "authenticated"

Si la politique INSERT est pour "public" ou n'existe pas, les uploads seront bloqués.

**Vérification** :

```sql
SELECT roles::text
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname = 'Authenticated users can upload attachments'
  AND cmd = 'INSERT';
```

**Résultat attendu** : `{authenticated}`

### 3. Bucket doit être PUBLIC

Si le bucket n'est pas marqué comme PUBLIC, les URLs publiques ne fonctionneront pas.

**Vérification** :

```sql
SELECT public
FROM storage.buckets
WHERE id = 'attachments';
```

**Résultat attendu** : `true`

---

## 📞 Si le Problème Persiste

Si après avoir suivi toutes ces étapes le problème persiste :

1. **Vérifiez les logs Supabase** : Dashboard > Logs > API
2. **Vérifiez que l'utilisateur est authentifié** : Dans la console du navigateur, vérifiez que `supabase.auth.getUser()` retourne un utilisateur
3. **Vérifiez les métadonnées d'un fichier uploadé** :
   ```sql
   SELECT
     name,
     metadata->>'mimetype' as content_type,
     created_at
   FROM storage.objects
   WHERE bucket_id = 'attachments'
   ORDER BY created_at DESC
   LIMIT 5;
   ```
   Si `content_type` est `application/json`, les politiques RLS ne sont toujours pas correctes.

---

**Dernière mise à jour** : 1 Février 2025


