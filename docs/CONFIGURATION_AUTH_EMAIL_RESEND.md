# Auth — confirmation email + SMTP Resend (`mail.emarzona.com`)

Projet Supabase : **`hbdnzajbyjakdhuavrvb`**

## Vue d'ensemble

| Étape                  | Mécanisme                                                                        |
| ---------------------- | -------------------------------------------------------------------------------- |
| Inscription            | Supabase Auth envoie l'email de **confirmation** via SMTP Resend                 |
| Clic lien confirmation | `auth.users.email_confirmed_at` renseigné                                        |
| Bienvenue              | Trigger SQL → Edge `send-welcome-email` → `send-email` (template `welcome-user`) |

## 1. Activer la confirmation d'email (Dashboard)

**Authentication → Providers → Email**

- [x] **Enable Email provider**
- [x] **Confirm email** (obligatoire avant première connexion)
- **Site URL** : `https://emarzona.com`
- **Redirect URLs** :
  - `https://emarzona.com/auth/callback`
  - `https://emarzona.com/dashboard`
  - `https://emarzona.com/**` (si autorisé par votre politique)

## 2. SMTP Resend pour les emails Auth

**Authentication → Emails → SMTP Settings**

| Champ              | Valeur                                                      |
| ------------------ | ----------------------------------------------------------- |
| Enable custom SMTP | ON                                                          |
| Host               | `smtp.resend.com`                                           |
| Port               | `465` (SSL) ou `587` (STARTTLS)                             |
| Username           | `resend`                                                    |
| Password           | Clé API Resend (`re_...`, même secret que `RESEND_API_KEY`) |
| Sender email       | `noreply@mail.emarzona.com`                                 |
| Sender name        | `Emarzona`                                                  |

Le domaine **`mail.emarzona.com`** doit être vérifié dans [Resend → Domains](https://resend.com/domains). N'utilisez pas `noreply@emarzona.com` (racine non vérifiée).

### Templates Auth (optionnel)

**Authentication → Email Templates** — personnaliser « Confirm signup » / « Magic Link » avec la marque Emarzona. La **Site URL** des liens doit rester `https://emarzona.com`.

## 3. Secrets Edge (déjà partagés avec l'email transactionnel)

```bash
npx supabase secrets set \
  RESEND_API_KEY=re_VOTRE_CLE \
  RESEND_FROM_EMAIL=noreply@mail.emarzona.com \
  RESEND_FROM_NAME=Emarzona \
  SITE_URL=https://emarzona.com \
  EDGE_INTERNAL_SECRET=<secret-interne> \
  --project-ref hbdnzajbyjakdhuavrvb
```

Voir aussi [CONFIGURATION_EMAIL_RESEND_CRON.md](./CONFIGURATION_EMAIL_RESEND_CRON.md).

## 4. Hook post-confirmation → `welcome-user`

### Composants

- Migration `20260524180000__welcome_email_on_email_confirmed.sql`
- Edge Function **`send-welcome-email`** (déployer après migration)
- Colonne `profiles.welcome_email_sent_at` (idempotence)

### Config secrets pour le trigger (obligatoire, une fois)

**Dashboard → SQL Editor** — copier [supabase/scripts/setup-welcome-email-hook.sql](../supabase/scripts/setup-welcome-email-hook.sql) et remplacer les placeholders :

```sql
SELECT public.setup_welcome_email_hook(
  p_service_role_key := 'eyJ...',              -- Settings → API → service_role (legacy JWT)
  p_edge_internal_secret := 'votre-secret',    -- même valeur que EDGE_INTERNAL_SECRET (optionnel)
  p_supabase_url := 'https://hbdnzajbyjakdhuavrvb.supabase.co'
);
```

> Utilisez le JWT **legacy** `eyJ...` (rôle `service_role`), pas la clé `sb_secret_...`.

**Alternative** (si `ALTER DATABASE` est autorisé sur votre instance) :

```sql
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://hbdnzajbyjakdhuavrvb.supabase.co';
ALTER DATABASE postgres SET app.settings.service_role_key = 'eyJ...';
ALTER DATABASE postgres SET app.settings.edge_internal_secret = 'votre-secret';
```

Le trigger lit d’abord `private.welcome_email_hook_config`, puis retombe sur `app.settings.*`.

### Déploiement Edge

```bash
npx supabase functions deploy send-welcome-email --project-ref hbdnzajbyjakdhuavrvb
```

### Test manuel

```bash
curl -X POST "https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/send-welcome-email" \
  -H "Authorization: Bearer <JWT service_role eyJ...>" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"<uuid>","email":"test@example.com","full_name":"Test"}'
```

Vérifier `profiles.welcome_email_sent_at` et une ligne dans `email_logs` (slug `welcome-user`).

## 5. Développement local (`config.toml`)

Le fichier `supabase/config.toml` du dépôt active `enable_confirmations` et documente le bloc SMTP Resend pour `supabase start`. En production, le **Dashboard** prime sur `config.toml`.

## 6. Comportement frontend

Après inscription, si **aucune session** n'est retournée (confirmation en attente), l'utilisateur voit un message « Vérifiez votre boîte mail » au lieu d'être redirigé vers le dashboard (`src/pages/Auth.tsx`).

## 7. Dépannage

| Symptôme                        | Piste                                                      |
| ------------------------------- | ---------------------------------------------------------- |
| Pas d'email de confirmation     | SMTP Resend / domaine `mail.emarzona.com` / spam           |
| Confirmation OK, pas de welcome | `app.settings.*` Postgres + logs Edge `send-welcome-email` |
| Welcome en double               | `welcome_email_sent_at` déjà renseigné → réponse `skipped` |
| 401 sur send-welcome-email      | JWT service_role ou `x-internal-secret`                    |
