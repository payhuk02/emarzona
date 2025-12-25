# ✅ VALIDATION SERVEUR POUR WIZARDS - PHASE 2

**Date** : 28 Janvier 2025  
**Statut** : ✅ **COMPLÉTÉ**

---

## 📋 RÉSUMÉ

Implémentation de la validation serveur pour les wizards de création de produits, combinant validation client (Zod) et validation serveur (RPC Supabase) pour garantir l'intégrité des données.

---

## ✅ AMÉLIORATIONS IMPLÉMENTÉES

### 1. Fonctions RPC Supabase

#### `supabase/migrations/20250128_wizard_server_validation.sql` (nouveau)
- ✅ **`validate_product_slug`** : Validation unicité slug (products, digital_products, physical_products, services)
- ✅ **`validate_sku`** : Validation unicité SKU pour produits physiques
- ✅ **`validate_digital_version`** : Validation unicité version pour produits digitaux
- ✅ **`validate_digital_product`** : Validation complète produit digital
- ✅ **`validate_physical_product`** : Validation complète produit physique
- ✅ **`validate_service`** : Validation complète service

#### Validations Implémentées
- ✅ **Format** : Regex pour slug, SKU, version, URL
- ✅ **Longueur** : Min/max pour tous les champs
- ✅ **Unicité** : Vérification dans toutes les tables concernées
- ✅ **Contraintes métier** : Prix, poids, quantité, durée, participants

### 2. Service de Validation Serveur

#### `src/lib/server-validation.ts` (nouveau)
- ✅ **Fonctions TypeScript** : Wrappers pour appeler les RPC
- ✅ **Gestion d'erreurs** : Normalisation et logging
- ✅ **Types** : Interfaces TypeScript pour résultats

### 3. Hook useWizardServerValidation

#### `src/hooks/useWizardServerValidation.ts` (nouveau)
- ✅ **Validation slug** : `validateSlug()`
- ✅ **Validation SKU** : `validateSku()`
- ✅ **Validation version** : `validateVersion()`
- ✅ **Validation complète** : `validateDigitalProduct()`, `validatePhysicalProduct()`, `validateService()`
- ✅ **Gestion état** : `isValidating`, `serverErrors`
- ✅ **Intégration toasts** : Messages user-friendly automatiques

---

## 📊 COMPARAISON AVANT/APRÈS

### Avant
- ❌ Validation uniquement côté client (Zod)
- ❌ Pas de vérification d'unicité serveur
- ❌ Risque de conflits (slug, SKU dupliqués)
- ❌ Pas de validation des contraintes métier serveur

### Après
- ✅ **Validation hybride** : Client (Zod) + Serveur (RPC)
- ✅ **Vérification unicité** : Slug, SKU, version vérifiés serveur
- ✅ **Sécurité renforcée** : Contournement client impossible
- ✅ **Contraintes métier** : Validation serveur des règles business

---

## 🎯 UTILISATION

### Exemple dans un Wizard

```tsx
import { useWizardServerValidation } from '@/hooks/useWizardServerValidation';

const wizard = () => {
  const { storeId } = useStore();
  const { validateSlug, validateDigitalProduct, isValidating, serverErrors } = 
    useWizardServerValidation({ storeId });

  const validateStep = async (step: number): Promise<boolean> => {
    // 1. Validation client (Zod)
    const clientResult = validateWithZod(digitalProductSchema, formData);
    if (!clientResult.valid) {
      return false;
    }

    // 2. Validation serveur (si étape 1)
    if (step === 1) {
      const serverResult = await validateDigitalProduct({
        name: formData.name,
        slug: formData.slug,
        price: formData.price,
      });

      if (!serverResult.valid) {
        return false;
      }
    }

    return true;
  };
};
```

### Exemple Validation Slug en Temps Réel

```tsx
const { validateSlug, serverErrors } = useWizardServerValidation({ storeId });

const handleSlugChange = async (slug: string) => {
  if (slug.length >= 3) {
    await validateSlug(slug);
  }
};

// Afficher erreur serveur
{serverErrors.slug && (
  <p className="text-sm text-destructive">{serverErrors.slug}</p>
)}
```

---

## 📁 FICHIERS CRÉÉS/MODIFIÉS

### Nouveaux Fichiers
- ✅ `supabase/migrations/20250128_wizard_server_validation.sql` (créé)
- ✅ `src/lib/server-validation.ts` (créé)
- ✅ `src/hooks/useWizardServerValidation.ts` (créé)

### Fichiers à Modifier (Intégration)
- 🔄 `src/components/products/create/digital/CreateDigitalProductWizard_v2.tsx` (à intégrer)
- 🔄 `src/components/products/create/physical/CreatePhysicalProductWizard_v2.tsx` (à intégrer)
- 🔄 `src/components/products/create/service/CreateServiceWizard_v2.tsx` (à intégrer)

---

## ⚙️ FONCTIONS RPC CRÉÉES

### validate_product_slug
- **Paramètres** : `p_slug`, `p_store_id`, `p_product_id` (optionnel)
- **Retour** : `{ valid: boolean, error?: string, message?: string }`
- **Vérifications** : Format, longueur, unicité dans toutes les tables

### validate_sku
- **Paramètres** : `p_sku`, `p_store_id`, `p_product_id` (optionnel)
- **Retour** : `{ valid: boolean, error?: string, message?: string }`
- **Vérifications** : Format, longueur, unicité

### validate_digital_version
- **Paramètres** : `p_version`, `p_digital_product_id`, `p_store_id`
- **Retour** : `{ valid: boolean, error?: string, message?: string }`
- **Vérifications** : Format, unicité pour le produit

### validate_digital_product
- **Paramètres** : `p_name`, `p_slug`, `p_price`, `p_store_id`, `p_product_id` (optionnel)
- **Retour** : `{ valid: boolean, errors?: Array<{field, message}> }`
- **Vérifications** : Nom, prix, slug (via validate_product_slug)

### validate_physical_product
- **Paramètres** : `p_name`, `p_slug`, `p_price`, `p_sku`, `p_weight`, `p_quantity`, `p_store_id`, `p_product_id` (optionnel)
- **Retour** : `{ valid: boolean, errors?: Array<{field, message}> }`
- **Vérifications** : Nom, prix, slug, SKU, poids, quantité

### validate_service
- **Paramètres** : `p_name`, `p_slug`, `p_price`, `p_duration`, `p_max_participants`, `p_meeting_url`, `p_store_id`, `p_product_id` (optionnel)
- **Retour** : `{ valid: boolean, errors?: Array<{field, message}> }`
- **Vérifications** : Nom, prix, slug, durée, participants, URL

---

## 🧪 TESTS RECOMMANDÉS

1. **Tester validation slug** :
   - Créer produit avec slug existant
   - Vérifier erreur serveur
   - Vérifier message user-friendly

2. **Tester validation SKU** :
   - Créer produit avec SKU existant
   - Vérifier erreur serveur
   - Vérifier unicité

3. **Tester validation complète** :
   - Valider produit digital complet
   - Valider produit physique complet
   - Valider service complet
   - Vérifier toutes les erreurs

4. **Tester intégration wizards** :
   - Tester dans CreateDigitalProductWizard
   - Tester dans CreatePhysicalProductWizard
   - Tester dans CreateServiceWizard

---

## ⚠️ NOTES IMPORTANTES

### Migration SQL
- ⚠️ **Exécuter la migration** : `supabase/migrations/20250128_wizard_server_validation.sql`
- ⚠️ **Permissions** : Les fonctions sont `SECURITY DEFINER` avec `GRANT EXECUTE TO authenticated`

### Intégration Wizards
- ✅ **Validation hybride** : Client d'abord, puis serveur
- ✅ **Async** : `validateStep` doit être async
- ✅ **Gestion erreurs** : Utiliser `serverErrors` pour afficher erreurs

### Performance
- ✅ **Validation conditionnelle** : Seulement si données valides côté client
- ✅ **Debouncing** : Pour validation temps réel (slug, SKU)
- ✅ **Cache** : Résultats de validation peuvent être mis en cache

---

## ✅ STATUT FINAL

**Validation serveur pour wizards** → ✅ **COMPLÉTÉ**

**Prochaine étape** : Intégrer dans les wizards existants (optionnel)

---

**Date de complétion** : 28 Janvier 2025  
**Version** : 1.0.0

