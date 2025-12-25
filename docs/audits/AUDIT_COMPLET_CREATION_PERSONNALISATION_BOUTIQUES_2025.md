# 🔍 AUDIT COMPLET - Création et Personnalisation de Boutiques
**Date:** 2 Février 2025  
**Version:** 1.0  
**Auteur:** Assistant IA

---

## 📋 TABLE DES MATIÈRES

1. [Résumé Exécutif](#résumé-exécutif)
2. [Architecture et Structure](#architecture-et-structure)
3. [Fonctionnalités de Création de Boutique](#fonctionnalités-de-création-de-boutique)
4. [Fonctionnalités de Personnalisation](#fonctionnalités-de-personnalisation)
5. [Application des Personnalisations](#application-des-personnalisations)
6. [Fonctionnalités Avancées](#fonctionnalités-avancées)
7. [Points Forts](#points-forts)
8. [Problèmes Identifiés](#problèmes-identifiés)
9. [Fonctionnalités Manquantes](#fonctionnalités-manquantes)
10. [Recommandations Prioritaires](#recommandations-prioritaires)

---

## 📊 RÉSUMÉ EXÉCUTIF

### Score Global: **7.5/10**

**Forces:**
- ✅ Structure de base solide avec formulaire complet
- ✅ Personnalisations avancées définies dans la DB
- ✅ Interface utilisateur bien organisée avec onglets
- ✅ Gestion des images (logo, bannière)
- ✅ SEO et localisation configurés

**Faiblesses Critiques:**
- ❌ **Personnalisations non appliquées dans le storefront**
- ❌ **Pas de prévisualisation en temps réel**
- ❌ **Gestion de domaine personnalisé incomplète**
- ❌ **Contenu marketing non implémenté dans l'UI**

---

## 🏗️ ARCHITECTURE ET STRUCTURE

### Fichiers Principaux

#### Pages
- ✅ `src/pages/Store.tsx` - Page principale de gestion
- ✅ `src/pages/Storefront.tsx` - Page publique de la boutique
- ✅ `src/components/store/StoreForm.tsx` - Formulaire de création/édition
- ✅ `src/components/store/StoreDetails.tsx` - Affichage et édition des boutiques

#### Composants de Personnalisation
- ✅ `src/components/store/StoreThemeSettings.tsx` - Thème et couleurs
- ✅ `src/components/store/StoreSEOSettings.tsx` - Configuration SEO
- ✅ `src/components/store/StoreLocationSettings.tsx` - Localisation et horaires
- ✅ `src/components/store/StoreLegalPages.tsx` - Pages légales
- ✅ `src/components/store/StoreImageUpload.tsx` - Upload d'images
- ✅ `src/components/store/StoreSlugEditor.tsx` - Édition du slug
- ✅ `src/components/store/StoreAnalytics.tsx` - Analytics

#### Hooks
- ✅ `src/hooks/useStores.ts` - Gestion des boutiques
- ✅ `src/hooks/useStore.ts` - Boutique courante
- ✅ `src/hooks/usePageCustomization.ts` - Personnalisations de pages

#### Base de Données
- ✅ Migration `20250128_store_advanced_customization_phase1.sql` - Structure complète
- ✅ Migration `20250205_add_info_message_to_stores.sql` - Messages informatifs

---

## 🛍️ FONCTIONNALITÉS DE CRÉATION DE BOUTIQUE

### ✅ Fonctionnalités Présentes

#### 1. **Création de Boutique**
- ✅ Formulaire complet avec validation
- ✅ Génération automatique du slug
- ✅ Vérification de disponibilité du slug
- ✅ Limite de 3 boutiques par utilisateur
- ✅ Gestion des erreurs et messages utilisateur

#### 2. **Informations de Base**
- ✅ Nom de la boutique (obligatoire)
- ✅ Slug/URL personnalisée (obligatoire)
- ✅ Description courte
- ✅ Description détaillée (À propos)
- ✅ Devise par défaut
- ✅ Message informatif avec personnalisation (couleur, police)

#### 3. **Images et Branding**
- ✅ Upload de logo (format carré recommandé)
- ✅ Upload de bannière (format paysage recommandé)
- ✅ Validation des formats (JPG, PNG, WebP, GIF)
- ✅ Limite de taille (5MB logo, 10MB bannière)
- ✅ Drag & drop supporté
- ✅ Remplacement d'image existante

#### 4. **Contact et Réseaux Sociaux**
- ✅ Email de contact
- ✅ Téléphone de contact
- ✅ Facebook
- ✅ Instagram
- ✅ Twitter/X
- ✅ LinkedIn

#### 5. **Gestion Multi-Boutiques**
- ✅ Affichage de toutes les boutiques
- ✅ Navigation entre boutiques
- ✅ Sélection de boutique active
- ✅ Limite de 3 boutiques par utilisateur

---

## 🎨 FONCTIONNALITÉS DE PERSONNALISATION

### ✅ Phase 1 - Thème et Couleurs (IMPLÉMENTÉ DANS DB ET UI)

#### Couleurs Principales
- ✅ `primary_color` - Couleur principale
- ✅ `secondary_color` - Couleur secondaire
- ✅ `accent_color` - Couleur d'accentuation
- ✅ `background_color` - Couleur de fond
- ✅ `text_color` - Couleur du texte
- ✅ `text_secondary_color` - Couleur texte secondaire

#### Couleurs des Boutons
- ✅ `button_primary_color` - Couleur bouton principal
- ✅ `button_primary_text` - Texte bouton principal
- ✅ `button_secondary_color` - Couleur bouton secondaire
- ✅ `button_secondary_text` - Texte bouton secondaire

#### Couleurs des Liens
- ✅ `link_color` - Couleur des liens
- ✅ `link_hover_color` - Couleur liens au survol

#### Style Général
- ✅ `border_radius` - Rayon des bordures (none, sm, md, lg, xl, full)
- ✅ `shadow_intensity` - Intensité des ombres (none, sm, md, lg, xl)

### ✅ Phase 1 - Typographie (IMPLÉMENTÉ DANS DB ET UI)

- ✅ `heading_font` - Police des titres (10 polices disponibles)
- ✅ `body_font` - Police du corps (10 polices disponibles)
- ✅ `font_size_base` - Taille de base
- ✅ `heading_size_h1` - Taille H1
- ✅ `heading_size_h2` - Taille H2
- ✅ `heading_size_h3` - Taille H3
- ✅ `line_height` - Hauteur de ligne
- ✅ `letter_spacing` - Espacement des lettres

**Polices Disponibles:**
- Inter, Roboto, Open Sans, Lato, Montserrat, Poppins, Raleway, Ubuntu, Nunito, Playfair Display

### ✅ Phase 1 - Layout et Structure (IMPLÉMENTÉ DANS DB ET UI)

- ✅ `header_style` - Style du header (minimal, standard, extended)
- ✅ `footer_style` - Style du footer (minimal, standard, extended)
- ✅ `sidebar_enabled` - Sidebar activée/désactivée
- ✅ `sidebar_position` - Position sidebar (left, right)
- ✅ `product_grid_columns` - Colonnes grille produits (2-6)
- ✅ `product_card_style` - Style cartes produits (minimal, standard, detailed)
- ✅ `navigation_style` - Style navigation (horizontal, vertical, mega)

### ✅ SEO (IMPLÉMENTÉ DANS DB ET UI)

- ✅ `meta_title` - Titre SEO (50-60 caractères recommandés)
- ✅ `meta_description` - Description SEO (120-160 caractères recommandés)
- ✅ `meta_keywords` - Mots-clés SEO
- ✅ `og_title` - Titre Open Graph
- ✅ `og_description` - Description Open Graph
- ✅ `og_image` - Image Open Graph (1200×630px recommandé)
- ✅ Validation de longueur avec indicateurs visuels
- ✅ Aperçu des résultats de recherche

### ✅ Localisation (IMPLÉMENTÉ DANS DB ET UI)

- ✅ `address_line1` - Adresse ligne 1
- ✅ `address_line2` - Adresse ligne 2
- ✅ `city` - Ville
- ✅ `state_province` - État/Province
- ✅ `postal_code` - Code postal
- ✅ `country` - Pays
- ✅ `latitude` - Latitude
- ✅ `longitude` - Longitude
- ✅ `timezone` - Fuseau horaire (6 fuseaux disponibles)

### ✅ Horaires d'Ouverture (IMPLÉMENTÉ DANS DB ET UI)

- ✅ Horaires par jour de la semaine (Lundi-Dimanche)
- ✅ Heure d'ouverture et fermeture
- ✅ Jour fermé/ouvert (switch)
- ✅ Format JSONB pour flexibilité
- ✅ Support horaires spéciaux (structure définie mais UI manquante)

### ✅ Pages Légales (IMPLÉMENTÉ DANS DB ET UI)

- ✅ `terms_of_service` - Conditions générales de vente
- ✅ `privacy_policy` - Politique de confidentialité
- ✅ `return_policy` - Politique de retour
- ✅ `shipping_policy` - Politique de livraison
- ✅ `refund_policy` - Politique de remboursement
- ✅ `cookie_policy` - Politique des cookies
- ✅ `disclaimer` - Avertissement légal
- ✅ `faq_content` - FAQ de la boutique
- ✅ Support Markdown
- ✅ Aperçu du contenu

### ✅ Analytics (IMPLÉMENTÉ)

- ✅ Vue d'ensemble des statistiques
- ✅ Vues totales
- ✅ Commandes totales
- ✅ Revenus totaux
- ✅ Clients totaux
- ✅ Croissance (views, orders, revenue, customers)
- ✅ Commandes récentes
- ✅ Produits les plus vendus
- ✅ Statistiques mensuelles

### ✅ Gestion URL/Slug (IMPLÉMENTÉ)

- ✅ Édition du slug
- ✅ Vérification de disponibilité en temps réel
- ✅ Génération automatique depuis le nom
- ✅ Validation du format
- ✅ Copie du lien
- ✅ Ouverture dans nouvel onglet

---

## 🎯 APPLICATION DES PERSONNALISATIONS

### ❌ PROBLÈME CRITIQUE: Personnalisations Non Appliquées

#### Analyse du Storefront

**Fichiers Examinés:**
- `src/pages/Storefront.tsx`
- `src/components/storefront/StoreHeader.tsx`
- `src/components/storefront/StoreFooter.tsx`
- `src/components/storefront/StoreTabs.tsx`

**Résultat:**
- ❌ **Aucune application des couleurs personnalisées** (`primary_color`, `secondary_color`, etc.)
- ❌ **Aucune application des polices personnalisées** (`heading_font`, `body_font`, etc.)
- ❌ **Aucune application du layout personnalisé** (`header_style`, `product_grid_columns`, etc.)
- ❌ **Aucune application des styles de boutons** (`button_primary_color`, etc.)
- ✅ Message informatif appliqué (avec couleur et police)
- ✅ Logo et bannière appliqués

**Impact:**
Les personnalisations sont sauvegardées dans la base de données mais **ne sont pas visibles** sur le storefront public. Les utilisateurs configurent leur thème mais ne voient pas le résultat.

---

## 🚀 FONCTIONNALITÉS AVANCÉES

### ✅ Présentes dans la DB mais Non Utilisées dans l'UI

#### 1. **Images Supplémentaires** (Définies dans DB)
- ✅ `favicon_url` - Favicon
- ✅ `apple_touch_icon_url` - Icône Apple Touch
- ✅ `watermark_url` - Filigrane
- ✅ `placeholder_image_url` - Image placeholder
- ❌ **UI manquante** pour uploader/configurer ces images

#### 2. **Contacts Supplémentaires** (Définis dans DB)
- ✅ `support_email` - Email support
- ✅ `sales_email` - Email ventes
- ✅ `press_email` - Email presse
- ✅ `partnership_email` - Email partenariats
- ✅ `support_phone` - Téléphone support
- ✅ `sales_phone` - Téléphone ventes
- ✅ `whatsapp_number` - WhatsApp
- ✅ `telegram_username` - Telegram
- ❌ **UI manquante** pour configurer ces contacts

#### 3. **Réseaux Sociaux Supplémentaires** (Définis dans DB)
- ✅ `youtube_url` - YouTube
- ✅ `tiktok_url` - TikTok
- ✅ `pinterest_url` - Pinterest
- ✅ `snapchat_url` - Snapchat
- ✅ `discord_url` - Discord
- ✅ `twitch_url` - Twitch
- ❌ **UI manquante** pour configurer ces réseaux

#### 4. **Contenu Marketing** (Défini dans DB mais Non Utilisé)
- ✅ `marketing_content` (JSONB) avec:
  - `welcome_message` - Message de bienvenue
  - `mission_statement` - Mission
  - `vision_statement` - Vision
  - `values` - Valeurs (array)
  - `story` - Histoire
  - `team_section` - Section équipe (array)
  - `testimonials` - Témoignages (array)
  - `certifications` - Certifications (array)
- ❌ **UI complètement manquante** pour ce contenu
- ❌ **Non affiché** dans le storefront

#### 5. **Gestion de Domaine Personnalisé** (Partiellement Implémenté)
- ✅ `custom_domain` - Domaine personnalisé
- ✅ `domain_status` - Statut du domaine (not_configured, pending, verified, error)
- ✅ `domain_verification_token` - Token de vérification
- ✅ `domain_verified_at` - Date de vérification
- ✅ `domain_error_message` - Message d'erreur
- ✅ `ssl_enabled` - SSL activé
- ✅ `redirect_www` - Redirection www
- ✅ `redirect_https` - Redirection HTTPS
- ✅ `dns_records` - Enregistrements DNS
- ✅ Composant `DomainSettings.tsx` existe
- ⚠️ **Intégration incomplète** dans StoreDetails

#### 6. **Horaires Spéciaux** (Structure Définie mais UI Manquante)
- ✅ Structure JSONB pour `special_hours` dans `opening_hours`
- ❌ **UI manquante** pour ajouter/modifier les horaires spéciaux
- ❌ **Non affichés** dans le storefront

---

## ✅ POINTS FORTS

1. **Architecture Solide**
   - Structure de base de données complète et bien pensée
   - Séparation claire des responsabilités
   - Composants modulaires et réutilisables

2. **Interface Utilisateur**
   - Organisation claire avec onglets
   - Validation en temps réel
   - Messages d'erreur explicites
   - Aperçus pour certaines fonctionnalités (thème, SEO)

3. **Fonctionnalités de Base**
   - Création de boutique fonctionnelle
   - Gestion multi-boutiques
   - Upload d'images robuste
   - SEO bien configuré

4. **Extensibilité**
   - Structure JSONB pour contenu flexible
   - Champs supplémentaires prévus pour évolutions futures

---

## ❌ PROBLÈMES IDENTIFIÉS

### 🔴 CRITIQUE

1. **Personnalisations Non Appliquées dans le Storefront**
   - **Impact:** Les utilisateurs configurent leur thème mais ne voient pas le résultat
   - **Fichiers concernés:** `Storefront.tsx`, `StoreHeader.tsx`, `StoreFooter.tsx`
   - **Solution:** Créer un système d'injection de styles CSS dynamiques basé sur les valeurs de la boutique

2. **Pas de Prévisualisation en Temps Réel**
   - **Impact:** Les utilisateurs ne peuvent pas voir les changements avant de sauvegarder
   - **Solution:** Ajouter un iframe de prévisualisation ou un mode aperçu

3. **Contenu Marketing Non Accessible**
   - **Impact:** Fonctionnalité définie mais inutilisable
   - **Solution:** Créer l'interface de gestion et l'affichage dans le storefront

### 🟡 IMPORTANT

4. **Images Supplémentaires Non Configurables**
   - Favicon, Apple Touch Icon, Watermark, Placeholder
   - **Solution:** Ajouter des champs dans l'onglet "Apparence"

5. **Contacts Supplémentaires Non Configurables**
   - Support, Sales, Press, Partnership emails/phones
   - **Solution:** Étendre l'onglet "Contact & Réseaux"

6. **Réseaux Sociaux Supplémentaires Non Configurables**
   - YouTube, TikTok, Pinterest, Snapchat, Discord, Twitch
   - **Solution:** Étendre l'onglet "Contact & Réseaux"

7. **Horaires Spéciaux Non Gestionnables**
   - Structure définie mais pas d'UI
   - **Solution:** Ajouter une section dans "Localisation"

8. **Gestion de Domaine Incomplète**
   - Composant existe mais pas intégré dans StoreDetails
   - **Solution:** Ajouter un onglet "Domaine" dans StoreDetails

### 🟢 MINEUR

9. **Pas de Templates de Thème**
   - Les utilisateurs doivent tout configurer manuellement
   - **Solution:** Proposer des thèmes prédéfinis

10. **Pas d'Export/Import de Configuration**
   - Impossible de sauvegarder/restaurer une configuration
   - **Solution:** Ajouter export JSON et import

11. **Validation SEO Basique**
   - Seulement longueur, pas de vérification de mots-clés
   - **Solution:** Ajouter analyse SEO avancée

---

## 🚫 FONCTIONNALITÉS MANQUANTES

### Priorité Haute

1. **Application des Personnalisations dans le Storefront**
   - Injection de styles CSS dynamiques
   - Application des couleurs, polices, layout
   - Support des thèmes personnalisés

2. **Prévisualisation en Temps Réel**
   - Mode aperçu avec iframe
   - Mise à jour instantanée des changements

3. **Interface de Gestion du Contenu Marketing**
   - Formulaire pour welcome message, mission, vision
   - Gestion de l'équipe (ajout/modification/suppression)
   - Gestion des témoignages
   - Gestion des certifications

4. **Affichage du Contenu Marketing dans le Storefront**
   - Section "À propos" avec mission/vision/valeurs
   - Section "Équipe"
   - Section "Témoignages"
   - Section "Certifications"

### Priorité Moyenne

5. **Gestion des Images Supplémentaires**
   - Upload favicon
   - Upload Apple Touch Icon
   - Upload watermark
   - Upload placeholder

6. **Gestion des Contacts Supplémentaires**
   - Configuration des emails spécialisés
   - Configuration des téléphones spécialisés
   - Intégration WhatsApp/Telegram

7. **Gestion des Réseaux Sociaux Supplémentaires**
   - Configuration YouTube, TikTok, Pinterest, etc.
   - Affichage dans le footer du storefront

8. **Gestion des Horaires Spéciaux**
   - Interface pour ajouter/modifier/supprimer
   - Affichage dans le storefront

9. **Intégration Complète de la Gestion de Domaine**
   - Onglet "Domaine" dans StoreDetails
   - Instructions de configuration DNS
   - Vérification automatique

### Priorité Basse

10. **Templates de Thème Prédéfinis**
    - Thèmes professionnels prêts à l'emploi
    - Application en un clic

11. **Export/Import de Configuration**
    - Export JSON de toute la configuration
    - Import pour restaurer ou dupliquer

12. **Analyse SEO Avancée**
    - Score SEO automatique
    - Suggestions d'amélioration
    - Vérification des mots-clés

13. **Historique des Modifications**
    - Journal des changements
    - Possibilité de restaurer une version précédente

14. **Mode Maintenance**
    - Page de maintenance personnalisable
    - Activation/désactivation

15. **Multi-langue pour le Storefront**
    - Traduction du contenu de la boutique
    - Sélecteur de langue dans le storefront

---

## 🎯 RECOMMANDATIONS PRIORITAIRES

### Phase 1 - CRITIQUE (À faire immédiatement)

#### 1. Application des Personnalisations dans le Storefront

**Fichiers à créer/modifier:**
- `src/hooks/useStoreTheme.ts` - Hook pour charger et appliquer le thème
- `src/components/storefront/StoreThemeProvider.tsx` - Provider pour injecter les styles
- Modifier `src/pages/Storefront.tsx` pour utiliser le thème
- Modifier `src/components/storefront/StoreHeader.tsx` pour appliquer les styles
- Modifier `src/components/storefront/StoreFooter.tsx` pour appliquer les styles

**Fonctionnalités:**
- Injection de CSS variables dynamiques
- Application des couleurs personnalisées
- Application des polices personnalisées
- Application du layout personnalisé (header_style, product_grid_columns, etc.)

#### 2. Prévisualisation en Temps Réel

**Fichiers à créer:**
- `src/components/store/StoreThemePreview.tsx` - Composant de prévisualisation
- `src/pages/store/StorePreview.tsx` - Page de prévisualisation

**Fonctionnalités:**
- Iframe avec storefront de test
- Mise à jour instantanée lors des changements
- Bouton "Voir l'aperçu" dans chaque onglet

### Phase 2 - IMPORTANT (À faire rapidement)

#### 3. Interface de Gestion du Contenu Marketing

**Fichiers à créer:**
- `src/components/store/StoreMarketingContent.tsx` - Composant de gestion
- Ajouter onglet "Marketing" dans `StoreDetails.tsx`

**Fonctionnalités:**
- Formulaire pour welcome message, mission, vision
- Gestion de l'équipe (CRUD complet)
- Gestion des témoignages (CRUD complet)
- Gestion des certifications (CRUD complet)

#### 4. Affichage du Contenu Marketing

**Fichiers à modifier:**
- `src/pages/Storefront.tsx` - Ajouter sections marketing
- `src/components/storefront/StoreTabs.tsx` - Ajouter onglet "À propos"

**Fonctionnalités:**
- Section "À propos" avec mission/vision/valeurs
- Section "Équipe" avec photos et bios
- Section "Témoignages" avec notes
- Section "Certifications" avec badges

#### 5. Gestion des Images Supplémentaires

**Fichiers à modifier:**
- `src/components/store/StoreDetails.tsx` - Ajouter dans onglet "Apparence"

**Fonctionnalités:**
- Upload favicon (16×16, 32×32, 48×48)
- Upload Apple Touch Icon (180×180)
- Upload watermark
- Upload placeholder

### Phase 3 - AMÉLIORATIONS (À planifier)

#### 6. Gestion Complète des Contacts et Réseaux Sociaux
#### 7. Gestion des Horaires Spéciaux
#### 8. Intégration Complète de la Gestion de Domaine
#### 9. Templates de Thème Prédéfinis
#### 10. Export/Import de Configuration

---

## 📝 DÉTAILS TECHNIQUES

### Structure de la Base de Données

**Table `stores` contient:**
- ✅ 50+ champs de personnalisation
- ✅ Champs JSONB pour contenu flexible
- ✅ Indexes pour performance
- ✅ Contraintes de validation

**Migrations Principales:**
- `20250128_store_advanced_customization_phase1.sql` - Personnalisations Phase 1
- `20250205_add_info_message_to_stores.sql` - Messages informatifs
- `20250205_add_info_message_style_to_stores.sql` - Styles messages

### Composants UI

**Organisation:**
- 7 onglets dans `StoreDetails.tsx`:
  1. Paramètres
  2. Apparence
  3. Localisation
  4. SEO
  5. Pages Légales
  6. URL
  7. Analytics

**Composants Réutilisables:**
- `StoreThemeSettings` - Thème complet
- `StoreSEOSettings` - SEO complet
- `StoreLocationSettings` - Localisation complète
- `StoreLegalPagesComponent` - Pages légales
- `StoreImageUpload` - Upload robuste

---

## ✅ CHECKLIST DE VÉRIFICATION

### Création de Boutique
- [x] Formulaire de création fonctionnel
- [x] Validation des champs
- [x] Génération automatique du slug
- [x] Vérification disponibilité slug
- [x] Limite de 3 boutiques
- [x] Messages d'erreur clairs

### Personnalisation Thème
- [x] Interface de configuration complète
- [x] Sauvegarde en base de données
- [ ] **Application dans le storefront** ❌
- [ ] **Prévisualisation en temps réel** ❌

### Personnalisation SEO
- [x] Configuration complète
- [x] Validation de longueur
- [x] Aperçu résultats recherche
- [ ] **Application dans les meta tags** ⚠️ (à vérifier)

### Localisation
- [x] Configuration adresse complète
- [x] Configuration horaires
- [ ] **Affichage dans le storefront** ⚠️ (à vérifier)
- [ ] **Carte Google Maps** ❌

### Pages Légales
- [x] Interface de gestion
- [x] Support Markdown
- [ ] **Affichage dans le storefront** ⚠️ (à vérifier)

### Images
- [x] Upload logo
- [x] Upload bannière
- [ ] Upload favicon ❌
- [ ] Upload Apple Touch Icon ❌
- [ ] Upload watermark ❌
- [ ] Upload placeholder ❌

### Contenu Marketing
- [ ] Interface de gestion ❌
- [ ] Affichage dans storefront ❌

### Domaine Personnalisé
- [x] Structure DB complète
- [x] Composant DomainSettings existe
- [ ] Intégration dans StoreDetails ❌
- [ ] Instructions DNS ❌

---

## 🎯 CONCLUSION

Le système de création et personnalisation de boutiques est **bien structuré** avec une base de données complète et une interface utilisateur organisée. Cependant, **le problème critique** est que les personnalisations ne sont **pas appliquées** dans le storefront public, rendant la fonctionnalité inutile pour les utilisateurs finaux.

**Priorité absolue:** Implémenter l'application des personnalisations dans le storefront avant toute autre amélioration.

---

**Prochaine étape recommandée:** Commencer par l'implémentation de l'application des personnalisations dans le storefront (Phase 1 - Critique).

