# 🔧 Solution 401 "Invalid JWT" dans send-email-campaign

**Date** : 30 Janvier 2025  
**Problème** : `send-email-campaign` retourne `401 Invalid JWT` même avec `SUPABASE_SERVICE_ROLE_KEY`

---

## 🔍 Problème Identifié

D'après les logs :
- ✅ `SUPABASE_SERVICE_ROLE_KEY` est bien défini (`hasServiceKey: true`)
- ❌ `send-email-campaign` retourne toujours `401 Invalid JWT`

**Cause probable** : Supabase rejette le JWT avant qu'il n'arrive à l'Edge Function, ou le format du JWT n'est pas correct.

---

## ✅ Solution : Utiliser l'Anon Key au lieu de la Service Role Key

Pour les appels internes entre Edge Functions, Supabase peut exiger l'**anon key** au lieu de la **service role key**.

### Option 1 : Utiliser l'Anon Key

Modifier `process-scheduled-campaigns/index.ts` pour utiliser l'anon key :

```typescript
async function sendCampaign(
  supabase: any,
  campaignId: string,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Utiliser l'anon key pour les appels internes
    // L'anon key est disponible via SUPABASE_ANON_KEY (injecté automatiquement)
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || supabaseServiceKey;
    
    console.log('Calling send-email-campaign:', {
      url: `${supabaseUrl}/functions/v1/send-email-campaign`,
      usingAnonKey: !!Deno.env.get('SUPABASE_ANON_KEY'),
      hasServiceKey: !!supabaseServiceKey
    });
    
    const functionUrl = `${supabaseUrl}/functions/v1/send-email-campaign`;
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`, // Utiliser anon key au lieu de service role key
      },
      body: JSON.stringify({
        campaign_id: campaignId,
        batch_size: 100,
        batch_index: 0,
      }),
    });
    // ... reste du code
  }
}
```

### Option 2 : Désactiver l'Authentification dans send-email-campaign

Comme on l'a fait pour `process-scheduled-campaigns`, désactiver temporairement l'authentification dans `send-email-campaign` (déjà fait avec les logs).

---

## 🧪 Test

Après avoir modifié le code pour utiliser l'anon key, testez à nouveau et vérifiez les logs pour voir si l'erreur `401` persiste.

---

## 📝 Checklist

- [ ] Code modifié pour utiliser l'anon key
- [ ] Edge Function redéployée
- [ ] Test effectué
- [ ] Logs vérifiés
- [ ] Erreur `401` résolue
- [ ] Campagne traitée avec succès

---

**Dernière mise à jour** : 30 Janvier 2025


