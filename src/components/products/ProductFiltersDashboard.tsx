import { Search, SlidersHorizontal, Filter, X, Grid3X3, List, BarChart3 } from "lucide-react";
import { Command } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

interface ProductFiltersDashboardProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  productType: string;
  onProductTypeChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  stockStatus?: string;
  onStockStatusChange?: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  categories: string[];
  productTypes: string[];
  viewMode?: "grid" | "list";
  onViewModeChange?: (mode: "grid" | "list") => void;
  totalProducts?: number;
  activeProducts?: number;
}

const ProductFiltersDashboard = ({
  searchQuery,
  onSearchChange,
  category,
  onCategoryChange,
  productType,
  onProductTypeChange,
  status,
  onStatusChange,
  stockStatus = "all",
  onStockStatusChange,
  sortBy,
  onSortByChange,
  categories,
  productTypes,
  viewMode = "grid",
  onViewModeChange,
  totalProducts = 0,
  activeProducts = 0,
}: ProductFiltersDashboardProps) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const hasFilters = category !== "all" || productType !== "all" || status !== "all" || stockStatus !== "all" || searchQuery;

  const clearFilters = () => {
    onCategoryChange("all");
    onProductTypeChange("all");
    onStatusChange("all");
    onStockStatusChange?.("all");
    onSearchChange("");
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (category !== "all") count++;
    if (productType !== "all") count++;
    if (status !== "all") count++;
    if (stockStatus !== "all") count++;
    if (searchQuery) count++;
    return count;
  };

  const sortOptions = [
    { value: "recent", label: "Plus récents" },
    { value: "oldest", label: "Plus anciens" },
    { value: "name-asc", label: "Nom (A-Z)" },
    { value: "name-desc", label: "Nom (Z-A)" },
    { value: "price-asc", label: "Prix croissant" },
    { value: "price-desc", label: "Prix décroissant" },
    { value: "popular", label: "Plus populaires" },
    { value: "rating", label: "Meilleures notes" },
  ];

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Statistiques rapides avec design amélioré */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 bg-card/30 rounded-lg border border-border/30 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <span className="text-xs sm:text-sm font-medium text-foreground">
              {totalProducts} produit{totalProducts > 1 ? "s" : ""} total
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs sm:text-sm text-muted-foreground">
              {activeProducts} actif{activeProducts > 1 ? "s" : ""}
            </span>
          </div>
        </div>
        
        {onViewModeChange && (
          <div className="flex items-center gap-1 border border-border/50 rounded-lg p-1 bg-background/50">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("grid")}
              className="h-7 sm:h-8 w-7 sm:w-8 p-0 transition-all duration-200 hover:scale-110"
              aria-label="Vue en grille"
            >
              <Grid3X3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("list")}
              className="h-7 sm:h-8 w-7 sm:w-8 p-0 transition-all duration-200 hover:scale-110"
              aria-label="Vue en liste"
            >
              <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Barre de recherche et filtres avec design amélioré */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher un produit..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-9 h-9 sm:h-10 bg-background/50 border-border/50 focus:bg-background focus:border-primary/50 transition-all duration-200"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSearchChange("")}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-accent/50 transition-all duration-200"
              aria-label="Effacer la recherche"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className="relative h-9 sm:h-10 hover:bg-accent/50 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <SlidersHorizontal className="h-4 w-4 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">Filtres</span>
              <span className="sm:hidden">Filtres</span>
              {hasFilters && (
                <Badge variant="secondary" className="ml-1.5 sm:ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] font-semibold animate-in zoom-in-95 duration-200">
                  {getActiveFiltersCount()}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[calc(100vw-2rem)] sm:w-80 max-w-[320px] sm:max-w-none" align="end" sideOffset={8}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filtres
                </h4>
                {hasFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-xs"
                  >
                    Réinitialiser
                  </Button>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Statut</Label>
                  <Select value={status} onValueChange={onStatusChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les statuts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="active">Actifs uniquement</SelectItem>
                      <SelectItem value="inactive">Inactifs uniquement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Catégorie</Label>
                  <Select value={category} onValueChange={onCategoryChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes les catégories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les catégories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Type de produit</Label>
                  <Select value={productType} onValueChange={onProductTypeChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      {productTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {onStockStatusChange && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">État du stock</Label>
                    <Select value={stockStatus} onValueChange={onStockStatusChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tous les stocks" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les stocks</SelectItem>
                        <SelectItem value="in_stock">En stock</SelectItem>
                        <SelectItem value="low_stock">Stock faible</SelectItem>
                        <SelectItem value="out_of_stock">Rupture de stock</SelectItem>
                        <SelectItem value="needs_restock">Nécessite réapprovisionnement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {hasFilters && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Filtres actifs</Label>
                    <div className="flex flex-wrap gap-2">
                      {searchQuery && (
                        <Badge variant="secondary" className="text-xs">
                          Recherche: {searchQuery}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onSearchChange("")}
                            className="ml-1 h-4 w-4 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      )}
                      {category !== "all" && (
                        <Badge variant="secondary" className="text-xs">
                          Catégorie: {category}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onCategoryChange("all")}
                            className="ml-1 h-4 w-4 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      )}
                      {productType !== "all" && (
                        <Badge variant="secondary" className="text-xs">
                          Type: {productType}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onProductTypeChange("all")}
                            className="ml-1 h-4 w-4 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      )}
                      {status !== "all" && (
                        <Badge variant="secondary" className="text-xs">
                          Statut: {status === "active" ? "Actifs" : "Inactifs"}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onStatusChange("all")}
                            className="ml-1 h-4 w-4 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      )}
                      {stockStatus !== "all" && onStockStatusChange && (
                        <Badge variant="secondary" className="text-xs">
                          Stock: {
                            stockStatus === "in_stock" ? "En stock" :
                            stockStatus === "low_stock" ? "Faible" :
                            stockStatus === "out_of_stock" ? "Rupture" :
                            "Réappro."
                          }
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onStockStatusChange("all")}
                            className="ml-1 h-4 w-4 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <Select value={sortBy} onValueChange={onSortByChange}>
          <SelectTrigger className="w-full sm:w-[140px] lg:w-[180px] h-9 sm:h-10 bg-background/50 border-border/50 focus:border-primary/50 transition-all duration-200">
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default ProductFiltersDashboard;
