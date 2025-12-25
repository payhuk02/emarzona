# 📝 CHANGELOG - Corrections Système Emailing & Tags
## Date: 2 Février 2025

---

## ✅ Corrections Implémentées (Phase 1 - Critiques)

### 1. Fonction SQL `remove_user_tag` ✅
**Fichier**: `supabase/migrations/20250202_fix_emailing_tags_workflows_critical.sql`

- ✅ Création de la fonction `remove_user_tag`
- ✅ Normalisation automatique du tag (trim + lowercase)
- ✅ Validation que le tag n'est pas vide
- ✅ Retourne `true` si le tag a été supprimé, `false` sinon

**Utilisation**:
```sql
SELECT remove_user_tag('user-id', 'store-id', 'vip');
```

### 2. Fonctions SQL Helper pour Tags ✅
**Fichier**: `supabase/migrations/20250202_fix_emailing_tags_workflows_critical.sql`

- ✅ `get_user_tags(user_id, store_id)` - Récupère tous les tags d'un utilisateur
- ✅ `get_users_by_tag(store_id, tag)` - Récupère tous les utilisateurs ayant un tag

### 3. Amélioration Fonction `add_user_tag` ✅
**Fichier**: `supabase/migrations/20250202_fix_emailing_tags_workflows_critical.sql`

**Améliorations**:
- ✅ Validation de longueur (1-50 caractères)
- ✅ Normalisation automatique (trim + lowercase)
- ✅ Validation des caractères (alphanumériques, underscore, tiret uniquement)
- ✅ Messages d'erreur explicites

**Avant**:
```sql
-- Pas de validation, tags dupliqués possibles ("VIP" vs "vip")
```

**Après**:
```sql
-- Validation complète, normalisation automatique
SELECT add_user_tag('user-id', 'store-id', 'VIP'); -- Devient "vip"
SELECT add_user_tag('user-id', 'store-id', '  vip  '); -- Devient "vip"
```

### 4. Correction Fonction `calculate_dynamic_segment_members` ✅
**Fichier**: `supabase/migrations/20250202_fix_emailing_tags_workflows_critical.sql`

**Avant**: Retournait toujours 0 résultats (LIMIT 0)

**Après**: Support complet pour:
- ✅ Filtres par tags (inclus et exclus)
- ✅ Filtres par date d'inscription (created_after, created_before)
- ✅ Filtres par nombre de commandes (min_orders, max_orders)
- ✅ Filtres par montant total (min_total_spent, max_total_spent)

**Exemple de critères**:
```json
{
  "tags": ["vip", "premium"],
  "excluded_tags": ["churned"],
  "min_orders": 3,
  "min_total_spent": 1000,
  "created_after": "2024-01-01"
}
```

### 5. Amélioration Fonction `update_segment_member_count` ✅
**Fichier**: `supabase/migrations/20250202_fix_emailing_tags_workflows_critical.sql`

- ✅ Calcul correct pour segments dynamiques
- ✅ Utilise `calculate_dynamic_segment_members` pour compter
- ✅ Mise à jour automatique de `last_calculated_at`

### 6. Amélioration Fonction `execute_email_workflow` ✅
**Fichier**: `supabase/migrations/20250202_fix_emailing_tags_workflows_critical.sql`

**Avant**: Ne faisait rien dans la boucle des actions

**Après**: Support complet pour:
- ✅ Action `add_tag` - Ajoute un tag à l'utilisateur
- ✅ Action `remove_tag` - Supprime un tag de l'utilisateur
- ✅ Action `send_email` - Prêt pour délégation à Edge Function
- ✅ Action `wait` - Attente avec `pg_sleep`
- ✅ Gestion des erreurs par action
- ✅ Actions critiques (arrêt du workflow si échec)

**Exemple de workflow**:
```json
{
  "actions": [
    {
      "type": "add_tag",
      "config": {
        "tag": "new_customer",
        "context": {"source": "workflow"}
      },
      "order": 1
    },
    {
      "type": "wait",
      "config": {"duration": 3600},
      "order": 2
    },
    {
      "type": "send_email",
      "config": {
        "template_slug": "welcome"
      },
      "order": 3,
      "critical": true
    }
  ]
}
```

### 7. Service TypeScript `EmailTagService` ✅
**Fichier**: `src/lib/email/email-tag-service.ts`

**Fonctionnalités**:
- ✅ `validateAndNormalizeTag(tag)` - Validation et normalisation
- ✅ `addTag(userId, storeId, tag, context?)` - Ajouter un tag
- ✅ `removeTag(userId, storeId, tag)` - Supprimer un tag
- ✅ `getUserTags(userId, storeId)` - Récupérer tous les tags d'un utilisateur
- ✅ `getUsersByTag(storeId, tag)` - Récupérer utilisateurs par tag
- ✅ `hasTag(userId, storeId, tag)` - Vérifier si un utilisateur a un tag
- ✅ `addTags(userId, storeId, tags[], context?)` - Ajouter plusieurs tags
- ✅ `removeTags(userId, storeId, tags[])` - Supprimer plusieurs tags
- ✅ `getStoreTags(storeId)` - Récupérer tous les tags uniques d'un store

**Exemple d'utilisation**:
```typescript
import { emailTagService } from '@/lib/email/email-tag-service';

// Ajouter un tag
await emailTagService.addTag(userId, storeId, 'VIP', { source: 'manual' });

// Supprimer un tag
await emailTagService.removeTag(userId, storeId, 'VIP');

// Récupérer tous les tags
const tags = await emailTagService.getUserTags(userId, storeId);

// Vérifier si un utilisateur a un tag
const isVip = await emailTagService.hasTag(userId, storeId, 'vip');
```

### 8. Intégration dans `MarketingAutomation` ✅
**Fichier**: `src/lib/marketing/automation.ts`

- ✅ Implémentation de `updateTag()` pour l'action `update_tag`
- ✅ Support pour ajouter et supprimer des tags via workflows
- ✅ Gestion d'erreurs améliorée

### 9. Amélioration `EmailWorkflowService` ✅
**Fichier**: `src/lib/email/email-workflow-service.ts`

- ✅ Enrichissement automatique du contexte (user_id, email)
- ✅ Meilleure gestion d'erreurs avec messages explicites
- ✅ Logging amélioré

---

## 📊 Résumé des Corrections

| Problème | Statut | Fichier |
|----------|--------|---------|
| Fonction `remove_user_tag` manquante | ✅ Corrigé | `20250202_fix_emailing_tags_workflows_critical.sql` |
| Fonction `execute_email_workflow` incomplète | ✅ Corrigé | `20250202_fix_emailing_tags_workflows_critical.sql` |
| Fonction `calculate_dynamic_segment_members` incomplète | ✅ Corrigé | `20250202_fix_emailing_tags_workflows_critical.sql` |
| Actions `add_tag` et `remove_tag` non implémentées | ✅ Corrigé | `20250202_fix_emailing_tags_workflows_critical.sql` |
| Pas de service TypeScript pour tags | ✅ Corrigé | `src/lib/email/email-tag-service.ts` |
| Pas de validation des tags | ✅ Corrigé | Fonction SQL + Service TypeScript |

---

## 🚀 Prochaines Étapes (Phase 2)

### À implémenter prochainement:
1. ⏳ Rate limiting pour SendGrid
2. ⏳ Retry automatique avec backoff exponentiel
3. ⏳ Système de catégories pour tags
4. ⏳ Nettoyage automatique des tags obsolètes
5. ⏳ Amélioration du logging
6. ⏳ Tests unitaires

---

## 📝 Notes Techniques

### Migration SQL
La migration `20250202_fix_emailing_tags_workflows_critical.sql` doit être exécutée après:
- `20250201_emailing_advanced_foundations.sql`
- `20250201_emailing_functions_base.sql`
- `20250201_phase7_email_workflows.sql`

### Breaking Changes
Aucun breaking change. Les fonctions existantes sont améliorées mais restent compatibles.

### Tests Recommandés
1. Tester l'ajout/suppression de tags
2. Tester les segments dynamiques avec critères de tags
3. Tester les workflows avec actions `add_tag` et `remove_tag`
4. Vérifier la normalisation des tags (casse, espaces)

---

**Date de mise à jour**: 2 Février 2025  
**Version**: 1.1.0

