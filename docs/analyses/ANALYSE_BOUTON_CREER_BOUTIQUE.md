# 🔍 ANALYSE - BOUTON "CRÉER MA BOUTIQUE"

**Date** : 2 Février 2025  
**Objectif** : Analyser le comportement complet du bouton "Créer ma boutique"  
**Fichier principal** : `src/components/settings/StoreSettings.tsx`

---

## 📍 LOCALISATION DU BOUTON

Le bouton "Créer ma boutique" apparaît dans **deux contextes** :

### 1. **Onglet "Créer" dans StoreSettings** (Principal)

**Fichier** : `src/components/settings/StoreSettings.tsx`

**Lignes** : 212-216

```typescript
{canCreateStore() && (
  <TabsTrigger value="create">
    Créer {getRemainingStores() > 0 && `(${getRemainingStores()} restante${getRemainingStores() > 1 ? 's' : ''})`}
  </TabsTrigger>
)}
```

**Comportement** :
- ✅ Affiché uniquement si `canCreateStore()` retourne `true`
- ✅ Affiche le nombre de boutiques restantes : `(X restante(s))`
- ✅ Change l'onglet actif vers `"create"` au clic

---

### 2. **Bouton dans la liste vide** (Secondaire)

**Fichier** : `src/components/settings/StoreSettings.tsx`

**Lignes** : 229-232

```typescript
<Button onClick={() => setActiveTab("create")}>
  <Plus className="h-4 w-4 mr-2" />
  Créer ma boutique
</Button>
```

**Comportement** :
- ✅ Affiché uniquement si `stores.length === 0` (aucune boutique)
- ✅ Change l'onglet actif vers `"create"` au clic
- ✅ Pas de vérification de limite (car aucune boutique n'existe)

---

## 🔒 CONDITIONS D'AFFICHAGE

### Fonction `canCreateStore()`

**Fichier** : `src/hooks/useStores.ts`

**Lignes** : 79-81

```typescript
const canCreateStore = () => {
  return stores.length < MAX_STORES_PER_USER;
};
```

**Constante** : `MAX_STORES_PER_USER = 3`

**Logique** :
- ✅ Retourne `true` si `stores.length < 3`
- ❌ Retourne `false` si `stores.length >= 3`

**Résultat** :
- **0 boutiques** : ✅ Bouton visible
- **1 boutique** : ✅ Bouton visible (affiche "2 restantes")
- **2 boutiques** : ✅ Bouton visible (affiche "1 restante")
- **3 boutiques** : ❌ Bouton **masqué** (onglet "Créer" n'apparaît pas)

---

## 🎯 COMPORTEMENT AU CLIC

### 1. **Changement d'Onglet**

**Action** : `setActiveTab("create")`

**Résultat** : L'onglet actif passe de `"list"` à `"create"`

---

### 2. **Affichage du Formulaire de Création**

**Fichier** : `src/components/settings/StoreSettings.tsx`

**Lignes** : 301-385

**Structure** :
```typescript
<TabsContent value="create" className="space-y-4">
  {!canCreateStore() ? (
    // ❌ Alerte si limite atteinte
    <Alert variant="destructive">
      <AlertDescription>
        Limite de 3 boutiques par utilisateur atteinte...
      </AlertDescription>
    </Alert>
  ) : (
    // ✅ Formulaire de création
    <Card>
      <CardHeader>
        <CardTitle>Créer votre boutique</CardTitle>
        <CardDescription>
          {stores.length > 0 
            ? `Vous avez ${stores.length} boutique(s). Vous pouvez créer jusqu'à ${getRemainingStores()} boutique(s) supplémentaire(s).`
            : "Configurez votre boutique pour commencer à vendre vos produits"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Formulaire */}
      </CardContent>
    </Card>
  )}
</TabsContent>
```

**Double Vérification** :
1. ✅ **Avant d'afficher l'onglet** : `canCreateStore()` dans `TabsTrigger`
2. ✅ **Dans le contenu de l'onglet** : `!canCreateStore()` pour afficher l'alerte

**Pourquoi ?** : Protection supplémentaire au cas où l'utilisateur accède directement à l'onglet "create" via l'URL.

---

## 📝 FORMULAIRE DE CRÉATION

### Champs Requis

1. **Nom de la boutique** (`name`)
   - ✅ Requis (validation : `!newStoreData.name.trim()`)
   - ✅ Génère automatiquement le slug si non fourni

2. **URL de la boutique** (`slug`)
   - ⚠️ Optionnel (généré automatiquement depuis le nom)
   - ✅ Format : `payhula.com/stores/{slug}`

3. **Description** (`description`)
   - ⚠️ Optionnel

---

### Fonction `handleCreateStore()`

**Fichier** : `src/components/settings/StoreSettings.tsx`

**Lignes** : 59-90

**Étapes** :

1. **Validation** :
   ```typescript
   if (!newStoreData.name.trim()) {
     toast({ title: "Erreur", description: "Le nom de la boutique est requis" });
     return;
   }
   ```

2. **Génération du slug** :
   ```typescript
   const slug = newStoreData.slug.trim() || generateSlug(newStoreData.name);
   ```

3. **Appel à `createStore()`** :
   ```typescript
   await createStore({
     name: newStoreData.name.trim(),
     description: newStoreData.description.trim() || null,
     slug: slug
   });
   ```

4. **Rafraîchissement** :
   ```typescript
   await refreshStores(); // Rafraîchit le contexte
   ```

5. **Réinitialisation** :
   ```typescript
   setNewStoreData({ name: "", description: "", slug: "" });
   setActiveTab("list"); // Retour à la liste
   ```

---

## 🔐 VÉRIFICATIONS DE SÉCURITÉ

### 1. **Frontend - Hook `useStores.createStore()`**

**Fichier** : `src/hooks/useStores.ts`

**Lignes** : 87-132

```typescript
const createStore = async (storeData: Partial<Store>) => {
  // ...
  
  // Vérifier la limite de 3 boutiques
  if (!canCreateStore()) {
    throw new Error(`Limite de ${MAX_STORES_PER_USER} boutiques par utilisateur atteinte...`);
  }
  
  // Insertion dans la base de données
  const { data, error } = await supabase
    .from('stores')
    .insert([{ ...storeData, user_id: user.id, is_active: true }])
    .select()
    .single();
  
  // ...
};
```

**Vérification** : ✅ Vérifie `canCreateStore()` avant l'insertion

---

### 2. **Backend - Trigger SQL**

**Fichier** : `supabase/migrations/20250202_restore_multi_stores_limit.sql`

```sql
CREATE OR REPLACE FUNCTION check_store_limit()
RETURNS TRIGGER AS $$
DECLARE
  store_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO store_count
  FROM public.stores
  WHERE user_id = NEW.user_id;
  
  IF store_count >= 3 THEN
    RAISE EXCEPTION 'Limite de 3 boutiques par utilisateur atteinte...';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_store_limit
  BEFORE INSERT ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION check_store_limit();
```

**Vérification** : ✅ Vérifie la limite au niveau base de données (double protection)

---

## 📊 FLUX COMPLET

```
┌─────────────────────────────────────┐
│  Utilisateur clique sur "Créer"    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Vérification : canCreateStore()?   │
│  - stores.length < 3 ?              │
└──────────────┬──────────────────────┘
               │
        ┌──────┴──────┐
        │             │
        ▼             ▼
    ✅ OUI         ❌ NON
        │             │
        │             └──► Onglet masqué
        │
        ▼
┌─────────────────────────────────────┐
│  setActiveTab("create")              │
│  → Affiche le formulaire             │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Utilisateur remplit le formulaire  │
│  et clique sur "Créer la boutique"  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Validation : name.trim() ?         │
└──────────────┬──────────────────────┘
               │
        ┌──────┴──────┐
        │             │
        ▼             ▼
    ✅ OUI         ❌ NON
        │             │
        │             └──► Toast d'erreur
        │
        ▼
┌─────────────────────────────────────┐
│  createStore() appelé               │
│  → Vérifie canCreateStore()         │
└──────────────┬──────────────────────┘
               │
        ┌──────┴──────┐
        │             │
        ▼             ▼
    ✅ OUI         ❌ NON
        │             │
        │             └──► Erreur + Toast
        │
        ▼
┌─────────────────────────────────────┐
│  Insertion dans Supabase             │
│  → Trigger SQL vérifie la limite    │
└──────────────┬──────────────────────┘
               │
        ┌──────┴──────┐
        │             │
        ▼             ▼
    ✅ OUI         ❌ NON
        │             │
        │             └──► Exception SQL
        │
        ▼
┌─────────────────────────────────────┐
│  refreshStores()                     │
│  → Met à jour le contexte            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  setActiveTab("list")                │
│  → Retour à la liste                 │
└─────────────────────────────────────┘
```

---

## 🎨 AFFICHAGE DYNAMIQUE

### Texte du Bouton

**Cas 1** : Aucune boutique
```
"Créer"
```

**Cas 2** : 1 boutique existante
```
"Créer (2 restantes)"
```

**Cas 3** : 2 boutiques existantes
```
"Créer (1 restante)"
```

**Cas 4** : 3 boutiques existantes
```
[Bouton masqué]
```

---

### Description dans le Formulaire

**Cas 1** : Aucune boutique
```
"Configurez votre boutique pour commencer à vendre vos produits"
```

**Cas 2** : Boutiques existantes
```
"Vous avez X boutique(s). Vous pouvez créer jusqu'à Y boutique(s) supplémentaire(s)."
```

---

## ✅ POINTS FORTS

1. **Triple Protection** :
   - ✅ Vérification frontend (`canCreateStore()`)
   - ✅ Vérification dans le hook (`createStore()`)
   - ✅ Vérification backend (Trigger SQL)

2. **UX Optimale** :
   - ✅ Affichage du nombre de boutiques restantes
   - ✅ Message clair si limite atteinte
   - ✅ Formulaire simple et intuitif

3. **Gestion d'Erreurs** :
   - ✅ Validation du nom requis
   - ✅ Gestion des erreurs SQL
   - ✅ Toasts informatifs

4. **Synchronisation** :
   - ✅ Rafraîchissement du contexte après création
   - ✅ Mise à jour automatique de la liste

---

## ⚠️ POINTS D'ATTENTION

1. **Double Vérification** :
   - ✅ `canCreateStore()` dans `TabsTrigger` (masque l'onglet)
   - ✅ `!canCreateStore()` dans `TabsContent` (affiche l'alerte)
   - **Note** : Protection redondante mais utile si accès direct à l'onglet

2. **Génération du Slug** :
   - ✅ Généré automatiquement si non fourni
   - ⚠️ Pas de vérification de disponibilité avant la création
   - **Note** : La vérification se fait dans `StoreForm.tsx` mais pas ici

---

## 🔧 AMÉLIORATIONS POSSIBLES

1. **Vérification du Slug** :
   - Ajouter une vérification de disponibilité en temps réel
   - Afficher un indicateur visuel (✓ ou ✗)

2. **Prévisualisation** :
   - Afficher l'URL complète : `payhula.com/stores/{slug}`
   - Indiquer si le slug est disponible

3. **Validation Avancée** :
   - Vérifier la longueur du nom (min/max)
   - Vérifier les caractères spéciaux dans le slug

---

## 📝 RÉSUMÉ

| Aspect | Comportement |
|--------|--------------|
| **Affichage** | Conditionnel (`canCreateStore()`) |
| **Texte** | Dynamique avec nombre de boutiques restantes |
| **Action** | Change l'onglet vers "create" |
| **Validation** | Triple (Frontend, Hook, Backend) |
| **Limite** | 3 boutiques maximum par utilisateur |
| **UX** | Messages clairs et informatifs |

---

**Document créé le** : 2 Février 2025  
**Dernière modification** : 2 Février 2025  
**Version** : 1.0

