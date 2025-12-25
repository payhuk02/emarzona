# Edge Function: Auto Pay Commissions

## Description

Cette Edge Function effectue le paiement automatique des commissions d'affiliation approuvées qui dépassent un seuil minimum configurable. Elle crée automatiquement des retraits (`affiliate_withdrawals`) pour les affiliés éligibles.

## Configuration

### Variables d'environnement

Aucune variable d'environnement spécifique requise. La fonction utilise :
- `SUPABASE_URL` (automatique)
- `SUPABASE_SERVICE_ROLE_KEY` (automatique)

### Configuration via platform_settings

Vous pouvez configurer le comportement via `platform_settings` :

```json
{
  "auto_pay_commissions": {
    "enabled": true,
    "minCommissionAmount": 50000  // En XOF
  }
}
```

**Paramètres par défaut :**
- `enabled`: false (désactivé par défaut pour validation manuelle)
- `minCommissionAmount`: 50000 XOF

## Déploiement

```bash
supabase functions deploy auto-pay-commissions
```

## Configuration du Cron Job

Dans Supabase Dashboard :

1. Allez dans **Database** → **Cron Jobs**
2. Créez un nouveau cron job :
   - **Name**: `auto-pay-commissions`
   - **Schedule**: `0 2 * * *` (tous les jours à 2h du matin)
   - **SQL Command**:
   ```sql
   SELECT net.http_post(
     url := 'https://YOUR_PROJECT.supabase.co/functions/v1/auto-pay-commissions',
     headers := jsonb_build_object(
       'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
     ),
     body := '{}'::jsonb
   );
   ```

## Fonctionnement

1. **Sélection des affiliés éligibles** :
   - `pending_commission >= minCommissionAmount`
   - Tri par montant décroissant

2. **Création des retraits** :
   - Crée un `affiliate_withdrawals` avec status `pending`
   - Met à jour le solde de l'affilié (`pending_commission`)
   - Log dans `transaction_logs`

3. **Gestion des erreurs** :
   - Continue même en cas d'erreur pour un affilié
   - Log toutes les erreurs

## Important

⚠️ **Les retraits créés sont en status `pending`** - un admin doit les approuver manuellement avant le paiement effectif. Cela permet un contrôle final avant le virement.

## Monitoring

Pour surveiller les paiements automatiques :

```sql
-- Retraits créés automatiquement
SELECT 
  aw.*,
  a.user_id,
  p.full_name as affiliate_name
FROM affiliate_withdrawals aw
JOIN affiliates a ON a.id = aw.affiliate_id
LEFT JOIN profiles p ON p.user_id = a.user_id
WHERE aw.metadata->>'auto_paid' = 'true'
ORDER BY aw.created_at DESC
LIMIT 50;
```

