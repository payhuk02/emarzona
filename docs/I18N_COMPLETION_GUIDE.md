# Guide de Complétion i18n - Emarzona

## État Actuel

### Langues Supportées

- 🇫🇷 **Français (FR)** - 100% complété (référence)
- 🇬🇧 **Anglais (EN)** - 96.7% complété (27 clés manquantes)
- 🇪🇸 **Espagnol (ES)** - 78.9% complété (172 clés manquantes)
- 🇩🇪 **Allemand (DE)** - 78.9% complété (172 clés manquantes)
- 🇵🇹 **Portugais (PT)** - 72.9% complété (330 clés manquantes)

## Structure des Fichiers

```
src/i18n/locales/
├── fr.json (référence - 816 clés)
├── en.json (789 clés - 27 manquantes)
├── es.json (644 clés - 172 manquantes)
├── de.json (644 clés - 172 manquantes)
└── pt.json (595 clés - 330 manquantes)
```

## Processus de Traduction

### 1. Identifier les Clés Manquantes

Utiliser le script de vérification :

```bash
npm run i18n:check
```

### 2. Traduire les Clés

Pour chaque langue, suivre ces étapes :

1. Ouvrir le fichier de traduction (ex: `en.json`)
2. Comparer avec `fr.json` (référence)
3. Ajouter les clés manquantes
4. Traduire le contenu

### 3. Vérifier la Cohérence

- Utiliser la même terminologie dans toute l'application
- Respecter le contexte (formel/informel selon la langue)
- Vérifier les formats (dates, devises, nombres)

## Clés Prioritaires à Traduire

### Anglais (EN) - 27 clés manquantes

- `wizard.*` (wizard de création de produits)
- `common.coverage`
- Sections spécifiques aux nouveaux systèmes

### Espagnol (ES) et Allemand (DE) - 172 clés manquantes

- Sections complètes de produits
- Analytics
- Notifications
- Paramètres avancés

### Portugais (PT) - 330 clés manquantes

- Toutes les sections principales
- Focus sur les fonctionnalités récentes

## Bonnes Pratiques

1. **Cohérence Terminologique**
   - Utiliser un glossaire pour les termes techniques
   - Maintenir la même traduction pour un même concept

2. **Contexte Culturel**
   - Adapter les exemples et références
   - Respecter les conventions locales (dates, devises)

3. **Formatage**
   - Utiliser les helpers de formatage (`useCurrencyFormat`, `useDateFormat`)
   - Tester avec différentes locales

4. **Tests**
   - Tester chaque langue sur toutes les pages principales
   - Vérifier les textes tronqués ou débordements
   - Tester sur mobile et desktop

## Outils Recommandés

- **i18next-parser** : Extraction automatique des clés
- **Crowdin** ou **Lokalise** : Plateformes de traduction collaborative
- **Google Translate API** : Pour les traductions initiales (à réviser)

## Checklist de Complétion

Pour chaque langue :

- [ ] Toutes les clés de `fr.json` sont présentes
- [ ] Toutes les traductions sont complètes (pas de placeholders)
- [ ] Les formats sont corrects (dates, devises)
- [ ] Les tests passent sur toutes les pages
- [ ] Aucun texte hardcodé ne reste dans le code
- [ ] Les composants utilisent `useTranslation` ou `useI18n`

## Prochaines Étapes

1. Compléter les traductions EN (27 clés)
2. Compléter les traductions ES et DE (172 clés chacune)
3. Compléter les traductions PT (330 clés)
4. Ajouter des tests automatisés pour vérifier la complétude
5. Mettre en place un workflow de traduction continue
