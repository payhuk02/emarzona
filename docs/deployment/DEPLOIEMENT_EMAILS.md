# 🚀 DÉPLOIEMENT - Intégration Emails de Confirmation

**Date :** 1er Février 2025  
**Statut :** Guide de déploiement étape par étape

---

## ⚡ Déploiement rapide

### Étape 1 : Migrations SQL (5 minutes)

Exécuter dans Supabase Dashboard → SQL Editor (dans cet ordre) :

1. ✅ `20250201_fix_email_templates_complete_structure.sql`
2. ✅ `20250201_add_missing_email_templates.sql`
3. ✅ `20250201_auto_send_order_confirmation_emails.sql` (optionnel)

### Étape 2 : Déployer les fonctions (2 minutes)

```bash
# 1. Edge Function principale
supabase functions deploy send-order-confirmation-email

# 2. Webhooks mis à jour
supabase functions deploy moneroo-webhook
supabase functions deploy paydunya-webhook
```

### Étape 3 : Variables d'environnement (3 minutes)

Dans Supabase Dashboard → Edge Functions → Settings → Secrets

**Pour `send-order-confirmation-email` :**
- `SENDGRID_API_KEY` (obligatoire)

---

## 📋 Détails complets

Voir : `docs/guides/DEPLOIEMENT_STEP_BY_STEP.md`

---

**Guide créé le 1er Février 2025** ✅

