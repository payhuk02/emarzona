/**
 * Badge pour afficher le type de produit avec traduction et icône
 * Date: 27 octobre 2025
 */

import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { getProductTypeLabel, getProductTypeColor, getProductTypeIcon } from '@/lib/productTypeHelper';
import { Download, Package, Briefcase, GraduationCap, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductTypeBadgeProps {
  type: string;
  showIcon?: boolean;
  className?: string;
}

const iconComponents: Record<string, LucideIcon> = {
  'Download': Download,
  'Package': Package,
  'Briefcase': Briefcase,
  'GraduationCap': GraduationCap,
};

const ProductTypeBadgeComponent = ({ type, showIcon = true, className }: ProductTypeBadgeProps) => {
  const { t } = useTranslation();
  
  const { label, colorClass, IconComponent } = useMemo(() => {
    const label = getProductTypeLabel(type, t);
    const colorClass = getProductTypeColor(type);
    const iconName = getProductTypeIcon(type);
    const IconComponent = iconComponents[iconName] || Package;
    return { label, colorClass, IconComponent };
  }, [type, t]);

  return (
    <Badge 
      className={cn(
        'flex items-center gap-1 text-white border-0',
        colorClass,
        className
      )}
    >
      {showIcon && <IconComponent className="h-3 w-3" />}
      <span>{label}</span>
    </Badge>
  );
};

ProductTypeBadgeComponent.displayName = 'ProductTypeBadgeComponent';

// Optimisation avec React.memo pour éviter les re-renders inutiles
export const ProductTypeBadge = React.memo(ProductTypeBadgeComponent, (prevProps, nextProps) => {
  return (
    prevProps.type === nextProps.type &&
    prevProps.showIcon === nextProps.showIcon &&
    prevProps.className === nextProps.className
  );
});

ProductTypeBadge.displayName = 'ProductTypeBadge';

