# ✅ Correction : Secrets Supabase

**Date** : 30 Janvier 2025  
**Découverte** : Supabase injecte automatiquement `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY`

---

## ✅ Information Importante

**Supabase injecte automatiquement** ces variables d'environnement dans toutes les Edge Functions :
- `SUPABASE_URL` : Disponible automatiquement
- `SUPABASE_SERVICE_ROLE_KEY` : Disponible automatiquement

**Vous ne pouvez PAS** ajouter ces secrets manuellement car Supabase affiche l'erreur :
> "Name must not start with the SUPABASE_ prefix"

---

## 🔍 Vérification du Code

Le code de `process-scheduled-campaigns` utilise déjà ces variables :

```typescript
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
```

Ces variables **devraient** être automatiquement disponibles.

---

## 🐛 Problème Possible

Si `SUPABASE_SERVICE_ROLE_KEY` est vide ou `undefined`, cela expliquerait l'erreur `401 Invalid JWT` lors de l'appel à `send-email-campaign`.

### Solution : Ajouter des Logs pour Vérifier

Modifier `process-scheduled-campaigns/index.ts` pour logger les valeurs :

```typescript
// Créer le client Supabase
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Log pour déboguer
console.log('Supabase configuration:', {
  hasUrl: !!supabaseUrl,
  url: supabaseUrl,
  hasServiceKey: !!supabaseServiceKey,
  serviceKeyLength: supabaseServiceKey?.length || 0,
  serviceKeyPrefix: supabaseServiceKey?.substring(0, 50) || 'N/A'
});

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration:', {
    hasUrl: !!supabaseUrl,
    hasServiceKey: !!supabaseServiceKey
  });
  return new Response(
    JSON.stringify({ error: 'Supabase configuration missing' }),
    {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
```

---

## 🧪 Test

Après avoir ajouté les logs, testez à nouveau et vérifiez les logs de `process-scheduled-campaigns` pour voir :
1. Si `SUPABASE_SERVICE_ROLE_KEY` est bien défini
2. Si la longueur de la clé est correcte
3. Si le préfixe de la clé correspond à ce qui est attendu

---

## 📝 Checklist

- [x] Compris que `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont automatiques
- [ ] Logs de débogage ajoutés
- [ ] Test effectué
- [ ] Logs vérifiés pour confirmer que les variables sont bien définies
- [ ] Problème identifié et solution appliquée

---

**Dernière mise à jour** : 30 Janvier 2025

