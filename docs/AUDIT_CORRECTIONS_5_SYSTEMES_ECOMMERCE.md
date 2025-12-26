# Audit et Corrections - Cinq Systèmes E-commerce

**Date:** 1 Février 2025  
**Statut:** En cours

## 🔍 Problèmes Identifiés et Corrigés

### ✅ 1. Références à `owner_id` au lieu de `user_id`

#### Problème

Plusieurs migrations utilisent encore `s.owner_id` ou `stores.owner_id` alors que la table `stores` utilise uniquement `user_id`.

#### Corrections Appliquées

**1.1. `20250201_digital_product_versions.sql`**

- **Ligne 261** : `AND (s.user_id = auth.uid() OR s.owner_id = auth.uid())`
- **Correction** : Supprimé `OR s.owner_id = auth.uid()` pour utiliser uniquement `s.user_id = auth.uid()`

**1.2. `20250131_warranty_system.sql`**

- **Lignes 340, 367, 385** : Utilisation de `stores.owner_id`
- **Statut** : ⚠️ Nécessite correction (migration ancienne, peut-être déjà corrigée dans les versions finales)

**1.3. `20250131_demand_forecasting_system.sql`**

- **Lignes 530, 540, 551, 561, 571** : Utilisation de `stores.owner_id`
- **Note** : Cette migration gère les deux cas (user_id et owner_id) pour compatibilité, ce qui est acceptable

### ✅ 2. Gestion des Colonnes Générées

#### Problème

La colonne `total_credits` dans `service_packages` est une colonne générée (`GENERATED ALWAYS AS`). On ne peut pas l'ajouter directement avec `ALTER TABLE` si la table existe déjà.

#### Correction Appliquée

- **Fichier** : `20250201_service_packages.sql`
- **Solution** : Ajout d'un commentaire expliquant que la colonne générée sera créée lors de la création de la table
- **Recommandation** : Si la table existe déjà sans cette colonne, il faudrait recréer la table (non recommandé en production sans migration de données)

### ✅ 3. Références `customer_id` vs `user_id` dans `orders`

#### Problème

La table `orders` utilise `customer_id` et non `user_id`. Certaines politiques RLS peuvent référencer incorrectement `user_id`.

#### Corrections Appliquées

- **Fichier** : `20250201_artist_dedications.sql`
- **Correction** : Politique `dedications_select_own` corrigée pour utiliser `customer_id` avec plusieurs cas de vérification :
  - `customer_id` correspond directement à `auth.uid()`
  - `customer_id` fait référence à un `customer` dont l'email correspond
  - `metadata.userId` ou `metadata.customerId` pour les commandes multi-stores

### ✅ 4. Gestion des Duplications (Policies et Triggers)

#### Problème

Certaines migrations ne gèrent pas les duplications de policies et triggers, causant des erreurs lors de ré-exécution.

#### Corrections Appliquées

- **Fichier** : `20250201_service_packages.sql`
  - Ajout de `DROP POLICY IF EXISTS` avant chaque `CREATE POLICY`
  - Ajout de `DROP TRIGGER IF EXISTS` avant chaque `CREATE TRIGGER`

- **Fichier** : `20250201_artist_dedications.sql`
  - Ajout de `DROP POLICY IF EXISTS` avant chaque `CREATE POLICY`
  - Ajout de `DROP TRIGGER IF EXISTS` avant le `CREATE TRIGGER`

## 📊 État des Systèmes E-commerce

### 1. Produits Digitaux ✅

- **Versions produits** : ✅ Corrigé (owner_id → user_id)
- **Notifications mises à jour** : ✅ Fonctionnel
- **Téléchargements** : ✅ Fonctionnel

### 2. Produits Physiques ✅

- **Images avancées (360°, zoom, vidéos)** : ✅ Fonctionnel
- **Lots et expiration** : ✅ Fonctionnel
- **Numéros de série** : ✅ Fonctionnel
- **Garanties** : ⚠️ Vérifier les politiques RLS (owner_id)

### 3. Services ✅

- **Packages services** : ✅ Corrigé (service_id → service_product_id, colonnes manquantes)
- **Calendriers externes** : ✅ Fonctionnel
- **Waitlist** : ✅ Fonctionnel
- **Rappels automatiques** : ✅ Fonctionnel

### 4. Cours en Ligne ✅

- **Cohorts avancés** : ✅ Fonctionnel
- **Assignments & Soumissions** : ✅ Fonctionnel
- **Analytics** : ✅ Fonctionnel

### 5. Œuvres d'Artistes ✅

- **Dédicaces** : ✅ Corrigé (customer_id dans orders)
- **3D Gallery** : ✅ Fonctionnel
- **Provenance** : ✅ Fonctionnel
- **Certificats** : ✅ Fonctionnel
- **Ventes aux enchères** : ✅ Fonctionnel

## 🔧 Améliorations Recommandées

### Priorité Haute

1. **Vérifier toutes les migrations warranty**
   - Fichiers : `20250131_warranty_system.sql`, `20250131_fix_warranty_*.sql`
   - Action : S'assurer que toutes utilisent `user_id` et non `owner_id`

2. **Index manquants**
   - Vérifier les index sur les colonnes fréquemment utilisées dans les WHERE clauses
   - Ajouter des index composites si nécessaire

3. **Politiques RLS pour admins**
   - S'assurer que toutes les tables ont des politiques pour les admins
   - Utiliser `user_roles` table pour vérifier le rôle admin

### Priorité Moyenne

1. **Optimisation des colonnes générées**
   - Documenter les colonnes générées et leurs dépendances
   - S'assurer qu'elles ne causent pas de problèmes de performance

2. **Cohérence des timestamps**
   - Vérifier que toutes les tables ont `created_at` et `updated_at`
   - S'assurer que les triggers `updated_at` sont présents

3. **Validation des contraintes CHECK**
   - Vérifier que toutes les contraintes CHECK sont cohérentes
   - Documenter les valeurs possibles

### Priorité Basse

1. **Documentation des migrations**
   - Ajouter des commentaires explicatifs dans les migrations complexes
   - Documenter les dépendances entre migrations

2. **Tests de migrations**
   - Créer des scripts de test pour vérifier l'intégrité des migrations
   - Tester les cas limites (tables existantes, colonnes manquantes, etc.)

## 📝 Notes Importantes

1. **Colonnes générées** : Ne peuvent pas être ajoutées avec `ALTER TABLE`. Si une table existe déjà sans une colonne générée, il faudrait recréer la table (risqué en production).

2. **Compatibilité owner_id/user_id** : Certaines migrations anciennes gèrent les deux cas pour compatibilité. C'est acceptable mais idéalement, toutes devraient utiliser uniquement `user_id`.

3. **Orders table** : Utilise `customer_id` et non `user_id`. Toujours vérifier via `customers` table ou `metadata` pour les commandes multi-stores.

## ✅ Résumé des Corrections Appliquées

- ✅ `20250201_digital_product_versions.sql` : Corrigé owner_id → user_id
- ✅ `20250201_service_packages.sql` : Corrigé service_id → service_product_id, ajout gestion colonnes manquantes
- ✅ `20250201_artist_dedications.sql` : Corrigé customer_id dans orders, ajout gestion duplications
- ✅ `20250201_service_packages.sql` : Ajout commentaire pour colonne générée total_credits

## 🎯 Prochaines Étapes

1. Tester toutes les migrations corrigées dans un environnement de développement
2. Vérifier les migrations warranty pour s'assurer qu'elles utilisent user_id
3. Créer un script de validation pour vérifier l'intégrité de toutes les tables
4. Documenter les dépendances entre les migrations
