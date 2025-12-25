/**
 * Skeleton Loaders Améliorés - Phase 2 UX
 * Shimmer effect et variantes pour meilleure expérience utilisateur
 */

import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'text' | 'circular' | 'rectangular' | 'rounded';
  animation?: 'pulse' | 'shimmer' | 'wave';
  width?: string | number;
  height?: string | number;
}

/**
 * Skeleton de base avec shimmer effect amélioré
 */
export function SkeletonEnhanced({
  className,
  variant = 'default',
  animation = 'shimmer',
  width,
  height,
  style,
  ...props
}: SkeletonProps) {
  const baseStyles = {
    width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
    ...style,
  };

  const variantClasses = {
    default: 'rounded-md',
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    shimmer: 'animate-shimmer',
    wave: 'animate-wave',
  };

  return (
    <div
      className={cn('bg-muted', variantClasses[variant], animationClasses[animation], className)}
      style={baseStyles}
      aria-label="Loading..."
      role="status"
      aria-live="polite"
      {...props}
    />
  );
}

/**
 * Skeleton pour une carte produit
 */
export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse', className)}>
      <div className="bg-muted rounded-lg aspect-[3/2] mb-4" />
      <div className="space-y-2">
        <SkeletonEnhanced variant="text" height={20} width="75%" />
        <SkeletonEnhanced variant="text" height={16} width="50%" />
        <SkeletonEnhanced variant="text" height={24} width="40%" />
      </div>
      <div className="mt-4">
        <SkeletonEnhanced variant="rounded" height={40} width="100%" />
      </div>
    </div>
  );
}

/**
 * Skeleton pour une liste de produits
 */
export function ProductListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

/**
 * Skeleton pour une table
 */
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4">
        {Array.from({ length: columns }).map((_, index) => (
          <SkeletonEnhanced key={index} variant="text" height={20} width="100%" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <SkeletonEnhanced key={colIndex} variant="text" height={16} width="100%" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton pour un profil utilisateur
 */
export function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <SkeletonEnhanced variant="circular" width={64} height={64} />
        <div className="flex-1 space-y-2">
          <SkeletonEnhanced variant="text" height={24} width="40%" />
          <SkeletonEnhanced variant="text" height={16} width="60%" />
        </div>
      </div>
      <div className="space-y-2">
        <SkeletonEnhanced variant="text" height={16} width="100%" />
        <SkeletonEnhanced variant="text" height={16} width="90%" />
        <SkeletonEnhanced variant="text" height={16} width="80%" />
      </div>
    </div>
  );
}

/**
 * Skeleton pour un dashboard
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-card rounded-lg p-6 space-y-2">
            <SkeletonEnhanced variant="text" height={16} width="50%" />
            <SkeletonEnhanced variant="text" height={32} width="80%" />
          </div>
        ))}
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg p-6 space-y-4">
          <SkeletonEnhanced variant="text" height={24} width="40%" />
          <SkeletonEnhanced variant="rectangular" height={200} width="100%" />
        </div>
        <div className="bg-card rounded-lg p-6 space-y-4">
          <SkeletonEnhanced variant="text" height={24} width="40%" />
          <SkeletonEnhanced variant="rectangular" height={200} width="100%" />
        </div>
      </div>
    </div>
  );
}
