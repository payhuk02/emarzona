# Edge Function: send-welcome-email

Envoie le template **`welcome-user`** via **`send-email`** une fois l'adresse email confirmée (`auth.users.email_confirmed_at`).

## Déclenchement

- Trigger SQL `on_auth_user_email_confirmed_welcome` sur `auth.users` (INSERT/UPDATE de `email_confirmed_at`)
- Appel manuel (tests) avec JWT `service_role` ou `x-internal-secret`

## Body

```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "full_name": "Prénom Nom"
}
```

## Secrets

- `EDGE_INTERNAL_SECRET` (recommandé, aligné avec les autres Edge Functions)
- `SITE_URL` (lien dashboard dans le template, défaut `https://emarzona.com`)
- `RESEND_*` hérités par `send-email`

## Déploiement

```bash
npx supabase functions deploy send-welcome-email --project-ref hbdnzajbyjakdhuavrvb
```

## Prérequis base de données

Configurer dans **Dashboard → Database → Settings → Custom Postgres Config** :

- `app.settings.supabase_url` = `https://hbdnzajbyjakdhuavrvb.supabase.co`
- `app.settings.service_role_key` = JWT service_role (`eyJ...`)

Voir [docs/CONFIGURATION_AUTH_EMAIL_RESEND.md](../../../docs/CONFIGURATION_AUTH_EMAIL_RESEND.md).
