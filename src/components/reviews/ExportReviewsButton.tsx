/**
 * Export Reviews Button
 * Date : 27 octobre 2025
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, Loader2 } from '@/components/icons';
import { exportReviewsToCSV } from '@/utils/exportReviewsCSV';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import type { Review } from '@/types/review';

interface ExportReviewsButtonProps {
  reviews: Review[];
  productName?: string;
  disabled?: boolean;
}

export const ExportReviewsButton: React.FC<ExportReviewsButtonProps> = ({
  reviews,
  productName,
  disabled = false,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async (includeMedia: boolean = true) => {
    if (!reviews || reviews.length === 0) {
      toast({
        title: 'Aucun avis à exporter',
        description: 'Il n\'y a pas d\'avis disponibles pour l\'export.',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);

    try {
      const filename = productName
        ? `reviews_${productName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
        : `reviews_export_${new Date().toISOString().split('T')[0]}.csv`;

      await exportReviewsToCSV(reviews, {
        filename,
        includeMedia,
        dateFormat: 'locale',
      });

      toast({
        title: '✅ Export réussi',
        description: `${reviews.length} avis exportés vers ${filename}`,
      });
    } catch (error) {
      logger.error('Export error', { error, reviewCount: reviews.length });
      toast({
        title: '❌ Erreur d\'export',
        description: 'Une erreur s\'est produite lors de l\'export.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (!reviews || reviews.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || isExporting}
          className="gap-2"
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Export en cours...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Exporter ({reviews.length})
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Format d'export</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport(true)}>
          <Download className="mr-2 h-4 w-4" />
          CSV Complet (avec médias)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport(false)}>
          <Download className="mr-2 h-4 w-4" />
          CSV Basique (sans médias)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

