# 🚀 Guide de Déploiement Étape par Étape

**Date :** 1er Février 2025  
**Objectif :** Déployer l'intégration complète d'emails de confirmation

---

## 📋 Checklist pré-déploiement

- [ ] Avoir accès à Supabase Dashboard
- [ ] Avoir les clés API nécessaires (SendGrid)
- [ ] Backups de base de données à jour (recommandé)

---

## 🔧 ÉTAPE 1 : Exécuter les migrations SQL

### Migration 1 : Structure complète des templates

**Fichier :** `supabase/migrations/20250201_fix_email_templates_complete_structure.sql`

**Action :**
1. Ouvrir Supabase Dashboard
2. Aller dans **SQL Editor**
3. Créer une nouvelle query
4. Copier le contenu du fichier
5. Exécuter (Run ou Ctrl+Enter)

**Vérification :**
```sql
-- Vérifier que les colonnes existent
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'email_templates' 
AND column_name IN ('product_type', 'is_default');
```

✅ **Doit retourner 2 lignes**

---

### Migration 2 : Templates manquants

**Fichier :** `supabase/migrations/20250201_add_missing_email_templates.sql`

**Action :**
1. Toujours dans SQL Editor
2. Créer une nouvelle query
3. Copier le contenu du fichier
4. Exécuter

**Vérification :**
```sql
-- Vérifier que les templates sont créés
SELECT slug, name, product_type, is_active 
FROM email_templates 
WHERE slug IN (
  'order-confirmation-service',
  'course-enrollment-confirmation',
  'order-confirmation-artist'
);
```

✅ **Doit retourner 3 lignes**

---

### Migration 3 : Automatisation (Optionnel)

**Fichier :** `supabase/migrations/20250201_auto_send_order_confirmation_emails.sql`

**Action :**
1. Créer une nouvelle query
2. Copier le contenu
3. Exécuter

**Note :** Cette migration crée un trigger SQL optionnel. L'intégration dans les webhooks fonctionne sans ce trigger.

---

## 🚀 ÉTAPE 2 : Déployer l'Edge Function

### Commande à exécuter

```bash
supabase functions deploy send-order-confirmation-email
```

**Vérification :**
1. Aller dans Supabase Dashboard → Edge Functions
2. Vérifier que `send-order-confirmation-email` apparaît dans la liste
3. Cliquer dessus pour voir les détails

---

## 🔧 ÉTAPE 3 : Déployer les webhooks mis à jour

### Webhook Moneroo

```bash
supabase functions deploy moneroo-webhook
```

### Webhook PayDunya

```bash
supabase functions deploy paydunya-webhook
```

**Vérification :**
1. Aller dans Supabase Dashboard → Edge Functions
2. Vérifier que les deux webhooks sont listés
3. Vérifier les dates de dernière mise à jour

---

## ⚙️ ÉTAPE 4 : Configurer les variables d'environnement

### Pour `send-order-confirmation-email`

Dans Supabase Dashboard → Edge Functions → `send-order-confirmation-email` → Settings → Secrets :

| Variable | Description | Où trouver |
|----------|-------------|------------|
| `SUPABASE_URL` | URL de votre projet | Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé de service | Dashboard → Settings → API |
| `SENDGRID_API_KEY` | Clé API SendGrid | SendGrid Dashboard → Settings → API Keys |

### Pour `moneroo-webhook`

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Déjà configuré normalement |
| `SUPABASE_SERVICE_ROLE_KEY` | Déjà configuré normalement |
| `MONEROO_WEBHOOK_SECRET` | Déjà configuré normalement |
| `SITE_URL` | Déjà configuré normalement |

### Pour `paydunya-webhook`

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Déjà configuré normalement |
| `SUPABASE_SERVICE_ROLE_KEY` | Déjà configuré normalement |
| `SITE_URL` | Déjà configuré normalement |

---

## 🧪 ÉTAPE 5 : Tests

### Test 1 : Vérifier les templates

```sql
SELECT 
  slug,
  name,
  product_type,
  is_active,
  is_default
FROM email_templates
WHERE product_type IS NOT NULL
ORDER BY product_type, slug;
```

✅ **Doit retourner au moins 5 templates**

### Test 2 : Tester l'Edge Function manuellement

Dans Supabase Dashboard → Edge Functions → `send-order-confirmation-email` → Invoke :

```json
{
  "order_id": "UNE_COMMANDE_EXISTANTE_AVEC_PAYMENT_STATUS_PAID",
  "customer_email": "test@example.com",
  "customer_name": "Test User"
}
```

**Vérifier les logs** pour voir si l'email est envoyé.

### Test 3 : Test avec un paiement réel

1. Créer une commande de test
2. Procéder au paiement
3. Vérifier que l'email est envoyé automatiquement

---

## ✅ Vérification finale

### Checklist complète

- [ ] Migrations SQL exécutées sans erreur
- [ ] Edge Function `send-order-confirmation-email` déployée
- [ ] Webhook `moneroo-webhook` déployé
- [ ] Webhook `paydunya-webhook` déployé
- [ ] Variables d'environnement configurées
- [ ] Templates vérifiés en base
- [ ] Test manuel de l'Edge Function réussi

---

## 🆘 En cas de problème

### Erreur : "Template not found"
**Solution :** Réexécuter la migration `20250201_add_missing_email_templates.sql`

### Erreur : "Column does not exist"
**Solution :** Réexécuter la migration `20250201_fix_email_templates_complete_structure.sql`

### Erreur : "SendGrid API Key not configured"
**Solution :** Vérifier que `SENDGRID_API_KEY` est bien configuré dans les secrets

### Erreur : "Function not found"
**Solution :** Vérifier que l'Edge Function est bien déployée

---

## 📞 Support

Si des problèmes persistent :
1. Vérifier les logs dans Supabase Dashboard → Edge Functions → Logs
2. Vérifier les logs SendGrid pour les erreurs d'envoi
3. Vérifier que toutes les migrations sont appliquées

---

**Guide créé le 1er Février 2025** ✅

