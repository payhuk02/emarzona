/**
 * Composant : ReviewFilter
 * Filtres et tri des avis
 * Date : 27 octobre 2025
 */

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Image } from 'lucide-react';
import type { ReviewFilters } from '@/types/review';

interface ReviewFilterProps {
  filters: ReviewFilters;
  onFiltersChange: (filters: ReviewFilters) => void;
}

export const ReviewFilter: React.FC<ReviewFilterProps> = ({
  filters,
  onFiltersChange,
}) => {
  const handleSortChange = (value: string) => {
    onFiltersChange({ ...filters, sort_by: value as any });
  };

  const toggleFilter = (key: 'verified_only' | 'has_media') => {
    onFiltersChange({ ...filters, [key]: !filters[key] });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Tri */}
      <Select value={filters.sort_by || 'recent'} onValueChange={handleSortChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Trier par" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="recent">Plus récents</SelectItem>
          <SelectItem value="helpful">Plus utiles</SelectItem>
          <SelectItem value="rating_high">Note (haute → basse)</SelectItem>
          <SelectItem value="rating_low">Note (basse → haute)</SelectItem>
        </SelectContent>
      </Select>

      {/* Filtres rapides */}
      <Button
        variant={filters.verified_only ? 'default' : 'outline'}
        size="sm"
        onClick={() => toggleFilter('verified_only')}
      >
        <ShieldCheck className="w-4 h-4 mr-1" />
        Achats vérifiés
      </Button>

      <Button
        variant={filters.has_media ? 'default' : 'outline'}
        size="sm"
        onClick={() => toggleFilter('has_media')}
      >
        <Image className="w-4 h-4 mr-1" />
        Avec photos
      </Button>

      {/* Reset */}
      {(filters.verified_only || filters.has_media || filters.rating) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFiltersChange({ sort_by: 'recent', limit: 10, offset: 0 })}
        >
          Réinitialiser
        </Button>
      )}
    </div>
  );
};

