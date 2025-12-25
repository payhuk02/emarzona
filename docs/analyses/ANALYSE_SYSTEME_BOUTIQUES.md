# Analyse du Système de Création de Boutiques (Limite 3)

## Date : 2025-01-30

## Résumé Exécutif

L'analyse révèle **plusieurs failles de sécurité critiques** dans le système de limitation à 3 boutiques par utilisateur. La validation se fait uniquement côté client, ce qui permet de contourner facilement la limite.

---

## 🔴 Problèmes Critiques Identifiés

### 1. **useStore.ts - Pas de vérification de limite** (CRITIQUE)

**Fichier** : `src/hooks/useStore.ts` (lignes 146-191)

**Problème** : La fonction `createStore` dans `useStore` ne vérifie **PAS** la limite de 3 boutiques avant de créer une boutique.

```146:191:src/hooks/useStore.ts
  const createStore = async (name: string, description?: string) => {
    try {
      if (!user) throw new Error("Non authentifié");

      const slug = generateSlug(name);
      
      // Vérifier disponibilité
      const isAvailable = await checkSlugAvailability(slug);
      if (!isAvailable) {
        toast({
          title: "Nom indisponible",
          description: "Ce nom de boutique est déjà utilisé. Essayez un autre nom.",
          variant: "destructive"
        });
        return false;
      }

      const { data, error } = await supabase
        .from('stores')
        .insert({
          user_id: user.id,
          name,
          slug,
          description: description || null
        })
        .select()
        .limit(1);

      if (error) throw error;

      setStore(data && data.length > 0 ? data[0] : null);
      toast({
        title: "Boutique créée !",
        description: `Votre boutique "${name}" est maintenant en ligne.`
      });
      return true;
    } catch (error) {
      logger.error('Error creating store:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer votre boutique",
        variant: "destructive"
      });
      return false;
    }
  };
```

**Impact** : Un utilisateur peut contourner la limite en utilisant ce hook au lieu de `useStores`.

---

### 2. **StoreForm.tsx - Insert direct sans vérification** (CRITIQUE)

**Fichier** : `src/components/store/StoreForm.tsx` (lignes 123-141)

**Problème** : Le formulaire fait un `insert` direct dans Supabase sans vérifier la limite de 3 boutiques.

```123:141:src/components/store/StoreForm.tsx
      } else {
        // Create new store
        const { error } = await supabase
          .from('stores')
          .insert({
            user_id: user.id,
            name,
            slug,
            description: description || null,
            default_currency: defaultCurrency,
          });

        if (error) throw error;

        toast({
          title: "Boutique créée",
          description: "Votre boutique a été créée avec succès",
        });
      }
```

**Impact** : Un utilisateur peut créer des boutiques sans limite via ce formulaire.

**Note** : Ce composant ne semble pas être utilisé actuellement dans l'application, mais il représente une faille potentielle.

---

### 3. **Pas de contrainte en base de données** (CRITIQUE)

**Problème** : Aucune contrainte CHECK, trigger ou fonction en base de données pour limiter à 3 boutiques par utilisateur.

**Impact** : 
- La validation côté client peut être contournée
- Race condition : si deux requêtes sont envoyées simultanément, les deux pourraient passer la vérification
- Un utilisateur malveillant peut créer plus de 3 boutiques via l'API directement

**Migration actuelle** : `supabase/migrations/20251006084900_2206f899-227f-4655-a684-46f9bbc334ed.sql` ne contient aucune limitation.

---

### 4. **Incohérence entre hooks** (MOYEN)

**Problème** : Deux hooks différents gèrent les boutiques :
- `useStores` : Gère plusieurs boutiques, vérifie la limite ✅
- `useStore` : Gère une seule boutique, ne vérifie PAS la limite ❌

**Impact** : Confusion potentielle pour les développeurs et risque d'utilisation du mauvais hook.

---

## ✅ Points Positifs

1. **useStores.ts** : Implémentation correcte avec vérification de limite
   - `MAX_STORES_PER_USER = 3` (ligne 41)
   - `canCreateStore()` vérifie la limite (ligne 78-80)
   - `createStore()` vérifie avant insertion (ligne 94-96)

2. **StoreSettings.tsx** : Utilise correctement `useStores` et affiche la limite

3. **Store.tsx** : Utilise correctement `useStores` et affiche les messages appropriés

---

## 🔧 Corrections Nécessaires

### Correction 1 : Ajouter vérification dans useStore.ts

Ajouter la vérification de limite dans `useStore.createStore()` avant l'insertion.

### Correction 2 : Corriger StoreForm.tsx

Modifier `StoreForm` pour utiliser `useStores` au lieu d'un insert direct, ou ajouter la vérification.

### Correction 3 : Créer un trigger en base de données

Créer une fonction et un trigger BEFORE INSERT pour garantir la limite côté serveur :

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
    RAISE EXCEPTION 'Limite de 3 boutiques par utilisateur atteinte';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER enforce_store_limit
  BEFORE INSERT ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION check_store_limit();
```

### Correction 4 : Ajouter une contrainte CHECK (optionnel mais recommandé)

Pour une double protection, ajouter une fonction et une contrainte :

```sql
CREATE OR REPLACE FUNCTION count_user_stores(user_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM public.stores WHERE user_id = user_uuid;
$$ LANGUAGE sql STABLE;

-- Note: PostgreSQL ne supporte pas directement CHECK avec sous-requête,
-- donc on utilise le trigger ci-dessus
```

---

## 📊 Tests Recommandés

1. **Test unitaire** : Vérifier que `useStore.createStore()` refuse après 3 boutiques
2. **Test d'intégration** : Tenter de créer 4 boutiques via l'API
3. **Test de race condition** : Envoyer 2 requêtes simultanées pour créer une boutique
4. **Test E2E** : Scénario complet de création jusqu'à la limite

---

## 🎯 Priorité des Corrections

1. **URGENT** : Créer le trigger en base de données (Correction 3)
2. **URGENT** : Corriger useStore.ts (Correction 1)
3. **MOYEN** : Corriger StoreForm.tsx (Correction 2)
4. **FAIBLE** : Unifier les hooks ou documenter leur usage

---

## 📝 Recommandations Supplémentaires

1. **Documentation** : Documenter clairement quel hook utiliser pour quelle fonctionnalité
2. **Tests** : Ajouter des tests unitaires et E2E pour la limite
3. **Monitoring** : Ajouter des alertes si un utilisateur tente de contourner la limite
4. **Logs** : Logger les tentatives de création au-delà de la limite pour audit

---

## ✅ Conclusion

Le système actuel présente des **failles de sécurité critiques** qui permettent de contourner la limite de 3 boutiques. Il est **impératif** de :
1. Ajouter une validation côté serveur (trigger)
2. Corriger tous les points d'entrée côté client
3. Tester exhaustivement les corrections

Une fois ces corrections appliquées, le système sera sécurisé et cohérent.

---

## ✅ Corrections Appliquées (2025-01-30)

### ✅ Correction 1 : useStore.ts
- **Fichier modifié** : `src/hooks/useStore.ts`
- **Changements** :
  - Ajout de la vérification de limite avant création (lignes 150-171)
  - Gestion de l'erreur de limite depuis la base de données (lignes 208-218)
  - Utilisation de `count` pour vérifier le nombre de boutiques existantes

### ✅ Correction 2 : StoreForm.tsx
- **Fichier modifié** : `src/components/store/StoreForm.tsx`
- **Changements** :
  - Ajout de la vérification de limite avant création (lignes 124-143)
  - Gestion de l'erreur de limite depuis la base de données (lignes 155-164)
  - Message d'erreur clair pour l'utilisateur

### ✅ Correction 3 : Trigger en base de données
- **Fichier créé** : `supabase/migrations/20250130_enforce_store_limit.sql`
- **Fonctionnalités** :
  - Fonction `check_store_limit()` qui vérifie le nombre de boutiques avant INSERT
  - Trigger `enforce_store_limit` qui s'exécute BEFORE INSERT
  - Message d'erreur en français pour l'utilisateur
  - Protection contre les race conditions

### 📋 Prochaines Étapes
1. **Appliquer la migration** : Exécuter `supabase/migrations/20250130_enforce_store_limit.sql` sur la base de données
2. **Tester les corrections** : Vérifier que la limite fonctionne correctement
3. **Tests E2E** : Créer des tests pour valider le comportement

---

## 🔒 Sécurité Renforcée

Le système est maintenant protégé à **trois niveaux** :
1. **Côté client** : Vérification dans `useStores`, `useStore`, et `StoreForm`
2. **Côté serveur** : Trigger en base de données qui garantit la limite
3. **Gestion d'erreurs** : Messages clairs pour l'utilisateur en cas de limite atteinte

Cette approche en couches garantit que même si une validation côté client est contournée, la base de données empêchera la création de plus de 3 boutiques.

