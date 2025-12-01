# 🚀 GUIDE DE DÉPLOIEMENT - Intégration Emails

**Date :** 1er Février 2025  
**Mode :** Déploiement direct vers Supabase Cloud

---

## ⚡ Déploiement en 3 étapes

### ÉTAPE 1 : Migrations SQL (5-10 minutes)

**Action :** Exécuter dans Supabase Dashboard → SQL Editor

#### 1.1 Migration Structure
**Fichier :** `supabase/migrations/20250201_fix_email_templates_complete_structure.sql`
- Copier tout le contenu du fichier
- Coller dans SQL Editor
- Cliquer sur "Run" ou Ctrl+Enter
- ✅ Vérifier qu'il n'y a pas d'erreur

#### 1.2 Migration Templates
**Fichier :** `supabase/migrations/20250201_add_missing_email_templates.sql`
- Copier tout le contenu du fichier
- Coller dans SQL Editor (nouvelle query)
- Cliquer sur "Run"
- ✅ Vérifier qu'il n'y a pas d'erreur

#### 1.3 Migration Trigger (Optionnel)
**Fichier :** `supabase/migrations/20250201_auto_send_order_confirmation_emails.sql`
- Optionnel (l'intégration dans les webhooks fonctionne sans)
- Si vous voulez le trigger SQL aussi, exécuter ce fichier

---

### ÉTAPE 2 : Déployer les Edge Functions (2-3 minutes)

**Ouvrir un terminal dans le répertoire du projet et exécuter :**

```bash
# 1. Edge Function principale
supabase functions deploy send-order-confirmation-email

# 2. Webhook Moneroo (mis à jour)
supabase functions deploy moneroo-webhook

# 3. Webhook PayDunya (mis à jour)
supabase functions deploy paydunya-webhook
```

**⚠️ Important :** Assurez-vous d'être connecté à Supabase :
```bash
supabase login
```

---

### ÉTAPE 3 : Configurer les variables d'environnement (2 minutes)

**Dans Supabase Dashboard :**

1. Aller dans **Edge Functions** → **send-order-confirmation-email** → **Settings** → **Secrets**

2. Ajouter/ vérifier ces variables :

| Variable | Valeur | Où trouver |
|----------|--------|------------|
| `SUPABASE_URL` | `https://hbdnzajbyjakdhuavrvb.supabase.co` | Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` (votre clé) | Dashboard → Settings → API → service_role key |
| `SENDGRID_API_KEY` | `SG....` (votre clé) | SendGrid Dashboard → Settings → API Keys |

**Note :** `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont peut-être déjà configurés globalement.

---

## ✅ Vérifications post-déploiement

### Vérification 1 : Templates créés

```sql
SELECT slug, name, product_type, is_active 
FROM email_templates 
WHERE slug IN (
  'order-confirmation-service',
  'course-enrollment-confirmation',
  'order-confirmation-artist'
);
```

**Résultat attendu :** 3 lignes

---

### Vérification 2 : Edge Functions déployées

Dans Supabase Dashboard → Edge Functions :
- ✅ `send-order-confirmation-email` doit apparaître
- ✅ `moneroo-webhook` doit être à jour
- ✅ `paydunya-webhook` doit être à jour

---

### Vérification 3 : Test manuel (optionnel)

Dans Supabase Dashboard → Edge Functions → `send-order-confirmation-email` → Invoke :

```json
{
  "order_id": "VOTRE_ORDER_ID_DE_TEST",
  "customer_email": "test@example.com",
  "customer_name": "Test User"
}
```

Vérifier les logs pour voir si l'email est envoyé.

---

## 🆘 En cas d'erreur

### Erreur : "Not logged in"
```bash
supabase login
```

### Erreur : "Template not found"
→ Réexécuter la migration `20250201_add_missing_email_templates.sql`

### Erreur : "Column does not exist"
→ Réexécuter la migration `20250201_fix_email_templates_complete_structure.sql`

### Erreur : "SendGrid API Key not configured"
→ Vérifier les secrets dans Supabase Dashboard

---

## 📋 Checklist finale

- [ ] Migrations SQL exécutées
- [ ] Edge Functions déployées
- [ ] Variables d'environnement configurées
- [ ] Templates vérifiés
- [ ] Test effectué (optionnel)

---

## 🎉 C'est prêt !

Une fois toutes les étapes terminées, le système enverra automatiquement des emails de confirmation après chaque paiement réussi !

**📖 Documentation complète :** `docs/guides/DEPLOIEMENT_STEP_BY_STEP.md`

---

**Guide créé le 1er Février 2025** ✅

