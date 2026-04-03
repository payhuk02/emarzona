# Process Email Sequences Edge Function

Edge Function Supabase pour traiter et envoyer automatiquement les emails des séquences.

## Configuration

### Variables d'environnement

Ajoutez ces variables dans Supabase Dashboard → Project Settings → Edge Functions → Secrets:

```
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Utilisation

### Appel manuel

```typescript
const { data, error } = await supabase.functions.invoke('process-email-sequences', {
  body: {
    limit: 100, // Optionnel, défaut: 100
  },
});
```

### Appel automatique (Cron)

Cette fonction doit être appelée régulièrement (toutes les heures ou toutes les 15 minutes) pour traiter les séquences.

**Option 1 : Via Supabase Cron Jobs**

Créez un cron job dans Supabase qui appelle cette fonction :

```sql
-- Exécuter toutes les heures
SELECT cron.schedule(
  'process-email-sequences-hourly',
  '0 * * * *', -- Toutes les heures
  $$
  SELECT net.http_post(
    url:='https://your-project.supabase.co/functions/v1/process-email-sequences',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body:='{"limit": 100}'::jsonb
  );
  $$
);
```

**Option 2 : Via un service externe**

Utilisez un service comme cron-job.org, EasyCron, ou votre propre serveur pour appeler cette fonction périodiquement.

## Fonctionnalités

- ✅ Récupère automatiquement les prochains emails à envoyer
- ✅ Vérifie les désabonnements avant envoi
- ✅ Envoie les emails via SendGrid
- ✅ Fait avancer automatiquement les enrollments
- ✅ Gère les erreurs et les logs
- ✅ Rate limiting intégré

## Flux d'exécution

```
1. Récupération des prochains emails (via get_next_sequence_emails_to_send)
   ↓
2. Pour chaque email :
   - Vérifier désabonnement
   - Récupérer le template
   - Envoyer l'email via SendGrid
   - Logger l'envoi
   - Faire avancer l'enrollment (advance_sequence_enrollment)
   ↓
3. Retourner le résumé (envoyés, erreurs)
```

## Résultat

La fonction retourne :

```json
{
  "success": true,
  "processed": 10,
  "sent": 9,
  "errors": 1,
  "error_details": [
    {
      "enrollment_id": "uuid",
      "error": "Template not found"
    }
  ]
}
```
