# 📸 Images de Templates

Ce dossier contient toutes les images de prévisualisation pour les templates.

## 📁 Structure

```
templates/
├── physical/          # Templates produits physiques
├── digital/           # Templates produits digitaux
├── services/          # Templates services
├── courses/           # Templates cours en ligne
└── v2/               # Templates version 2
```

## 🖼️ Format des Images

- **Dimensions**: 1280 x 720 pixels (16:9)
- **Format**: JPG optimisé
- **Poids max**: 300KB par image
- **Qualité**: Haute résolution, professionnelle

## 📝 Convention de Nommage

### Physical Products
- `fashion-apparel-thumb.jpg` (vignette principale)
- `fashion-apparel-hero.jpg` (image hero)
- `fashion-apparel-detail.jpg` (détails produit)
- etc.

### Format général
`{category}-{name}-{type}.jpg`

Exemples:
- `electronics-thumb.jpg`
- `jewelry-hero.jpg`
- `home-garden-lifestyle.jpg`

## 🚀 Ajouter de Nouvelles Images

1. Créer/Obtenir image en 1280x720
2. Optimiser avec [TinyPNG](https://tinypng.com)
3. Renommer selon la convention
4. Placer dans le bon dossier

## 📖 Documentation Complète

Voir `TEMPLATES_IMAGES_GUIDE.md` à la racine du projet pour :
- Spécifications détaillées par template
- Options de création d'images
- Scripts d'optimisation
- Ressources et outils

## ⚡ Solution Rapide (Placeholders)

Pour tester rapidement, utiliser des placeholders :

https://placehold.co/1280x720/couleur1/couleur2?text=Mon+Template

Exemples de couleurs par catégorie :
- Fashion: `0051BA/FFDB00` (Bleu/Jaune)
- Electronics: `000000/FFFFFF` (Noir/Blanc)
- Jewelry: `1a1a1a/d4af37` (Noir/Or)
- Home: `0051BA/FFDB00` (Bleu IKEA/Jaune)
- Health: `0066cc/00a86b` (Bleu/Vert)

---

*Dernière mise à jour: 30 Octobre 2025*

