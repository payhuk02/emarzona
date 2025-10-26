/**
 * Carte animée avec effets de hover et transition fluide
 */

import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  hoverEffect?: 'lift' | 'scale' | 'glow' | 'none';
  delay?: number;
  onClick?: () => void;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  className,
  hoverEffect = 'lift',
  delay = 0,
  onClick
}) => {
  const hoverClasses = {
    lift: 'hover-lift',
    scale: 'hover-scale',
    glow: 'hover-glow',
    none: ''
  };

  return (
    <div
      className={cn(
        'animate-slide-in-up',
        hoverClasses[hoverEffect],
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

interface AnimatedButtonProps {
  children: ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  className,
  variant = 'primary',
  onClick,
  disabled = false,
  type = 'button'
}) => {
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary/90',
    secondary: 'bg-secondary text-white hover:bg-secondary/90',
    outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'button-ripple',
        'px-6 py-3 rounded-lg font-medium',
        'transition-smooth',
        'hover:scale-105 active:scale-95',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </button>
  );
};

interface AnimatedImageProps {
  src: string;
  alt: string;
  className?: string;
  zoom?: boolean;
}

export const AnimatedImage: React.FC<AnimatedImageProps> = ({
  src,
  alt,
  className,
  zoom = true
}) => {
  return (
    <div className={cn(zoom && 'image-zoom', className)}>
      <img src={src} alt={alt} className="w-full h-full object-cover" />
    </div>
  );
};

interface SkeletonProps {
  className?: string;
  dark?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, dark = false }) => {
  return (
    <div className={cn(dark ? 'skeleton-dark' : 'skeleton', className)} />
  );
};

interface FadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export const FadeIn: React.FC<FadeInProps> = ({ children, className, delay = 0 }) => {
  return (
    <div
      className={cn('animate-fade-in', className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

interface SlideInProps {
  children: ReactNode;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number;
}

export const SlideIn: React.FC<SlideInProps> = ({
  children,
  className,
  direction = 'up',
  delay = 0
}) => {
  const directionClasses = {
    up: 'animate-slide-in-up',
    down: 'animate-slide-in-down',
    left: 'animate-slide-in-left',
    right: 'animate-slide-in-right'
  };

  return (
    <div
      className={cn(directionClasses[direction], className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

interface ScaleInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export const ScaleIn: React.FC<ScaleInProps> = ({ children, className, delay = 0 }) => {
  return (
    <div
      className={cn('animate-scale-in', className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

