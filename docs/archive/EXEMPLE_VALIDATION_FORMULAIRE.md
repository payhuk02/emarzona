# 📝 Exemple d'Utilisation - Validation de Formulaires

## 🎯 Objectif

Ce document montre comment utiliser la nouvelle bibliothèque de validation (`src/lib/form-validation.ts`) dans les formulaires de l'application.

---

## 📋 Exemple 1 : Formulaire de Checkout

### Avant (Validation manuelle)

```typescript
const validateForm = (): boolean => {
  const errors: Partial<Record<keyof ShippingAddress, string>> = {};

  if (!formData.full_name.trim()) {
    errors.full_name = 'Le nom complet est requis';
  }

  if (!formData.email.trim()) {
    errors.email = 'L\'email est requis';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = 'Email invalide';
  }

  if (!formData.phone.trim()) {
    errors.phone = 'Le téléphone est requis';
  }

  // ... etc

  setFormErrors(errors);
  return Object.keys(errors).length === 0;
};
```

### Après (Avec la bibliothèque de validation)

```typescript
import { commonSchemas, validateForm } from '@/lib/form-validation';
import { z } from 'zod';

// Schéma de validation
const shippingAddressSchema = z.object({
  full_name: commonSchemas.name,
  email: commonSchemas.email,
  phone: commonSchemas.phone,
  address_line1: z.string().min(5, {
    message: 'L\'adresse doit contenir au moins 5 caractères',
  }),
  address_line2: z.string().optional(),
  city: z.string().min(2, {
    message: 'La ville doit contenir au moins 2 caractères',
  }),
  postal_code: commonSchemas.postalCode,
  country: commonSchemas.countryCode,
  state: z.string().optional(),
});

// Validation
const validateForm = (): boolean => {
  const result = validateForm(shippingAddressSchema, formData);
  
  if (!result.success) {
    setFormErrors(result.errors);
    return false;
  }
  
  setFormErrors({});
  return true;
};
```

**Avantages** :
- ✅ Code plus court et plus lisible
- ✅ Validation cohérente
- ✅ Messages d'erreur clairs
- ✅ Réduction des erreurs

---

## 📋 Exemple 2 : Formulaire de Produit

### Avant (Validation manuelle)

```typescript
const validateForm = (): boolean => {
  const errors: Record<string, string> = {};
  
  if (!formData.name.trim()) {
    errors.name = "Le nom du produit est requis";
  }
  
  if (!formData.slug.trim()) {
    errors.slug = "L'URL du produit est requise";
  }
  
  if (formData.price < 0) {
    errors.price = "Le prix doit être positif";
  }
  
  // ... etc

  setValidationErrors(errors);
  return Object.keys(errors).length === 0;
};
```

### Après (Avec la bibliothèque de validation)

```typescript
import { commonSchemas, validateForm } from '@/lib/form-validation';
import { z } from 'zod';

// Schéma de validation
const productSchema = z.object({
  name: z.string().min(2, {
    message: 'Le nom du produit doit contenir au moins 2 caractères',
  }).max(100, {
    message: 'Le nom du produit doit contenir au plus 100 caractères',
  }),
  slug: commonSchemas.slug,
  category: z.string().min(1, {
    message: 'La catégorie est requise',
  }),
  product_type: z.enum(['digital', 'physical', 'service'], {
    errorMap: () => ({ message: 'Le type de produit est requis' }),
  }),
  pricing_model: z.enum(['one_time', 'subscription', 'pay_as_you_go'], {
    errorMap: () => ({ message: 'Le modèle de tarification est requis' }),
  }),
  price: commonSchemas.price,
  promotional_price: commonSchemas.price.optional(),
  description: z.string().optional(),
});

// Validation
const validateForm = (): boolean => {
  const result = validateForm(productSchema, formData);
  
  if (!result.success) {
    setValidationErrors(result.errors);
    return false;
  }
  
  setValidationErrors({});
  return true;
};
```

**Avantages** :
- ✅ Validation robuste
- ✅ Messages d'erreur clairs
- ✅ Réduction des erreurs
- ✅ Code plus maintenable

---

## 📋 Exemple 3 : Validation Asynchrone (Client + Serveur)

### Utilisation

```typescript
import { commonSchemas, validateFormAsync } from '@/lib/form-validation';
import { z } from 'zod';

// Schéma de validation
const userSchema = z.object({
  email: commonSchemas.email,
  password: commonSchemas.password,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

// Validation côté serveur
const serverValidation = async (data: z.infer<typeof userSchema>) => {
  // Vérifier si l'email existe déjà
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', data.email)
    .single();
  
  if (existingUser) {
    return {
      success: false,
      errors: {
        email: 'Cet email est déjà utilisé',
      },
    };
  }
  
  return { success: true };
};

// Validation
const handleSubmit = async () => {
  const result = await validateFormAsync(userSchema, formData, serverValidation);
  
  if (!result.success) {
    setFormErrors(result.errors);
    return;
  }
  
  // Données validées
  console.log(result.data);
  // ... créer l'utilisateur
};
```

**Avantages** :
- ✅ Validation côté client + serveur
- ✅ Vérification de l'unicité (email, etc.)
- ✅ Meilleure sécurité
- ✅ Expérience utilisateur améliorée

---

## 📋 Exemple 4 : Validation de Champ Individuel

### Utilisation

```typescript
import { commonSchemas, validateField } from '@/lib/form-validation';

// Validation d'un champ individuel
const handleEmailChange = (value: string) => {
  const result = validateField(commonSchemas.email, value);
  
  if (!result.success) {
    setFieldError('email', result.error);
  } else {
    clearFieldError('email');
  }
  
  setFormData({ ...formData, email: value });
};
```

**Avantages** :
- ✅ Validation en temps réel
- ✅ Feedback immédiat
- ✅ Meilleure UX
- ✅ Réduction des erreurs

---

## 📋 Exemple 5 : Helpers pour Erreurs

### Utilisation

```typescript
import { 
  formatValidationErrors, 
  getFieldError, 
  hasFormErrors, 
  clearFormErrors 
} from '@/lib/form-validation';

// Formater les erreurs pour l'affichage
const formattedErrors = formatValidationErrors(errors);
// => [{ field: 'email', message: 'L\'email est requis' }, ...]

// Obtenir l'erreur d'un champ
const emailError = getFieldError(errors, 'email');
// => 'L\'email est requis' ou undefined

// Vérifier si le formulaire a des erreurs
if (hasFormErrors(errors)) {
  console.log('Le formulaire a des erreurs');
}

// Nettoyer les erreurs d'un champ
const cleanedErrors = clearFormErrors(errors, ['email', 'phone']);
// => Erreurs sans 'email' et 'phone'

// Nettoyer toutes les erreurs
const noErrors = clearFormErrors(errors);
// => {}
```

**Avantages** :
- ✅ Helpers pratiques
- ✅ Code plus lisible
- ✅ Réduction des erreurs
- ✅ Meilleure maintenabilité

---

## 🎯 PROCHAINES ÉTAPES

### 1. Migrer les Formulaires Existants

- [ ] Migrer le formulaire de checkout
- [ ] Migrer le formulaire de produit
- [ ] Migrer le formulaire de service
- [ ] Migrer le formulaire de cours
- [ ] Migrer les autres formulaires

### 2. Ajouter la Validation Serveur

- [ ] Ajouter la validation serveur pour l'email
- [ ] Ajouter la validation serveur pour le slug
- [ ] Ajouter la validation serveur pour les autres champs

### 3. Améliorer les Messages d'Erreur

- [ ] Personnaliser les messages d'erreur
- [ ] Ajouter des messages contextuels
- [ ] Améliorer l'affichage des erreurs

---

## ✅ CONCLUSION

La bibliothèque de validation offre :
- ✅ **Validation cohérente** : Même validation partout
- ✅ **Messages d'erreur clairs** : Meilleure UX
- ✅ **Réduction des erreurs** : Validation robuste
- ✅ **Réduction du code** : Schémas réutilisables
- ✅ **Meilleure maintenabilité** : Code plus lisible

**Statut** : ✅ **PRÊT À UTILISER**  
**Recommandation** : Migrer progressivement les formulaires existants

---

**Date de création** : 31 Janvier 2025  
**Statut** : ✅ **COMPLET**  
**Prochaines étapes** : Migrer les formulaires existants




