# Send Email Edge Function

Edge Function Supabase pour envoyer des emails transactionnels via Resend API.

## Configuration

### Variables d'environnement

Ajoutez ces variables dans Supabase Dashboard → Project Settings → Edge Functions → Secrets:

```
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@payhula.com
RESEND_FROM_NAME=Payhula
```

### Obtenir une clé API Resend

1. Créez un compte sur [Resend](https://resend.com)
2. Obtenez votre clé API depuis le dashboard
3. Ajoutez-la dans les secrets Supabase

## Utilisation

```typescript
const { data, error } = await supabase.functions.invoke('send-email', {
  body: {
    to: 'customer@example.com',
    subject: 'Paiement confirmé - Payhula',
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

- `payment_success`: Email de confirmation de paiement réussi
- `payment_failed`: Email de notification d'échec de paiement
- `payment_cancelled`: Email de notification d'annulation de paiement
- `payment_refunded`: Email de notification de remboursement
- `payment_pending`: Email de notification de paiement en attente







