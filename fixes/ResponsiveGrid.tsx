// src/components/ui/ResponsiveGrid.tsx
import { cn } from '@/lib/utils';

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
  skeletonCount?: number;
}

export const ResponsiveGrid = ({ 
  children, 
  className, 
  loading = false, 
  skeletonCount = 12 
}: ResponsiveGridProps) => {
  // Skeleton optimisé ComeUp-style
  const SkeletonCard = () => (
    <div className="animate-pulse">
      <div className="bg-gray-200 dark:bg-gray-700 rounded-xl aspect-[16/9] mb-4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        "gap-4 sm:gap-6 lg:gap-8",
        "px-4 sm:px-6 lg:px-8",
        className
      )}>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className={cn(
      "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      "gap-4 sm:gap-6 lg:gap-8", 
      "px-4 sm:px-6 lg:px-8",
      className
    )}>
      {children}
    </div>
  );
};