# 📋 RAPPORT COMPLET - REMPLACEMENT PAYHUK → EMARZONA

**Date** : 2025-12-01  
**Objectif** : Vérifier et remplacer toutes les occurrences de "Payhuk" par "Emarzona" dans toute la plateforme, y compris les migrations SQL.

## 🔍 RÉSULTATS DE LA VÉRIFICATION

### 1. MIGRATIONS SQL (supabase/migrations/)
**Total trouvé** : ~55 occurrences

#### Catégories d'occurrences :
- **Commentaires de migration** : `-- PAYHUK SYSTEM`, `-- Payhuk - Projet`
- **Valeurs par défaut** : `'noreply@payhuk.com'`, `'Payhuk'`
- **URLs** : `https://payhuk.com/products/...`
- **Domaines** : `payhuk.com/aff/ABC123`
- **Commentaires de table** : `'Clés API pour l'API publique Payhuk'`

#### Fichiers principaux à modifier :
- `20251027_email_system.sql` : Emails par défaut
- `20251025_affiliate_system_complete.sql` : URLs d'affiliation
- `20250228_api_keys_table.sql` : Commentaires API
- `20250131_affiliate_short_links.sql` : Domaines d'affiliation
- Tous les fichiers de migration avec commentaires `-- PAYHUK`

### 2. FICHIERS TYPESCRIPT/JAVASCRIPT (src/)
**Total trouvé** : ~21 occurrences

#### Catégories :
- **localStorage keys** : `payhuk_language`, `payhuk_analytics_session`, `payhuk_session_id`
- **Cache prefix** : `payhuk_cache_`
- **URLs GitHub** : `github.com/payhuk02/payhula`
- **Domaines** : `payhuk.com`
- **Références de transaction** : `payhuk_${Date.now()}`

#### Fichiers à modifier :
- `src/lib/cache.ts` : `payhuk_cache_` → `emarzona_cache_`
- `src/components/ui/LanguageSwitcher.tsx` : `payhuk_language` → `emarzona_language`
- `src/hooks/useAnalytics.ts` : `payhuk_analytics_session` → `emarzona_analytics_session`
- `src/hooks/courses/useCourseAnalytics.ts` : `payhuk_session_id` → `emarzona_session_id`
- `src/i18n/config.ts` : `payhuk_language` → `emarzona_language`
- `src/hooks/useI18n.ts` : `payhuk_language` → `emarzona_language`
- `src/integrations/payments/flutterwave.ts` : `payhuk_` → `emarzona_`
- `src/components/products/create/shared/ProductSEOForm.tsx` : `payhuk.com` → `emarzona.com`
- `src/lib/ai-content-generator.ts` : `'payhuk'` → `'emarzona'`

### 3. FICHIERS DE CONFIGURATION
**Total trouvé** : 2 occurrences

- `mobile/package.json` : `"name": "payhuk-mobile"` → `"name": "emarzona-mobile"`

### 4. FICHIERS SQL RACINE
**Total trouvé** : ~20 occurrences dans fichiers SQL à la racine

- Fichiers de backup (peuvent être ignorés)
- Fichiers de fix SQL avec commentaires

### 5. DOCUMENTATION
**Total trouvé** : ~632 occurrences (principalement dans les rapports d'audit)

- Les fichiers de documentation peuvent garder les références historiques
- Seuls les fichiers actifs doivent être modifiés

## 📝 PLAN D'ACTION

### Phase 1 : Migrations SQL (PRIORITAIRE)
- [ ] Remplacer tous les commentaires `-- PAYHUK` par `-- EMARZONA`
- [ ] Remplacer `'noreply@payhuk.com'` par `'noreply@emarzona.com'`
- [ ] Remplacer `'Payhuk'` par `'Emarzona'` dans les valeurs par défaut
- [ ] Remplacer `payhuk.com` par `emarzona.com` dans les URLs
- [ ] Mettre à jour les commentaires de tables

### Phase 2 : Code TypeScript/JavaScript
- [ ] Remplacer toutes les clés localStorage
- [ ] Remplacer le prefix de cache
- [ ] Remplacer les références de domaine
- [ ] Remplacer les références de transaction

### Phase 3 : Configuration
- [ ] Mettre à jour package.json mobile

### Phase 4 : Validation
- [ ] Vérifier qu'aucune occurrence n'a été oubliée
- [ ] Tester les fonctionnalités affectées
- [ ] Vérifier les migrations en base de données

## ⚠️ ATTENTION

1. **Compatibilité localStorage** : Les anciennes clés `payhuk_*` dans localStorage devront être migrées progressivement pour éviter la perte de données utilisateur.

2. **Migrations déjà exécutées** : Les migrations SQL déjà appliquées en production ne doivent pas être modifiées rétroactivement. Seules les nouvelles migrations doivent utiliser "Emarzona".

3. **URLs externes** : Les références à `github.com/payhuk02/payhula` peuvent rester si c'est le vrai repo GitHub.

4. **Emails** : Vérifier que le domaine `emarzona.com` est configuré pour recevoir les emails avant de changer les adresses.

## ✅ STATUT

- [ ] Phase 1 : Migrations SQL
- [ ] Phase 2 : Code TypeScript/JavaScript  
- [ ] Phase 3 : Configuration
- [ ] Phase 4 : Validation

