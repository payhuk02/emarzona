/**
 * MobileTableCard - Affiche les données de tableau sous forme de cartes sur mobile
 * Transforme automatiquement les tableaux en cartes responsives
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle } from './card';

type RowData = Record<string, unknown>;

interface MobileTableCardProps<Row extends RowData = RowData> {
  /**
   * Données à afficher (array d'objets)
   */
  data: Row[];
  /**
   * Colonnes à afficher avec leurs labels
   */
  columns: Array<{
    key: string;
    /**
     * Rétro-compat: certaines pages utilisent `header` au lieu de `label`
     */
    label?: string;
    header?: string;
    render?: (value: unknown, row: Row) => React.ReactNode;
    className?: string;
    priority?: 'high' | 'medium' | 'low'; // Priorité d'affichage sur mobile
  }>;
  /**
   * Fonction de rendu personnalisée pour la carte
   */
  renderCard?: (row: Row, index: number) => React.ReactNode;
  /**
   * Actions à afficher dans chaque carte
   */
  actions?: (row: Row) => React.ReactNode;
  /**
   * Classe CSS supplémentaire
   */
  className?: string;
  /**
   * Forcer l'affichage en cartes même sur desktop
   */
  forceCardView?: boolean;
}

/**
 * Composant qui transforme un tableau en cartes sur mobile
 */
export const MobileTableCard : React.FC<MobileTableCardProps> = ({
  data,
  columns,
  renderCard,
  actions,
  className,
  forceCardView = false,
}) => {
  const isMobile = useIsMobile();
  const shouldShowCards = isMobile || forceCardView;

  if (!shouldShowCards) {
    return null; // Laisser le tableau s'afficher normalement
  }

  // Filtrer les colonnes par priorité sur mobile
  const visibleColumns = isMobile ? columns.filter(col => col.priority !== 'low') : columns;

  if (renderCard) {
    return (
      <div className={cn('space-y-4', className)}>
        {data.map((row, index) => (
          <React.Fragment key={index}>{renderCard(row, index)}</React.Fragment>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {data.map((row, index) => (
        <Card key={index} className="overflow-hidden">
          <CardContent className="p-4 space-y-3">
            {visibleColumns.map(column => {
              const value = row[column.key];
              const renderedValue = column.render ? column.render(value, row) : value;
              const columnLabel = column.label ?? column.header ?? column.key;

              return (
                <div
                  key={column.key}
                  className={cn(
                    'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2',
                    column.className
                  )}
                >
                  <span className="text-sm font-medium text-muted-foreground sm:min-w-[120px]">
                    {columnLabel}
                  </span>
                  <span className="text-sm sm:text-base font-medium break-words">
                    {renderedValue || '-'}
                  </span>
                </div>
              );
            })}

            {actions && <div className="flex flex-wrap gap-2 pt-2 border-t">{actions(row)}</div>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

/**
 * Hook pour déterminer si on doit afficher en cartes ou tableau
 */
export const useTableDisplayMode = () => {
  const isMobile = useIsMobile();
  return {
    isMobile,
    showCards: isMobile,
    showTable: !isMobile,
  };
};







