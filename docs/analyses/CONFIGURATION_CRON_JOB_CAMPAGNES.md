# Configuration du Cron Job pour les Campagnes Programmées

**Date:** 1er Février 2025  
**Statut:** ✅ Edge Function déployée

---

## ✅ Déploiement Réussi

L'Edge Function `process-scheduled-campaigns` a été déployée avec succès sur votre projet Supabase.

**Projet:** `hbdnzajbyjakdhuavrvb`  
**Dashboard:** https://supabase.com/dashboard/project/hbdnzajbyjakdhuavrvb/functions

---

## 🔧 Configuration du Cron Job

### Option 1: Via Supabase Dashboard (Recommandé)

1. **Accédez au Dashboard Supabase**
   - Allez sur: https://supabase.com/dashboard/project/hbdnzajbyjakdhuavrvb

2. **Naviguez vers Database > Cron Jobs**
   - Dans le menu de gauche, cliquez sur **Database**
   - Puis cliquez sur **Cron Jobs** (ou **pg_cron** si disponible)

3. **Créez un nouveau Cron Job**
   - Cliquez sur **"New Cron Job"** ou **"Create Cron Job"**
   - Configurez:
     - **Name:** `process-scheduled-campaigns`
     - **Schedule:** `*/5 * * * *` (toutes les 5 minutes)
     - **Command/Function:**
       - Si vous avez pg_cron, utilisez une requête SQL qui appelle l'Edge Function
       - Sinon, utilisez un service externe (voir Option 2)

### Option 2: Via Service Externe (Si pg_cron n'est pas disponible)

Si Supabase ne supporte pas les cron jobs natifs, utilisez un service externe:

#### A. Vercel Cron Jobs

Créez un fichier `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/process-campaigns",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

Créez `api/cron/process-campaigns.ts`:

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const response = await fetch(`${supabaseUrl}/functions/v1/process-scheduled-campaigns`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${supabaseServiceKey}`,
    },
    body: JSON.stringify({ limit: 10 }),
  });

  const data = await response.json();
  return NextResponse.json(data);
}
```

#### B. GitHub Actions

Créez `.github/workflows/process-campaigns.yml`:

```yaml
name: Process Scheduled Campaigns

on:
  schedule:
    - cron: '*/5 * * * *' # Toutes les 5 minutes
  workflow_dispatch: # Permet de déclencher manuellement

jobs:
  process:
    runs-on: ubuntu-latest
    steps:
      - name: Call Edge Function
        run: |
          curl -X POST \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -d '{"limit": 10}' \
            ${{ secrets.SUPABASE_URL }}/functions/v1/process-scheduled-campaigns
```

#### C. Cloudflare Workers (Cron Triggers)

Créez `wrangler.toml`:

```toml
name = "process-campaigns-cron"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[triggers]
crons = ["*/5 * * * *"]
```

Créez `src/index.ts`:

```typescript
export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const response = await fetch(`${env.SUPABASE_URL}/functions/v1/process-scheduled-campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ limit: 10 }),
    });

    return response.json();
  },
};
```

---

## 🧪 Test de la Fonction

### Test Manuel

Vous pouvez tester la fonction manuellement via:

1. **Dashboard Supabase**
   - Allez dans **Functions** > **process-scheduled-campaigns**
   - Cliquez sur **"Invoke"**
   - Payload: `{"limit": 10}`

2. **cURL**

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -d '{"limit": 10}' \
  https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/process-scheduled-campaigns
```

3. **JavaScript/TypeScript**

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://hbdnzajbyjakdhuavrvb.supabase.co', 'YOUR_SERVICE_ROLE_KEY');

const { data, error } = await supabase.functions.invoke('process-scheduled-campaigns', {
  body: { limit: 10 },
});
```

---

## 📊 Monitoring

### Vérifier les Logs

1. **Dashboard Supabase**
   - Allez dans **Functions** > **process-scheduled-campaigns**
   - Cliquez sur **"Logs"** pour voir les exécutions

2. **Vérifier les Campagnes**
   - Les campagnes avec `scheduled_at` passé et `status = 'scheduled'` seront automatiquement envoyées
   - Le statut passera à `sending` puis `completed`

### Métriques

La fonction retourne:

```json
{
  "success": true,
  "message": "Processed 3 scheduled campaigns",
  "processed": 3,
  "successful": 2,
  "failed": 1,
  "results": [...]
}
```

---

## ⚙️ Configuration Avancée

### Variables d'Environnement

Assurez-vous que ces variables sont configurées dans Supabase:

- `SENDGRID_API_KEY` - Clé API SendGrid
- `SUPABASE_URL` - URL de votre projet (automatique)
- `SUPABASE_SERVICE_ROLE_KEY` - Clé de service (automatique)

### Paramètres

- `limit` (optionnel): Nombre maximum de campagnes à traiter par exécution (défaut: 10)

### Fréquence

La fréquence recommandée est **toutes les 5 minutes** (`*/5 * * * *`).

Pour une fréquence différente:

- Toutes les minutes: `* * * * *`
- Toutes les 10 minutes: `*/10 * * * *`
- Toutes les heures: `0 * * * *`

---

## ✅ Checklist

- [x] Edge Function déployée
- [ ] Cron job configuré (via dashboard ou service externe)
- [ ] Variables d'environnement configurées
- [ ] Test manuel effectué
- [ ] Monitoring configuré

---

## 🆘 Dépannage

### La fonction ne s'exécute pas automatiquement

- Vérifiez que le cron job est bien configuré
- Vérifiez les logs de la fonction
- Testez manuellement la fonction

### Les campagnes ne sont pas envoyées

- Vérifiez que `scheduled_at` est dans le passé
- Vérifiez que `status = 'scheduled'`
- Vérifiez qu'un `template_id` est associé
- Vérifiez les logs de `send-email-campaign`

### Erreurs dans les logs

- Vérifiez que `SENDGRID_API_KEY` est configurée
- Vérifiez que la fonction `send-email-campaign` est déployée
- Vérifiez les permissions RLS sur la table `email_campaigns`

---

**Date de configuration:** 1er Février 2025  
**Prochaine vérification recommandée:** Après la première exécution automatique
