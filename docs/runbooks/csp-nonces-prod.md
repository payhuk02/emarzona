# Runbook — CSP nonces (Epic 5.1)

## Objectif

Remplacer la CSP statique `vercel.json` par une CSP dynamique avec nonce par requête HTML (middleware Edge).

## Fichiers

- `middleware.ts` — injection nonce + header `Content-Security-Policy`
- `src/lib/middleware/csp-policy.ts` — construction directive CSP
- `vercel.json` — CSP statique **retirée** (autres headers conservés)

## Déploiement

1. Merger et **redeploy Vercel** (obligatoire — le middleware ne s’active qu’au deploy).
2. Vérifier une page HTML :
   ```bash
   curl -sI https://www.emarzona.com/ | grep -i content-security-policy
   ```
3. Confirmer que les scripts ont `nonce="..."` dans le HTML servi.

## Rollback

Remettre le bloc `Content-Security-Policy` dans `vercel.json` et retirer le traitement non-bot dans `middleware.ts`.

## Notes

- `'strict-dynamic'` autorise les scripts chargés par un script nonceé (Vite chunks).
- `style-src 'unsafe-inline'` conservé (Tailwind runtime).
- Report URI : `/api/csp-report` (endpoint à brancher si besoin).
