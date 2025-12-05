# 🔍 Guide d'Utilisation d'axe DevTools

**Date**: 2025-01-04  
**Objectif**: Vérifier et corriger les problèmes d'accessibilité avec axe DevTools

---

## 📋 Installation

### Chrome/Edge
1. Ouvrir Chrome Web Store
2. Rechercher "axe DevTools"
3. Installer l'extension [axe DevTools](https://chrome.google.com/webstore/detail/axe-devtools-web-accessibility/lhdoppojpmngadmnindnejefpokejbdd)

### Firefox
1. Ouvrir Firefox Add-ons
2. Rechercher "axe DevTools"
3. Installer l'extension

---

## 🚀 Utilisation

### Étape 1: Ouvrir DevTools
1. Ouvrir l'application dans le navigateur
2. Appuyer sur `F12` ou `Ctrl+Shift+I` (Windows/Linux) / `Cmd+Option+I` (Mac)
3. Aller dans l'onglet **"axe DevTools"**

### Étape 2: Lancer l'Audit
1. Cliquer sur **"Scan ALL of my page"** pour auditer toute la page
2. Ou cliquer sur **"Scan part of my page"** pour auditer une section spécifique
3. Attendre la fin du scan (quelques secondes)

### Étape 3: Analyser les Résultats
L'audit affiche :
- **Violations** : Problèmes critiques à corriger
- **Incomplete** : Problèmes potentiels à vérifier
- **Passes** : Éléments conformes
- **Inapplicable** : Règles non applicables

---

## 🔧 Problèmes Courants et Solutions

### 1. Images sans texte alternatif

**Problème**:
```
Image elements must have an alt attribute
```

**Solution**:
```tsx
// ❌ Avant
<img src="/logo.png" />

// ✅ Après
<img src="/logo.png" alt="Logo Emarzona" />
```

---

### 2. Boutons sans label

**Problème**:
```
Buttons must have discernible text
```

**Solution**:
```tsx
// ❌ Avant
<Button>
  <X className="h-4 w-4" />
</Button>

// ✅ Après
<Button aria-label="Fermer">
  <X className="h-4 w-4" aria-hidden="true" />
</Button>
```

---

### 3. Contraste insuffisant

**Problème**:
```
Elements must have sufficient color contrast
```

**Solution**:
- Vérifier le ratio de contraste (minimum 4.5:1 pour texte normal, 3:1 pour texte large)
- Utiliser des couleurs avec meilleur contraste
- Vérifier avec [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

---

### 4. Formulaires sans labels

**Problème**:
```
Form elements must have labels
```

**Solution**:
```tsx
// ❌ Avant
<input type="text" name="email" />

// ✅ Après
<Label htmlFor="email">Email</Label>
<Input id="email" type="email" name="email" />
```

---

### 5. Navigation clavier

**Problème**:
```
All page content must be contained by landmarks
```

**Solution**:
- Utiliser des éléments sémantiques (`<main>`, `<nav>`, `<header>`, `<footer>`)
- Ajouter `role="main"` si nécessaire

---

## 📊 Checklist d'Audit

### Pages à Auditer
- [ ] Page d'accueil (Landing)
- [ ] Page de connexion (Auth)
- [ ] Dashboard
- [ ] Liste des produits
- [ ] Détail d'un produit
- [ ] Panier
- [ ] Checkout
- [ ] Profil utilisateur
- [ ] Paramètres

### Éléments à Vérifier
- [ ] Toutes les images ont un `alt`
- [ ] Tous les boutons ont un label ou `aria-label`
- [ ] Tous les formulaires ont des labels
- [ ] Contraste suffisant sur tous les textes
- [ ] Navigation clavier fonctionnelle
- [ ] Focus visible sur tous les éléments
- [ ] Skip links présents et fonctionnels

---

## 🎯 Objectifs

### Conformité WCAG 2.1
- **Level A** : 100% conforme ✅
- **Level AA** : 95%+ conforme ⚠️
- **Level AAA** : 70%+ conforme (optionnel) 💡

### Métriques
- **0 violations critiques** (Level A)
- **< 5 violations** Level AA
- **Score axe** : > 90/100

---

## 📝 Rapport d'Audit

### Template de Rapport
```markdown
# Audit axe DevTools - [Page Name]
**Date**: [Date]
**Page**: [URL]

## Résultats
- Violations: X
- Incomplete: Y
- Passes: Z

## Violations Critiques
1. [Description] - [Fichier] - [Ligne]
2. [Description] - [Fichier] - [Ligne]

## Actions Correctives
- [ ] [Action 1]
- [ ] [Action 2]
```

---

## 🔗 Ressources

- [axe DevTools Documentation](https://www.deque.com/axe/devtools/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)

---

## ✅ Bonnes Pratiques

1. **Auditer régulièrement** : Après chaque nouvelle fonctionnalité
2. **Corriger immédiatement** : Les violations Level A
3. **Documenter** : Les corrections apportées
4. **Tester** : Avec des lecteurs d'écran après corrections
5. **Former** : L'équipe sur l'accessibilité

---

**Prochaine révision**: 2025-01-11 (hebdomadaire)





