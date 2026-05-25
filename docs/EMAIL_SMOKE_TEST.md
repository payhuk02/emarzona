# Smoke test — système emailing Emarzona

Projet Supabase : `hbdnzajbyjakdhuavrvb`

## 1. Migration désabonnement public

Déjà appliquée en prod via :

```bash
npx supabase db query --linked -f supabase/migrations/20260525140000__fix_email_unsubscribes_public_rpc.sql
npx supabase migration repair 20260525140000 --status applied --linked
```

## 2. Vérifications SQL rapides

```bash
npx supabase db query --linked -f supabase/scripts/email-smoke-verify.sql -o table
```

## 3. Script automatisé

### Windows (PowerShell)

```powershell
$env:SUPABASE_ANON_KEY = "<anon JWT depuis Dashboard → API>"
$env:CRON_SECRET = "<Edge secret CRON_SECRET>"
.\scripts\email-smoke-test.ps1
```

### Linux / macOS

```bash
export SUPABASE_ANON_KEY="eyJ..."
export CRON_SECRET="..."
chmod +x scripts/email-smoke-test.sh
./scripts/email-smoke-test.sh
```

## 4. Contrôles manuels UI

| Test          | URL / action                                                   |
| ------------- | -------------------------------------------------------------- |
| Campagnes     | `/dashboard/emails/campaigns` → test email + rapport           |
| Analytics     | `/dashboard/emails/analytics`                                  |
| Désabonnement | `/unsubscribe?email=vous@test.com&type=marketing` (sans login) |
| Préférences   | `/settings/notifications`                                      |

## 5. Résultats attendus (prod vérifié)

- RPC `record_email_unsubscribe` : **présent**
- Crons actifs : `process-scheduled-email-campaigns` (_/5), `process-email-sequences` (_/15), `abandoned-cart-recovery` (horaire)
- Colonnes `email_logs` : `to_email`, `status`
