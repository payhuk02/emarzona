/**
 * États de chargement réutilisables pour les cours
 * Date : 27 octobre 2025
 * Amélioration : UX professionnelle
 */

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, RefreshCcw } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState = ({ message = 'Chargement...' }: LoadingStateProps) => {
  return (
    <Card>
      <CardContent className="p-12">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-orange-600" />
          <p className="text-muted-foreground">{message}</p>
        </div>
      </CardContent>
    </Card>
  );
};

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState = ({ 
  message = 'Une erreur est survenue', 
  onRetry 
}: ErrorStateProps) => {
  return (
    <Card>
      <CardContent className="p-12">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <Alert variant="destructive" className="max-w-md">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
          {onRetry && (
            <Button onClick={onRetry} variant="outline">
              <RefreshCcw className="w-4 h-4 mr-2" />
              Réessayer
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState = ({ 
  icon, 
  title, 
  description, 
  action 
}: EmptyStateProps) => {
  return (
    <Card>
      <CardContent className="p-12">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          {icon && (
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              {icon}
            </div>
          )}
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">{title}</h3>
            {description && (
              <p className="text-muted-foreground">{description}</p>
            )}
          </div>
          {action}
        </div>
      </CardContent>
    </Card>
  );
};

interface CourseDetailSkeletonProps {
  showSidebar?: boolean;
}

export const CourseDetailSkeleton = ({ showSidebar = true }: CourseDetailSkeletonProps) => {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <Skeleton className="h-64 w-full" />
      
      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
        
        {showSidebar && (
          <div className="space-y-4">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}
      </div>
    </div>
  );
};

