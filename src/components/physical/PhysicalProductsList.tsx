import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Package,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Eye,
  Trash2,
  Copy,
  Plus,
  Download,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { usePhysicalProducts } from '@/hooks/physical/usePhysicalProducts';
import { CompactStockIndicator } from './InventoryStockIndicator';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface PhysicalProduct {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  image_url?: string;
  price: number;
  currency: string;
  has_variants: boolean;
  track_inventory: boolean;
  total_quantity?: number;
  low_stock_threshold?: number;
  total_quantity_sold?: number;
  total_revenue?: number;
  is_active: boolean;
  created_at: string;
}

export interface PhysicalProductsListProps {
  storeId: string;
  onCreateProduct?: () => void;
  onEditProduct?: (productId: string) => void;
  onViewProduct?: (productId: string) => void;
  className?: string;
}

type FilterStatus = 'all' | 'active' | 'inactive' | 'low_stock' | 'out_of_stock';
type SortBy = 'name' | 'created_at' | 'price' | 'stock' | 'revenue';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PhysicalProductsList({
  storeId,
  onCreateProduct,
  onEditProduct,
  onViewProduct,
  className,
}: PhysicalProductsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<SortBy>('created_at');

  // Fetch products
  const { data: products, isLoading } = usePhysicalProducts(storeId);

  // Filter & Sort products
  const filteredProducts = React.useMemo(() => {
    if (!products) return [];

    let filtered = [...products];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.sku?.toLowerCase().includes(query) ||
          p.barcode?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter((p) => {
        switch (filterStatus) {
          case 'active':
            return p.is_active;
          case 'inactive':
            return !p.is_active;
          case 'low_stock':
            return (
              p.track_inventory &&
              p.total_quantity !== undefined &&
              p.low_stock_threshold !== undefined &&
              p.total_quantity > 0 &&
              p.total_quantity <= p.low_stock_threshold
            );
          case 'out_of_stock':
            return p.track_inventory && (p.total_quantity === 0 || p.total_quantity === undefined);
          default:
            return true;
        }
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price':
          return b.price - a.price;
        case 'stock':
          return (b.total_quantity || 0) - (a.total_quantity || 0);
        case 'revenue':
          return (b.total_revenue || 0) - (a.total_revenue || 0);
        case 'created_at':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return filtered;
  }, [products, searchQuery, filterStatus, sortBy]);

  // Stats
  const stats = React.useMemo(() => {
    if (!products) return { total: 0, active: 0, lowStock: 0, outOfStock: 0, totalRevenue: 0 };

    return {
      total: products.length,
      active: products.filter((p) => p.is_active).length,
      lowStock: products.filter(
        (p) =>
          p.track_inventory &&
          p.total_quantity !== undefined &&
          p.low_stock_threshold !== undefined &&
          p.total_quantity > 0 &&
          p.total_quantity <= p.low_stock_threshold
      ).length,
      outOfStock: products.filter((p) => p.track_inventory && (p.total_quantity === 0 || p.total_quantity === undefined)).length,
      totalRevenue: products.reduce((sum, p) => sum + (p.total_revenue || 0), 0),
    };
  }, [products]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produits</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actifs</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Faible</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.lowStock}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rupture Stock</CardTitle>
            <Package className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.outOfStock}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenu Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()} XOF</div>
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Produits Physiques</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Gérez tous vos produits physiques
            </p>
          </div>
          {onCreateProduct && (
            <Button onClick={onCreateProduct} className="gap-2">
              <Plus className="h-4 w-4" />
              Nouveau Produit
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, SKU, code-barres..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={filterStatus} onValueChange={(value: FilterStatus) => setFilterStatus(value)}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les produits</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="inactive">Inactifs</SelectItem>
                <SelectItem value="low_stock">Stock faible</SelectItem>
                <SelectItem value="out_of_stock">Rupture de stock</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(value: SortBy) => setSortBy(value)}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Date de création</SelectItem>
                <SelectItem value="name">Nom (A-Z)</SelectItem>
                <SelectItem value="price">Prix (élevé-bas)</SelectItem>
                <SelectItem value="stock">Stock disponible</SelectItem>
                <SelectItem value="revenue">Revenu</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Aucun produit trouvé</p>
              <p className="text-sm">
                {searchQuery || filterStatus !== 'all'
                  ? 'Essayez de modifier vos filtres de recherche'
                  : 'Créez votre premier produit physique'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>SKU / Code-barres</TableHead>
                    <TableHead>Prix</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Variantes</TableHead>
                    <TableHead>Ventes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      {/* Product */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="h-10 w-10 rounded object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{product.name}</p>
                            {!product.is_active && (
                              <Badge variant="secondary" className="text-xs mt-1">
                                Inactif
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* SKU / Barcode */}
                      <TableCell>
                        <div className="space-y-1">
                          {product.sku && (
                            <p className="text-sm font-mono">{product.sku}</p>
                          )}
                          {product.barcode && (
                            <p className="text-xs text-muted-foreground font-mono">
                              {product.barcode}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      {/* Price */}
                      <TableCell>
                        <span className="font-medium">
                          {product.price.toLocaleString()} {product.currency}
                        </span>
                      </TableCell>

                      {/* Stock */}
                      <TableCell>
                        {product.track_inventory ? (
                          <CompactStockIndicator
                            quantity={product.total_quantity || 0}
                            lowStockThreshold={product.low_stock_threshold || 10}
                          />
                        ) : (
                          <span className="text-sm text-muted-foreground">Non suivi</span>
                        )}
                      </TableCell>

                      {/* Variants */}
                      <TableCell>
                        {product.has_variants ? (
                          <Badge variant="outline">Oui</Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">Non</span>
                        )}
                      </TableCell>

                      {/* Sales */}
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium">
                            {product.total_quantity_sold || 0} vendus
                          </p>
                          {product.total_revenue && (
                            <p className="text-xs text-muted-foreground">
                              {product.total_revenue.toLocaleString()} XOF
                            </p>
                          )}
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => onViewProduct?.(product.id)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Voir
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onEditProduct?.(product.id)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="h-4 w-4 mr-2" />
                              Dupliquer
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Export Button */}
          {filteredProducts.length > 0 && (
            <div className="flex justify-end">
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Exporter ({filteredProducts.length} produits)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


