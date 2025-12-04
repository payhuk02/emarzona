# Guide des Tables Responsives - Plateforme Emarzona

**Date**: 4 décembre 2025  
**Objectif**: Guide pour créer et optimiser des tables avec beaucoup de colonnes (>5) pour mobile et desktop.

---

## 📋 Vue d'Ensemble

Les tables avec plus de 5 colonnes posent des problèmes de lisibilité sur mobile. Ce guide explique comment utiliser le composant `ResponsiveTable` pour créer des tables qui s'adaptent automatiquement.

---

## 🎯 Quand Utiliser ResponsiveTable

### ✅ Utiliser ResponsiveTable si :
- Table avec **plus de 5 colonnes**
- Table avec colonnes larges (texte long, dates, montants)
- Table qui doit être lisible sur mobile
- Table avec données complexes

### ❌ Ne pas utiliser si :
- Table simple avec ≤5 colonnes
- Table déjà optimisée avec vue mobile séparée
- Table avec scroll horizontal acceptable

---

## 📦 Composant ResponsiveTable

**Fichier**: `src/components/admin/ResponsiveTable.tsx`

### Props
```typescript
interface ResponsiveTableProps {
  headers: ReactNode[];           // En-têtes de colonnes
  rows: ReactNode[][];            // Données (tableau de tableaux)
  renderMobileCard?: (cells: ReactNode[], index: number) => ReactNode;
  emptyMessage?: ReactNode;        // Message si aucune donnée
  className?: string;
}
```

---

## 💡 Exemples d'Utilisation

### Exemple 1: Table Simple

```tsx
import { ResponsiveTable } from '@/components/admin/ResponsiveTable';

<ResponsiveTable
  headers={['Nom', 'Email', 'Rôle', 'Statut', 'Date', 'Actions']}
  rows={users.map(user => [
    user.name,
    user.email,
    <Badge>{user.role}</Badge>,
    <Badge variant={user.active ? 'default' : 'secondary'}>
      {user.active ? 'Actif' : 'Inactif'}
    </Badge>,
    format(new Date(user.created_at), 'dd MMM yyyy'),
    <Button size="sm">Voir</Button>
  ])}
/>
```

### Exemple 2: Table avec Rendu Mobile Personnalisé

```tsx
<ResponsiveTable
  headers={['Affilié', 'Code', 'Produit', 'Clics', 'Ventes', 'CA', 'Commission', 'Statut']}
  rows={links.map(link => [
    link.affiliate?.display_name,
    link.affiliate?.affiliate_code,
    link.product?.name,
    link.total_clicks,
    link.total_sales,
    formatCurrency(link.total_revenue),
    formatCurrency(link.total_commission),
    <Badge>{link.status}</Badge>
  ])}
  renderMobileCard={(cells, index) => (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold">{cells[0]}</h3>
              <p className="text-sm text-muted-foreground">Code: {cells[1]}</p>
            </div>
            {cells[7]} {/* Statut badge */}
          </div>
          
          <div className="grid grid-cols-2 gap-3 pt-3 border-t">
            <div>
              <p className="text-xs text-muted-foreground">Clics</p>
              <p className="text-sm font-semibold">{cells[3]}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ventes</p>
              <p className="text-sm font-semibold">{cells[4]}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">CA</p>
              <p className="text-sm font-semibold">{cells[5]}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Commission</p>
              <p className="text-sm font-semibold">{cells[6]}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )}
/>
```

---

## 🎨 Bonnes Pratiques

### 1. Ordre des Colonnes
- **Colonnes importantes en premier** (Nom, ID, Statut)
- **Colonnes d'actions en dernier**
- **Colonnes secondaires au milieu**

### 2. Rendu Mobile
- **Utiliser `renderMobileCard`** pour un rendu personnalisé
- **Grouper les informations** par catégorie
- **Utiliser des grilles** pour les métriques (grid-cols-2)

### 3. Typographie
- **Textes courts** sur mobile
- **Truncate** pour les textes longs
- **Badges** pour les statuts

### 4. Espacement
- **Padding responsive**: `p-4 sm:p-5`
- **Gap responsive**: `gap-3 sm:gap-4`
- **Marges cohérentes**

---

## 🔄 Migration depuis Table Standard

### Avant (Table standard)
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Colonne 1</TableHead>
      <TableHead>Colonne 2</TableHead>
      {/* ... 6+ colonnes */}
    </TableRow>
  </TableHeader>
  <TableBody>
    {data.map(item => (
      <TableRow>
        <TableCell>{item.col1}</TableCell>
        <TableCell>{item.col2}</TableCell>
        {/* ... */}
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### Après (ResponsiveTable)
```tsx
<ResponsiveTable
  headers={['Colonne 1', 'Colonne 2', /* ... */]}
  rows={data.map(item => [
    item.col1,
    item.col2,
    /* ... */
  ])}
  renderMobileCard={(cells, index) => (
    <Card>
      <CardContent>
        {/* Rendu personnalisé */}
      </CardContent>
    </Card>
  )}
/>
```

---

## 📱 Breakpoints

- **Desktop**: `lg:block` (≥1024px) - Table standard
- **Mobile/Tablette**: `lg:hidden` (<1024px) - Cartes

---

## ✅ Checklist

Avant de créer une table, vérifier :

- [ ] Nombre de colonnes > 5 ?
- [ ] Table lisible sur mobile ?
- [ ] Rendu mobile personnalisé nécessaire ?
- [ ] Typographie responsive ?
- [ ] Touch targets optimaux (44px) ?
- [ ] Overflow géré ?

---

## 🔗 Références

- `src/components/admin/ResponsiveTable.tsx` - Composant source
- `src/pages/StoreAffiliates.tsx` - Exemple d'utilisation
- `docs/audits/AUDIT_COMPLET_PLATEFORME_2025.md` - Audit complet

---

**Maintenu par**: Équipe de développement Emarzona  
**Dernière mise à jour**: 4 décembre 2025

