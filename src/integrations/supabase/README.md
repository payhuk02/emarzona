# Types Supabase générés

Fichier principal : `types.ts` (généré — ne pas éditer à la main).

## Régénération

```bash
npm run supabase:types
```

Prérequis : accès au projet Supabase (`hbdnzajbyjakdhuavrvb`) et CLI connectée.

Vérification sans écraser le fichier :

```bash
npm run supabase:types:check
```

## Après régénération

1. Exécuter les migrations locales non encore appliquées sur le projet distant si des colonnes manquent.
2. Lancer `npm run typecheck:commerce-core` et les tests unitaires checkout.

Dernière régénération documentée : mai 2026 (CLI Supabase `gen types typescript`).
