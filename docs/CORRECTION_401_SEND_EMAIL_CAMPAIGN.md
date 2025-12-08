# 🔧 Correction 401 "Invalid JWT" dans send-email-campaign

**Date** : 30 Janvier 2025  
**Problème** : `send-email-campaign` retourne `401 Invalid JWT` quand appelée par `process-scheduled-campaigns`

---

## 🔍 Problème Identifié

D'après les logs :
```
Error invoking send-email-campaign: {"code":401, "message":"Invalid JWT"}
```

L'Edge Function `send-email-campaign` rejette l'appel de `process-scheduled-campaigns` avec `401 Invalid JWT`.

**Cause probable** : `SUPABASE_SERVICE_ROLE_KEY` n'est pas correctement configuré dans l'environnement de `process-scheduled-campaigns`, ou la clé utilisée est invalide.

---

## ✅ Solution : Vérifier et Configurer les Secrets

### 1. Vérifier les Secrets de `process-scheduled-campaigns`

Dans Supabase Dashboard > Edge Functions > Secrets, vérifiez que ces secrets sont configurés :

- ✅ `SUPABASE_URL` : `https://hbdnzajbyjakdhuavrvb.supabase.co`
- ✅ `SUPABASE_SERVICE_ROLE_KEY` : La service role key (la même que celle utilisée dans le cron job)
- ⚠️ `SENDGRID_API_KEY` : Optionnel mais recommandé

### 2. Utiliser la Même Service Role Key

Assurez-vous que `SUPABASE_SERVICE_ROLE_KEY` dans les secrets de `process-scheduled-campaigns` est **exactement la même** que celle utilisée dans le cron job :

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZG56YWpieWpha2RodWF2cnZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzU5ODIzMSwiZXhwIjoyMDczMTc0MjMxfQ.MT2e4tcw_5eK0fRQFN5tF1Cwu210MKFUAUGqmYm_1XE
```

### 3. Ajouter des Logs de Débogage

Modifier `process-scheduled-campaigns/index.ts` pour logger la clé utilisée :

```typescript
async function sendCampaign(
  supabase: any,
  campaignId: string,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Log pour déboguer
    console.log('Calling send-email-campaign:', {
      url: `${supabaseUrl}/functions/v1/send-email-campaign`,
      hasServiceKey: !!supabaseServiceKey,
      serviceKeyLength: supabaseServiceKey?.length || 0,
      serviceKeyPrefix: supabaseServiceKey?.substring(0, 50) || 'N/A'
    });
    
    const functionUrl = `${supabaseUrl}/functions/v1/send-email-campaign`;
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        campaign_id: campaignId,
        batch_size: 100,
        batch_index: 0,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error invoking send-email-campaign:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        url: functionUrl
      });
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }
    // ... reste du code
  }
}
```

---

## 🧪 Test Après Configuration

Après avoir configuré les secrets, testez à nouveau :

```sql
SELECT net.http_post(
  url := 'https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/process-scheduled-campaigns',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZG56YWpieWpha2RodWF2cnZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzU5ODIzMSwiZXhwIjoyMDczMTc0MjMxfQ.MT2e4tcw_5eK0fRQFN5tF1Cwu210MKFUAUGqmYm_1XE',
    'x-cron-secret', 'process-scheduled-campaigns-secret-2025'
  ),
  body := jsonb_build_object('limit', 10)
) AS request_id;
```

Puis vérifiez les logs de `process-scheduled-campaigns` pour voir :
1. Si `supabaseServiceKey` est bien défini
2. Si l'appel à `send-email-campaign` réussit maintenant

---

## 📝 Checklist

- [ ] `SUPABASE_SERVICE_ROLE_KEY` vérifié dans les secrets de `process-scheduled-campaigns`
- [ ] `SUPABASE_URL` vérifié dans les secrets
- [ ] Logs de débogage ajoutés (optionnel)
- [ ] Test effectué
- [ ] Logs vérifiés pour confirmer que `send-email-campaign` est appelée avec succès
- [ ] Campagne traitée avec succès

---

**Dernière mise à jour** : 30 Janvier 2025

