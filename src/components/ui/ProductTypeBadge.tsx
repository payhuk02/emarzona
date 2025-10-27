/**
 * Badge pour afficher le type de produit avec traduction et icône
 * Date: 27 octobre 2025
 */

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

export const ProductTypeBadge = ({ type, showIcon = true, className }: ProductTypeBadgeProps) => {
  const { t } = useTranslation();
  
  const label = getProductTypeLabel(type, t);
  const colorClass = getProductTypeColor(type);
  const iconName = getProductTypeIcon(type);
  const IconComponent = iconComponents[iconName] || Package;

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

