# Google Calendar OAuth — production (Epic 3.3.4 / E37)

## Objectif

Permettre aux vendeurs services de connecter **Google Calendar** (lecture busy + création Meet) en production.

## Prérequis Google Cloud Console

1. Projet GCP avec **Google Calendar API** activée.
2. **OAuth consent screen** : type External, scopes `calendar.readonly` + `calendar.events`.
3. **Credentials → OAuth 2.0 Client ID** (type Web application).
4. **Authorized redirect URI** (obligatoire, exact) :

```
https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/google-calendar-oauth
```

## Secrets Supabase (Edge Functions)

| Secret                          | Description                     |
| ------------------------------- | ------------------------------- |
| `GOOGLE_CALENDAR_CLIENT_ID`     | Client ID OAuth Web             |
| `GOOGLE_CALENDAR_CLIENT_SECRET` | Client secret                   |
| `GOOGLE_CALENDAR_REDIRECT_URI`  | URI ci-dessus (identique à GCP) |

### Script (recommandé)

```powershell
$env:GOOGLE_CALENDAR_CLIENT_ID = "<client-id>.apps.googleusercontent.com"
$env:GOOGLE_CALENDAR_CLIENT_SECRET = "<secret>"
$env:GOOGLE_CALENDAR_REDIRECT_URI = "https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/google-calendar-oauth"
.\scripts\set-google-calendar-oauth-secrets.ps1
```

Ou interactif :

```powershell
.\scripts\set-google-calendar-oauth-secrets.ps1 -Interactive
```

### CLI manuelle

```bash
npx supabase secrets set \
  GOOGLE_CALENDAR_CLIENT_ID="<id>" \
  GOOGLE_CALENDAR_CLIENT_SECRET="<secret>" \
  GOOGLE_CALENDAR_REDIRECT_URI="https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/google-calendar-oauth" \
  --project-ref hbdnzajbyjakdhuavrvb
```

## Déploiement edge functions

```bash
npx supabase functions deploy google-calendar-oauth --no-verify-jwt --project-ref hbdnzajbyjakdhuavrvb
npx supabase functions deploy google-calendar-sync --project-ref hbdnzajbyjakdhuavrvb
npx supabase functions deploy service-booking-meeting --project-ref hbdnzajbyjakdhuavrvb
```

`google-calendar-oauth` : `--no-verify-jwt` requis pour le callback GET Google (sans JWT utilisateur).

## Vérification

```bash
npx supabase secrets list --project-ref hbdnzajbyjakdhuavrvb | findstr GOOGLE_CALENDAR
```

Test vendeur (dashboard → Intégrations calendrier → **Connecter Google Calendar**) :

1. Redirection `accounts.google.com` sans erreur 500.
2. Retour avec `?google_calendar=connected` sur la page vendeur.
3. Sync busy : événements importés dans `service_calendar_events`.

Test SQL (post-migration E37) :

```sql
SELECT proname FROM pg_proc WHERE proname = 'upsert_google_calendar_busy_events';
```

## Rollback

```bash
npx supabase secrets unset GOOGLE_CALENDAR_CLIENT_ID GOOGLE_CALENDAR_CLIENT_SECRET GOOGLE_CALENDAR_REDIRECT_URI --project-ref hbdnzajbyjakdhuavrvb
```

Les intégrations existantes restent en base mais le refresh token échouera jusqu'à reconnexion.
