# 🐛 Problème 401 "Invalid JWT" dans send-email-campaign

**Date** : 30 Janvier 2025  
**Problème** : `process-scheduled-campaigns` appelle `send-email-campaign` mais reçoit `401 Invalid JWT`

---

## ⚠️ Problème Identifié

D'après les logs :

```
Error invoking send-email-campaign: {"code":401, "message":"Invalid JWT"}
```

L'Edge Function `send-email-campaign` retourne `401 Invalid JWT` quand elle est appelée par `process-scheduled-campaigns`.

---

## 🔍 Analyse du Code

### 1. Comment `process-scheduled-campaigns` appelle `send-email-campaign`

Dans `supabase/functions/process-scheduled-campaigns/index.ts` (ligne 56) :

```typescript
const functionUrl = `${supabaseUrl}/functions/v1/send-email-campaign`;

const response = await fetch(functionUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${supabaseServiceKey}`,
  },
  body: JSON.stringify({
    campaign_id: campaignId,
    batch_size: 100,
    batch_index: 0,
  }),
});
```

### 2. Problème Possible

L'Edge Function `send-email-campaign` n'a **PAS de vérification d'authentification dans son code**, mais Supabase exige quand même un header `Authorization` valide pour appeler les Edge Functions.

Le problème est que `supabaseServiceKey` pourrait être :

- `undefined` ou vide
- Mal formaté
- Expiré ou invalide

---

## 🔧 Solutions

### Solution 1 : Vérifier que `SUPABASE_SERVICE_ROLE_KEY` est configuré

Dans Supabase Dashboard > Edge Functions > Secrets, vérifiez que `SUPABASE_SERVICE_ROLE_KEY` est bien configuré.

### Solution 2 : Ajouter des logs pour déboguer

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
      serviceKeyPrefix: supabaseServiceKey?.substring(0, 20) || 'N/A'
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
        error: errorText
      });
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }
    // ... reste du code
  }
}
```

### Solution 3 : Désactiver temporairement l'authentification dans `send-email-campaign`

Comme on l'a fait pour `process-scheduled-campaigns`, désactiver temporairement l'authentification dans `send-email-campaign` pour tester.

---

## 🧪 Test Immédiat

Vérifiez les logs de `process-scheduled-campaigns` pour voir :

1. Si `supabaseServiceKey` est bien défini
2. Si l'URL est correcte
3. Si le header `Authorization` est bien formaté

---

## 📝 Checklist

- [ ] `SUPABASE_SERVICE_ROLE_KEY` vérifié dans les secrets
- [ ] Logs de `process-scheduled-campaigns` vérifiés
- [ ] Format du header `Authorization` vérifié
- [ ] Test avec logs de débogage effectué
- [ ] Problème identifié et solution appliquée

---

**Dernière mise à jour** : 30 Janvier 2025
