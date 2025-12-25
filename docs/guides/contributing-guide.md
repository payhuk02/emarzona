# 🤝 Guide de Contribution - Payhula

**Dernière mise à jour** : Janvier 2025

---

## 📋 Table des Matières

1. [Standards de Code](#standards-de-code)
2. [Structure du Projet](#structure-du-projet)
3. [Workflow Git](#workflow-git)
4. [Tests](#tests)
5. [Documentation](#documentation)

---

## 💻 Standards de Code

### TypeScript

- ✅ Toujours typer les props et fonctions
- ✅ Utiliser les interfaces pour les types complexes
- ✅ Éviter `any`, utiliser `unknown` si nécessaire

### React

- ✅ Composants fonctionnels avec hooks
- ✅ Utiliser `React.memo` pour les composants lourds
- ✅ Lazy loading pour les routes et composants lourds

### Imports

- ✅ Icônes depuis `@/components/icons`
- ✅ Dépendances lourdes en lazy loading
- ✅ Imports spécifiques, pas de `import *`

---

## 📁 Structure du Projet

```
src/
├── components/        # Composants React
│   ├── ui/           # Composants UI de base
│   ├── __tests__/    # Tests des composants
│   └── ...
├── hooks/            # Hooks personnalisés
│   └── __tests__/    # Tests des hooks
├── lib/              # Utilitaires et helpers
├── contexts/         # Contextes React
├── pages/            # Pages de l'application
└── types/            # Types TypeScript
```

---

## 🔀 Workflow Git

### Branches

- `main` : Production
- `develop` : Développement
- `feature/*` : Nouvelles fonctionnalités
- `fix/*` : Corrections de bugs
- `hotfix/*` : Corrections urgentes

### Commits

Format : `type: description`

Types :
- `feat:` : Nouvelle fonctionnalité
- `fix:` : Correction de bug
- `docs:` : Documentation
- `refactor:` : Refactoring
- `test:` : Tests
- `chore:` : Tâches de maintenance

Exemple :
```
feat: Ajout du lazy loading pour jspdf
fix: Correction de l'erreur DollarSignIcon
docs: Mise à jour du guide de migration
```

---

## 🧪 Tests

### Structure

- Tests dans `__tests__/` à côté du code
- Extension `.test.tsx` pour les tests avec JSX
- Extension `.test.ts` pour les tests sans JSX

### Exécution

```bash
# Tous les tests
npm run test:unit

# Avec couverture
npm run test:coverage

# Mode watch
npm test
```

### Objectif

- **Couverture minimale** : 50%
- **Composants critiques** : 80%+

---

## 📝 Documentation

### Nouveaux Composants

- Commenter les props complexes
- Documenter les hooks personnalisés
- Ajouter des exemples d'utilisation

### Guides

- Mettre à jour les guides existants
- Créer de nouveaux guides si nécessaire
- Maintenir la cohérence

---

## ✅ Checklist Avant un PR

- [ ] Code conforme aux standards
- [ ] Tests passent
- [ ] Couverture de tests maintenue
- [ ] Documentation mise à jour
- [ ] Linter sans erreurs
- [ ] Build réussi
- [ ] Commit message clair

---

## 🔗 Ressources

- [Guide Migration](./migration-guide.md)
- [Guide Performance](./performance-best-practices.md)
- [Guide Tests](./testing-guide.md)

---

**Dernière mise à jour** : Janvier 2025

