# Send SMS Edge Function

Edge Function Supabase pour envoyer des SMS transactionnels via Twilio API.

## Configuration

### Variables d'environnement

Ajoutez ces variables dans Supabase Dashboard → Project Settings → Edge Functions → Secrets:

```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

### Obtenir les credentials Twilio

1. Créez un compte sur [Twilio](https://www.twilio.com)
2. Obtenez votre Account SID et Auth Token depuis le dashboard
3. Achetez un numéro de téléphone Twilio
4. Ajoutez les credentials dans les secrets Supabase

## Utilisation

```typescript
const { data, error } = await supabase.functions.invoke('send-sms', {
  body: {
    to: '+221771234567',
    template: 'payment_success',
    data: {
      customerName: 'John Doe',
      amount: 10000,
      currency: 'XOF',
      orderNumber: 'ORD-12345',
      transactionId: 'txn_123',
    },
  },
});
```

## Templates supportés

- `payment_success`: SMS de confirmation de paiement réussi
- `payment_failed`: SMS de notification d'échec de paiement
- `payment_cancelled`: SMS de notification d'annulation de paiement
- `payment_refunded`: SMS de notification de remboursement
- `payment_pending`: SMS de notification de paiement en attente

## Format des numéros

Les numéros de téléphone sont automatiquement formatés pour Twilio:
- Si le numéro commence par `0`, il est converti en format international
- Par défaut, le préfixe `+221` (Sénégal) est ajouté si absent
- Les caractères non numériques sont supprimés







