# 🐛 FIX - Clignotement lors du clic sur "Créer ma boutique"

## 🔍 PROBLÈME IDENTIFIÉ

Lors du clic sur le bouton "Créer ma boutique", une ancienne page clignotait brièvement avant la redirection vers la page Settings.

### Cause du problème

1. **TabsTrigger avec onClick** : Le `TabsTrigger` avec `value="create"` avait un `onClick` qui redirigeait
2. **Comportement par défaut** : Quand on clique sur un `TabsTrigger`, Radix UI change automatiquement l'onglet actif **AVANT** l'exécution du `onClick`
3. **Résultat** : 
   - React affiche d'abord le `TabsContent value="create"` (ancienne page)
   - Puis le `onClick` s'exécute et redirige
   - **Clignotement visible** ⚠️

### Code problématique

```typescript
<TabsTrigger 
  value="create" 
  onClick={handleCreateStoreRedirect}  // ❌ S'exécute APRÈS le changement d'onglet
>
  Créer ma boutique
</TabsTrigger>

<TabsContent value="create">  {/* ❌ Affiché brièvement avant la redirection */}
  {/* Ancienne page de création */}
</TabsContent>
```

## ✅ SOLUTION APPLIQUÉE

### Remplacement du TabsTrigger par un Button

Au lieu d'utiliser un `TabsTrigger` qui change l'onglet, on utilise un `Button` stylé pour ressembler à un onglet mais qui ne fait que la navigation.

### Code corrigé

```typescript
<TabsList>
  <TabsTrigger value="manage">Gérer mes boutiques</TabsTrigger>
  <Button  // ✅ Button au lieu de TabsTrigger
    variant="ghost"
    className="... styles similaires à TabsTrigger ..."
    onClick={handleCreateStoreRedirect}  // ✅ Navigation immédiate
  >
    Créer ma boutique
  </Button>
</TabsList>

{/* TabsContent "create" supprimé - plus nécessaire */}
```

### Avantages

1. ✅ **Pas de changement d'onglet** : Le Button ne fait pas partie du système de tabs
2. ✅ **Navigation immédiate** : Redirection directe sans affichage intermédiaire
3. ✅ **Pas de clignotement** : L'ancienne page n'est jamais affichée
4. ✅ **Style cohérent** : Le Button ressemble visuellement à un onglet

## 📝 MODIFICATIONS

### Fichier modifié : `src/pages/Store.tsx`

1. **Remplacement du TabsTrigger** (lignes 78-88)
   - Avant : `<TabsTrigger value="create" onClick={...}>`
   - Après : `<Button onClick={...}>` avec styles similaires

2. **Suppression du TabsContent "create"** (lignes 97-145)
   - Supprimé car plus accessible via un onglet
   - La création se fait maintenant uniquement via Settings

## 🎯 RÉSULTAT

- ✅ **Plus de clignotement** : Navigation fluide et immédiate
- ✅ **Expérience utilisateur améliorée** : Pas de page intermédiaire visible
- ✅ **Code plus propre** : Suppression du code inutile

## 🔄 FLUX FINAL

```
Clic sur "Créer ma boutique"
  ↓
Navigation immédiate vers /dashboard/settings?tab=store&action=create
  ↓
Affichage direct du formulaire de création dans Settings
```

**Aucun clignotement, navigation fluide !** ✨

