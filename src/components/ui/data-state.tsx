/**
 * Composant DataState - Gère les états de données (loading, error, empty, success)
 * Simplifie la gestion des états dans les composants
 * 
 * @example
 * ```tsx
 * <DataState
 *   loading={isLoading}
 *   error={error}
 *   empty={!data || data.length === 0}
 *   emptyMessage="Aucune donnée disponible"
 * >
 *   <DataDisplay data={data} />
 * </DataState>
 * ```
 */

import React from 'react';
import { Loader2, AlertCircle, Inbox, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

export interface DataStateProps {
  /**
   * État de chargement
   */
  loading?: boolean;
  /**
   * Erreur éventuelle
   */
  error?: Error | string | null;
  /**
   * Indique si les données sont vides
   */
  empty?: boolean;
  /**
   * Message à afficher quand les données sont vides
   */
  emptyMessage?: string;
  /**
   * Icône à afficher quand les données sont vides
   */
  emptyIcon?: React.ReactNode;
  /**
   * Callback pour réessayer en cas d'erreur
   */
  onRetry?: () => void;
  /**
   * Variant du skeleton (si loading)
   */
  skeletonVariant?: 'default' | 'card' | 'list' | 'table';
  /**
   * Nombre de skeletons à afficher
   */
  skeletonCount?: number;
  /**
   * Classe CSS additionnelle
   */
  className?: string;
  /**
   * Contenu à afficher quand tout est OK
   */
  children: React.ReactNode;
}

/**
 * Composant DataState
 */
export const DataState : React.FC<DataStateProps> = ({
  loading = false,
  error = null,
  empty = false,
  emptyMessage = 'Aucune donnée disponible',
  emptyIcon,
  onRetry,
  skeletonVariant = 'default',
  skeletonCount = 3,
  className,
  children,
}) => {
  // État de chargement
  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        {skeletonVariant === 'card' && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: skeletonCount }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6 space-y-3">
                  <div className="h-32 bg-muted animate-pulse rounded-md" />
                  <div className="h-4 bg-muted animate-pulse rounded-md w-3/4" />
                  <div className="h-4 bg-muted animate-pulse rounded-md w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {skeletonVariant === 'list' && (
          <div className="space-y-3">
            {Array.from({ length: skeletonCount }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="h-12 w-12 bg-muted animate-pulse rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded-md w-3/4" />
                  <div className="h-4 bg-muted animate-pulse rounded-md w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}
        
        {skeletonVariant === 'table' && (
          <div className="space-y-3">
            <div className="h-10 bg-muted animate-pulse rounded-md" />
            {Array.from({ length: skeletonCount }).map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-md" />
            ))}
          </div>
        )}
        
        {skeletonVariant === 'default' && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Chargement...</p>
          </div>
        )}
      </div>
    );
  }

  // État d'erreur
  if (error) {
    const errorMessage = typeof error === 'string' ? error : error.message;
    
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erreur</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>{errorMessage}</span>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="ml-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // État vide
  if (empty) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 space-y-4', className)}>
        {emptyIcon || <Inbox className="h-12 w-12 text-muted-foreground" />}
        <p className="text-sm text-muted-foreground text-center">{emptyMessage}</p>
      </div>
    );
  }

  // État de succès - afficher le contenu
  return <>{children}</>;
};

/**
 * Hook pour simplifier l'utilisation de DataState avec des données
 */
export function useDataState<T>(
  data: T | null | undefined,
  loading: boolean,
  error: Error | null,
  options: {
    isEmpty?: (data: T) => boolean;
    emptyMessage?: string;
    onRetry?: () => void;
  } = {}
) {
  const {
    isEmpty = (d: T) => {
      if (d === null || d === undefined) return true;
      if (Array.isArray(d)) return d.length === 0;
      if (typeof d === 'object') return Object.keys(d).length === 0;
      return false;
    },
    emptyMessage = 'Aucune donnée disponible',
    onRetry,
  } = options;

  const empty = data ? isEmpty(data) : true;

  return {
    loading,
    error,
    empty,
    emptyMessage,
    onRetry,
    hasData: !loading && !error && !empty,
  };
}








