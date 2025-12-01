# 🚀 Guide de Déploiement - Intégration Emails dans Webhooks

**Date :** 1er Février 2025  
**Objectif :** Déployer l'intégration complète d'envoi automatique d'emails de confirmation

---

## ✅ Prérequis

Avant de déployer, s'assurer que :

1. ✅ **Migrations SQL appliquées** :
   - `20250201_fix_email_templates_complete_structure.sql`
   - `20250201_add_missing_email_templates.sql`
   - `20250201_auto_send_order_confirmation_emails.sql` (optionnel)

2. ✅ **Edge Function `send-order-confirmation-email` déployée** :
   ```bash
   supabase functions deploy send-order-confirmation-email
   ```

3. ✅ **Variables d'environnement configurées** :
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SENDGRID_API_KEY`

---

## 📦 Déploiement

### Étape 1 : Déployer les webhooks mis à jour

#### Webhook Moneroo
```bash
supabase functions deploy moneroo-webhook
```

#### Webhook PayDunya
```bash
supabase functions deploy paydunya-webhook
```

---

### Étape 2 : Vérifier les variables d'environnement

Dans Supabase Dashboard → Edge Functions → Settings → Secrets :

**Pour `moneroo-webhook` et `paydunya-webhook` :**
- `SUPABASE_URL` ✅
- `SUPABASE_SERVICE_ROLE_KEY` ✅
- `MONEROO_WEBHOOK_SECRET` (Moneroo seulement) ✅
- `SITE_URL` ✅

**Pour `send-order-confirmation-email` :**
- `SUPABASE_URL` ✅
- `SUPABASE_SERVICE_ROLE_KEY` ✅
- `SENDGRID_API_KEY` ✅

---

## 🧪 Tests

### Test 1 : Vérifier la fonction helper

Créer un test simple dans la console Supabase pour vérifier que la fonction récupère bien les emails :

```sql
-- Vérifier qu'une commande avec customer a bien un email
SELECT 
  o.id,
  o.order_number,
  o.customer_id,
  c.email,
  c.name
FROM orders o
LEFT JOIN customers c ON c.id = o.customer_id
WHERE o.payment_status = 'paid'
LIMIT 1;
```

### Test 2 : Tester l'Edge Function directement

Appeler l'Edge Function avec un order_id de test :

```bash
curl -X POST \
  'https://YOUR_PROJECT.supabase.co/functions/v1/send-order-confirmation-email' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "order_id": "TEST_ORDER_ID",
    "customer_email": "test@example.com",
    "customer_name": "Test User"
  }'
```

### Test 3 : Tester avec un paiement réel

1. Créer une commande de test avec un produit
2. Procéder au paiement
3. Simuler le webhook de paiement complété
4. Vérifier que l'email est envoyé

---

## 🔍 Vérification post-déploiement

### 1. Vérifier les logs

Dans Supabase Dashboard → Edge Functions → Logs :

**Webhook Moneroo :**
```
✅ Order confirmation emails sent for order {order_id}
```

**Webhook PayDunya :**
```
✅ Order confirmation emails sent for order {order_id}
```

**Edge Function send-order-confirmation-email :**
```
✅ Processing order confirmation emails for order {order_id}
✅ Email sent for {product_type} product
```

### 2. Vérifier les emails dans SendGrid

Dans SendGrid Dashboard → Activity :
- Vérifier que les emails sont envoyés
- Vérifier les taux de livraison
- Vérifier les erreurs éventuelles

### 3. Vérifier les logs d'emails en base

```sql
SELECT 
  el.*,
  et.slug as template_slug,
  et.name as template_name
FROM email_logs el
LEFT JOIN email_templates et ON et.id = el.template_id
WHERE el.order_id = 'YOUR_ORDER_ID'
ORDER BY el.sent_at DESC;
```

---

## ⚠️ Troubleshooting

### Problème : Emails non envoyés

**Vérifications :**
1. ✅ L'Edge Function `send-order-confirmation-email` est-elle déployée ?
2. ✅ La variable `SENDGRID_API_KEY` est-elle configurée ?
3. ✅ Les templates email existent-ils en base ?
4. ✅ L'email du client est-il disponible ?

**Logs à vérifier :**
```bash
# Voir les logs du webhook
supabase functions logs moneroo-webhook

# Voir les logs de l'Edge Function email
supabase functions logs send-order-confirmation-email
```

### Problème : Email du client non trouvé

**Causes possibles :**
- La commande n'a pas de `customer_id`
- Le `customer_id` ne correspond à aucun customer ou utilisateur
- L'email n'est pas renseigné dans la table `customers` ou `auth.users`

**Solution :**
- Vérifier que les commandes ont bien un `customer_id`
- Vérifier que les customers ont un email dans la table `customers`

### Problème : Template email manquant

**Vérification :**
```sql
SELECT slug, name, product_type, is_active
FROM email_templates
WHERE slug IN (
  'order-confirmation-digital',
  'order-confirmation-physical',
  'order-confirmation-service',
  'course-enrollment-confirmation',
  'order-confirmation-artist'
);
```

Si un template manque, exécuter la migration :
```sql
-- Exécuter : 20250201_add_missing_email_templates.sql
```

---

## 📊 Monitoring

### Métriques à surveiller

1. **Taux d'envoi d'emails** :
   - Nombre d'emails envoyés vs commandes payées
   - Délai entre paiement et envoi d'email

2. **Taux d'erreur** :
   - Erreurs d'envoi (SendGrid)
   - Erreurs de récupération d'email client
   - Erreurs de template manquant

3. **Performance** :
   - Temps de réponse des webhooks
   - Temps d'envoi des emails

### Requêtes SQL de monitoring

```sql
-- Taux d'envoi d'emails par type de produit
SELECT 
  el.product_type,
  COUNT(*) as emails_sent,
  COUNT(DISTINCT el.order_id) as orders_with_emails
FROM email_logs el
WHERE el.sent_at >= NOW() - INTERVAL '7 days'
GROUP BY el.product_type;

-- Commandes payées sans email envoyé
SELECT 
  o.id,
  o.order_number,
  o.customer_id,
  o.payment_status,
  o.created_at
FROM orders o
WHERE o.payment_status = 'paid'
  AND o.created_at >= NOW() - INTERVAL '7 days'
  AND NOT EXISTS (
    SELECT 1 FROM email_logs el 
    WHERE el.order_id = o.id
  );
```

---

## ✅ Checklist finale

- [ ] Migrations SQL appliquées
- [ ] Edge Function `send-order-confirmation-email` déployée
- [ ] Variables d'environnement configurées
- [ ] Webhook Moneroo déployé et mis à jour
- [ ] Webhook PayDunya déployé et mis à jour
- [ ] Tests effectués avec succès
- [ ] Logs vérifiés
- [ ] Monitoring configuré

---

## 🎉 Résultat attendu

Après déploiement complet :

✅ **Dès qu'un paiement est complété :**
1. Le webhook met à jour la commande
2. Les notifications sont créées
3. **Les emails de confirmation sont envoyés automatiquement**
4. Un email approprié est envoyé pour chaque type de produit

**Le système est maintenant complètement automatisé ! 🚀**

---

**Guide créé le 1er Février 2025** ✅

