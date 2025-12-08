# ⏰ Configuration Cron Job pour Campagnes Programmées

**Date** : 30 Janvier 2025  
**Fonction** : `process-scheduled-campaigns`

---

## 📋 Vue d'Ensemble

L'Edge Function `process-scheduled-campaigns` vérifie et envoie automatiquement les campagnes email programmées. Elle doit être appelée périodiquement via un cron job.

---

## 🔧 Configuration Supabase Cron Jobs

### Option 1 : Via Supabase Dashboard (Recommandé)

1. **Accéder à Supabase Dashboard**
   - Allez sur https://supabase.com/dashboard
   - Sélectionnez votre projet

2. **Créer un Cron Job**
   - Allez dans **Database** > **Cron Jobs**
   - Cliquez sur **New Cron Job**

3. **Configurer le Cron Job**
   ```sql
   -- Nom du cron job
   process_scheduled_email_campaigns
   
   -- Schedule (toutes les 5 minutes)
   0,5,10,15,20,25,30,35,40,45,50,55 * * * *
   
   -- Commande
   SELECT net.http_post(
     url := 'https://your-project.supabase.co/functions/v1/process-scheduled-campaigns',
     headers := jsonb_build_object(
       'Content-Type', 'application/json',
       'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
     ),
     body := jsonb_build_object('limit', 10)
   );
   ```

### Option 2 : Via Migration SQL

Créez un fichier de migration `supabase/migrations/YYYYMMDDHHMMSS_setup_email_campaigns_cron.sql` :

```sql
-- Créer le cron job pour traiter les campagnes programmées
-- Exécute toutes les 5 minutes

SELECT cron.schedule(
  'process-scheduled-email-campaigns',
  '0,5,10,15,20,25,30,35,40,45,50,55 * * * *', -- Toutes les 5 minutes
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/process-scheduled-campaigns',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object('limit', 10)
  );
  $$
);
```

**Note** : Assurez-vous que l'extension `pg_cron` est activée dans votre projet Supabase.

---

## ⚙️ Configuration Alternative : External Cron Service

Si Supabase Cron Jobs n'est pas disponible, utilisez un service externe :

### Option A : GitHub Actions (Gratuit)

Créez `.github/workflows/process-scheduled-campaigns.yml` :

```yaml
name: Process Scheduled Email Campaigns

on:
  schedule:
    # Toutes les 5 minutes
    - cron: '*/5 * * * *'
  workflow_dispatch: # Permet l'exécution manuelle

jobs:
  process-campaigns:
    runs-on: ubuntu-latest
    steps:
      - name: Call Edge Function
        run: |
          curl -X POST \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -d '{"limit": 10}' \
            https://your-project.supabase.co/functions/v1/process-scheduled-campaigns
```

### Option B : Vercel Cron Jobs

Si vous déployez sur Vercel, ajoutez dans `vercel.json` :

```json
{
  "crons": [
    {
      "path": "/api/cron/process-scheduled-campaigns",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

Créez `api/cron/process-scheduled-campaigns.ts` :

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const response = await fetch(
    `${process.env.SUPABASE_URL}/functions/v1/process-scheduled-campaigns`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ limit: 10 }),
    }
  );

  const data = await response.json();
  return res.status(200).json(data);
}
```

---

## 🔍 Vérification

### Tester le Cron Job

1. **Créer une campagne de test**
   - Créez une campagne avec `status: 'scheduled'`
   - Définissez `scheduled_at` à une date/heure proche (dans 1-2 minutes)

2. **Vérifier les logs**
   - Supabase Dashboard > Edge Functions > `process-scheduled-campaigns` > Logs
   - Vérifiez que la campagne est traitée

3. **Vérifier le statut**
   - La campagne doit passer de `scheduled` à `sending`
   - Les emails doivent être envoyés

---

## 📊 Monitoring

### Logs Supabase

- **Edge Functions Logs** : Supabase Dashboard > Edge Functions > Logs
- **Database Logs** : Supabase Dashboard > Database > Logs

### Métriques à Surveiller

- Nombre de campagnes traitées par exécution
- Taux de succès/échec
- Temps d'exécution
- Erreurs éventuelles

---

## ⚠️ Notes Importantes

1. **Fréquence** : Toutes les 5 minutes est recommandé pour un bon équilibre entre réactivité et charge serveur
2. **Limite** : Le paramètre `limit` (défaut: 10) limite le nombre de campagnes traitées par exécution
3. **Pause entre envois** : La fonction attend 1 seconde entre chaque campagne pour éviter la surcharge
4. **Gestion d'erreurs** : Les erreurs sont loggées mais n'empêchent pas le traitement des autres campagnes

---

## 🔄 Mise à Jour

Pour modifier la fréquence du cron job :

```sql
-- Supprimer l'ancien cron job
SELECT cron.unschedule('process-scheduled-email-campaigns');

-- Créer le nouveau avec une nouvelle fréquence
SELECT cron.schedule(
  'process-scheduled-email-campaigns',
  '*/10 * * * *', -- Toutes les 10 minutes
  $$...$$
);
```

---

**Dernière mise à jour** : 30 Janvier 2025

