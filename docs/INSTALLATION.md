# Guide d'installation — Emarzona

## Prérequis

- **Node.js** 20 LTS ou supérieur
- **npm** 10+
- Compte [Supabase](https://supabase.com) (projet lié ou dédié dev)
- Compte [Vercel](https://vercel.com) (déploiement frontend)

## Installation locale

```bash
git clone https://github.com/emarzona/emarzona.git
cd emarzona
npm install
cp .env.example .env
```

Éditez `.env` avec au minimum :

| Variable                 | Description                        |
| ------------------------ | ---------------------------------- |
| `VITE_SUPABASE_URL`      | URL du projet Supabase             |
| `VITE_SUPABASE_ANON_KEY` | Clé publishable (sb*publishable*…) |

Voir [DEPLOIEMENT_FRONT_SUPABASE_KEYS.md](./DEPLOIEMENT_FRONT_SUPABASE_KEYS.md) pour la rotation des clés JWT legacy.

## Lancer le serveur de développement

```bash
npm run dev
```

Application : `http://localhost:8080`

## Scripts de validation (recommandés après setup)

```bash
npm run verify:supabase-keys    # clés front valides
npm run typecheck:commerce-core # TypeScript commerce
npm run test:unit               # tests unitaires Vitest
npm run verify:phase2:fast      # gate Phase 2 (~5 min, hors secrets remote)
```

Pour les scripts `verify:payment-v2` et `audit:security-gates` en local, ajoutez `SUPABASE_SERVICE_ROLE_KEY` dans `.env` (ne jamais committer).

## Documentation associée

- [ARCHITECTURE.md](./ARCHITECTURE.md) — vue d'ensemble technique
- [DEPLOYMENT.md](./DEPLOYMENT.md) — déploiement Vercel + Supabase
- [USER_GUIDE.md](./USER_GUIDE.md) — guide vendeur / acheteur
- [SECURE_DEPLOY_CHECKLIST.md](../SECURE_DEPLOY_CHECKLIST.md) — gate sécurité pré-prod
