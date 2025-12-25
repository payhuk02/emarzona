# 📦 Archive SQL - Fichiers de Fix et Diagnostic

Ce dossier contient les fichiers SQL de fix, diagnostic et vérification qui ont été exécutés et ne sont plus nécessaires dans la racine du projet.

## 📁 Structure

- **fixes/** - Fichiers SQL de correction de bugs et problèmes
- **diagnostics/** - Fichiers SQL de diagnostic et analyse
- **verifications/** - Fichiers SQL de vérification et tests

## 📋 Fichiers Archivés

### Fixes (15 fichiers)

Ces fichiers ont été utilisés pour corriger des problèmes spécifiques :

- `DEFINITIVE_FIX_PROFILES_ERROR.sql` - Correction définitive des erreurs de profiles
- `DEFINITIVE_FIX_PROFILES_NO_CONFLICTS.sql` - Correction profiles sans conflits
- `FINAL_FIX_PROFILES_COMPLETE.sql` - Correction finale complète des profiles
- `FIX_ALL_TRANSACTIONS_COLUMNS.sql` - Correction des colonnes de transactions
- `FIX_CURRENCY_COLUMN.sql` - Correction de la colonne currency
- `FIX_GET_USER_PRODUCT_RECOMMENDATIONS.sql` - Correction de la fonction de recommandations
- `FIX_RLS_PERMISSIONS.sql` - Correction des permissions RLS
- `FIX_USER_PRODUCT_RECOMMENDATIONS.sql` - Correction des recommandations utilisateur
- `fix-product-store-id.sql` - Correction de l'ID store des produits
- `fix_product_images_permissions.sql` - Correction des permissions d'images produits
- `fix_product_images_rls_final.sql` - Correction finale RLS images produits
- `fix_product_images_rls_now.sql` - Correction immédiate RLS images produits
- `fix_rls_immediate.sql` - Correction immédiate RLS
- `QUICK_FIX_SCHEMA_CACHE.sql` - Fix rapide du cache de schéma
- `URGENT_FIX_PROFILES_ERROR.sql` - Fix urgent des erreurs profiles

### Diagnostics (3 fichiers)

- `DIAGNOSTIC_COMPLET_IMAGES_ARTISTE.sql` - Diagnostic complet des images artiste
- `diagnostic_product_images_permissions.sql` - Diagnostic des permissions d'images produits
- `diagnostic_upload_files.sql` - Diagnostic des uploads de fichiers

### Vérifications (5 fichiers)

- `verification_complete_images_artiste.sql` - Vérification complète images artiste
- `verification_images_artiste.sql` - Vérification images artiste
- `verification_images_artiste_simple.sql` - Vérification simple images artiste
- `verification_simple_images_artiste.sql` - Vérification simple images artiste
- `verification_ultra_simple.sql` - Vérification ultra simple

### Autres (4 fichiers)

- `CREER_FONCTION_RECOMMENDATIONS_COMPLETE.sql` - Création fonction recommandations
- `supabase_add_store_columns.sql` - Ajout colonnes store
- `supabase_analytics_tables.sql` - Tables analytics
- `supabase_storage_policies.sql` - Politiques de storage

## ⚠️ Important

Ces fichiers sont archivés pour référence historique. **Ne pas exécuter** ces fichiers directement en production sans vérification préalable.

Les corrections ont été intégrées dans les migrations officielles dans `supabase/migrations/`.

## 📝 Note

Si vous avez besoin de réappliquer un fix, vérifiez d'abord si une migration équivalente existe dans `supabase/migrations/` avec un timestamp plus récent.

---

*Archivé le : 2025-01-30*


