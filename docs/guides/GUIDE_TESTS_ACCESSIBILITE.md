# 🧪 Guide des Tests d'Accessibilité

**Date**: 2025-01-04  
**Objectif**: Comprendre et exécuter les tests d'accessibilité

---

## 📋 Tests Disponibles

### Tests Automatisés avec Playwright

**Fichier**: `tests/accessibility.spec.ts`

**Pages Testées**:
- ✅ Accueil (`/`)
- ✅ Marketplace (`/marketplace`)
- ✅ Authentification (`/auth`)
- ✅ Dashboard (`/dashboard`)
- ✅ Produits (`/products`)
- ✅ Commandes (`/orders`)

---

## 🚀 Exécution des Tests

### Tous les Tests d'Accessibilité

```bash
npm run test:a11y
```

### Tests Spécifiques

```bash
# Tests de navigation clavier uniquement
npx playwright test tests/accessibility.spec.ts --grep "Navigation Clavier"

# Tests ARIA uniquement
npx playwright test tests/accessibility.spec.ts --grep "ARIA"

# Tests de contraste uniquement
npx playwright test tests/accessibility.spec.ts --grep "Contraste"
```

### Avec Interface UI

```bash
npx playwright test tests/accessibility.spec.ts --ui
```

---

## 📊 Types de Tests

### 1. Scan Automatique avec axe-core

**Objectif**: Détecter automatiquement les violations WCAG

**Tests**:
- ✅ Pas de violations WCAG 2.1 Level A
- ✅ Pas de violations WCAG 2.1 Level AA

**Exécution**:
```bash
npx playwright test tests/accessibility.spec.ts --grep "Scan Automatique"
```

---

### 2. Navigation Clavier

**Objectif**: Vérifier que la navigation au clavier fonctionne

**Tests**:
- ✅ Navigation avec Tab
- ✅ Navigation en arrière avec Shift+Tab
- ✅ Activation des liens avec Enter
- ✅ Activation des boutons avec Space
- ✅ Focus visible

**Exécution**:
```bash
npx playwright test tests/accessibility.spec.ts --grep "Navigation Clavier"
```

---

### 3. ARIA & Sémantique

**Objectif**: Vérifier la structure ARIA et sémantique

**Tests**:
- ✅ Présence de landmarks (main, nav, header, footer)
- ✅ Images avec attributs alt
- ✅ Boutons avec labels accessibles
- ✅ Liens avec texte accessible
- ✅ Formulaires avec labels

**Exécution**:
```bash
npx playwright test tests/accessibility.spec.ts --grep "ARIA"
```

---

### 4. Contraste

**Objectif**: Vérifier le contraste des couleurs

**Tests**:
- ✅ Contraste suffisant (WCAG 2.1 AA)

**Exécution**:
```bash
npx playwright test tests/accessibility.spec.ts --grep "Contraste"
```

---

### 5. Responsive & Zoom

**Objectif**: Vérifier l'utilisabilité avec zoom et sur mobile

**Tests**:
- ✅ Utilisable avec zoom 200%
- ✅ Utilisable en mode paysage mobile

**Exécution**:
```bash
npx playwright test tests/accessibility.spec.ts --grep "Responsive"
```

---

### 6. Lecteur d'Écran

**Objectif**: Vérifier la compatibilité avec les lecteurs d'écran

**Tests**:
- ✅ Titre de page descriptif
- ✅ Hiérarchie de headings correcte
- ✅ Contenu dynamique avec aria-live

**Exécution**:
```bash
npx playwright test tests/accessibility.spec.ts --grep "Lecteur"
```

---

### 7. Formulaires

**Objectif**: Vérifier l'accessibilité des formulaires

**Tests**:
- ✅ Erreurs de validation annoncées
- ✅ Champs requis identifiés

**Exécution**:
```bash
npx playwright test tests/accessibility.spec.ts --grep "Formulaires"
```

---

## 🔧 Script d'Automatisation

### Vérification Automatique

**Script**: `scripts/check-accessibility.js`

**Usage**:
```bash
# Vérifier toutes les pages
node scripts/check-accessibility.js

# Avec URL personnalisée
BASE_URL=http://localhost:8080 node scripts/check-accessibility.js
```

**Fonctionnalités**:
- ✅ Scanne toutes les pages principales
- ✅ Génère un rapport JSON
- ✅ Affiche un résumé des résultats

**Rapport Généré**: `accessibility-reports/accessibility-report-[timestamp].json`

---

## 📝 Ajouter de Nouvelles Pages

### Modifier `tests/accessibility.spec.ts`

```typescript
const pages = [
  { name: 'Accueil', path: '/' },
  { name: 'Nouvelle Page', path: '/nouvelle-page' }, // Ajouter ici
];
```

### Modifier `scripts/check-accessibility.js`

```javascript
const pages = [
  { name: 'Accueil', path: '/' },
  { name: 'Nouvelle Page', path: '/nouvelle-page' }, // Ajouter ici
];
```

---

## 🎯 Objectifs de Conformité

### WCAG 2.1 Level A
- ✅ **100% conforme** - Obligatoire

### WCAG 2.1 Level AA
- ✅ **95%+ conforme** - Recommandé

### Métriques
- **0 violations** Level A
- **< 5 violations** Level AA
- **Score axe** : > 90/100

---

## 🔍 Dépannage

### Tests Échouent

1. **Vérifier que le serveur est en cours d'exécution**
   ```bash
   npm run dev
   ```

2. **Vérifier l'URL de base**
   ```bash
   BASE_URL=http://localhost:8080 npm run test:a11y
   ```

3. **Vérifier les dépendances**
   ```bash
   npm install
   ```

### Tests Lents

- Réduire le nombre de pages testées
- Utiliser `--workers=1` pour exécution séquentielle
- Utiliser `--grep` pour tester une page spécifique

---

## 📚 Ressources

- [Playwright Accessibility Testing](https://playwright.dev/docs/accessibility-testing)
- [axe-core Documentation](https://github.com/dequelabs/axe-core)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

## ✅ Checklist

Avant de commit:
- [ ] Tous les tests d'accessibilité passent
- [ ] Aucune violation Level A
- [ ] < 5 violations Level AA
- [ ] Rapport généré et vérifié

---

**Prochaine révision**: 2025-01-11 (hebdomadaire)





