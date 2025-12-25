# Système de Navigation Professionnel

## Vue d'ensemble

Le système de navigation a été conçu pour offrir une expérience utilisateur professionnelle inspirée des grandes plateformes (Notion, Linear, Stripe Dashboard, Systeme.io). Il comprend :

1. **TopNavigationBar** - Barre de navigation horizontale principale en haut
2. **Sidebars contextuelles** - Sidebars verticales spécifiques à chaque section
3. **ContextualNavBar** - Barres de navigation horizontales contextuelles (optionnel)
4. **MainLayout** - Layout unifié qui détecte automatiquement la sidebar appropriée

## Architecture

### Structure des Sidebars

Chaque section principale avec sous-éléments a sa propre sidebar :

- **SettingsSidebar** - Pour `/dashboard/settings`
- **ProductsSidebar** - Pour `/dashboard/products` et sections produits
- **SalesSidebar** - Pour `/dashboard/orders` et sections ventes/logistique
- **FinanceSidebar** - Pour `/dashboard/payments` et sections finance
- **MarketingSidebar** - Pour `/dashboard/customers` et sections marketing
- **EmailsSidebar** - Pour `/dashboard/emails/*`
- **AnalyticsSidebar** - Pour `/dashboard/analytics` et sections analytics
- **SystemsSidebar** - Pour `/dashboard/integrations` et sections systèmes
- **AccountSidebar** - Pour `/account/*`
- **OrdersSidebar** - Pour `/dashboard/orders`
- **CustomersSidebar** - Pour `/dashboard/customers`

### Détection Automatique

Le `MainLayout` détecte automatiquement quelle sidebar afficher selon la route :

```typescript
const detectLayoutType = (pathname: string): LayoutType => {
  if (pathname.includes('/settings')) return 'settings';
  if (pathname.includes('/emails')) return 'emails';
  if (pathname.includes('/products') || pathname.includes('/digital-products')) return 'products';
  // ... etc
};
```

## Caractéristiques

### Design Professionnel

- **Groupes organisés** : Les items de navigation sont organisés en groupes logiques avec des titres de section
- **Breadcrumbs** : Chaque sidebar affiche un breadcrumb pour la navigation contextuelle
- **États actifs** : Mise en évidence claire de l'élément actif avec couleurs primaires
- **Hover states** : Transitions fluides au survol
- **Responsive** : Sidebars masquées sur mobile, affichées sur desktop (lg:block)

### Structure Standardisée

Chaque sidebar suit cette structure :

```typescript
<aside className="hidden lg:block fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] border-r bg-background overflow-y-auto z-40">
  <div className="p-4 space-y-6">
    {/* Breadcrumb */}
    <Breadcrumb items={breadcrumbItems} />

    {/* Navigation par groupes */}
    <nav className="space-y-6">
      {navGroups.map((group) => (
        <div className="space-y-2">
          <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {group.label}
          </h3>
          <div className="space-y-1">
            {group.items.map((item) => (
              <NavLink ... />
            ))}
          </div>
        </div>
      ))}
    </nav>
  </div>
</aside>
```

## Utilisation

### Dans une Page

Pour utiliser le système, enveloppez simplement votre contenu dans `MainLayout` :

```typescript
import { MainLayout } from '@/components/layout';

export const MyPage = () => {
  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        {/* Votre contenu */}
      </div>
    </MainLayout>
  );
};
```

Le layout détectera automatiquement la sidebar appropriée selon la route.

### Layout Type Explicite

Vous pouvez aussi spécifier explicitement le type de layout :

```typescript
<MainLayout layoutType="products">
  {/* Contenu */}
</MainLayout>
```

## Barre de Navigation Horizontale Contextuelle

Pour ajouter une barre de navigation horizontale contextuelle (comme dans les grandes plateformes), utilisez `ContextualNavBar` :

```typescript
import { ContextualNavBar } from '@/components/layout';
import { Package, Plus, Download } from 'lucide-react';

const navItems = [
  { label: 'Tous les produits', path: '/dashboard/products', icon: Package },
  { label: 'Créer', path: '/dashboard/products/new', icon: Plus },
  { label: 'Digitaux', path: '/dashboard/digital-products', icon: Download },
];

<ContextualNavBar
  title="Produits"
  items={navItems}
  basePath="/dashboard/products"
/>
```

## Sections avec Sidebars

### Produits & Cours
- Produits
- Mes Cours
- Produits Digitaux
- Mes Téléchargements
- Mes Licences
- Bundles Produits
- Analytics Digitaux
- Mises à jour Digitales

### Ventes & Logistique
- Commandes & Clients (7 items)
- Services & Réservations (5 items)
- Logistique & Inventaire (6 items)
- Optimisation (3 items)
- Produits Physiques (8 items)

### Finance & Paiements
- Paiements
- Solde à Payer
- Gestion Paiements

### Marketing & Croissance
- Clients & Promotions (2 items)
- Email Marketing (6 items)
- Croissance (3 items)

### Analytics & SEO
- Statistiques
- Mes Pixels
- Mon SEO

### Systèmes & Intégrations
- Intégrations (1 item)
- Webhooks (3 items)
- Programmes (2 items)

## Améliorations Futures

- [ ] Ajouter des badges de notification sur les items de navigation
- [ ] Implémenter la recherche dans les sidebars
- [ ] Ajouter des raccourcis clavier pour la navigation
- [ ] Créer des animations de transition entre sections
- [ ] Ajouter des tooltips informatifs sur les items

## Notes Techniques

- Les sidebars sont fixes (`fixed`) et positionnées à `left-0 top-16`
- Largeur standard : `w-64` (256px)
- Hauteur : `h-[calc(100vh-4rem)]` (hauteur de viewport moins la top bar)
- Z-index : `z-40` pour être au-dessus du contenu mais sous les modals
- Le contenu principal a une marge gauche de `lg:ml-64` sur desktop pour compenser la sidebar fixe

