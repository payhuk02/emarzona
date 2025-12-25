# ✅ Requête Finale Corrigée pour `email_logs`

**Date** : 30 Janvier 2025  
**Structure Réelle Confirmée** : 14 colonnes

---

## 📊 Structure Réelle de `email_logs`

D'après la requête de schéma, voici les colonnes disponibles :

1. `id` (uuid, NOT NULL)
2. `user_id` (uuid, nullable)
3. `template_id` (uuid, nullable)
4. `to_email` (text, NOT NULL) ✅
5. `subject` (text, NOT NULL)
6. `status` (text, nullable) ✅ (pas `sendgrid_status`)
7. `sendgrid_message_id` (text, nullable)
8. `error_message` (text, nullable)
9. `opened_at` (timestamp with time zone, nullable)
10. `clicked_at` (timestamp with time zone, nullable)
11. `metadata` (jsonb, nullable)
12. `created_at` (timestamp with time zone, nullable) ✅ (utiliser pour `sent_at`)
13. `campaign_id` (uuid, nullable) ✅
14. `sequence_id` (uuid, nullable)

---

## ✅ Requête Corrigée pour Voir les Logs d'Emails

```sql
SELECT 
  id,
  to_email,
  subject,
  status,
  sendgrid_message_id,
  error_message,
  opened_at,
  clicked_at,
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

## 🔍 Vérifier si des Emails ont été Créés

```sql
SELECT 
  COUNT(*) as total_logs,
  COUNT(CASE WHEN status IS NOT NULL THEN 1 END) as with_status,
  COUNT(CASE WHEN sendgrid_message_id IS NOT NULL THEN 1 END) as with_sendgrid_id,
  MIN(created_at) as first_log,
  MAX(created_at) as last_log
FROM public.email_logs
WHERE campaign_id = '4f3d3b29-7643-4696-8139-3b49feed4d36';
```

---

## 📊 Voir Tous les Détails (Version Complète)

```sql
SELECT *
FROM public.email_logs
WHERE campaign_id = '4f3d3b29-7643-4696-8139-3b49feed4d36'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🎯 Mapping des Colonnes

| Colonne Documentée | Colonne Réelle | Notes |
|-------------------|----------------|-------|
| `recipient_email` | `to_email` | ✅ Utiliser `to_email` |
| `sendgrid_status` | `status` | ✅ Utiliser `status` |
| `sent_at` | `created_at` | ✅ Utiliser `created_at` |
| `delivered_at` | ❌ N'existe pas | Vérifier dans `metadata` ou `status` |
| `opened_at` | `opened_at` | ✅ Existe |
| `clicked_at` | `clicked_at` | ✅ Existe |

---

## 💡 Notes Importantes

1. **`status`** : Contient probablement le statut SendGrid (`queued`, `sent`, `delivered`, `bounced`, etc.)
2. **`created_at`** : Timestamp de création = moment où l'email a été envoyé
3. **`metadata`** : JSONB qui peut contenir des informations supplémentaires (delivered_at, etc.)
4. **`sendgrid_message_id`** : ID unique de SendGrid pour le tracking

---

## 🔍 Vérifier le Contenu de `metadata`

Si vous voulez voir ce qui est stocké dans `metadata` :

```sql
SELECT 
  id,
  to_email,
  subject,
  status,
  metadata,
  created_at
FROM public.email_logs
WHERE campaign_id = '4f3d3b29-7643-4696-8139-3b49feed4d36'
ORDER BY created_at DESC
LIMIT 5;
```

---

**Dernière mise à jour** : 30 Janvier 2025

