# Types Supabase générés

Fichier principal : `types.ts` (généré — ne pas éditer à la main).

Client applicatif : `client.ts` — singleton `createClient` utilisé par toute l'app.

## Régénération

```bash
npm run supabase:types
```

Prérequis : accès au projet Supabase (`hbdnzajbyjakdhuavrvb`) et CLI connectée.

Vérification sans écraser le fichier :

```bash
npm run supabase:types:check
```

## Stockage de session auth (`sessionStorage`)

Le client Supabase est configuré avec `auth.storage: sessionStorage` (voir `client.ts`).

| Aspect           | Comportement                                                                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Sécurité**     | Les jetons ne survivent pas à la fermeture d'onglet/navigateur, ce qui limite l'exposition XSS persistante par rapport à `localStorage`.                           |
| **UX**           | L'utilisateur est déconnecté à la fermeture de l'onglet ; la session reste active tant que l'onglet est ouvert (`persistSession: true`, `autoRefreshToken: true`). |
| **Multi-onglet** | Chaque onglet possède son propre `sessionStorage` : une connexion dans un onglet n'est pas partagée aux autres.                                                    |
| **Tests**        | En `MODE=test`, une clé factice est injectée si les variables d'environnement sont absentes.                                                                       |

**Décision produit** : privilégier la réduction de surface XSS sur la persistance cross-session. Pour une persistance « se souvenir de moi », il faudrait évaluer `localStorage` avec TTL court, rotation agressive et durcissement CSP — non activé à ce jour.

Variables requises en local : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (ou `VITE_SUPABASE_PUBLISHABLE_KEY`).

## Après régénération

1. Exécuter les migrations locales non encore appliquées sur le projet distant si des colonnes manquent.
2. Lancer `npm run typecheck:commerce-core` et les tests unitaires checkout.

Dernière régénération documentée : mai 2026 (CLI Supabase `gen types typescript`).
