# Auto Payout Vendors

Edge Function pour le reversement automatique des fonds vendeurs.

## Description

Cette fonction vérifie quotidiennement les stores éligibles pour un reversement automatique et crée des demandes de retrait si les conditions sont remplies.

## Configuration

La configuration se trouve dans `platform_settings` sous la clé `admin` :

```json
{
  "auto_payout_vendors": {
    "enabled": false, // Activer/désactiver le reversement automatique
    "delay_days": 7, // Délai en jours avant reversement automatique
    "min_amount": 50000 // Montant minimum en XOF pour reversement automatique
  }
}
```

## Conditions d'éligibilité

Un store est éligible si :

1. `available_balance >= min_amount` (configuré)
2. Le dernier calcul (`last_calculated_at`) est antérieur à `delay_days` jours OU est NULL
3. Le store a une méthode de paiement par défaut configurée

## Workflow

1. La fonction vérifie la configuration
2. Récupère les stores éligibles
3. Pour chaque store éligible :
   - Vérifie qu'il n'y a pas déjà un retrait en attente
   - Crée un `store_withdrawals` avec status `pending`
   - L'admin devra approuver et compléter le retrait

## Déploiement

```bash
supabase functions deploy auto-payout-vendors
```

## Configuration Cron Job

Dans Supabase Dashboard > Database > Cron Jobs, créer un job :

- **Schedule**: `0 3 * * *` (tous les jours à 3h du matin)
- **Function**: `auto-payout-vendors`
- **Headers**:
  - `x-cron-secret`: `auto-payout-vendors-secret-2025` (ou votre secret)

## Notes

- Les retraits créés automatiquement ont le status `pending` et nécessitent l'approbation d'un admin
- La fonction limite à 50 stores par exécution pour éviter la surcharge
- Les stores sans méthode de paiement par défaut sont ignorés
