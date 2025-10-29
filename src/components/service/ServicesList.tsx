import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Copy,
  Calendar,
  Users,
  DollarSign,
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Download,
  Plus,
  RefreshCw,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ServiceStatusIndicator, ServiceStatus } from './ServiceStatusIndicator';

/**
 * Service complet avec toutes les informations
 */
export interface Service {
  id: string;
  name: string;
  category: string;
  status: ServiceStatus;
  duration: number; // en minutes
  price: number;
  currency?: string;
  availableSlots?: number;
  totalSlots?: number;
  bookingsCount?: number;
  revenue?: number;
  averageRating?: number;
  assignedStaff?: string[];
  createdAt: Date | string;
  updatedAt?: Date | string;
  isActive: boolean;
  bookingTrend?: 'up' | 'down' | 'stable';
}

/**
 * Filtres disponibles
 */
export interface ServicesFilters {
  search?: string;
  status?: ServiceStatus | 'all';
  category?: string | 'all';
  staff?: string | 'all';
  priceRange?: {
    min?: number;
    max?: number;
  };
  sortBy?: 'name' | 'price' | 'bookings' | 'revenue' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Props pour ServicesList
 */
export interface ServicesListProps {
  /** Liste des services */
  services: Service[];
  
  /** Callback lors de la sélection d'un service */
  onServiceSelect?: (service: Service) => void;
  
  /** Callback pour éditer un service */
  onEdit?: (service: Service) => void;
  
  /** Callback pour supprimer un service */
  onDelete?: (service: Service) => void;
  
  /** Callback pour dupliquer un service */
  onDuplicate?: (service: Service) => void;
  
  /** Callback pour voir les détails */
  onView?: (service: Service) => void;
  
  /** Callback pour actions groupées */
  onBulkAction?: (action: string, selectedIds: string[]) => void;
  
  /** Afficher la sélection multiple */
  enableSelection?: boolean;
  
  /** Afficher les stats */
  showStats?: boolean;
  
  /** Mode d'affichage */
  viewMode?: 'grid' | 'list';
  
  /** Catégories disponibles (pour filtres) */
  categories?: string[];
  
  /** Staff disponible (pour filtres) */
  staffMembers?: string[];
  
  /** Classe CSS personnalisée */
  className?: string;
  
  /** Loading state */
  isLoading?: boolean;
  
  /** Callback pour refresh */
  onRefresh?: () => void;
  
  /** Callback pour créer un nouveau service */
  onCreate?: () => void;
}

/**
 * ServicesList - Composant de liste complète de services avec filtres et actions
 * 
 * @example
 * ```tsx
 * <ServicesList 
 *   services={services}
 *   onEdit={(service) => console.log('Edit', service)}
 *   onDelete={(service) => console.log('Delete', service)}
 *   enableSelection={true}
 *   showStats={true}
 *   categories={['Coaching', 'Consultation', 'Formation']}
 *   staffMembers={['Dr. Martin', 'Sophie Laurent']}
 * />
 * ```
 */
export const ServicesList: React.FC<ServicesListProps> = ({
  services,
  onServiceSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onView,
  onBulkAction,
  enableSelection = false,
  showStats = true,
  viewMode: initialViewMode = 'list',
  categories = [],
  staffMembers = [],
  className,
  isLoading = false,
  onRefresh,
  onCreate,
}) => {
  // États
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(initialViewMode);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<ServicesFilters>({
    search: '',
    status: 'all',
    category: 'all',
    staff: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // Filtrage et tri
  const filteredServices = useMemo(() => {
    let result = [...services];

    // Search
    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(
        (service) =>
          service.name.toLowerCase().includes(search) ||
          service.category.toLowerCase().includes(search)
      );
    }

    // Status filter
    if (filters.status && filters.status !== 'all') {
      result = result.filter((service) => service.status === filters.status);
    }

    // Category filter
    if (filters.category && filters.category !== 'all') {
      result = result.filter((service) => service.category === filters.category);
    }

    // Staff filter
    if (filters.staff && filters.staff !== 'all') {
      result = result.filter((service) =>
        service.assignedStaff?.includes(filters.staff!)
      );
    }

    // Price range filter
    if (filters.priceRange) {
      if (filters.priceRange.min !== undefined) {
        result = result.filter((service) => service.price >= filters.priceRange!.min!);
      }
      if (filters.priceRange.max !== undefined) {
        result = result.filter((service) => service.price <= filters.priceRange!.max!);
      }
    }

    // Sorting
    if (filters.sortBy) {
      result.sort((a, b) => {
        let aValue: any = a[filters.sortBy!];
        let bValue: any = b[filters.sortBy!];

        // Handle dates
        if (filters.sortBy === 'createdAt' || filters.sortBy === 'updatedAt') {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        }

        if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [services, filters]);

  // Stats globales
  const stats = useMemo(() => {
    return {
      total: services.length,
      active: services.filter((s) => s.isActive).length,
      totalBookings: services.reduce((sum, s) => sum + (s.bookingsCount || 0), 0),
      totalRevenue: services.reduce((sum, s) => sum + (s.revenue || 0), 0),
      averagePrice: services.length > 0
        ? services.reduce((sum, s) => sum + s.price, 0) / services.length
        : 0,
    };
  }, [services]);

  // Sélection
  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredServices.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredServices.map((s) => s.id)));
    }
  };

  // Toggle sort
  const toggleSort = (field: ServicesFilters['sortBy']) => {
    if (filters.sortBy === field) {
      setFilters({
        ...filters,
        sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc',
      });
    } else {
      setFilters({
        ...filters,
        sortBy: field,
        sortOrder: 'asc',
      });
    }
  };

  // Render stats bar
  const renderStats = () => {
    if (!showStats) return null;

    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-muted/50 rounded-lg">
        <div>
          <p className="text-xs text-muted-foreground">Total services</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Actifs</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Réservations</p>
          <p className="text-2xl font-bold">{stats.totalBookings}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Revenue total</p>
          <p className="text-2xl font-bold">
            {stats.totalRevenue.toLocaleString()} EUR
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Prix moyen</p>
          <p className="text-2xl font-bold">
            {Math.round(stats.averagePrice)} EUR
          </p>
        </div>
      </div>
    );
  };

  // Render single service card
  const renderServiceCard = (service: Service) => {
    const isSelected = selectedIds.has(service.id);

    return (
      <Card
        key={service.id}
        className={cn(
          'p-4 hover:shadow-md transition-shadow cursor-pointer',
          isSelected && 'ring-2 ring-primary'
        )}
        onClick={() => onServiceSelect?.(service)}
      >
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              {enableSelection && (
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleSelection(service.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-base">{service.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {service.category}
                  </Badge>
                  {service.assignedStaff && service.assignedStaff.length > 0 && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {service.assignedStaff.length}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onView && (
                  <DropdownMenuItem onClick={() => onView(service)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Voir détails
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(service)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </DropdownMenuItem>
                )}
                {onDuplicate && (
                  <DropdownMenuItem onClick={() => onDuplicate(service)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Dupliquer
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(service)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Status */}
          <ServiceStatusIndicator
            status={service.status}
            availableSlots={service.availableSlots}
            totalSlots={service.totalSlots}
            variant="compact"
          />

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3 text-muted-foreground" />
              <span className="font-medium">{service.price} EUR</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span>{service.duration}min</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span>{service.bookingsCount || 0}</span>
            </div>
          </div>

          {/* Trend & Revenue */}
          {(service.bookingTrend || service.revenue) && (
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
              {service.bookingTrend && (
                <div className="flex items-center gap-1">
                  {service.bookingTrend === 'up' && (
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  )}
                  {service.bookingTrend === 'down' && (
                    <TrendingDown className="h-3 w-3 text-red-600" />
                  )}
                  <span>Tendance</span>
                </div>
              )}
              {service.revenue && (
                <span className="font-medium">{service.revenue} EUR revenue</span>
              )}
            </div>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un service..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <Select
            value={filters.status || 'all'}
            onValueChange={(value) =>
              setFilters({ ...filters, status: value as any })
            }
          >
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              <SelectItem value="available">Disponible</SelectItem>
              <SelectItem value="booked">Réservé</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
            </SelectContent>
          </Select>

          {categories.length > 0 && (
            <Select
              value={filters.category || 'all'}
              onValueChange={(value) =>
                setFilters({ ...filters, category: value })
              }
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {staffMembers.length > 0 && (
            <Select
              value={filters.staff || 'all'}
              onValueChange={(value) => setFilters({ ...filters, staff: value })}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Staff" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {staffMembers.map((staff) => (
                  <SelectItem key={staff} value={staff}>
                    {staff}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            </Button>
          )}
          {onCreate && (
            <Button size="sm" onClick={onCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      {renderStats()}

      {/* Bulk actions */}
      {enableSelection && selectedIds.size > 0 && (
        <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
          <p className="text-sm font-medium">
            {selectedIds.size} service(s) sélectionné(s)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBulkAction?.('export', Array.from(selectedIds))}
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBulkAction?.('delete', Array.from(selectedIds))}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
          </div>
        </div>
      )}

      {/* Results header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredServices.length} résultat(s)
        </p>
        <div className="flex items-center gap-2">
          {enableSelection && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSelectAll}
              className="text-xs"
            >
              {selectedIds.size === filteredServices.length
                ? 'Désélectionner tout'
                : 'Sélectionner tout'}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSort('name')}
            className="text-xs"
          >
            <ArrowUpDown className="h-3 w-3 mr-1" />
            Nom
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSort('price')}
            className="text-xs"
          >
            <ArrowUpDown className="h-3 w-3 mr-1" />
            Prix
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSort('bookings')}
            className="text-xs"
          >
            <ArrowUpDown className="h-3 w-3 mr-1" />
            Réservations
          </Button>
        </div>
      </div>

      {/* Services list */}
      {isLoading ? (
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground mt-2">Chargement...</p>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Aucun service trouvé</p>
        </div>
      ) : (
        <div
          className={cn(
            viewMode === 'grid'
              ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-3'
          )}
        >
          {filteredServices.map((service) => renderServiceCard(service))}
        </div>
      )}
    </div>
  );
};

ServicesList.displayName = 'ServicesList';

export default ServicesList;

