# 🚨 INSTRUCTIONS URGENTES - Création du Bucket "attachments"

## ⚠️ PROBLÈME CRITIQUE

**Erreur**: `File uploaded as JSON instead of image!`

**Cause**: Le bucket Supabase **"attachments" n'existe pas**.

**Impact**: ❌ **Tous les uploads de fichiers échouent**

---

## ✅ SOLUTION IMMÉDIATE (5 MINUTES)

### ÉTAPE 1: Ouvrir Supabase Dashboard

1. Allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Connectez-vous
3. Sélectionnez votre projet **Emarzona**

---

### ÉTAPE 2: Exécuter la Migration SQL

1. Dans le menu gauche, cliquez sur **SQL Editor**
2. Cliquez sur **New Query** (ou le bouton **+**)
3. **Copiez TOUT le contenu** du fichier ci-dessous
4. Collez-le dans l'éditeur SQL
5. Cliquez sur **Run** (ou `Ctrl+Enter` / `Cmd+Enter`)

---

### 📄 CONTENU DE LA MIGRATION SQL

```sql
-- ============================================================
-- CRÉATION ET CONFIGURATION COMPLÈTE DU BUCKET "attachments"
-- Date : 1 Février 2025
-- ============================================================

-- ÉTAPE 1 : Créer le bucket s'il n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'attachments') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'attachments',
      'attachments',
      true, -- PUBLIC (très important)
      10485760, -- 10MB
      NULL -- Pas de restrictions MIME
    );
    RAISE NOTICE '✅ Bucket "attachments" créé avec succès';
  ELSE
    RAISE NOTICE 'ℹ️ Le bucket "attachments" existe déjà';
    UPDATE storage.buckets
    SET public = true, allowed_mime_types = NULL
    WHERE id = 'attachments';
    IF FOUND THEN
      RAISE NOTICE '✅ Bucket "attachments" mis à jour (public + pas de restrictions MIME)';
    END IF;
  END IF;
END $$;

-- ÉTAPE 2 : Supprimer les anciennes politiques
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
        OR policyname ILIKE '%anyone%view%'
        OR policyname ILIKE '%authenticated%upload%'
      )
  LOOP
    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
      policies_dropped := policies_dropped + 1;
      RAISE NOTICE 'Suppression de la politique: %', policy_record.policyname;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Erreur lors de la suppression de la politique %: %', policy_record.policyname, SQLERRM;
    END;
  END LOOP;
  IF policies_dropped > 0 THEN
    RAISE NOTICE '✅ % politique(s) supprimée(s)', policies_dropped;
  ELSE
    RAISE NOTICE 'ℹ️ Aucune politique existante à supprimer';
  END IF;
END $$;

-- ÉTAPE 3 : Créer les politiques RLS

-- Politique 1: Lecture publique (CRITIQUE)
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
```

---

### ÉTAPE 3: Vérifier la Création

1. Allez dans **Storage** > **Buckets**
2. Vérifiez que **"attachments"** apparaît dans la liste
3. Cliquez sur **"attachments"**
4. **IMPORTANT**: Vérifiez que **"Public bucket"** est **COCHÉ** ✅
5. Si ce n'est pas le cas, cochez-le et cliquez sur **Save**

---

### ÉTAPE 4: Attendre et Tester

1. **Attendez 2-3 minutes** (délai de propagation Supabase)
2. Rechargez votre application (F5)
3. Essayez d'uploader une image dans un message
4. Vérifiez que l'image s'affiche correctement

---

## ✅ RÉSULTAT ATTENDU

Après l'exécution, vous devriez voir dans les logs SQL:

```
✅ Bucket "attachments" créé avec succès
✅ X politique(s) supprimée(s)
✅ CONFIGURATION COMPLÈTE ET CORRECTE !
```

---

## 🔍 VÉRIFICATION MANUELLE

Dans **Storage** > **Buckets** > **"attachments"** > **Policies**, vous devriez voir:

- ✅ "Anyone can view attachments" (SELECT)
- ✅ "Authenticated users can upload attachments" (INSERT)
- ✅ "Users can update their own attachments" (UPDATE)
- ✅ "Users can delete their own attachments" (DELETE)

---

## 🆘 SI ÇA NE FONCTIONNE PAS

1. Vérifiez que vous êtes connecté à Supabase
2. Vérifiez que vous avez les permissions admin
3. Regardez les logs SQL pour voir les erreurs
4. Essayez de créer le bucket manuellement dans **Storage** > **Buckets** > **New bucket**

---

**Fichier complet**: `supabase/migrations/20250201_create_and_configure_attachments_bucket.sql`
