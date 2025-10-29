import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Search,
  Filter,
  Download,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Copy,
  Archive,
  CheckCircle2,
  XCircle,
  ChevronUp,
  ChevronDown,
  Package,
  DollarSign,
  Users,
  TrendingUp,
  Key,
  Shield,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DigitalProductStatusIndicator, DigitalProductStatus } from './DigitalProductStatusIndicator';

/**
 * Catégories de produits digitaux
 */
export type DigitalCategory =
  | 'ebook'
  | 'template'
  | 'software'
  | 'course'
  | 'plugin'
  | 'theme'
  | 'audio'
  | 'video'
  | 'other';

/**
 * Champs de tri disponibles
 */
export type DigitalSortField =
  | 'name'
  | 'price'
  | 'downloads'
  | 'revenue'
  | 'created_at'
  | 'updated_at';

/**
 * Direction du tri
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Élément de la liste de produits digitaux
 */
export interface DigitalProductListItem {
  id: string;
  name: string;
  description?: string;
  category: DigitalCategory;
  status: DigitalProductStatus;
  price: number;
  currency?: string;
  totalDownloads: number;
  recentDownloads?: number;
  revenue: number;
  activeLicenses: number;
  totalLicenses?: number;
  protectionLevel: 'basic' | 'standard' | 'advanced';
  version?: string;
  fileSize: number; // en MB
  fileType: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
  thumbnail?: string;
}

/**
 * Props pour DigitalProductsList
 */
export interface DigitalProductsListProps {
  /** Liste des produits digitaux */
  products: DigitalProductListItem[];
  
  /** Callback lors de la sélection d'un produit */
  onSelect?: (productIds: string[]) => void;
  
  /** Callback lors de l'édition d'un produit */
  onEdit?: (productId: string) => void;
  
  /** Callback lors de la suppression d'un produit */
  onDelete?: (productId: string) => void;
  
  /** Callback lors de la duplication d'un produit */
  onDuplicate?: (productId: string) => void;
  
  /** Callback lors de l'archivage d'un produit */
  onArchive?: (productId: string) => void;
  
  /** Callback lors de la visualisation d'un produit */
  onView?: (productId: string) => void;
  
  /** Afficher les actions par lot */
  showBulkActions?: boolean;
  
  /** Afficher les filtres */
  showFilters?: boolean;
  
  /** Afficher la recherche */
  showSearch?: boolean;
  
  /** Classe CSS personnalisée */
  className?: string;
  
  /** Nombre d'éléments par page */
  pageSize?: number;
}

/**
 * Configuration des catégories
 */
const CATEGORY_CONFIG: Record<DigitalCategory, { label: string; color: string }> = {
  ebook: { label: 'Ebook', color: 'text-blue-600' },
  template: { label: 'Template', color: 'text-purple-600' },
  software: { label: 'Logiciel', color: 'text-green-600' },
  course: { label: 'Formation', color: 'text-orange-600' },
  plugin: { label: 'Plugin', color: 'text-pink-600' },
  theme: { label: 'Thème', color: 'text-indigo-600' },
  audio: { label: 'Audio', color: 'text-yellow-600' },
  video: { label: 'Vidéo', color: 'text-red-600' },
  other: { label: 'Autre', color: 'text-gray-600' },
};

/**
 * DigitalProductsList - Liste de produits digitaux avec filtres et actions
 * 
 * @example
 * ```tsx
 * <DigitalProductsList 
 *   products={digitalProducts}
 *   onEdit={(id) => console.log('Edit:', id)}
 *   onDelete={(id) => console.log('Delete:', id)}
 *   showBulkActions={true}
 *   showFilters={true}
 *   showSearch={true}
 * />
 * ```
 */
export const DigitalProductsList: React.FC<DigitalProductsListProps> = ({
  products,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onArchive,
  onView,
  showBulkActions = true,
  showFilters = true,
  showSearch = true,
  className,
  pageSize = 10,
}) => {
  // États
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DigitalCategory | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<DigitalProductStatus | 'all'>('all');
  const [sortField, setSortField] = useState<DigitalSortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  // Formater la taille de fichier
  const formatFileSize = (mb: number) => {
    if (mb < 1) return `${(mb * 1024).toFixed(0)} KB`;
    if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${mb.toFixed(1)} MB`;
  };

  // Formater la date
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Filtrer et trier les produits
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // Recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.id.toLowerCase().includes(query)
      );
    }

    // Filtre catégorie
    if (selectedCategory !== 'all') {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // Filtre statut
    if (selectedStatus !== 'all') {
      result = result.filter((p) => p.status === selectedStatus);
    }

    // Tri
    result.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Convertir les dates en timestamps
      if (sortField === 'created_at' || sortField === 'updated_at') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return result;
  }, [products, searchQuery, selectedCategory, selectedStatus, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedProducts.length / pageSize);
  const paginatedProducts = filteredAndSortedProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Gestion de la sélection
  const toggleSelection = (productId: string) => {
    const newSelection = new Set(selectedProducts);
    if (newSelection.has(productId)) {
      newSelection.delete(productId);
    } else {
      newSelection.add(productId);
    }
    setSelectedProducts(newSelection);
    onSelect?.(Array.from(newSelection));
  };

  const toggleSelectAll = () => {
    if (selectedProducts.size === paginatedProducts.length) {
      setSelectedProducts(new Set());
      onSelect?.([]);
    } else {
      const allIds = new Set(paginatedProducts.map((p) => p.id));
      setSelectedProducts(allIds);
      onSelect?.(Array.from(allIds));
    }
  };

  // Gestion du tri
  const handleSort = (field: DigitalSortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: DigitalSortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4 ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 ml-1" />
    );
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header avec recherche et filtres */}
      <Card className="p-4">
        <div className="space-y-4">
          {/* Barre de recherche */}
          {showSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, description ou ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          )}

          {/* Filtres */}
          {showFilters && (
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filtres:</span>
              </div>

              {/* Filtre catégorie */}
              <Select
                value={selectedCategory}
                onValueChange={(value) => setSelectedCategory(value as DigitalCategory | 'all')}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Filtre statut */}
              <Select
                value={selectedStatus}
                onValueChange={(value) => setSelectedStatus(value as DigitalProductStatus | 'all')}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="published">Publié</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="archived">Archivé</SelectItem>
                  <SelectItem value="suspended">Suspendu</SelectItem>
                </SelectContent>
              </Select>

              {/* Réinitialiser les filtres */}
              {(selectedCategory !== 'all' || selectedStatus !== 'all' || searchQuery) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedStatus('all');
                  }}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Réinitialiser
                </Button>
              )}
            </div>
          )}

          {/* Actions par lot */}
          {showBulkActions && selectedProducts.size > 0 && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-700">
                {selectedProducts.size} produit{selectedProducts.size > 1 ? 's' : ''} sélectionné{selectedProducts.size > 1 ? 's' : ''}
              </span>
              <div className="ml-auto flex gap-2">
                <Button size="sm" variant="outline">
                  <Archive className="h-4 w-4 mr-2" />
                  Archiver
                </Button>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Exporter
                </Button>
                <Button size="sm" variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              {/* Checkbox tout sélectionner */}
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    paginatedProducts.length > 0 &&
                    selectedProducts.size === paginatedProducts.length
                  }
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>

              {/* Colonnes triables */}
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('name')}
                  className="flex items-center"
                >
                  Produit
                  <SortIcon field="name" />
                </Button>
              </TableHead>

              <TableHead>Catégorie</TableHead>

              <TableHead>Statut</TableHead>

              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('price')}
                  className="flex items-center"
                >
                  Prix
                  <SortIcon field="price" />
                </Button>
              </TableHead>

              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('downloads')}
                  className="flex items-center"
                >
                  Téléchargements
                  <SortIcon field="downloads" />
                </Button>
              </TableHead>

              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('revenue')}
                  className="flex items-center"
                >
                  Revenue
                  <SortIcon field="revenue" />
                </Button>
              </TableHead>

              <TableHead>Licences</TableHead>

              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('created_at')}
                  className="flex items-center"
                >
                  Date création
                  <SortIcon field="created_at" />
                </Button>
              </TableHead>

              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Package className="h-12 w-12 opacity-50" />
                    <p className="text-lg font-medium">Aucun produit trouvé</p>
                    <p className="text-sm">Modifiez vos filtres ou créez un nouveau produit</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedProducts.map((product) => (
                <TableRow key={product.id}>
                  {/* Checkbox sélection */}
                  <TableCell>
                    <Checkbox
                      checked={selectedProducts.has(product.id)}
                      onCheckedChange={() => toggleSelection(product.id)}
                    />
                  </TableCell>

                  {/* Produit */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {product.thumbnail ? (
                        <img
                          src={product.thumbnail}
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
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {product.version && <span>v{product.version}</span>}
                          {product.version && <span>•</span>}
                          <span>{product.fileType}</span>
                          <span>•</span>
                          <span>{formatFileSize(product.fileSize)}</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  {/* Catégorie */}
                  <TableCell>
                    <Badge variant="outline" className={CATEGORY_CONFIG[product.category].color}>
                      {CATEGORY_CONFIG[product.category].label}
                    </Badge>
                  </TableCell>

                  {/* Statut */}
                  <TableCell>
                    <DigitalProductStatusIndicator
                      status={product.status}
                      variant="compact"
                      totalDownloads={product.totalDownloads}
                    />
                  </TableCell>

                  {/* Prix */}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="font-medium">
                        {product.price} {product.currency || 'EUR'}
                      </span>
                    </div>
                  </TableCell>

                  {/* Téléchargements */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Download className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">{product.totalDownloads.toLocaleString()}</span>
                      {product.recentDownloads !== undefined && (
                        <Badge variant="secondary" className="text-xs">
                          +{product.recentDownloads}
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  {/* Revenue */}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="font-semibold text-green-600">
                        {product.revenue.toLocaleString()} {product.currency || 'EUR'}
                      </span>
                    </div>
                  </TableCell>

                  {/* Licences */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-purple-600" />
                      <span>
                        {product.activeLicenses}
                        {product.totalLicenses && `/${product.totalLicenses}`}
                      </span>
                      {product.totalLicenses && (
                        <>
                          {product.activeLicenses / product.totalLicenses > 0.9 && (
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>

                  {/* Date */}
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(product.createdAt)}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onView && (
                          <DropdownMenuItem onClick={() => onView(product.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Voir
                          </DropdownMenuItem>
                        )}
                        {onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(product.id)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Éditer
                          </DropdownMenuItem>
                        )}
                        {onDuplicate && (
                          <DropdownMenuItem onClick={() => onDuplicate(product.id)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Dupliquer
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {onArchive && (
                          <DropdownMenuItem onClick={() => onArchive(product.id)}>
                            <Archive className="h-4 w-4 mr-2" />
                            Archiver
                          </DropdownMenuItem>
                        )}
                        {onDelete && (
                          <DropdownMenuItem
                            onClick={() => onDelete(product.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t p-4">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} sur {totalPages} • {filteredAndSortedProducts.length} produit{filteredAndSortedProducts.length > 1 ? 's' : ''}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Résumé statistiques */}
      <Card className="p-4">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total produits</p>
              <p className="text-xl font-bold">{filteredAndSortedProducts.length}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-50">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Revenue total</p>
              <p className="text-xl font-bold text-green-600">
                {filteredAndSortedProducts
                  .reduce((sum, p) => sum + p.revenue, 0)
                  .toLocaleString()}{' '}
                EUR
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-50">
              <Download className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Téléchargements</p>
              <p className="text-xl font-bold">
                {filteredAndSortedProducts
                  .reduce((sum, p) => sum + p.totalDownloads, 0)
                  .toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-50">
              <Users className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Licences actives</p>
              <p className="text-xl font-bold">
                {filteredAndSortedProducts.reduce((sum, p) => sum + p.activeLicenses, 0)}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

DigitalProductsList.displayName = 'DigitalProductsList';

export default DigitalProductsList;

