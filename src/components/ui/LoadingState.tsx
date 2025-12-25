/**
 * LoadingState Component
 * Date: 28 Janvier 2025
 * 
 * Composant réutilisable pour les états de chargement avec différents styles
 * Améliore l'UX avec des feedbacks visuels clairs
 */

import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type LoadingStateVariant = 'spinner' | 'skeleton' | 'dots' | 'pulse' | 'minimal';

interface LoadingStateProps {
  /**
   * Variant du loading state
   */
  variant?: LoadingStateVariant;
  /**
   * Message à afficher
   */
  message?: string;
  /**
   * Taille du spinner
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Afficher dans une carte
   */
  inCard?: boolean;
  /**
   * Classe CSS personnalisée
   */
  className?: string;
  /**
   * Nombre de skeletons à afficher (pour variant skeleton)
   */
  skeletonCount?: number;
  /**
   * Hauteur des skeletons
   */
  skeletonHeight?: string;
}

export const LoadingState = ({
  variant = 'spinner',
  message,
  size = 'md',
  inCard = false,
  className,
  skeletonCount = 3,
  skeletonHeight = 'h-20',
}: LoadingStateProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const renderContent = () => {
    switch (variant) {
      case 'spinner':
        return (
          <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
            <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
            {message && (
              <p className="text-sm text-muted-foreground">{message}</p>
            )}
          </div>
        );

      case 'dots':
        return (
          <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
            <div className="flex gap-2">
              <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="h-2 w-2 bg-primary rounded-full animate-bounce" />
            </div>
            {message && (
              <p className="text-sm text-muted-foreground">{message}</p>
            )}
          </div>
        );

      case 'pulse':
        return (
          <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
            <div className={cn('bg-primary rounded-full animate-pulse', sizeClasses[size])} />
            {message && (
              <p className="text-sm text-muted-foreground">{message}</p>
            )}
          </div>
        );

      case 'skeleton':
        return (
          <div className={cn('space-y-3', className)}>
            {Array.from({ length: skeletonCount }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'animate-pulse bg-muted rounded-md',
                  skeletonHeight
                )}
              />
            ))}
          </div>
        );

      case 'minimal':
        return (
          <div className={cn('flex items-center gap-2', className)}>
            <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
            {message && (
              <span className="text-sm text-muted-foreground">{message}</span>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const content = renderContent();

  if (inCard) {
    return (
      <Card>
        <CardContent className="py-12">
          {content}
        </CardContent>
      </Card>
    );
  }

  return content;
};

interface ErrorStateProps {
  /**
   * Message d'erreur
   */
  message?: string;
  /**
   * Callback pour réessayer
   */
  onRetry?: () => void;
  /**
   * Afficher dans une carte
   */
  inCard?: boolean;
  /**
   * Classe CSS personnalisée
   */
  className?: string;
}

export const ErrorState = ({
  message = 'Une erreur est survenue',
  onRetry,
  inCard = false,
  className,
}: ErrorStateProps) => {
  const content = (
    <div className={cn('flex flex-col items-center justify-center gap-4', className)}>
      <AlertCircle className="h-12 w-12 text-destructive" />
      <div className="text-center space-y-2">
        <p className="font-medium text-destructive">{message}</p>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        )}
      </div>
    </div>
  );

  if (inCard) {
    return (
      <Card>
        <CardContent className="py-12">
          {content}
        </CardContent>
      </Card>
    );
  }

  return content;
};

interface EmptyStateProps {
  /**
   * Message à afficher
   */
  message?: string;
  /**
   * Description supplémentaire
   */
  description?: string;
  /**
   * Action à afficher
   */
  action?: React.ReactNode;
  /**
   * Afficher dans une carte
   */
  inCard?: boolean;
  /**
   * Classe CSS personnalisée
   */
  className?: string;
}

export const EmptyState = ({
  message = 'Aucun élément trouvé',
  description,
  action,
  inCard = false,
  className,
}: EmptyStateProps) => {
  const content = (
    <div className={cn('flex flex-col items-center justify-center gap-4 py-12', className)}>
      <div className="text-center space-y-2">
        <p className="text-lg font-medium text-muted-foreground">{message}</p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        {action && <div className="mt-4">{action}</div>}
      </div>
    </div>
  );

  if (inCard) {
    return (
      <Card>
        <CardContent>
          {content}
        </CardContent>
      </Card>
    );
  }

  return content;
};

