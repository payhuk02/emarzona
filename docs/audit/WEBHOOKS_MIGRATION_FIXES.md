# 🔧 CORRECTIONS DES MIGRATIONS WEBHOOKS

## Date: 2025-01-28

---

## ✅ CORRECTIONS EFFECTUÉES

### 1. Migration Cron Job (`20250128_webhook_delivery_cron.sql`)

**Erreur initiale:** `could not find valid entry for job 'process-webhook-deliveries'`

**Solution:** Ajout d'un bloc `EXCEPTION` pour gérer le cas où le cron job n'existe pas encore :

```sql
BEGIN
  PERFORM cron.unschedule('process-webhook-deliveries');
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Le cron job n'existe pas encore, c'est normal
END;
```

**Status:** ✅ Corrigé

---

### 2. Migration d'Unification - Conversion Type Events

**Erreur initiale:** `column "events" is of type webhook_event_type[] but expression is of type text[]`

**Solution:**

- Création d'une fonction helper `convert_enum_array_to_text_array()` pour convertir ENUM[] vers TEXT[]
- Conversion forcée de la colonne `events` avant les insertions
- Utilisation de la fonction dans `USING` pour éviter les sous-requêtes

```sql
CREATE OR REPLACE FUNCTION public.convert_enum_array_to_text_array(enum_array anyarray)
RETURNS TEXT[]
LANGUAGE plpgsql
IMMUTABLE
AS $$ ... $$;

ALTER TABLE public.webhooks
ALTER COLUMN events TYPE TEXT[]
USING public.convert_enum_array_to_text_array(events);
```

**Status:** ✅ Corrigé

---

### 3. Migration d'Unification - Colonne `name` manquante

**Erreur initiale:** `column "name" does not exist` dans `physical_product_webhooks`

**Solution:** Génération d'un nom basé sur `event_type` au lieu de référencer une colonne inexistante :

```sql
-- Avant (incorrect)
COALESCE(name, 'Physical Product Webhook') as name,

-- Après (correct)
'Physical Product Webhook - ' || event_type as name,
```

**Status:** ✅ Corrigé

---

### 4. Migration d'Unification - Colonne `failure_count` manquante

**Erreur initiale:** `column "failure_count" of relation "webhooks" does not exist`

**Solution:** Ajout d'une vérification conditionnelle pour gérer le cas où la colonne n'existe pas encore :

```sql
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'webhooks'
      AND column_name = 'failure_count'
  ) THEN
    -- Mettre à jour avec failure_count
    UPDATE ... SET failure_count = ...;
  ELSE
    -- Mettre à jour sans failure_count
    UPDATE ... (sans failure_count);
  END IF;
END $$;
```

**Status:** ✅ Corrigé

---

## 📋 ORDRE D'EXÉCUTION DES MIGRATIONS

**IMPORTANT:** Exécuter les migrations dans cet ordre :

1. **`20250128_webhooks_system_consolidated.sql`**
   - Crée/consolide la structure de base
   - Définit les types ENUM et les tables
   - Crée les fonctions RPC

2. **`20250128_webhook_delivery_cron.sql`**
   - Configure le cron job pour traitement automatique
   - Crée les fonctions de traitement

3. **`20250128_migrate_webhooks_to_unified.sql`**
   - Convertit la colonne `events` de ENUM[] vers TEXT[]
   - Migre les données des anciens systèmes
   - Crée la table de mapping

---

## ⚠️ NOTES IMPORTANTES

1. **Conversion de colonne:** La conversion de `events` de ENUM[] vers TEXT[] peut prendre du temps si la table contient beaucoup de données.

2. **Cron Job:** Si `pg_cron` n'est pas disponible, configurez le cron job manuellement via Supabase Dashboard.

3. **Vérifications:** Après chaque migration, vérifier :
   - Que les tables existent
   - Que les colonnes ont le bon type
   - Que les données ont été migrées correctement

---

## 🧪 TESTS RECOMMANDÉS

### Test 1: Vérifier la conversion de colonne

```sql
SELECT
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'webhooks'
  AND column_name = 'events';
-- Devrait retourner: data_type = 'ARRAY', udt_name = 'text'
```

### Test 2: Vérifier les webhooks migrés

```sql
SELECT
  COUNT(*) as total,
  metadata->>'source' as source
FROM webhooks
WHERE metadata->>'source' IN ('digital_product_webhooks', 'physical_product_webhooks')
GROUP BY metadata->>'source';
```

### Test 3: Vérifier le cron job

```sql
SELECT * FROM cron.job WHERE jobname = 'process-webhook-deliveries';
```

---

**Date:** 2025-01-28  
**Version:** 1.0  
**Status:** ✅ Toutes les erreurs corrigées
