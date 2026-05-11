# Edge Function: verify-domains

## Description

Cette Edge Function vérifie automatiquement l'état des domaines personnalisés configurés pour les boutiques. Elle est conçue pour être appelée périodiquement via un cron job.

## Fonctionnalités

- ✅ Vérifie la propagation DNS via Google DNS API
- ✅ Met à jour automatiquement le statut des domaines
- ✅ Active automatiquement SSL quand un domaine est vérifié
- ✅ Enregistre les erreurs de propagation DNS
- ✅ Supporte la vérification de multiples domaines simultanément

## Configuration

### 1. Déployer la fonction

```bash
supabase functions deploy verify-domains
```

### 2. Configurer le cron job

Dans le dashboard Supabase, allez dans **Database > Cron Jobs** et créez un nouveau job :

```sql
SELECT cron.schedule(
  'verify-domains-periodically',
  '*/15 * * * *', -- Toutes les 15 minutes
  $$
  SELECT
    net.http_post(
      url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/verify-domains',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
      body:='{}'::jsonb
    ) AS request_id;
  $$
);
```

Ou via l'interface Supabase :

- Interval: `*/15 * * * *` (toutes les 15 minutes)
- SQL: Voir ci-dessus

### 3. Variables d'environnement

Les variables suivantes sont automatiquement disponibles dans les Edge Functions Supabase :

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Utilisation

### Appel manuel

```bash
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/verify-domains' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'
```

### Réponse

```json
{
  "message": "Vérification des domaines terminée",
  "checked": 5,
  "verified": 3,
  "failed": 2,
  "results": [
    {
      "store": "Ma Boutique",
      "domain": "example.com",
      "result": {
        "success": true,
        "message": "Domaine vérifié avec succès (propagation: 5s). SSL activé."
      }
    }
  ]
}
```

## Vérifications effectuées

Pour chaque domaine, la fonction vérifie :

1. **Enregistrement A principal** : Le domaine pointe vers `185.158.133.1`
2. **Enregistrement A www** : Le sous-domaine www pointe vers `185.158.133.1`
3. **Enregistrement TXT de vérification** : Le token de vérification est présent

## Actions automatiques

- Si tous les enregistrements DNS sont corrects :
  - Le statut du domaine passe à `verified`
  - SSL est activé automatiquement (`ssl_enabled = true`)
  - La date de vérification est enregistrée

- Si des erreurs sont détectées :
  - Le statut est mis à jour avec les erreurs
  - SSL reste désactivé
  - Les erreurs sont enregistrées dans `domain_error_message`

## Monitoring

L'historique des vérifications est enregistré dans la table `domain_verification_history` (créée par la migration correspondante).

## Limitations

- La fonction vérifie uniquement les domaines avec `domain_status = 'pending'` ou `'verified'`
- La propagation DNS peut prendre jusqu'à 48 heures (selon le TTL)
- SSL n'est activé que si la propagation DNS est complète

## Support

Pour les problèmes ou questions, consultez la documentation Supabase Edge Functions :
https://supabase.com/docs/guides/functions
