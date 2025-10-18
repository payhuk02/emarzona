import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Search, 
  Filter, 
  X, 
  SlidersHorizontal, 
  Star,
  TrendingUp,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

interface AdvancedFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    search: string;
    category: string;
    productType: string;
    priceRange: string;
    rating: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    viewMode: 'grid' | 'list';
  };
  onFiltersChange: (filters: any) => void;
  categories: string[];
  productTypes: string[];
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
}

const AdvancedFilters = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  categories,
  productTypes,
  priceRange,
  onPriceRangeChange
}: AdvancedFiltersProps) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [localPriceRange, setLocalPriceRange] = useState(priceRange);

  useEffect(() => {
    setLocalFilters(filters);
    setLocalPriceRange(priceRange);
  }, [filters, priceRange]);

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
    onPriceRangeChange(localPriceRange);
    onClose();
  };

  const resetFilters = () => {
    const defaultFilters = {
      search: "",
      category: "all",
      productType: "all",
      priceRange: "all",
      rating: "all",
      sortBy: "created_at",
      sortOrder: "desc" as const,
      viewMode: "grid" as const
    };
    setLocalFilters(defaultFilters);
    setLocalPriceRange([0, 100000]);
    onFiltersChange(defaultFilters);
    onPriceRangeChange([0, 100000]);
  };

  const hasActiveFilters = 
    localFilters.category !== "all" ||
    localFilters.productType !== "all" ||
    localFilters.priceRange !== "all" ||
    localFilters.rating !== "all" ||
    localFilters.search !== "" ||
    localPriceRange[0] !== 0 ||
    localPriceRange[1] !== 100000;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-800 border-slate-600">
        <CardHeader className="border-b border-slate-600">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5" />
              Filtres avancés
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Recherche */}
          <div>
            <Label className="text-white mb-2 block">Recherche</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Rechercher par nom, description, vendeur..."
                value={localFilters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              />
            </div>
          </div>

          {/* Catégories */}
          <div>
            <Label className="text-white mb-3 block">Catégories</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <Button
                variant={localFilters.category === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange("category", "all")}
                className={localFilters.category === "all" ? "bg-blue-600 text-white" : "bg-slate-700 border-slate-600 text-white hover:bg-slate-600"}
              >
                Toutes
              </Button>
              {categories.map(category => (
                <Button
                  key={category}
                  variant={localFilters.category === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFilterChange("category", category)}
                  className={localFilters.category === category ? "bg-blue-600 text-white" : "bg-slate-700 border-slate-600 text-white hover:bg-slate-600"}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Types de produits */}
          <div>
            <Label className="text-white mb-3 block">Types de produits</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <Button
                variant={localFilters.productType === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange("productType", "all")}
                className={localFilters.productType === "all" ? "bg-blue-600 text-white" : "bg-slate-700 border-slate-600 text-white hover:bg-slate-600"}
              >
                Tous
              </Button>
              {productTypes.map(type => (
                <Button
                  key={type}
                  variant={localFilters.productType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFilterChange("productType", type)}
                  className={localFilters.productType === type ? "bg-blue-600 text-white" : "bg-slate-700 border-slate-600 text-white hover:bg-slate-600"}
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>

          {/* Plage de prix */}
          <div>
            <Label className="text-white mb-3 block">
              Plage de prix: {localPriceRange[0].toLocaleString()} - {localPriceRange[1].toLocaleString()} XOF
            </Label>
            <Slider
              value={localPriceRange}
              onValueChange={setLocalPriceRange}
              max={100000}
              min={0}
              step={1000}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-slate-400 mt-1">
              <span>0 XOF</span>
              <span>100,000+ XOF</span>
            </div>
          </div>

          {/* Note minimum */}
          <div>
            <Label className="text-white mb-3 block">Note minimum</Label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map(rating => (
                <Button
                  key={rating}
                  variant={localFilters.rating === rating.toString() ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFilterChange("rating", rating.toString())}
                  className={localFilters.rating === rating.toString() ? "bg-blue-600 text-white" : "bg-slate-700 border-slate-600 text-white hover:bg-slate-600"}
                >
                  <Star className="h-4 w-4 mr-1" />
                  {rating}+
                </Button>
              ))}
              <Button
                variant={localFilters.rating === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange("rating", "all")}
                className={localFilters.rating === "all" ? "bg-blue-600 text-white" : "bg-slate-700 border-slate-600 text-white hover:bg-slate-600"}
              >
                Toutes
              </Button>
            </div>
          </div>

          {/* Tri */}
          <div>
            <Label className="text-white mb-3 block">Trier par</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={localFilters.sortBy === "created_at" ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange("sortBy", "created_at")}
                className={localFilters.sortBy === "created_at" ? "bg-blue-600 text-white" : "bg-slate-700 border-slate-600 text-white hover:bg-slate-600"}
              >
                <Clock className="h-4 w-4 mr-1" />
                Plus récents
              </Button>
              <Button
                variant={localFilters.sortBy === "price" ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange("sortBy", "price")}
                className={localFilters.sortBy === "price" ? "bg-blue-600 text-white" : "bg-slate-700 border-slate-600 text-white hover:bg-slate-600"}
              >
                Prix
              </Button>
              <Button
                variant={localFilters.sortBy === "rating" ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange("sortBy", "rating")}
                className={localFilters.sortBy === "rating" ? "bg-blue-600 text-white" : "bg-slate-700 border-slate-600 text-white hover:bg-slate-600"}
              >
                <Star className="h-4 w-4 mr-1" />
                Note
              </Button>
              <Button
                variant={localFilters.sortBy === "sales_count" ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange("sortBy", "sales_count")}
                className={localFilters.sortBy === "sales_count" ? "bg-blue-600 text-white" : "bg-slate-700 border-slate-600 text-white hover:bg-slate-600"}
              >
                <TrendingUp className="h-4 w-4 mr-1" />
                Ventes
              </Button>
            </div>
          </div>

          {/* Ordre de tri */}
          <div>
            <Label className="text-white mb-3 block">Ordre</Label>
            <div className="flex gap-2">
              <Button
                variant={localFilters.sortOrder === "desc" ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange("sortOrder", "desc")}
                className={localFilters.sortOrder === "desc" ? "bg-blue-600 text-white" : "bg-slate-700 border-slate-600 text-white hover:bg-slate-600"}
              >
                Décroissant
              </Button>
              <Button
                variant={localFilters.sortOrder === "asc" ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange("sortOrder", "asc")}
                className={localFilters.sortOrder === "asc" ? "bg-blue-600 text-white" : "bg-slate-700 border-slate-600 text-white hover:bg-slate-600"}
              >
                Croissant
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-600">
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Badge variant="destructive" className="bg-red-600 text-white">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Filtres actifs
                </Badge>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={resetFilters}
                className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
              >
                <X className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
              <Button
                onClick={applyFilters}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Appliquer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedFilters;
