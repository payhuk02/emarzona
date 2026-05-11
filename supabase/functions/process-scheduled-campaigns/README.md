# Process Scheduled Campaigns

Edge Function pour vérifier et envoie automatiquement les campagnes email programmées.

## Configuration

### Variables d'environnement requises

- `SUPABASE_URL` : URL de votre instance Supabase
- `SUPABASE_SERVICE_ROLE_KEY` : Clé de service Supabase
- `SENDGRID_API_KEY` : Clé API SendGrid (optionnel, mais recommandé)

### Configuration Cron Job

Cette fonction doit être appelée périodiquement (recommandé : toutes les 5 minutes) via :

1. **Supabase Cron Jobs** (Recommandé)
   - Voir [CONFIGURATION_CRON_CAMPAGNES_PROGRAMMEES.md](../../../docs/CONFIGURATION_CRON_CAMPAGNES_PROGRAMMEES.md)

2. **Service externe** (GitHub Actions, Vercel Cron, etc.)
   - Voir la documentation pour les alternatives

## Fonctionnalités

- Récupère les campagnes avec `status = 'scheduled'` et `scheduled_at <= now()`
- Appelle l'Edge Function `send-email-campaign` pour chaque campagne
- Met à jour le statut des campagnes à `sending`
- Gère les erreurs sans bloquer le traitement des autres campagnes

## Paramètres

- `limit` (optionnel) : Nombre maximum de campagnes à traiter par exécution (défaut: 10)

## Exemple d'appel

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -d '{"limit": 10}' \
  https://your-project.supabase.co/functions/v1/process-scheduled-campaigns
```

## Réponse

```json
{
  "success": true,
  "message": "Processed 2 scheduled campaigns",
  "processed": 2,
  "successful": 2,
  "failed": 0,
  "results": [
    {
      "campaign_id": "uuid-1",
      "campaign_name": "Campaign 1",
      "success": true
    },
    {
      "campaign_id": "uuid-2",
      "campaign_name": "Campaign 2",
      "success": true
    }
  ]
}
```

## Déploiement

```bash
supabase functions deploy process-scheduled-campaigns
```

## Monitoring

- Vérifiez les logs dans Supabase Dashboard > Edge Functions > Logs
- Surveillez le nombre de campagnes traitées et les erreurs éventuelles
