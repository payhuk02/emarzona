# Guide de Contribution

Ce document décrit les conventions et outils utilisés dans le projet Payhuk.

## 🛠️ Outils de Développement

### Prettier (Formatage de Code)

Le projet utilise Prettier pour garantir un formatage cohérent du code.

#### Commandes disponibles :
```bash
# Formater tous les fichiers
npm run format

# Vérifier le formatage sans modifier
npm run format:check
```

#### Configuration
Le fichier `.prettierrc.json` contient les règles de formatage :
- Indentation : 2 espaces
- Guillemets : simples pour JS/TS, doubles pour JSX
- Largeur de ligne : 100 caractères
- Point-virgule : obligatoire

### ESLint (Linting)

ESLint est utilisé pour détecter les erreurs et problèmes de code.

#### Commandes disponibles :
```bash
# Linter tous les fichiers
npm run lint

# Linter et corriger automatiquement
npm run lint:fix
```

### Husky (Git Hooks)

Husky exécute automatiquement des vérifications avant chaque commit.

#### Installation initiale :
```bash
npm install
npm run setup:husky
```

#### Fonctionnement
Avant chaque commit, `lint-staged` exécute :
- ESLint sur les fichiers `.ts` et `.tsx` modifiés
- Prettier sur tous les fichiers modifiés

Si des erreurs sont détectées, le commit est bloqué jusqu'à correction.

## 📝 Conventions de Code

### TypeScript

#### Types `any` à éviter
- Utiliser des interfaces ou types spécifiques
- Préférer `unknown` pour les erreurs, puis vérifier avec `instanceof Error`

**Exemple :**
```typescript
// ❌ Mauvais
catch (error: any) {
  console.log(error.message);
}

// ✅ Bon
catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
  logger.error('Operation failed', { error: errorMessage });
}
```

### React

#### Composants
- Utiliser des composants fonctionnels avec hooks
- Préférer `React.memo` pour les composants lourds
- Utiliser `useCallback` et `useMemo` pour optimiser les performances

#### Accessibilité
- Toujours fournir `aria-label` pour les boutons sans texte visible
- Utiliser les balises sémantiques appropriées
- Gérer le focus clavier

### Logging

Utiliser `logger` au lieu de `console.*` :

```typescript
import { logger } from '@/lib/logger';

// ✅ Bon
logger.info('Operation started', { userId });
logger.error('Operation failed', { error, context });
logger.warn('Deprecated feature used', { feature });
```

## 🧪 Tests

### Tests Unitaires

Les tests unitaires utilisent Vitest et Testing Library.

#### Structure
```
src/
  components/
    ui/
      __tests__/
        button.test.tsx
        input.test.tsx
  hooks/
    __tests__/
      useStore.test.tsx
```

#### Commandes
```bash
# Exécuter tous les tests
npm run test:unit

# Tests avec interface
npm run test:ui

# Tests avec couverture
npm run test:coverage
```

### Tests E2E

Les tests E2E utilisent Playwright.

#### Commandes
```bash
# Tous les tests E2E
npm run test:e2e

# Tests spécifiques
npm run test:e2e:auth
npm run test:e2e:products
```

## 🔒 Sécurité

### Upload de Fichiers

Tous les uploads de fichiers doivent :
1. Valider le type MIME côté client
2. Vérifier les magic bytes via Edge Function
3. Bloquer les extensions dangereuses
4. Sanitiser les noms de fichiers

Voir `src/lib/file-security.ts` et `supabase/functions/validate-file-upload/` pour plus de détails.

## 📊 Base de Données

### Migrations

Les migrations Supabase sont dans `supabase/migrations/`.

#### Bonnes pratiques :
- Nommer les migrations avec la date : `YYYYMMDD_description.sql`
- Utiliser des transactions quand possible
- Ajouter des commentaires pour les changements complexes
- Tester les migrations en local avant de les déployer

### Requêtes N+1

Éviter les requêtes N+1 en :
- Utilisant des jointures SQL
- Créant des fonctions SQL pour les statistiques complexes
- Utilisant `Promise.all()` pour les requêtes parallèles

## 🚀 Workflow Git

1. **Créer une branche** : `git checkout -b feature/nom-de-la-feature`
2. **Faire des commits** : Les hooks Husky vérifieront automatiquement le code
3. **Pousser la branche** : `git push origin feature/nom-de-la-feature`
4. **Créer une PR** : Sur GitHub/GitLab

### Messages de Commit

Utiliser des messages clairs et descriptifs :
```
feat: ajouter la gestion des messages informatifs
fix: corriger l'affichage du logo sur mobile
refactor: optimiser les requêtes N+1 dans useEnrollments
test: ajouter des tests pour le composant Button
```

## 📚 Ressources

- [Documentation TypeScript](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [Testing Library](https://testing-library.com/)
- [Playwright](https://playwright.dev/)

---

**Questions ?** Ouvrez une issue ou contactez l'équipe de développement.

