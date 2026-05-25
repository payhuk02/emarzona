# Déploiement front — clés Supabase (publishable)

## Règle (depuis mai 2026)

Le projet `hbdnzajbyjakdhuavrvb` a **désactivé les JWT legacy** `anon` / `service_role` pour l’API REST publique.

| Variable                                                        | Valeur attendue                            | Interdit en prod                            |
| --------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------- |
| `VITE_SUPABASE_URL`                                             | `https://hbdnzajbyjakdhuavrvb.supabase.co` | —                                           |
| `VITE_SUPABASE_ANON_KEY` **ou** `VITE_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...`                       | `eyJhbGciOiJIUzI1NiIs...` (JWT anon legacy) |

Le client lit les deux noms :

```ts
// src/integrations/supabase/client.ts
import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
```

## Vercel (production / preview)

1. **Dashboard** → projet Emarzona → **Settings** → **Environment Variables**
2. Vérifier pour **Production**, **Preview** et **Development** :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY` = clé **Publishable** du dashboard Supabase → **API Keys** → _Publishable key_
3. **Redéployer** après toute modification (les variables `VITE_*` sont injectées au **build**).

### CLI (lecture seule)

```bash
npx vercel env ls production
npx vercel env pull .env.vercel.production --environment=production
# Inspecter VITE_SUPABASE_ANON_KEY : doit commencer par sb_publishable_
```

## GitHub Actions (Playwright / CI)

Workflows `.github/workflows/playwright.yml` utilisent :

- `secrets.VITE_SUPABASE_PUBLISHABLE_KEY` ou
- `secrets.VITE_SUPABASE_TEST_ANON_KEY` (doit être une clé **publishable**, pas `eyJ...`)

Mettre à jour le secret si les tests REST échouent avec `401` / `Invalid API key`.

## Vérification locale / CI

```bash
# Depuis .env.local
npm run verify:supabase-keys

# Avec variables explicites
VITE_SUPABASE_ANON_KEY=sb_publishable_xxx npm run verify:supabase-keys
```

Le script échoue (`exit 1`) si une clé legacy `eyJ` est détectée.

## Piège fréquent : doublon dans `.env`

Si `.env` contient **deux** lignes `VITE_SUPABASE_ANON_KEY`, Vite applique la **dernière**. Une ligne `sb_publishable_...` suivie d’un `eyJ...` legacy **casse** le front en prod locale.

```bash
npm run verify:supabase-keys   # échoue si doublon ou eyJ détecté
```

Supprimez toute ligne `eyJ...` et ne gardez qu’une clé publishable.

## Checklist go-live front

- [ ] `VITE_SUPABASE_ANON_KEY` commence par `sb_publishable_`
- [ ] Build Vercel récent après changement de clé
- [ ] `/unsubscribe` fonctionne sans login (RPC `record_email_unsubscribe`)
- [ ] Smoke : `.\scripts\email-smoke-test.ps1` avec `$env:SUPABASE_ANON_KEY = sb_publishable_...`

## Références

- [EMAIL_SMOKE_TEST.md](./EMAIL_SMOKE_TEST.md)
- [CONFIGURATION_EMAIL_RESEND_CRON.md](./CONFIGURATION_EMAIL_RESEND_CRON.md)
