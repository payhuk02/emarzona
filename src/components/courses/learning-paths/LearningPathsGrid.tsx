/**
 * Learning Paths Grid Component
 * Grille de parcours d'apprentissage
 */

import React from 'react';
import { useLearningPaths } from '@/hooks/courses/useLearningPaths';
import { LearningPathCard } from './LearningPathCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useStudentLearningPaths } from '@/hooks/courses/useLearningPaths';
import { useAuth } from '@/contexts/AuthContext';

interface LearningPathsGridProps {
  storeId?: string;
  onPathClick?: (pathId: string) => void;
}

const LearningPathsGridComponent = ({ storeId, onPathClick }: LearningPathsGridProps) => {
  const { user } = useAuth();
  const { data: paths = [], isLoading } = useLearningPaths(storeId);
  const { data: enrollments = [] } = useStudentLearningPaths(user?.id);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    );
  }

  if (paths.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Aucun parcours d'apprentissage disponible</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {paths.map((path) => {
        const enrollment = enrollments.find(e => e.learning_path_id === path.id);
        
        return (
          <LearningPathCard
            key={path.id}
            path={path}
            enrollment={enrollment}
            onView={() => onPathClick?.(path.id)}
            onEnroll={() => onPathClick?.(path.id)}
          />
        );
      })}
    </div>
  );
};

// Optimisation avec React.memo pour éviter les re-renders inutiles
export const LearningPathsGrid = React.memo(LearningPathsGridComponent, (prevProps, nextProps) => {
  return (
    prevProps.storeId === nextProps.storeId &&
    prevProps.onPathClick === nextProps.onPathClick
  );
});

LearningPathsGrid.displayName = 'LearningPathsGrid';

