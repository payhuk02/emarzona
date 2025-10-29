# 🚀 TEMPLATES UI V2 - GUIDE DE DÉMARRAGE RAPIDE

## 🎯 Accès rapide

```bash
# Démarrer le serveur de développement
npm run dev

# Accéder à la demo UI
http://localhost:5173/demo/templates-ui
```

---

## 📚 TABLE DES MATIÈRES

1. [Marketplace - Parcourir les templates](#1-marketplace)
2. [Preview - Aperçu fullscreen](#2-preview)
3. [Customizer - Personnaliser](#3-customizer)
4. [Exporter - Télécharger](#4-exporter)
5. [Importer - Charger un template](#5-importer)

---

## 1. 🏪 MARKETPLACE

### Parcourir les templates

1. **Ouvrir le marketplace**
   - Accéder à `/demo/templates-ui`
   - Tab "Marketplace"

2. **Rechercher**
   ```
   🔍 Taper dans la barre de recherche
   → Résultats en temps réel
   ```

3. **Filtrer**
   - **Tier:** Free / Premium
   - **Style:** Minimal, Modern, Professional, Creative, Luxury, Elegant
   - **Sort:** Populaire, Récent, Note, Prix, Nom

4. **Changer la vue**
   - **Grille** (par défaut) : cartes visuelles
   - **Liste** : vue compacte avec détails

5. **Actions sur un template**
   - **Hover** → Aperçu rapide
   - **Clic** → Sélectionner (devient actif)
   - **Bouton Aperçu** → Ouvrir preview modal
   - **❤️ Favoris** → Ajouter aux favoris

---

## 2. 🔍 PREVIEW

### Visualiser en fullscreen

1. **Ouvrir la preview**
   - Cliquer sur "Aperçu" sur une carte
   - Ou cliquer sur "👁️ Eye" dans le hover

2. **Changer le viewport**
   ```
   🖥️ Desktop (1920px)  → Vue desktop complète
   📱 Tablet (768px)    → Vue tablette
   📱 Mobile (375px)    → Vue mobile
   ```

3. **Contrôles de zoom**
   ```
   🔍- Dézoomer    → 50% minimum
   🔍+ Zoomer      → 200% maximum
   📐  Reset       → 100%
   ```

4. **Toggle thème**
   ```
   ☀️ Mode clair
   🌙 Mode sombre
   ```

5. **Navigation**
   ```
   ⬅️ Template précédent
   ➡️ Template suivant
   ```

6. **Panneau détails**
   ```
   ℹ️ Info → Afficher/masquer panneau latéral
   → ID, version, auteur, stats, catégories
   ```

7. **Actions**
   ```
   ❤️ Favoris    → Ajouter aux favoris
   🔗 Partager   → Copier lien de partage
   📤 Exporter   → Ouvrir dialog export
   ✅ Utiliser   → Sélectionner ce template
   ```

---

## 3. 🎨 CUSTOMIZER

### Personnaliser visuellement

1. **Accéder au customizer**
   - Sélectionner un template d'abord
   - Tab "Customizer"

2. **Interface split-screen**
   ```
   [Panneau Contrôles]  |  [Aperçu en temps réel]
   ```

3. **Sections d'édition**

   #### 📝 Informations de base
   - Nom du produit
   - Slogan
   - Description
   - Catégorie
   - Prix

   #### 🖼️ Visuels
   - Images du produit (4 max)
   - Thumbnail (vignette)
   - Vidéo (optionnel)

   #### 🎨 Couleurs
   - Couleur principale (primary)
   - Couleur secondaire (secondary)
   - Couleur d'accent (accent)
   - Color picker + input hexadécimal

   #### ✍️ Typographie
   - Police principale (10 choix)
   - Taille du titre (20-64px)
   - Taille du corps (12-24px)
   - Hauteur de ligne (1.0-2.5)

4. **Historique**
   ```
   ↩️ Undo → Annuler dernière modification
   ↪️ Redo → Refaire modification annulée
   ```

5. **Masquer/Afficher preview**
   ```
   👁️ / 👁️‍🗨️ Toggle → Maximiser l'espace d'édition
   ```

6. **Sauvegarder**
   ```
   💾 Save → Enregistrer les modifications
   ```

---

## 4. 📤 EXPORTER

### Télécharger un template

1. **Ouvrir le dialog export**
   - Depuis preview modal → Bouton "Exporter"
   - Depuis page "À propos" → "Exporter tous"

2. **Quick Export (rapide)**

   #### Copier en JSON
   ```
   1. Cliquer "Copier"
   2. ✅ JSON copié dans le presse-papiers
   3. Coller où vous voulez
   ```

   #### Télécharger fichier
   ```
   1. Cliquer "Télécharger"
   2. 📥 Fichier .json téléchargé
   3. Nom: template-[nom]-[timestamp].json
   ```

   #### Générer lien de partage
   ```
   1. Cliquer "Générer"
   2. 🔗 Lien copié dans presse-papiers
   3. Format: /templates/import?data=[base64]
   4. Partager avec n'importe qui
   ```

3. **Advanced Options (avancées)**

   #### Options disponibles
   ```
   ✅ Inclure les métadonnées    → ID, version, auteur, dates
   ⚡ Inclure les analytics      → Vues, downloads, rating
   📦 Minifier le JSON           → Réduire taille fichier
   🔐 Ajouter un checksum        → Vérification intégrité
   ```

   #### Aperçu JSON
   ```
   👁️ Afficher/Masquer → Voir le JSON avant export
   → Mise en forme selon options sélectionnées
   ```

4. **Export multiple (batch)**
   ```
   Plusieurs templates sélectionnés
   → Téléchargement automatique en ZIP
   → Nom: templates-export-[timestamp].zip
   ```

---

## 5. 📥 IMPORTER

### Charger un template

1. **Accéder à l'importeur**
   - Tab "Importer"

2. **3 méthodes d'import**

   #### Méthode 1: Fichier
   ```
   1. Glisser-déposer un fichier .json
      OU
      Cliquer pour sélectionner
   2. ⏳ Validation automatique
   3. ✅ Import réussi
   ```

   #### Méthode 2: URL
   ```
   1. Coller l'URL d'un template
   2. Cliquer "Importer depuis URL"
   3. ⏳ Téléchargement + validation
   4. ✅ Import réussi
   ```

   #### Méthode 3: JSON
   ```
   1. Coller le JSON directement
   2. Cliquer "Importer JSON"
   3. ⏳ Parsing + validation
   4. ✅ Import réussi
   ```

3. **Validation automatique**
   ```
   ✅ Structure vérifiée
   ✅ Champs requis présents
   ✅ Types de données corrects
   ⚠️ Avertissements si incomplet
   ```

4. **Migration V1 → V2**
   ```
   Si ancien format détecté:
   → Migration automatique
   → Nouveaux champs ajoutés
   → Structure mise à jour
   ```

---

## 💡 ASTUCES & RACCOURCIS

### Workflow recommandé
```
1. 🏪 Marketplace → Parcourir et rechercher
2. 🔍 Preview    → Visualiser en détail
3. ✅ Utiliser   → Sélectionner le template
4. 🎨 Customizer → Personnaliser visuellement
5. 💾 Save       → Sauvegarder les modifications
6. 📤 Export     → Télécharger le résultat
```

### Favoris
```
❤️ Marquer vos templates préférés
→ Facilite la retrouvaille
→ Persiste dans la session (pour l'instant)
```

### Recherche efficace
```
🔍 Mots-clés supportés:
- Nom du template
- Description
- Tags
- Catégorie

Exemples:
→ "ebook minimal"
→ "software modern"
→ "premium"
```

### Filtres combinés
```
Tier: Premium
Style: Modern
Sort: Rating
→ Voir les meilleurs templates premium modernes
```

---

## 🎓 EXEMPLES D'UTILISATION

### Cas 1: Créer un produit e-book
```
1. Marketplace → Rechercher "ebook"
2. Sélectionner "E-book Minimal - Inspired by Medium"
3. Customizer:
   - Nom: "Mon Guide Complet"
   - Tagline: "Maîtrisez X en 30 jours"
   - Prix: 29.99
   - Couleur principale: #3B82F6
   - Upload cover image
4. Save → Use dans création de produit
```

### Cas 2: Créer un logiciel SaaS
```
1. Marketplace → Rechercher "software"
2. Sélectionner "Software Modern - Inspired by Stripe"
3. Customizer:
   - Nom: "MonApp SaaS"
   - Description: Fonctionnalités...
   - Prix: 49/mois
   - Couleur: Gradient bleu
   - Upload screenshots
4. Export → Partager avec équipe
```

### Cas 3: Créer un template personnalisé
```
1. Importer un template de base
2. Customizer:
   - Changer toutes les couleurs
   - Ajuster typographie
   - Upload visuels personnalisés
3. Export → Sauvegarder
4. Réutiliser pour futurs produits
```

---

## ⚙️ CONFIGURATION

### Routes disponibles
```typescript
/demo/templates-ui          → Page demo complète
/demo/templates-ui#marketplace  → Direct au marketplace
/demo/templates-ui#customizer   → Direct au customizer
```

### Intégration dans app
```typescript
// Importer les composants
import {
  TemplateMarketplace,
  TemplatePreviewModal,
  TemplateCustomizer,
  TemplateExporterDialog,
  TemplateImporter,
} from '@/components/templates';

// Utiliser dans vos pages
<TemplateMarketplace
  onSelectTemplate={(template) => {
    // Faire quelque chose avec le template
  }}
/>
```

---

## 🆘 RÉSOLUTION DE PROBLÈMES

### Template ne s'affiche pas correctement
```
✓ Vérifier que tous les champs requis sont présents
✓ Vérifier les URLs des images (accessibles)
✓ Essayer différents viewports (Desktop/Tablet/Mobile)
```

### Export échoue
```
✓ Vérifier la connexion internet (si lien de partage)
✓ Vérifier que le template est bien sélectionné
✓ Essayer d'abord "Copier JSON" puis sauvegarder manuellement
```

### Import échoue
```
✓ Vérifier le format JSON (valid JSON)
✓ Vérifier la structure du template
✓ Essayer l'import par fichier plutôt que par texte
```

### Customizer ne sauvegarde pas
```
✓ Vérifier que vous avez sélectionné un template
✓ Vérifier que onSave callback est définie
✓ Voir la console pour erreurs JavaScript
```

---

## 📞 SUPPORT

### Fichiers de référence
- `TEMPLATES_UI_V2_COMPLETE_REPORT.md` → Rapport technique complet
- `src/types/templates-v2.ts` → Types TypeScript
- `src/lib/template-engine.ts` → Documentation du moteur

### Composants UI
- `src/components/templates/` → Tous les composants
- `src/pages/demo/TemplatesUIDemo.tsx` → Exemple d'intégration

---

**Enjoy! 🎉**

Vous avez maintenant une interface professionnelle niveau Shopify/Figma 
pour gérer vos templates de produits !

