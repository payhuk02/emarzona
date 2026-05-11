# Emarzona Domains Go-Live Checklist

Platform domains:
- Main platform: `emarzona.com`
- Store wildcard domain: `myemarzona.shop`
- User custom domains: customer-owned domains

## 1. DNS & Routing

- `emarzona.com` points to production app hosting.
- `www.emarzona.com` redirects or aliases to `emarzona.com` (single canonical strategy).
- `myemarzona.shop` is configured.
- `*.myemarzona.shop` wildcard is configured to route all store subdomains.
- For each custom domain:
  - TXT record `_emarzona.<domain>` contains verification token.
  - A/CNAME target matches infra target (based on your provider).
  - DNS propagation validated (allow up to 48h).

## 2. Vercel / Hosting

- Project includes both platform and store wildcard domains.
- Rewrite fallback to SPA is active (`/index.html`) for non-API routes.
- HTTPS is enabled for `emarzona.com` and wildcard store domain.
- Domain ownership validated for custom domains before activation.

## 3. Supabase Database

- `public.custom_domains` exists and is populated.
- RLS is enabled on `custom_domains`.
- `get_store_by_subdomain` and `get_store_by_custom_domain` exist.
- No duplicate active store subdomains.
- Domain statuses are coherent:
  - `pending/verifying` during setup
  - `active` when verified and live
  - `error` when DNS/SSL checks fail

## 4. Supabase Edge Functions Env

Set these secrets in Supabase Edge Functions:
- `ALLOWED_ORIGINS=https://emarzona.com,https://www.emarzona.com,https://myemarzona.shop`
- `CRON_SECRET=<strong-secret>`
- `EDGE_INTERNAL_SECRET=<strong-secret>`
- `SITE_URL=https://emarzona.com`
- `CUSTOM_DOMAIN_A_TARGETS=<comma-separated expected A targets>` (optional, recommended)
- `CUSTOM_DOMAIN_CNAME_TARGETS=<comma-separated expected CNAME targets>` (optional, recommended)

Email functions:
- `RESEND_API_KEY` / `RESEND_FROM_EMAIL` configured for `send-email`.
- `SENDGRID_API_KEY` configured only in server-side contexts where still used.

## 5. Security Controls

- Client-side direct SendGrid sending is disabled.
- Domain verification endpoint uses authenticated user JWT.
- Domain monitoring cron endpoint requires `x-cron-secret`.
- Internal cross-function calls use `x-internal-secret` or validated JWT.
- CORS allowlist is configured and not left open in production.

## 6. Functional E2E Smoke Tests

- Platform routes work on `emarzona.com`.
- Storefront opens on `https://<store-subdomain>.myemarzona.shop`.
- Product URLs resolve correctly on store subdomains.
- Add custom domain in dashboard -> verify -> status becomes active.
- Custom domain serves correct storefront after activation.
- SSL warning/expiration flow sends alerts as expected.

## 7. SQL Validation Before Release

Run:

`supabase/scripts/verify-domain-go-live.sql`

Expected:
- Required RPCs/tables/policies exist.
- No duplicate active subdomains.
- Active custom domains resolve in smoke tests.
- Problem queue is empty or understood and accepted.

## 8. Rollback Plan

- Keep `myemarzona.shop` paths as fallback if custom domain fails.
- If custom domain fails verification, force status `pending/error` and keep storefront reachable by subdomain.
- Maintain DNS rollback instructions per registrar.

