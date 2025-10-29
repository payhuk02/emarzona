# 🗄️ DIGITAL PRODUCTS - MIGRATIONS SQL

Ce dossier contient toutes les migrations SQL pour le système de **Produits Digitaux** de Payhula.

---

## 📦 MIGRATIONS DISPONIBLES

### ✅ Existantes (Déjà déployées)

#### 1. `20251027_digital_products_professional.sql`
**Date:** 27 Octobre 2025  
**Status:** ✅ Déployé  

**Contenu:**
- Tables de base pour produits digitaux
- Système de fichiers multi-fichiers
- Tracking des téléchargements
- Gestion basique des licenses
- Système de mises à jour

**Tables créées:** 6
- `digital_products`
- `digital_product_files`
- `digital_product_downloads`
- `digital_product_updates`
- `digital_licenses`
- `digital_license_activations`

---

#### 2. `20251029_digital_license_management_system.sql`
**Date:** 29 Octobre 2025  
**Status:** ✅ Déployé  

**Contenu:**
- Système de licenses professionnel
- Support multi-devices
- Activations avec device fingerprinting
- Audit trail complet
- Fonctions de génération et validation

**Tables créées:** 3
- `digital_product_licenses`
- `license_activations`
- `license_events`

**Fonctions créées:** 2
- `generate_license_key()` - Génère une clé unique
- `validate_license(TEXT, TEXT)` - Valide une license

---

#### 3. `20251029_product_versioning_system.sql`
**Date:** 29 Octobre 2025  
**Status:** ✅ Déployé  

**Contenu:**
- Versioning sémantique (major.minor.patch)
- Changelog détaillé
- Historique des versions
- Logs de téléchargements par version
- Notifications de mises à jour

**Tables créées:** 2
- `product_versions`
- `version_download_logs`

---

#### 4. `20251029_download_protection_system.sql`
**Date:** 29 Octobre 2025  
**Status:** ✅ Déployé  

**Contenu:**
- Tokens de téléchargement sécurisés
- Expiration automatique
- Limitations (IP, nombre, durée)
- Logs d'accès détaillés
- Analytics de téléchargement

**Tables créées:** 2
- `download_tokens`
- `download_logs`

**Fonctions créées:** 2
- `generate_download_token(...)` - Génère un token sécurisé
- `validate_download_token(TEXT)` - Valide un token

---

### ⭐ NOUVELLES (À déployer)

#### 5. `20251029_digital_bundles_system.sql` 🆕
**Date:** 29 Octobre 2025  
**Status:** ⏳ À déployer  

**Contenu:**
- Système de bundles (packs de produits)
- Pricing dynamique avec remises
- 3 types de remise (%, fixe, custom)
- Gestion des items de bundle
- Recalcul automatique des prix
- Statistiques intégrées

**Tables créées:** 2
- `digital_bundles`
- `digital_bundle_items`

**ENUMS créés:** 2
- `bundle_discount_type`
- `bundle_status`

**Fonctions créées:** 3
- `calculate_bundle_original_price(UUID)` - Calcule le prix total
- `update_bundle_pricing()` - Recalcule automatiquement
- `generate_bundle_slug(UUID, TEXT)` - Génère un slug unique

**Vues créées:** 1
- `digital_bundles_with_stats` - Bundles avec statistiques

**RLS Policies:** 4

**Lignes de code:** ~575 lignes SQL

---

#### 6. `20251029_digital_products_enhancements.sql` 🆕
**Date:** 29 Octobre 2025  
**Status:** ⏳ À déployer  

**Contenu:**
- Optimisations de performance
- Indexes supplémentaires
- Vues pour dashboards
- Fonctions utilitaires avancées
- Triggers automatiques
- Support analytics en temps réel

**Tables créées:** 0 (améliore l'existant)

**Indexes créés:** 8
- Performance queries
- Recherches optimisées
- Agrégations rapides

**Vues créées:** 3
- `digital_products_stats` - Stats complètes par produit
- `recent_digital_downloads` - Téléchargements récents
- `active_digital_licenses` - Licenses actives avec calculs

**Fonctions créées:** 5
- `get_remaining_downloads(UUID, UUID)` - Downloads restants
- `has_digital_access(UUID, TEXT)` - Vérifier l'accès
- `get_download_analytics(UUID, INTEGER)` - Analytics détaillées
- `update_digital_product_stats(UUID)` - MAJ stats
- `expire_digital_licenses()` - Expirer licenses (cron job)

**Triggers créés:** 1
- `update_stats_after_download` - MAJ automatique stats

**Lignes de code:** ~430 lignes SQL

---

## 🚀 ORDRE D'EXÉCUTION

Les migrations doivent être exécutées dans l'ordre suivant :

```
1. 20251027_digital_products_professional.sql           ✅ FAIT
2. 20251029_digital_license_management_system.sql       ✅ FAIT
3. 20251029_product_versioning_system.sql               ✅ FAIT
4. 20251029_download_protection_system.sql              ✅ FAIT
5. 20251029_digital_bundles_system.sql                  ⏳ TODO
6. 20251029_digital_products_enhancements.sql           ⏳ TODO
```

**Important:** Ne pas changer l'ordre ! Les migrations ont des dépendances.

---

## 📚 DOCUMENTATION

### Guides disponibles

1. **`DIGITAL_MIGRATION_GUIDE.md`**
   - Guide complet d'exécution
   - 3 méthodes (Dashboard, CLI, psql)
   - Validation étape par étape
   - Troubleshooting

2. **`DIGITAL_VALIDATION_TESTS.sql`**
   - 10 tests automatisés
   - Vérification complète
   - Résumé automatique

3. **`DIGITAL_DATABASE_COMPLETE_REPORT.md`**
   - Rapport détaillé complet
   - Métriques et statistiques
   - Compatibilité composants

4. **`DATABASE_STATUS.md`**
   - Status visuel rapide
   - Vue d'ensemble

---

## 🧪 VALIDATION

Après chaque migration, exécuter :

```sql
-- Vérifier les tables
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' AND tablename LIKE 'digital_%';

-- Vérifier les fonctions
SELECT proname FROM pg_proc 
WHERE proname LIKE '%digital%' OR proname LIKE '%bundle%';

-- Vérifier les vues
SELECT viewname FROM pg_views 
WHERE schemaname = 'public' AND viewname LIKE '%digital%';
```

Ou exécuter le fichier complet de tests :
```bash
psql -f supabase/DIGITAL_VALIDATION_TESTS.sql
```

---

## 📊 STATISTIQUES TOTALES

### Après toutes les migrations

| Métrique | Valeur |
|----------|--------|
| **Tables totales** | 15 |
| **Fonctions totales** | 12 |
| **Vues totales** | 4 |
| **Indexes totaux** | ~58 |
| **RLS Policies** | ~24 |
| **ENUMS** | 7 |
| **Triggers** | ~10 |
| **Lignes SQL** | ~3,000+ |

---

## 🔧 MAINTENANCE

### Tâches régulières recommandées

1. **Quotidiennement** (via pg_cron)
   ```sql
   SELECT expire_digital_licenses();
   ```

2. **Hebdomadaire**
   - Analyser les performances des vues
   - Vérifier les statistiques
   - Nettoyer les logs anciens

3. **Mensuellement**
   - Reindex si nécessaire
   - Vacuum des tables
   - Backup complet

---

## 🐛 TROUBLESHOOTING

### Problème: "relation already exists"
**Solution:** Normal si migration déjà exécutée. Les scripts utilisent `IF NOT EXISTS`.

### Problème: "permission denied"
**Solution:** Exécuter avec un user SUPERUSER (généralement `postgres`).

### Problème: Performances lentes
**Solution:** 
1. Vérifier les indexes : `SELECT * FROM pg_stat_user_indexes;`
2. Analyser les queries : `EXPLAIN ANALYZE ...`
3. Reindex si nécessaire : `REINDEX INDEX index_name;`

---

## 🔄 ROLLBACK

En cas de problème, rollback possible avec :

```sql
-- Pour bundles system
DROP TABLE IF EXISTS digital_bundle_items CASCADE;
DROP TABLE IF EXISTS digital_bundles CASCADE;
DROP TYPE IF EXISTS bundle_discount_type CASCADE;
DROP TYPE IF EXISTS bundle_status CASCADE;

-- Pour enhancements
DROP VIEW IF EXISTS digital_bundles_with_stats;
DROP VIEW IF EXISTS digital_products_stats;
DROP VIEW IF EXISTS recent_digital_downloads;
DROP VIEW IF EXISTS active_digital_licenses;
-- etc.
```

⚠️ **Attention:** Le rollback supprime les données !

---

## 📞 SUPPORT

En cas de problème :

1. Vérifier les logs Supabase
2. Consulter `DIGITAL_MIGRATION_GUIDE.md`
3. Lancer `DIGITAL_VALIDATION_TESTS.sql`
4. Relire cette documentation

---

## 🎯 LIENS UTILES

- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

**Last Updated:** 29 Octobre 2025  
**Maintainer:** Payhula Team  
**Project:** Payhuk SaaS Platform

