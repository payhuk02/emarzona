# Send Email Campaign Edge Function

Edge Function Supabase pour envoyer des campagnes email marketing via Resend.

## Configuration

### Variables d'environnement

Ajoutez ces variables dans Supabase Dashboard → Project Settings → Edge Functions → Secrets:

```
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@mail.emarzona.com
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
EDGE_INTERNAL_SECRET=your-internal-secret
```

### Obtenir une clé API Resend

1. Créez un compte sur [Resend](https://resend.com)
2. Vérifiez le domaine `mail.emarzona.com` et obtenez votre clé API
3. Ajoutez `RESEND_API_KEY` et `RESEND_FROM_EMAIL` dans les secrets Supabase Edge

## Utilisation

```typescript
const { data, error } = await supabase.functions.invoke('send-email-campaign', {
  body: {
    campaign_id: 'campaign-uuid',
    batch_size: 100, // Optionnel, défaut: 100
    batch_index: 0, // Optionnel, défaut: 0
  },
});
```

## Fonctionnalités

- ✅ Envoi en batch pour gérer de grandes audiences
- ✅ Vérification des désabonnements
- ✅ Mise à jour automatique des métriques
- ✅ Gestion des erreurs et retry
- ✅ Support de différents types d'audience (segment, list, filter)
- ✅ Logging des emails envoyés

## Types d'audience supportés

### Segment

Récupère les membres d'un segment email spécifique.

### List

Récupère les clients d'une liste (à implémenter).

### Filter

Récupère les clients selon des filtres personnalisés (ex: clients qui ont acheté).

## Traitement en batch

Pour les grandes campagnes, l'envoi est traité par batch:

```typescript
// Premier batch
const result1 = await supabase.functions.invoke('send-email-campaign', {
  body: { campaign_id: 'xxx', batch_index: 0 },
});

// Deuxième batch si nécessaire
if (result1.data.has_more) {
  await supabase.functions.invoke('send-email-campaign', {
    body: { campaign_id: 'xxx', batch_index: 1 },
  });
}
```

## Métriques

La fonction met à jour automatiquement les métriques de la campagne:

- `sent`: Nombre d'emails envoyés
- `delivered`: Nombre d'emails livrés (mise à jour via webhook Resend)
- `opened`: Nombre d'ouvertures (mise à jour via webhook Resend)
- `clicked`: Nombre de clics (mise à jour via webhook Resend)
- `bounced`: Nombre de rebonds (mise à jour via webhook Resend)
- `unsubscribed`: Nombre de désabonnements
