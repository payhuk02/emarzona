# 🔒 PLAN D'ACTION - CORRECTION RLS PHASE 1

**Date** : 31 Janvier 2025  
**Priorité** : 🔴 URGENT  
**Durée estimée** : 2-3 jours

---

## 🎯 OBJECTIF

Corriger les **40 tables sans politiques RLS** qui bloquent actuellement l'accès aux données.

---

## 📋 ÉTAPES D'EXÉCUTION

### Étape 1 : Audit Initial (30 min)

1. **Exécuter le script d'audit** dans Supabase SQL Editor :
   ```sql
   -- Voir les tables sans politiques
   SELECT * FROM get_tables_without_policies() ORDER BY priority, table_name;
   ```

2. **Vérifier les résultats** :
   - Identifier les 40 tables exactes
   - Vérifier leur priorité (CRITIQUE, HAUTE, MOYENNE, BASSE)
   - Documenter les tables qui nécessitent des politiques spéciales

### Étape 2 : Appliquer la Migration Phase 1 (1-2 heures)

1. **Exécuter la migration** :
   ```bash
   # Via Supabase CLI
   supabase migration up
   
   # Ou directement dans Supabase SQL Editor
   # Copier le contenu de: supabase/migrations/20250131_fix_rls_missing_policies_phase1.sql
   ```

2. **Vérifier les résultats** :
   - Vérifier que les politiques ont été créées
   - Vérifier qu'il n'y a pas d'erreurs

### Étape 3 : Tests de Validation (2-3 heures)

1. **Tests fonctionnels** :
   - Tester l'accès aux tables critiques depuis l'application
   - Vérifier que les utilisateurs peuvent accéder à leurs données
   - Vérifier que les admins peuvent accéder à toutes les données
   - Vérifier que les utilisateurs non autorisés ne peuvent pas accéder

2. **Tests de sécurité** :
   - Vérifier l'isolation des données entre utilisateurs
   - Vérifier l'isolation des données entre boutiques
   - Vérifier que les admins ont accès complet

### Étape 4 : Documentation (30 min)

1. **Documenter les résultats** :
   - Liste des tables corrigées
   - Politiques créées pour chaque table
   - Exceptions ou politiques spéciales
   - Tests effectués et résultats

---

## 📊 TABLES CRITIQUES À CORRIGER

### Priorité CRITIQUE (à corriger en premier)

1. ✅ `platform_settings` - Configuration plateforme (admin seulement)
2. ✅ `admin_config` - Configuration admin (admin seulement)
3. ✅ `commissions` - Commissions (propriétaires + admin)
4. ✅ `subscriptions` - Abonnements (utilisateurs + admin)
5. ✅ `disputes` - Litiges (propriétaires + clients + admin)
6. ⏳ `invoices` - Factures (à vérifier structure)
7. ⏳ `transactions` - Transactions (à vérifier structure)
8. ⏳ `payments` - Paiements (à vérifier structure)
9. ⏳ `store_withdrawals` - Retraits boutiques (à vérifier structure)
10. ⏳ `affiliate_commissions` - Commissions affiliation (à vérifier structure)

### Priorité HAUTE (à corriger ensuite)

- `lessons` - Leçons de cours
- `quizzes` - Quiz
- `assignments` - Devoirs
- `certificates` - Certificats
- `service_availability` - Disponibilités de service
- `recurring_bookings` - Réservations récurrentes
- `warranty_claims` - Réclamations garantie

---

## 🔍 VÉRIFICATIONS POST-MIGRATION

### Checklist de Validation

- [ ] Toutes les tables critiques ont des politiques SELECT
- [ ] Toutes les tables critiques ont des politiques INSERT
- [ ] Toutes les tables critiques ont des politiques UPDATE
- [ ] Toutes les tables critiques ont des politiques DELETE
- [ ] Les utilisateurs peuvent accéder à leurs propres données
- [ ] Les propriétaires de boutiques peuvent accéder aux données de leurs boutiques
- [ ] Les admins peuvent accéder à toutes les données
- [ ] Les utilisateurs non autorisés ne peuvent pas accéder aux données
- [ ] L'application fonctionne correctement après la migration
- [ ] Aucune erreur dans les logs Supabase

---

## ⚠️ POINTS D'ATTENTION

### Tables avec Structures Spéciales

Certaines tables peuvent nécessiter des politiques spéciales :

1. **Tables système** : Peuvent nécessiter des politiques admin-only
2. **Tables de logs** : Peuvent nécessiter des politiques read-only
3. **Tables de cache** : Peuvent nécessiter des politiques publiques
4. **Tables avec relations complexes** : Peuvent nécessiter des politiques avec jointures

### Gestion des Erreurs

Si une table échoue lors de la création des politiques :

1. Vérifier la structure de la table
2. Vérifier les contraintes existantes
3. Créer des politiques manuelles spécifiques
4. Documenter l'exception

---

## 📝 PROCHAINES ÉTAPES

Après la Phase 1 :

1. **Phase 2** : Corriger les 46 tables sans SELECT (1-2 jours)
2. **Phase 3** : Compléter les politiques sur les 200+ tables incomplètes (3-5 jours)
3. **Phase 4** : Tests de sécurité complets (1-2 jours)

---

## 🔗 RESSOURCES

- **Migration SQL** : `supabase/migrations/20250131_fix_rls_missing_policies_phase1.sql`
- **Script d'audit** : `supabase/FINAL_RLS_AUDIT_SIMPLIFIED.sql`
- **Documentation RLS** : `docs/RLS_SECURISATION_COMPLETE.md`
- **Résultats audit** : `docs/RLS_AUDIT_FINAL_RESULTS.md`

---

**Statut** : ⏳ En attente d'exécution  
**Dernière mise à jour** : 31 Janvier 2025
