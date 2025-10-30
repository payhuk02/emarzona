import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface ProductFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  productType: string;
  onProductTypeChange: (value: string) => void;
  licensingType?: 'all' | 'standard' | 'plr' | 'copyrighted';
  onLicensingTypeChange?: (value: 'all' | 'standard' | 'plr' | 'copyrighted') => void;
  categories: string[];
  productTypes: string[];
}

const ProductFilters = ({
  searchQuery,
  onSearchChange,
  category,
  onCategoryChange,
  productType,
  licensingType = 'all',
  onLicensingTypeChange,
  onProductTypeChange,
  categories,
  productTypes,
}: ProductFiltersProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const hasActiveFilters = category !== "all" || productType !== "all" || licensingType !== 'all';

  const clearFilters = () => {
    onCategoryChange("all");
    onProductTypeChange("all");
    onLicensingTypeChange && onLicensingTypeChange('all');
  };

  return (
    <div className="flex flex-col gap-3 mb-4 sm:mb-6">
      {/* Search bar - always visible */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder="Rechercher un produit..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-11 touch-manipulation"
        />
      </div>

      {/* Desktop filters */}
      <div className="hidden sm:flex gap-3">
        <Select value={category} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-[200px]">
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

        {/* Licensing type */}
        {onLicensingTypeChange && (
          <Select value={licensingType} onValueChange={(v) => onLicensingTypeChange(v as any)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Licence" />
            </SelectTrigger>
            <SelectContent className="z-50 bg-background">
              <SelectItem value="all">Toutes licences</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="plr">PLR</SelectItem>
              <SelectItem value="copyrighted">Droit d'auteur</SelectItem>
            </SelectContent>
          </Select>
        )}

        <Select value={productType} onValueChange={onProductTypeChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Type de produit" />
          </SelectTrigger>
          <SelectContent className="z-50 bg-background">
            <SelectItem value="all">Tous les types</SelectItem>
            {productTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
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
            Effacer
          </Button>
        )}
      </div>

      {/* Mobile filter button */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            className="sm:hidden w-full h-11 justify-start touch-manipulation relative"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtres
            {hasActiveFilters && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary" />
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl">
          <SheetHeader className="mb-6">
            <SheetTitle>Filtrer les produits</SheetTitle>
          </SheetHeader>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="mobile-category">Catégorie</Label>
              <Select value={category} onValueChange={onCategoryChange}>
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
              <Label htmlFor="mobile-type">{t('storefront.filters.productType')}</Label>
              <Select value={productType} onValueChange={onProductTypeChange}>
                <SelectTrigger id="mobile-type" className="h-12 touch-manipulation">
                  <SelectValue placeholder={t('storefront.filters.selectType')} />
                </SelectTrigger>
                <SelectContent className="z-[60] bg-background">
                  <SelectItem value="all">{t('storefront.filters.allTypes')}</SelectItem>
                  {productTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          {onLicensingTypeChange && (
            <div className="space-y-2">
              <Label htmlFor="mobile-license">Licence</Label>
              <Select value={licensingType} onValueChange={(v) => onLicensingTypeChange(v as any)}>
                <SelectTrigger id="mobile-license" className="h-12 touch-manipulation">
                  <SelectValue placeholder="Sélectionner une licence" />
                </SelectTrigger>
                <SelectContent className="z-[60] bg-background">
                  <SelectItem value="all">Toutes licences</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="plr">PLR</SelectItem>
                  <SelectItem value="copyrighted">Droit d'auteur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="flex-1 h-12 touch-manipulation"
              >
                {t('storefront.filters.reset')}
              </Button>
              <Button
                onClick={() => setOpen(false)}
                className="flex-1 h-12 touch-manipulation gradient-primary"
              >
                {t('storefront.filters.apply')}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ProductFilters;
