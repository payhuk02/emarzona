# 🔍 Requête pour Voir la Structure Réelle de `email_logs`

**Date** : 30 Janvier 2025

---

## 📊 Voir Toutes les Colonnes Disponibles

Exécutez cette requête pour voir **toutes les colonnes** de la table `email_logs` :

```sql
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'email_logs'
ORDER BY ordinal_position;
```

---

## 🔍 Requête Simple pour Voir les Données

Une fois que vous connaissez les colonnes disponibles, utilisez cette requête simple :

```sql
SELECT *
FROM public.email_logs
WHERE campaign_id = '4f3d3b29-7643-4696-8139-3b49feed4d36'
ORDER BY created_at DESC
LIMIT 10;
```

Cette requête utilisera `*` pour sélectionner toutes les colonnes disponibles, évitant ainsi les erreurs de colonnes manquantes.

---

## 📝 Colonnes Probablement Disponibles (d'après les erreurs)

D'après les erreurs rencontrées, voici ce qui existe et ce qui n'existe pas :

### ✅ Colonnes qui EXISTENT :

- `id`
- `to_email` (pas `recipient_email`)
- `subject`
- `campaign_id`
- `sequence_id`
- `created_at`
- `user_id`
- `template_id`
- `metadata` (jsonb)

### ❌ Colonnes qui N'EXISTENT PAS :

- `recipient_email` (utiliser `to_email`)
- `sendgrid_status`
- `sent_at` (utiliser `created_at`)
- `delivered_at`
- `opened_at`
- `clicked_at`

---

## 🎯 Requête Corrigée (Sans Colonnes Manquantes)

```sql
SELECT
  id,
  to_email,
  subject,
  created_at,
  campaign_id,
  sequence_id,
  template_id,
  user_id,
  metadata
FROM public.email_logs
WHERE campaign_id = '4f3d3b29-7643-4696-8139-3b49feed4d36'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 💡 Note Importante

La structure réelle de `email_logs` est différente de celle documentée dans les migrations. Cela peut indiquer que :

1. Les migrations n'ont pas toutes été exécutées
2. La table a été modifiée manuellement
3. Il y a plusieurs versions de la table dans différents environnements

**Solution** : Utilisez `SELECT *` pour voir toutes les colonnes disponibles, puis adaptez vos requêtes en conséquence.
