import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  X, 
  Search, 
  Filter, 
  Star, 
  DollarSign, 
  TrendingUp, 
  Clock,
  CheckCircle2,
  Sparkles,
  Zap,
  Target,
  Flame
} from "lucide-react";
import { cn } from "@/lib/utils";

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
    tags: string[];
    verifiedOnly: boolean;
    featuredOnly: boolean;
    inStock: boolean;
  };
  onFiltersChange: (filters: Partial<{
    search: string;
    category: string;
    productType: string;
    priceRange: string;
    rating: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    viewMode: 'grid' | 'list';
    tags: string[];
    verifiedOnly: boolean;
    featuredOnly: boolean;
    inStock: boolean;
  }>) => void;
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
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      setLocalFilters(filters);
    }
  }, [isOpen, filters]);

  const handleApply = () => {
    onFiltersChange(localFilters);
    setIsAnimating(false);
    setTimeout(() => onClose(), 300);
  };

  const handleReset = () => {
    const resetFilters = {
      search: "",
      category: "all",
      productType: "all",
      priceRange: "all",
      rating: "all",
      sortBy: "created_at",
      sortOrder: "desc" as const,
      viewMode: "grid" as const,
      tags: [],
      verifiedOnly: false,
      featuredOnly: false,
      inStock: true
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  const PRODUCT_TAGS = [
    "Nouveau", "Populaire", "En promotion", "Recommandé", "Tendance",
    "Qualité premium", "Livraison rapide", "Support 24/7", "Garantie",
    "Formation incluse", "Mise à jour gratuite", "Communauté active"
  ];

  const SORT_OPTIONS = [
    { value: "created_at", label: "Plus récents", icon: Clock },
    { value: "price", label: "Prix", icon: DollarSign },
    { value: "rating", label: "Note", icon: Star },
    { value: "sales_count", label: "Ventes", icon: TrendingUp },
    { value: "name", label: "Nom", icon: Target },
    { value: "popularity", label: "Popularité", icon: Flame }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <Card className={cn(
        "relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-800 border-slate-600 shadow-2xl",
        isAnimating ? "animate-in zoom-in-95 duration-300" : "animate-out zoom-out-95 duration-300"
      )}>
        <CardHeader className="border-b border-slate-600">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-400" />
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

        <CardContent className="p-6 space-y-8">
          {/* Recherche avancée */}
          <div className="space-y-4">
            <Label className="text-white font-semibold flex items-center gap-2">
              <Search className="h-4 w-4" />
              Recherche intelligente
            </Label>
            <Input
              value={localFilters.search}
              onChange={(e) => setLocalFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Rechercher par nom, description, boutique..."
              className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
            />
          </div>

          {/* Filtres de base */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Catégorie */}
            <div className="space-y-2">
              <Label className="text-white font-medium">Catégorie</Label>
              <select
                value={localFilters.category}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full p-2 bg-slate-700 border-slate-600 text-white rounded-md focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="all">Toutes les catégories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Type de produit */}
            <div className="space-y-2">
              <Label className="text-white font-medium">Type de produit</Label>
              <select
                value={localFilters.productType}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, productType: e.target.value }))}
                className="w-full p-2 bg-slate-700 border-slate-600 text-white rounded-md focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="all">Tous les types</option>
                {productTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Note minimum */}
            <div className="space-y-2">
              <Label className="text-white font-medium">Note minimum</Label>
              <select
                value={localFilters.rating}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, rating: e.target.value }))}
                className="w-full p-2 bg-slate-700 border-slate-600 text-white rounded-md focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="all">Toutes les notes</option>
                <option value="4">4+ étoiles</option>
                <option value="3">3+ étoiles</option>
                <option value="2">2+ étoiles</option>
                <option value="1">1+ étoiles</option>
              </select>
            </div>
          </div>

          {/* Plage de prix avec slider */}
          <div className="space-y-4">
            <Label className="text-white font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Plage de prix (XOF)
            </Label>
            <div className="px-4">
              <Slider
                value={priceRange}
                onValueChange={onPriceRangeChange}
                max={200000}
                min={0}
                step={1000}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-slate-400 mt-2">
                <span>{priceRange[0].toLocaleString()} XOF</span>
                <span>{priceRange[1].toLocaleString()} XOF</span>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <Label className="text-white font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Tags populaires
            </Label>
            <div className="flex flex-wrap gap-2">
              {PRODUCT_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => {
                    const newTags = localFilters.tags.includes(tag)
                      ? localFilters.tags.filter(t => t !== tag)
                      : [...localFilters.tags, tag];
                    setLocalFilters(prev => ({ ...prev, tags: newTags }));
                  }}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs transition-all duration-300 hover:scale-105",
                    localFilters.tags.includes(tag)
                      ? "bg-blue-600 text-white shadow-lg"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Filtres supplémentaires */}
          <div className="space-y-4">
            <Label className="text-white font-semibold flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtres supplémentaires
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="verifiedOnly"
                  checked={localFilters.verifiedOnly}
                  onCheckedChange={(checked) => 
                    setLocalFilters(prev => ({ ...prev, verifiedOnly: checked as boolean }))
                  }
                  className="border-slate-600 data-[state=checked]:bg-blue-600"
                />
                <Label htmlFor="verifiedOnly" className="text-slate-300 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  Boutiques vérifiées uniquement
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="featuredOnly"
                  checked={localFilters.featuredOnly}
                  onCheckedChange={(checked) => 
                    setLocalFilters(prev => ({ ...prev, featuredOnly: checked as boolean }))
                  }
                  className="border-slate-600 data-[state=checked]:bg-blue-600"
                />
                <Label htmlFor="featuredOnly" className="text-slate-300 flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-400" />
                  Produits en vedette uniquement
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="inStock"
                  checked={localFilters.inStock}
                  onCheckedChange={(checked) => 
                    setLocalFilters(prev => ({ ...prev, inStock: checked as boolean }))
                  }
                  className="border-slate-600 data-[state=checked]:bg-blue-600"
                />
                <Label htmlFor="inStock" className="text-slate-300 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  En stock uniquement
                </Label>
              </div>
            </div>
          </div>

          {/* Tri */}
          <div className="space-y-4">
            <Label className="text-white font-semibold flex items-center gap-2">
              <Target className="h-4 w-4" />
              Trier par
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {SORT_OPTIONS.map(option => (
                <button
                  key={option.value}
                  onClick={() => setLocalFilters(prev => ({ ...prev, sortBy: option.value }))}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg border transition-all duration-300 hover:scale-105",
                    localFilters.sortBy === option.value
                      ? "bg-blue-600 border-blue-500 text-white"
                      : "bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600"
                  )}
                >
                  <option.icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-6 border-t border-slate-600">
            <Button
              variant="outline"
              onClick={handleReset}
              className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
            >
              Réinitialiser
            </Button>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
              >
                Annuler
              </Button>
              <Button
                onClick={handleApply}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                Appliquer les filtres
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedFilters;