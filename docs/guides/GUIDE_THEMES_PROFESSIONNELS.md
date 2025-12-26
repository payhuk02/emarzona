# Guide des Thèmes Professionnels - Emarzona

**Date:** 2 Décembre 2025  
**Version:** 1.0

---

## 📋 Vue d'Ensemble

Emarzona dispose maintenant de **6 thèmes professionnels** :

1. **Professionnel** - Clair, professionnel, bleu
2. **Minimaliste** - Minimaliste, moderne, épuré
3. **Sombre** - Sombre élégant, premium
4. **Spacieux** - Clair, spacieux, confortable
5. **Classique** - Clair, fonctionnel, pratique
6. **Défaut** - Thème sombre actuel

---

## 🎨 Détails des Thèmes

### 1. Thème Professionnel

**Style:** Professionnel, clair, moderne

**Caractéristiques:**

- ✅ Fond blanc pur (#FFFFFF)
- ✅ Texte noir bleuté (#0A2540)
- ✅ Bleu professionnel (#635BFF)
- ✅ Police: Inter
- ✅ Border radius: 8px (modéré)
- ✅ Ombres subtiles

**Idéal pour:**

- Applications professionnelles
- Dashboards d'entreprise
- Interfaces de paiement
- Sites corporate

**Code:**

```typescript
import { useTheme } from '@/hooks/useTheme';

const { changeTheme } = useTheme();
changeTheme('professional');
```

---

### 2. Thème Minimaliste

**Style:** Minimaliste, moderne, épuré

**Caractéristiques:**

- ✅ Fond blanc pur (#FFFFFF)
- ✅ Texte noir doux (#1D1D1F)
- ✅ Bleu Linear (#0066FF)
- ✅ Police: Inter
- ✅ Border radius: 6px (subtile)
- ✅ Ombres très légères

**Idéal pour:**

- Applications de productivité
- Gestion de projets
- Interfaces minimalistes
- Apps modernes

**Code:**

```typescript
changeTheme('minimal');
```

---

### 3. Thème Sombre

**Style:** Sombre élégant, premium

**Caractéristiques:**

- ✅ Fond noir pur (#000000)
- ✅ Texte blanc doux (#FAFAFA)
- ✅ Accents blancs
- ✅ Police: Inter
- ✅ Border radius: 8px
- ✅ Ombres profondes

**Idéal pour:**

- Applications premium
- Portfolios développeurs
- Sites tech modernes
- Interfaces sombres élégantes

**Code:**

```typescript
changeTheme('dark');
```

---

### 4. Thème Spacieux

**Style:** Clair, spacieux, confortable

**Caractéristiques:**

- ✅ Fond blanc pur (#FFFFFF)
- ✅ Texte gris foncé (#37352F)
- ✅ Sidebar gris clair
- ✅ Police: System UI
- ✅ Border radius: 4px (minimal)
- ✅ Ombres très légères

**Idéal pour:**

- Applications de documentation
- Wikis et bases de connaissances
- Interfaces spacieuses
- Apps de prise de notes

**Code:**

```typescript
changeTheme('spacious');
```

---

### 5. Thème Classique

**Style:** Clair, fonctionnel, pratique

**Caractéristiques:**

- ✅ Fond blanc pur (#FFFFFF)
- ✅ Texte noir bleuté (#24292F)
- ✅ Bleu GitHub (#0969DA)
- ✅ Police: System UI
- ✅ Border radius: 6px
- ✅ Ombres modérées

**Idéal pour:**

- Applications de développement
- Outils techniques
- Interfaces fonctionnelles
- Apps pour développeurs

**Code:**

```typescript
changeTheme('classic');
```

---

### 6. Thème Emarzona (Défaut)

**Style:** Sombre actuel  
**Caractéristiques:**

- ✅ Fond sombre bleu-gris
- ✅ Texte blanc
- ✅ Accents colorés (bleu, jaune)
- ✅ Police: Poppins
- ✅ Border radius: 16px (généreux)
- ✅ Ombres colorées

**Code:**

```typescript
changeTheme('default');
```

---

## 🚀 Utilisation

### 1. Utiliser le Hook useTheme

```typescript
import { useTheme } from '@/hooks/useTheme';

function MyComponent() {
  const { theme, themeConfig, changeTheme, isLoading } = useTheme();

  return (
    <div>
      <p>Thème actuel: {theme}</p>
      <button onClick={() => changeTheme('stripe')}>
        Changer pour Stripe
      </button>
    </div>
  );
}
```

### 2. Utiliser le Composant ThemeSelector

```typescript
import { ThemeSelector } from '@/components/navigation/ThemeSelector';

function SettingsPage() {
  return (
    <div>
      <h1>Paramètres</h1>
      <ThemeSelector />
    </div>
  );
}
```

### 3. Version Compacte (Sidebar)

```typescript
import { ThemeSelectorCompact } from '@/components/navigation/ThemeSelector';

function Sidebar() {
  return (
    <div>
      <ThemeSelectorCompact />
    </div>
  );
}
```

---

## 🎯 Intégration dans l'Application

Le système de thème est **automatiquement initialisé** au démarrage de l'application via le `ThemeProvider` dans `App.tsx`.

### Préférence Utilisateur

Le thème sélectionné est **automatiquement sauvegardé** dans le `localStorage` et **restauré** au prochain chargement.

**Clé de stockage:** `emarzona-theme`

---

## 📊 Comparaison des Thèmes

| Thème         | Fond   | Texte       | Primary        | Police    | Style         |
| ------------- | ------ | ----------- | -------------- | --------- | ------------- |
| Professionnel | Blanc  | Noir bleuté | Bleu (#635BFF) | Inter     | Professionnel |
| Minimaliste   | Blanc  | Noir doux   | Bleu (#0066FF) | Inter     | Minimaliste   |
| Sombre        | Noir   | Blanc doux  | Blanc          | Inter     | Élégant       |
| Spacieux      | Blanc  | Gris foncé  | Gris foncé     | System UI | Spacieux      |
| Classique     | Blanc  | Noir bleuté | Bleu (#0969DA) | System UI | Fonctionnel   |
| Défaut        | Sombre | Blanc       | Bleu vif       | Poppins   | Coloré        |

---

## 🔧 Personnalisation

### Ajouter un Nouveau Thème

1. **Créer la configuration dans `src/lib/themes.ts`:**

```typescript
export const myTheme: ThemeConfig = {
  name: 'mytheme',
  displayName: 'Mon Thème',
  description: 'Description du thème',
  colors: {
    background: '0 0% 100%',
    foreground: '0 0% 0%',
    // ... autres couleurs
  },
  // ... autres propriétés
};
```

2. **Ajouter au registre:**

```typescript
export const themes: Record<ThemeName, ThemeConfig> = {
  // ... thèmes existants
  mytheme: myTheme,
};
```

3. **Mettre à jour le type:**

```typescript
export type ThemeName =
  | 'stripe'
  | 'linear'
  | 'vercel'
  | 'notion'
  | 'github'
  | 'default'
  | 'mytheme';
```

---

## 🎨 Variables CSS Disponibles

Tous les thèmes exposent les mêmes variables CSS :

```css
/* Couleurs principales */
--background
--foreground
--card
--card-foreground
--popover
--popover-foreground
--primary
--primary-foreground
--secondary
--secondary-foreground
--muted
--muted-foreground
--accent
--accent-foreground
--destructive
--destructive-foreground
--border
--input
--ring

/* Sidebar */
--sidebar-background
--sidebar-foreground
--sidebar-primary
--sidebar-primary-foreground
--sidebar-accent
--sidebar-accent-foreground
--sidebar-border
--sidebar-ring

/* Autres */
--radius
--shadow-soft
--shadow-medium
--shadow-large
--font-sans
```

---

## 📱 Responsive

Tous les thèmes sont **100% responsives** et s'adaptent automatiquement à tous les écrans.

---

## ♿ Accessibilité

Tous les thèmes respectent les **standards WCAG AA** :

- ✅ Contraste minimum 4.5:1
- ✅ Focus visible amélioré
- ✅ Navigation clavier optimisée
- ✅ Support des préférences utilisateur

---

## 🐛 Dépannage

### Le thème ne s'applique pas

1. Vérifier que `ThemeProvider` est bien dans `App.tsx`
2. Vérifier la console pour les erreurs
3. Vider le cache du navigateur
4. Vérifier le `localStorage`

### Les couleurs ne changent pas

1. Vérifier que les variables CSS sont bien définies
2. Vérifier que le thème est bien appliqué au `:root`
3. Vérifier les conflits CSS avec `!important`

---

## 📚 Ressources

- **Fichier de configuration:** `src/lib/themes.ts`
- **Hook:** `src/hooks/useTheme.ts`
- **Composants:** `src/components/navigation/ThemeSelector.tsx`
- **Provider:** `src/components/theme/ThemeProvider.tsx`

---

## 🎯 Prochaines Étapes

1. ✅ Thèmes créés (fait)
2. ✅ Système de sélection (fait)
3. ⏳ Ajouter des prévisualisations visuelles
4. ⏳ Permettre la personnalisation avancée
5. ⏳ Ajouter des thèmes saisonniers

---

**Date de création:** 2 Décembre 2025  
**Dernière mise à jour:** 2 Décembre 2025
