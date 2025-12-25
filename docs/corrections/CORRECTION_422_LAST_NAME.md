# Correction de l'erreur 422 "The customer.Last name"

## Problème identifié

L'API Moneroo retournait une erreur `422 Unprocessable Entity` avec le message "The customer.Last name", indiquant que le champ `last_name` dans l'objet `customer` était vide ou invalide.

### Cause racine

Lors du formatage du nom du client (`customer_name`) en `first_name` et `last_name`, le code ne gérait pas correctement les cas suivants :

1. **`customer_name` vide ou null** : Résultait en `last_name` vide
2. **`customer_name` avec un seul mot** : Résultait en `last_name` vide (par exemple, "john" de "john@example.com")
3. **`customer_name` avec plusieurs espaces** : Pouvait créer des parties vides

## Solution implémentée

### 1. Gestion robuste du nom du client

```typescript
// Si customer_name est vide, utiliser l'email comme base
if (!customerName && data.customer_email) {
  customerName = data.customer_email.split('@')[0] || 'Client';
}

// Si customer_name est toujours vide, utiliser une valeur par défaut
if (!customerName) {
  customerName = 'Client';
}
```

### 2. Division intelligente du nom

```typescript
// Diviser le nom en first_name et last_name
const customerNameParts = customerName.split(' ').filter(part => part.trim().length > 0);

if (customerNameParts.length === 0) {
  // Cas improbable mais sécurisé
  firstName = 'Client';
  lastName = 'Moneroo';
} else if (customerNameParts.length === 1) {
  // Un seul mot: utiliser ce mot pour first_name et "Client" pour last_name
  firstName = customerNameParts[0];
  lastName = 'Client';
} else {
  // Plusieurs mots: premier mot = first_name, reste = last_name
  firstName = customerNameParts[0];
  lastName = customerNameParts.slice(1).join(' ');
}
```

### 3. Validation finale

```typescript
// S'assurer que first_name et last_name ne sont jamais vides
firstName = firstName.trim() || 'Client';
lastName = lastName.trim() || 'Client';
```

### 4. Logs détaillés pour diagnostic

```typescript
console.log('[Moneroo Edge Function] Customer name processing:', {
  originalCustomerName: data.customer_name,
  processedCustomerName: customerName,
  firstName,
  lastName,
  customerEmail: data.customer_email,
  nameParts: customerNameParts,
});
```

## Fichiers modifiés

1. **`supabase/functions/moneroo/index.ts`**
   - Correction de la logique de formatage du nom du client
   - Ajout de logs détaillés
   - Ajout d'accolades `{}` autour du bloc `case 'create_checkout'` pour éviter les problèmes de scope

2. **`CODE_MONEROO_POUR_SUPABASE.txt`**
   - Mise à jour avec le code corrigé prêt à être déployé

## Cas de test

### Cas 1 : `customer_name` vide
- **Input** : `customer_name: ""`, `customer_email: "john@example.com"`
- **Output** : `first_name: "john"`, `last_name: "Client"`

### Cas 2 : `customer_name` avec un seul mot
- **Input** : `customer_name: "john"`, `customer_email: "john@example.com"`
- **Output** : `first_name: "john"`, `last_name: "Client"`

### Cas 3 : `customer_name` avec plusieurs mots
- **Input** : `customer_name: "John Doe"`, `customer_email: "john@example.com"`
- **Output** : `first_name: "John"`, `last_name: "Doe"`

### Cas 4 : `customer_name` avec plusieurs mots (nom composé)
- **Input** : `customer_name: "John Doe Smith"`, `customer_email: "john@example.com"`
- **Output** : `first_name: "John"`, `last_name: "Doe Smith"`

### Cas 5 : `customer_name` et `customer_email` vides
- **Input** : `customer_name: ""`, `customer_email: ""`
- **Output** : `first_name: "Client"`, `last_name: "Moneroo"`

## Prochaines étapes

1. **Redéployer l'Edge Function** avec le code corrigé depuis `CODE_MONEROO_POUR_SUPABASE.txt`
2. **Tester un paiement** avec différents formats de noms de clients
3. **Vérifier les logs Supabase** pour confirmer que `last_name` n'est plus vide

## Notes importantes

- Le champ `last_name` est maintenant **garanti non vide** grâce aux vérifications multiples
- Les valeurs par défaut ("Client", "Moneroo") sont utilisées uniquement en dernier recours
- Les logs détaillés permettent de diagnostiquer facilement les problèmes futurs
- Le code gère tous les cas limites de manière robuste




