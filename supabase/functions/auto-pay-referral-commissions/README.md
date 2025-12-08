# Auto Pay Referral Commissions

Edge Function pour le paiement automatique des commissions de parrainage.

## Description

Cette fonction vérifie quotidiennement les commissions de parrainage éligibles et les marque comme payées si les conditions sont remplies.

## Configuration

La configuration se trouve dans `platform_settings` sous la clé `admin` :

```json
{
  "auto_pay_referral_commissions": {
    "enabled": false,  // Activer/désactiver le paiement automatique
    "min_amount": 50000  // Montant minimum en XOF pour paiement automatique
  }
}
```

## Conditions d'éligibilité

Un groupe de commissions est éligible si :
1. Toutes les commissions ont le status `pending`
2. Le total des commissions pour un même `referrer_id` >= `min_amount` (configuré)
3. Chaque commission individuelle >= `min_amount`

## Workflow

1. La fonction vérifie la configuration
2. Récupère les commissions éligibles (groupées par `referrer_id`)
3. Pour chaque groupe éligible :
   - Marque toutes les commissions comme `paid`
   - Met à jour `paid_at`
   - Le total est déjà dans `profiles.total_referral_earnings` (mis à jour à la création)

## Déploiement

```bash
supabase functions deploy auto-pay-referral-commissions
```

## Configuration Cron Job

Dans Supabase Dashboard > Database > Cron Jobs, créer un job :

- **Schedule**: `0 4 * * *` (tous les jours à 4h du matin)
- **Function**: `auto-pay-referral-commissions`
- **Headers**: 
  - `x-cron-secret`: `auto-pay-referral-commissions-secret-2025` (ou votre secret)

## Notes

- Les commissions sont marquées comme `paid` mais ne créent pas de retrait automatique
- Pour créer des retraits automatiques, il faudrait une fonction supplémentaire
- La fonction limite à 100 commissions par exécution pour éviter la surcharge


