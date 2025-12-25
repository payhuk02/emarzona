# 🚀 Guide de Déploiement et Configuration

**Date** : 31 Janvier 2025  
**Objectif** : Guide complet pour déployer et configurer les nouvelles fonctionnalités

---

## 📋 TABLE DES MATIÈRES

1. [Templates Email](#1-templates-email)
2. [Edge Function Supabase](#2-edge-function-supabase)
3. [Cron Job Configuration](#3-cron-job-configuration)
4. [APIs Transporteurs](#4-apis-transporteurs)

---

## 1. TEMPLATES EMAIL

### Migration SQL

Exécuter la migration pour créer les templates email :

```bash
# Via Supabase CLI
supabase migration up 20250231_add_tracking_email_templates

# Ou via SQL Editor dans Supabase Dashboard
# Copier-coller le contenu de: supabase/migrations/20250231_add_tracking_email_templates.sql
```

### Vérification

Vérifier que les templates ont été créés :

```sql
SELECT slug, name, product_type, is_active 
FROM email_templates 
WHERE slug IN (
  'shipment-tracking-update',
  'shipment-delivered',
  'shipment-out-for-delivery'
);
```

### Templates Créés

- ✅ `shipment-tracking-update` - Mise à jour générale
- ✅ `shipment-delivered` - Colis livré
- ✅ `shipment-out-for-delivery` - En cours de livraison

---

## 2. EDGE FUNCTION SUPABASE

### Prérequis

- Supabase CLI installé
- Projet Supabase configuré
- Accès au projet Supabase

### Déploiement

```bash
# 1. Se connecter à Supabase
supabase login

# 2. Lier le projet
supabase link --project-ref YOUR_PROJECT_REF

# 3. Déployer la fonction
supabase functions deploy track-shipments
```

### Variables d'Environnement

Les variables suivantes sont automatiquement disponibles dans les Edge Functions :
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### Test Local

```bash
# Démarrer Supabase localement
supabase start

# Tester la fonction localement
supabase functions serve track-shipments
```

### Test de la Fonction

```bash
curl -X POST http://localhost:54321/functions/v1/track-shipments \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## 3. CRON JOB CONFIGURATION

### Via Supabase Dashboard

1. Aller dans **Database > Cron Jobs**
2. Cliquer sur **New Cron Job**
3. Configurer :

```sql
-- Nom du job
track-pending-shipments

-- Schedule (toutes les 5 minutes)
*/5 * * * *

-- Commande SQL
SELECT
  net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/track-shipments',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  ) AS request_id;
```

### Via SQL Direct

```sql
-- Activer l'extension pg_cron si nécessaire
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Créer le cron job
SELECT cron.schedule(
  'track-pending-shipments',
  '*/5 * * * *', -- Toutes les 5 minutes
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/track-shipments',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
```

### Vérification

Vérifier que le cron job est actif :

```sql
SELECT * FROM cron.job WHERE jobname = 'track-pending-shipments';
```

### Logs

Voir les logs d'exécution :

```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'track-pending-shipments')
ORDER BY start_time DESC 
LIMIT 10;
```

---

## 4. APIs TRANSPORTEURS

### Configuration Variables d'Environnement

Ajouter dans `.env` :

```env
# FedEx
VITE_FEDEX_API_KEY=your_fedex_api_key
VITE_FEDEX_API_SECRET=your_fedex_api_secret
VITE_FEDEX_ACCOUNT_NUMBER=your_account_number

# DHL
VITE_DHL_API_KEY=your_dhl_api_key

# UPS
VITE_UPS_CLIENT_ID=your_ups_client_id
VITE_UPS_CLIENT_SECRET=your_ups_client_secret

# Chronopost
VITE_CHRONOPOST_ACCOUNT_NUMBER=your_chronopost_account
VITE_CHRONOPOST_PASSWORD=your_chronopost_password
```

### Obtenir les Credentials

#### FedEx

1. Créer un compte sur [FedEx Developer Portal](https://developer.fedex.com/)
2. Créer une application
3. Obtenir `API Key` et `API Secret`
4. Obtenir le `Account Number` depuis votre compte FedEx

#### DHL

1. Créer un compte sur [DHL Developer Portal](https://developer.dhl.com/)
2. Créer une application
3. Obtenir l'`API Key`

#### UPS

1. Créer un compte sur [UPS Developer Portal](https://developer.ups.com/)
2. Créer une application
3. Obtenir `Client ID` et `Client Secret`

#### Chronopost

1. Contacter Chronopost pour obtenir les credentials API
2. Obtenir `Account Number` et `Password`

### Test des Adaptateurs

Les adaptateurs utilisent automatiquement la simulation si les credentials ne sont pas configurés.

Pour tester avec les vraies APIs :

1. Configurer les variables d'environnement
2. Redémarrer l'application
3. Les adaptateurs utiliseront automatiquement les vraies APIs

### Structure des Adaptateurs

Chaque adaptateur est dans un fichier séparé :
- `src/lib/shipping/carriers/fedex-adapter.ts`
- `src/lib/shipping/carriers/dhl-adapter.ts`
- `src/lib/shipping/carriers/ups-adapter.ts`
- `src/lib/shipping/carriers/chronopost-adapter.ts`

---

## ✅ CHECKLIST DE DÉPLOIEMENT

### Templates Email
- [ ] Migration SQL exécutée
- [ ] Templates créés dans la base de données
- [ ] Templates testés avec un envoi d'email

### Edge Function
- [ ] Fonction déployée sur Supabase
- [ ] Fonction testée localement
- [ ] Fonction testée en production

### Cron Job
- [ ] Extension `pg_cron` activée
- [ ] Cron job créé
- [ ] Cron job testé
- [ ] Logs vérifiés

### APIs Transporteurs
- [ ] Credentials obtenus pour chaque transporteur
- [ ] Variables d'environnement configurées
- [ ] Adaptateurs testés avec vraies APIs
- [ ] Gestion d'erreurs vérifiée

---

## 🔧 DÉPANNAGE

### Templates Email non trouvés

```sql
-- Vérifier que les templates existent
SELECT * FROM email_templates WHERE slug LIKE 'shipment%';

-- Si manquants, réexécuter la migration
```

### Edge Function ne répond pas

1. Vérifier les logs dans Supabase Dashboard > Functions > track-shipments > Logs
2. Vérifier que les variables d'environnement sont correctes
3. Tester la fonction localement

### Cron Job ne s'exécute pas

1. Vérifier que `pg_cron` est activé
2. Vérifier les logs : `SELECT * FROM cron.job_run_details`
3. Vérifier que l'URL de la fonction est correcte

### APIs Transporteurs ne fonctionnent pas

1. Vérifier les credentials dans les variables d'environnement
2. Vérifier les logs dans la console
3. Les adaptateurs utilisent automatiquement la simulation si les credentials sont manquants

---

**Date de dernière mise à jour** : 31 Janvier 2025  
**Statut** : ✅ Guide Complet

