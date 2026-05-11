# Edge Function: Manage Email Tags Cron Jobs

## Description

Cette Edge Function permet de gérer les cron jobs pour les tags email en contournant les restrictions de permissions RPC sur le schéma `cron`.

## Problème résolu

Les fonctions RPC `get_email_tags_cron_jobs_status` et `toggle_email_tags_cron_job` peuvent retourner une erreur 403 même avec `SECURITY DEFINER` et les permissions `GRANT EXECUTE`, car Supabase peut bloquer l'accès au schéma `cron` via l'API REST.

Cette Edge Function utilise le **service role key** pour appeler ces fonctions, contournant ainsi les restrictions.

## Déploiement

### Via Supabase CLI

```bash
supabase functions deploy manage-email-tags-cron-jobs
```

### Via Supabase Dashboard

1. Allez dans **Supabase Dashboard > Edge Functions**
2. Cliquez sur **Create a new function**
3. Nommez-la `manage-email-tags-cron-jobs`
4. Copiez-collez le contenu de `index.ts`
5. Cliquez sur **Deploy**

## Utilisation

### Récupérer le statut des cron jobs

```typescript
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/manage-email-tags-cron-jobs?action=get_status`,
  {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  }
);

const result = await response.json();
// result.data contient un tableau de CronJobStatus
```

### Activer/Désactiver un cron job

```typescript
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/manage-email-tags-cron-jobs?action=toggle`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      job_name: 'cleanup-expired-email-tags',
      active: true, // ou false pour désactiver
    }),
  }
);

const result = await response.json();
```

## Actions disponibles

- `get_status` : Récupère le statut de tous les cron jobs
- `toggle` : Active ou désactive un cron job

## Jobs autorisés

- `cleanup-expired-email-tags`
- `cleanup-unused-email-tags`
- `update-segment-member-counts`

## Sécurité

- ✅ Vérifie que l'utilisateur est authentifié
- ✅ Utilise le service role key uniquement côté serveur
- ✅ Valide les noms de jobs autorisés
- ✅ Gère les erreurs CORS

## Variables d'environnement requises

- `SUPABASE_URL` : URL de votre projet Supabase
- `SUPABASE_SERVICE_ROLE_KEY` : Clé service role (automatiquement disponible dans Edge Functions)
- `SUPABASE_ANON_KEY` : Clé anonyme (automatiquement disponible dans Edge Functions)
