# Runbook — SSO Enterprise vendeurs (Epic 4.3)

## Objectif

Permettre aux boutiques **Physique Enterprise** (`physical_premium`) de connecter leur IdP (Azure AD, Okta, Google Workspace) pour l’équipe vendeur avec **provisioning JIT** et mapping groupes → rôles.

## Prérequis

| Item             | Détail                                                               |
| ---------------- | -------------------------------------------------------------------- |
| Plan boutique    | `physical_premium` (Enterprise — 15 000 XOF/mois)                    |
| Feature flag SQL | `store_has_physical_feature(store_id, 'team.sso')`                   |
| Edge function    | `store-sso-auth` déployée avec `--no-verify-jwt` (callback OIDC GET) |

## Déploiement

```bash
# Migration E40
npx supabase db push --linked

# Edge (callback OIDC sans JWT)
npx supabase functions deploy store-sso-auth --no-verify-jwt --project-ref hbdnzajbyjakdhuavrvb
```

## Configuration vendeur (Dashboard)

1. **Équipe → onglet SSO Enterprise**
2. Type **OIDC** (recommandé production)
3. Renseigner :
   - Issuer URL (ex. `https://login.microsoftonline.com/{tenant}/v2.0`)
   - Client ID / Secret
   - Domaines email autorisés (`acme.com`)
   - Mapping JSON groupes → rôles
4. Redirect URI chez l’IdP :

```
https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/store-sso-auth
```

5. URL login équipe :

```
https://www.emarzona.com/auth/sso/{store_slug}
```

## Flux technique

```
Employé → /auth/sso/acme → edge authorize → IdP
       → callback edge → userinfo → domain check
       → create/find user → provision_store_sso_member
       → magic link Supabase → /dashboard
```

## Rôles mappés

| Rôle Emarzona | Permissions typiques                   |
| ------------- | -------------------------------------- |
| `manager`     | Produits, commandes, équipe, analytics |
| `staff`       | Produits, commandes, tâches            |
| `support`     | Commandes, clients                     |
| `viewer`      | Lecture seule                          |

## SAML 2.0 (Epic 4.5 — phase 2)

1. Type **SAML 2.0** dans Équipe → SSO Enterprise
2. Renseigner Entity ID IdP, SSO URL, certificat X.509 PEM
3. ACS URL chez l'IdP :

```
https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/store-sso-auth
```

4. SP Entity ID Emarzona :

```
https://www.emarzona.com/auth/sso/saml
```

5. Binding : HTTP-POST (ACS), HTTP-Redirect (login).

Validation : signature RSA-SHA256, expiration assertion, email + groupes IdP.

## Sécurité

- Secrets OIDC (`oidc_client_secret`) : RLS propriétaire + edge service_role uniquement
- États OAuth CSRF : `store_sso_states` (15 min, one-time)
- Audit : `store_sso_login_events`
- Rate-limit bots middleware (Epic 4.1) complémentaire

## Tests

```bash
npx vitest run src/lib/sso/__tests__/store-sso.test.ts
# SQL
psql ... -f tests/financial/e40-enterprise-sso.test.sql
```

## Rollback

```sql
UPDATE store_sso_providers SET enabled = false;
-- ou DROP migration tables (staging only)
```
