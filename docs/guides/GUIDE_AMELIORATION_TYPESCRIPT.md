# 🔧 GUIDE D'AMÉLIORATION TYPESCRIPT - PHASE 2

**Date** : 31 Janvier 2025  
**Statut** : TypeScript Strict déjà activé ✅  
**Objectif** : Améliorer la qualité du code TypeScript

---

## ✅ ÉTAT ACTUEL

### Configuration TypeScript

**Fichier** : `tsconfig.app.json`

```json
{
  "compilerOptions": {
    "strict": true,                    // ✅ Activé
    "noUnusedLocals": true,            // ✅ Activé
    "noUnusedParameters": true,        // ✅ Activé
    "noImplicitAny": true,             // ✅ Activé
    // strictNullChecks est inclus dans "strict": true
  }
}
```

**Conclusion** : TypeScript Strict est **déjà activé** ! ✅

---

## 🎯 OBJECTIFS DE LA PHASE 2

Même si TypeScript strict est activé, il reste des améliorations à faire :

1. **Réduire les types `any`** : 1598 occurrences → Objectif < 500
2. **Améliorer les null checks** : Utiliser `?.` et `??` de manière cohérente
3. **Nettoyer les variables inutilisées** : Supprimer le code mort
4. **Améliorer les types** : Créer des interfaces/types plus précis

---

## 📋 PLAN D'ACTION

### Étape 1 : Identifier les fichiers avec le plus de `any`

**Commande** :
```bash
# Compter les occurrences de 'any' par fichier
grep -r ": any" src/ --include="*.ts" --include="*.tsx" | cut -d: -f1 | sort | uniq -c | sort -rn | head -20
```

**Fichiers prioritaires** (basé sur l'audit) :
- Hooks personnalisés (`src/hooks/`)
- Contextes React (`src/contexts/`)
- Types de données (`src/types/`)

---

### Étape 2 : Corriger les types `any` dans les hooks

#### Pattern 1 : Paramètres de fonction

**❌ Avant** :
```typescript
function fetchData(params: any) {
  return params.id;
}
```

**✅ Après** :
```typescript
interface FetchDataParams {
  id: string;
  limit?: number;
}

function fetchData(params: FetchDataParams) {
  return params.id;
}
```

#### Pattern 2 : Callbacks

**❌ Avant** :
```typescript
products.map(product => product.name);
// Si TypeScript ne peut pas inférer le type
```

**✅ Après** :
```typescript
products.map((product: Product) => product.name);
// Ou mieux : typer le tableau
const products: Product[] = [...];
products.map(product => product.name); // Inférence automatique
```

#### Pattern 3 : Catch blocks

**❌ Avant** :
```typescript
try {
  // ...
} catch (error) {
  console.log(error.message); // Erreur : 'error' est de type 'unknown'
}
```

**✅ Après** :
```typescript
try {
  // ...
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.log(message);
}
```

---

### Étape 3 : Améliorer les null checks

#### Pattern 1 : Accès propriété potentiellement null

**❌ Avant** :
```typescript
const userName = user.name.toUpperCase(); // Erreur si user.name est null
```

**✅ Après** :
```typescript
const userName = user?.name?.toUpperCase() ?? 'Unknown';
```

#### Pattern 2 : State potentiellement null

**❌ Avant** :
```typescript
const [user, setUser] = useState<User>(null); // Erreur
```

**✅ Après** :
```typescript
const [user, setUser] = useState<User | null>(null);

// Utilisation
if (user) {
  console.log(user.name); // TypeScript sait que user n'est pas null
}
```

#### Pattern 3 : Paramètres optionnels

**❌ Avant** :
```typescript
function formatDate(date: Date) {
  return date.toISOString(); // Erreur si date peut être null
}
```

**✅ Après** :
```typescript
function formatDate(date: Date | null | undefined): string {
  if (!date) return '-';
  return date.toISOString();
}
```

---

### Étape 4 : Nettoyer les variables inutilisées

**Commande pour identifier** :
```bash
# TypeScript compiler affichera les warnings
npm run build
```

**Exemples à nettoyer** :

**❌ Avant** :
```typescript
const MyComponent = () => {
  const [count, setCount] = useState(0);
  const unusedVar = 'test'; // ❌ Jamais utilisé
  const unusedParam = (value: string) => {}; // ❌ Paramètre non utilisé

  return <div>{count}</div>;
};
```

**✅ Après** :
```typescript
const MyComponent = () => {
  const [count] = useState(0);
  // unusedVar supprimé
  const handler = () => {}; // Paramètre supprimé si non nécessaire

  return <div>{count}</div>;
};
```

---

## 🔍 FICHIERS PRIORITAIRES À CORRIGER

### 1. Hooks Personnalisés

**Fichiers** :
- `src/hooks/useProducts.ts`
- `src/hooks/useOrders.ts`
- `src/hooks/useAuth.ts`
- `src/hooks/useStore.ts`
- `src/hooks/useProfile.ts`

**Actions** :
1. Typer tous les paramètres de fonction
2. Typer les retours de fonction
3. Utiliser des interfaces pour les paramètres complexes
4. Gérer les cas null/undefined

---

### 2. Contextes React

**Fichiers** :
- `src/contexts/AuthContext.tsx`
- `src/contexts/StoreContext.tsx`

**Actions** :
1. Typer le contexte avec une interface
2. Typer les valeurs par défaut
3. Gérer les cas où le contexte peut être undefined

**Exemple** :
```typescript
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

---

### 3. Types de Données

**Fichiers** :
- `src/types/` (tous les fichiers)

**Actions** :
1. Créer des interfaces pour toutes les entités
2. Utiliser des types union pour les états
3. Éviter `any` même pour les données externes (utiliser `unknown`)

**Exemple** :
```typescript
// ❌ Avant
interface Product {
  id: any;
  name: any;
  price: any;
}

// ✅ Après
interface Product {
  id: string;
  name: string;
  price: number;
  description?: string; // Optionnel
  tags: string[]; // Array typé
}
```

---

## 🛠️ OUTILS UTILES

### 1. ESLint avec TypeScript

**Configuration** : `.eslintrc.json`

```json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn"
  }
}
```

### 2. VSCode Extensions

- **TypeScript Hero** : Organise les imports
- **Error Lens** : Affiche les erreurs inline
- **TypeScript Importer** : Auto-import des types

### 3. Scripts NPM

**Ajouter dans `package.json`** :
```json
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "type-check:watch": "tsc --noEmit --watch"
  }
}
```

---

## 📊 MÉTRIQUES DE PROGRÈS

### Avant (État Actuel)

- Types `any` : **1598 occurrences**
- Variables inutilisées : **~50-100**
- Erreurs TypeScript : **À vérifier**

### Objectif

- Types `any` : **< 500 occurrences** (-69%)
- Variables inutilisées : **0**
- Erreurs TypeScript : **0**

---

## ✅ CHECKLIST DE VALIDATION

### Phase 2.1 : Réduction des `any` (3h)

- [ ] Identifier les 20 fichiers avec le plus de `any`
- [ ] Corriger les hooks personnalisés
- [ ] Corriger les contextes React
- [ ] Corriger les types de données
- [ ] Vérifier : `grep -r ": any" src/ | wc -l` < 500

### Phase 2.2 : Amélioration null checks (2h)

- [ ] Vérifier tous les accès propriétés avec `?.`
- [ ] Vérifier tous les useState avec types null
- [ ] Vérifier tous les paramètres optionnels
- [ ] Tester avec `npm run build`

### Phase 2.3 : Nettoyage code mort (1h)

- [ ] Supprimer variables inutilisées
- [ ] Supprimer paramètres inutilisées
- [ ] Supprimer imports inutilisés
- [ ] Vérifier : `npm run build` sans warnings

---

## 🚀 COMMANDES UTILES

### Vérifier les erreurs TypeScript

```bash
# Compiler sans générer de fichiers
npm run build

# Ou avec tsc directement
npx tsc --noEmit
```

### Compter les `any`

```bash
# Windows PowerShell
(Select-String -Path "src\**\*.ts" -Pattern ": any" -Recurse).Count
(Select-String -Path "src\**\*.tsx" -Pattern ": any" -Recurse).Count

# Linux/Mac
grep -r ": any" src/ --include="*.ts" --include="*.tsx" | wc -l
```

### Trouver les variables inutilisées

```bash
# TypeScript compiler les affichera automatiquement
npm run build 2>&1 | Select-String "is declared but never used"
```

---

## 📝 NOTES IMPORTANTES

### Compatibilité

- ✅ Toutes les corrections sont **rétrocompatibles**
- ✅ Peut être fait **progressivement** (fichier par fichier)
- ✅ Ne casse pas le code existant

### Priorisation

1. **Hooks critiques** (useAuth, useProducts, useOrders)
2. **Contextes React** (AuthContext, StoreContext)
3. **Types de données** (interfaces principales)
4. **Composants** (progressivement)

### Tests

- ✅ Vérifier que `npm run build` passe
- ✅ Vérifier que les tests passent
- ✅ Tester manuellement les fonctionnalités critiques

---

## 🎯 PROCHAINES ÉTAPES

1. **Exécuter** : `npm run build` pour voir les erreurs actuelles
2. **Identifier** : Les fichiers avec le plus de `any`
3. **Corriger** : Fichier par fichier, en commençant par les hooks
4. **Valider** : Vérifier que le build passe
5. **Documenter** : Noter les corrections dans ce fichier

---

**Document créé le** : 31 Janvier 2025  
**Dernière mise à jour** : 31 Janvier 2025  
**Version** : 1.0


