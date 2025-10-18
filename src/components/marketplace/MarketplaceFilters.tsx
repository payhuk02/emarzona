import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SlidersHorizontal, X } from "lucide-react";

interface MarketplaceFiltersProps {
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  priceRange: string;
  onPriceChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  categories: string[];
}

const MarketplaceFilters = ({
  categoryFilter,
  onCategoryChange,
  priceRange,
  onPriceChange,
  sortBy,
  onSortChange,
  categories,
}: MarketplaceFiltersProps) => {
  const [open, setOpen] = useState(false);
  const hasActiveFilters = categoryFilter !== "all" || priceRange !== "all" || sortBy !== "recent";

  const clearFilters = () => {
    onCategoryChange("all");
    onPriceChange("all");
    onSortChange("recent");
  };

  return (
    <>
      {/* Desktop Filters */}
      <div className="hidden sm:flex flex-wrap gap-3">
        <Select value={categoryFilter} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-[180px] md:w-[200px] bg-card border-border">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent className="z-50 bg-background">
            <SelectItem value="all">Toutes les catégories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={priceRange} onValueChange={onPriceChange}>
          <SelectTrigger className="w-[180px] md:w-[200px] bg-card border-border">
            <SelectValue placeholder="Prix" />
          </SelectTrigger>
          <SelectContent className="z-50 bg-background">
            <SelectItem value="all">Tous les prix</SelectItem>
            <SelectItem value="0-5000">0 - 5,000 XOF</SelectItem>
            <SelectItem value="5000-15000">5,000 - 15,000 XOF</SelectItem>
            <SelectItem value="15000+">15,000+ XOF</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-[180px] md:w-[200px] bg-card border-border">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent className="z-50 bg-background">
            <SelectItem value="recent">Plus récents</SelectItem>
            <SelectItem value="popular">Plus populaires</SelectItem>
            <SelectItem value="price-asc">Prix croissant</SelectItem>
            <SelectItem value="price-desc">Prix décroissant</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Réinitialiser
          </Button>
        )}
      </div>

      {/* Mobile Filter Button */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            className="sm:hidden w-full h-11 justify-start touch-manipulation relative"
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filtres et tri
            {hasActiveFilters && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary animate-pulse" />
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
          <SheetHeader className="mb-6">
            <SheetTitle>Filtrer et trier</SheetTitle>
          </SheetHeader>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="mobile-category">Catégorie</Label>
              <Select value={categoryFilter} onValueChange={onCategoryChange}>
                <SelectTrigger id="mobile-category" className="h-12 touch-manipulation">
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent className="z-[60] bg-background">
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
              <Label htmlFor="mobile-price">Fourchette de prix</Label>
              <Select value={priceRange} onValueChange={onPriceChange}>
                <SelectTrigger id="mobile-price" className="h-12 touch-manipulation">
                  <SelectValue placeholder="Sélectionner un prix" />
                </SelectTrigger>
                <SelectContent className="z-[60] bg-background">
                  <SelectItem value="all">Tous les prix</SelectItem>
                  <SelectItem value="0-5000">0 - 5,000 XOF</SelectItem>
                  <SelectItem value="5000-15000">5,000 - 15,000 XOF</SelectItem>
                  <SelectItem value="15000+">15,000+ XOF</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile-sort">Trier par</Label>
              <Select value={sortBy} onValueChange={onSortChange}>
                <SelectTrigger id="mobile-sort" className="h-12 touch-manipulation">
                  <SelectValue placeholder="Choisir le tri" />
                </SelectTrigger>
                <SelectContent className="z-[60] bg-background">
                  <SelectItem value="recent">Plus récents</SelectItem>
                  <SelectItem value="popular">Plus populaires</SelectItem>
                  <SelectItem value="price-asc">Prix croissant</SelectItem>
                  <SelectItem value="price-desc">Prix décroissant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="flex-1 h-12 touch-manipulation"
              >
                Réinitialiser
              </Button>
              <Button
                onClick={() => setOpen(false)}
                className="flex-1 h-12 touch-manipulation gradient-primary"
              >
                Appliquer
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default MarketplaceFilters;
