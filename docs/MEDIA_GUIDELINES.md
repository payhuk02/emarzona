# Directives Médias Payhula

Ce document standardise les images et médias pour garantir une UI professionnelle, des performances stables et un SEO optimal.

## Formats d’images

- Ratio standard produits/cours: 16:9
- Dimensions recommandées: 1280×720 px
- Format: WebP (préféré), sinon JPEG de haute qualité
- Qualité cible: 80–90 (compression équilibrée)

## Où ce standard est appliqué

- Marketplace cards: 1280×720
- Boutique cards: 1280×720
- Détail produit – galerie principale: transform 1280×720
- Cours card: 1280×720

Le front applique `width`/`height` et/ou la transformation Supabase Storage pour normaliser l’affichage.

## Téléversement (upload)

- Les images qui ne respectent pas ~16:9 sont rejetées côté UI (tolérance ±3%).
- Utilisez des visuels nets sans texte « collé » sur les bords.
- Évitez les images < 800×450 px (perte de qualité sur desktop).

## Bannières / Exceptions

- Les bannières de boutique peuvent utiliser un ratio différent (ex. 3:1). Préparez des visuels dédiés.

## Bonnes pratiques

- Centrez le sujet; évitez les bordures colorées trop épaisses.
- Préférez des fonds propres et contrastés.
- Vérifiez le rendu mobile et desktop.

## SEO

- Renseignez `alt` descriptif et concis.
- Les pages produit intègrent `ProductSchema`/`CourseSchema` avec `image` optimisée.

