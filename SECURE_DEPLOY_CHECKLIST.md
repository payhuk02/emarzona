# Secure Deploy Checklist (Emarzona)

## 1) Secrets and environment

- Set `EDGE_INTERNAL_SECRET` for all internal Edge Functions.
- Verify `SUPABASE_SERVICE_ROLE_KEY` is only present in server-side runtimes.
- Verify `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `RESEND_FROM_NAME`.
- Confirm `ALLOWED_ORIGINS` includes only trusted domains.

## 2) Edge Functions security gates

- `webhook-delivery` must reject requests without valid `x-internal-secret`.
- `send-email` must allow:
  - internal calls with `x-internal-secret`,
  - authenticated user calls only in restricted mode.
- Ensure user-mode email calls cannot send custom HTML and cannot target other recipients.

## 3) CI checks before merge

- Run `npm run lint:ci`.
- Run `npm run test:coverage`.
- Run workflow job `edge-functions`:
  - `deno fmt --check supabase/functions`
  - `deno check` on Edge Function entrypoints.

## 4) Post-deploy smoke tests

- Call `webhook-delivery` without secret -> expect `401`.
- Call `webhook-delivery` with valid secret -> expect `200`.
- Call `send-email` as user with `html` payload -> expect `403`.
- Call `send-email` as user to another email -> expect `403`.
- Call `send-email` with internal secret and valid payload -> expect `200`.

## 5) Observability validation

- Confirm logs include `requestId` and `durationMs` for `send-email` and `webhook-delivery`.
- Confirm failed requests include structured error payloads.
- Track error rates after deploy (first 24h, then 7 days).
