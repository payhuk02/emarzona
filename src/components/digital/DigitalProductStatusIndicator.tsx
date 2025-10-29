import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Archive,
  Download,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  Shield,
  Key,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Statuts possibles pour un produit digital
 */
export type DigitalProductStatus = 
  | 'draft'         // Brouillon
  | 'published'     // Publié
  | 'active'        // Actif avec ventes
  | 'archived'      // Archivé
  | 'suspended';    // Suspendu (violation, etc.)

/**
 * Variantes d'affichage du composant
 */
export type DigitalStatusVariant = 'compact' | 'default' | 'detailed';

/**
 * Props pour DigitalProductStatusIndicator
 */
export interface DigitalProductStatusIndicatorProps {
  /** Statut actuel du produit */
  status: DigitalProductStatus;
  
  /** Nombre total de téléchargements */
  totalDownloads?: number;
  
  /** Téléchargements récents (7 derniers jours) */
  recentDownloads?: number;
  
  /** Tendance des téléchargements */
  downloadTrend?: 'up' | 'down' | 'stable';
  
  /** Nombre de licences actives */
  activeLicenses?: number;
  
  /** Nombre de licences totales */
  totalLicenses?: number;
  
  /** Seuil de licence faible (par défaut: 20%) */
  lowLicenseThreshold?: number;
  
  /** Afficher la barre de progression */
  showProgress?: boolean;
  
  /** Variante d'affichage */
  variant?: DigitalStatusVariant;
  
  /** Classe CSS personnalisée */
  className?: string;
  
  /** Revenue généré */
  revenue?: number;
  
  /** Devise */
  currency?: string;
  
  /** Nombre de clients actifs */
  activeCustomers?: number;
  
  /** Niveau de protection */
  protectionLevel?: 'basic' | 'standard' | 'advanced';
}

/**
 * Configuration des statuts avec leurs propriétés visuelles
 */
const STATUS_CONFIG: Record<
  DigitalProductStatus,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    borderColor: string;
    textColor: string;
    badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline';
  }
> = {
  draft: {
    label: 'Brouillon',
    icon: Clock,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    textColor: 'text-gray-700',
    badgeVariant: 'outline',
  },
  published: {
    label: 'Publié',
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700',
    badgeVariant: 'default',
  },
  active: {
    label: 'Actif',
    icon: TrendingUp,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    badgeVariant: 'default',
  },
  archived: {
    label: 'Archivé',
    icon: Archive,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-700',
    badgeVariant: 'outline',
  },
  suspended: {
    label: 'Suspendu',
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-700',
    badgeVariant: 'destructive',
  },
};

/**
 * Configuration des niveaux de protection
 */
const PROTECTION_LEVELS: Record<string, { label: string; color: string }> = {
  basic: { label: 'Basique', color: 'text-gray-600' },
  standard: { label: 'Standard', color: 'text-blue-600' },
  advanced: { label: 'Avancé', color: 'text-green-600' },
};

/**
 * DigitalProductStatusIndicator - Composant d'affichage du statut de produit digital
 * 
 * @example
 * ```tsx
 * // Compact variant
 * <DigitalProductStatusIndicator 
 *   status="active" 
 *   variant="compact"
 * />
 * 
 * // Default with downloads
 * <DigitalProductStatusIndicator 
 *   status="published" 
 *   totalDownloads={450}
 *   recentDownloads={12}
 *   showProgress={true}
 * />
 * 
 * // Detailed with all metrics
 * <DigitalProductStatusIndicator 
 *   status="active" 
 *   variant="detailed"
 *   totalDownloads={1250}
 *   recentDownloads={85}
 *   downloadTrend="up"
 *   activeLicenses={320}
 *   totalLicenses={500}
 *   revenue={4250}
 *   activeCustomers={280}
 *   protectionLevel="advanced"
 *   showProgress={true}
 * />
 * ```
 */
export const DigitalProductStatusIndicator: React.FC<DigitalProductStatusIndicatorProps> = ({
  status,
  totalDownloads,
  recentDownloads,
  downloadTrend = 'stable',
  activeLicenses,
  totalLicenses,
  lowLicenseThreshold = 20,
  showProgress = false,
  variant = 'default',
  className,
  revenue,
  currency = 'EUR',
  activeCustomers,
  protectionLevel,
}) => {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  // Calculer le pourcentage de licences utilisées
  const licensePercentage = activeLicenses !== undefined && totalLicenses
    ? (activeLicenses / totalLicenses) * 100
    : 0;

  const isLowLicense = activeLicenses !== undefined && totalLicenses
    ? ((totalLicenses - activeLicenses) / totalLicenses) * 100 <= lowLicenseThreshold
    : false;

  // Obtenir l'icône de tendance
  const getTrendIcon = () => {
    switch (downloadTrend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-600" />;
      default:
        return <Minus className="h-3 w-3 text-gray-400" />;
    }
  };

  // VARIANT: COMPACT
  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn('inline-flex items-center gap-1.5', className)}>
              <Icon className={cn('h-4 w-4', config.color)} />
              <Badge variant={config.badgeVariant} className="text-xs">
                {config.label}
              </Badge>
              {totalDownloads !== undefined && (
                <span className="text-xs text-muted-foreground">
                  {totalDownloads.toLocaleString()} DL
                </span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm space-y-1">
              <p className="font-medium">{config.label}</p>
              {totalDownloads !== undefined && (
                <p className="text-xs text-muted-foreground">
                  {totalDownloads.toLocaleString()} téléchargements
                </p>
              )}
              {activeLicenses !== undefined && totalLicenses && (
                <p className="text-xs text-muted-foreground">
                  {activeLicenses} licences actives sur {totalLicenses}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // VARIANT: DEFAULT
  if (variant === 'default') {
    return (
      <Card className={cn('p-4', config.borderColor, className)}>
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn('p-2 rounded-lg', config.bgColor)}>
                <Icon className={cn('h-5 w-5', config.color)} />
              </div>
              <div>
                <p className={cn('font-semibold text-sm', config.textColor)}>
                  {config.label}
                </p>
                {protectionLevel && (
                  <p className={cn('text-xs', PROTECTION_LEVELS[protectionLevel].color)}>
                    Protection {PROTECTION_LEVELS[protectionLevel].label}
                  </p>
                )}
              </div>
            </div>

            {/* Downloads badge */}
            {totalDownloads !== undefined && (
              <Badge variant="secondary" className="text-xs">
                <Download className="h-3 w-3 mr-1" />
                {totalDownloads.toLocaleString()}
              </Badge>
            )}
          </div>

          {/* License progress */}
          {showProgress && totalLicenses && activeLicenses !== undefined && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Licences actives</span>
                <span className="font-medium">
                  {activeLicenses}/{totalLicenses}
                </span>
              </div>
              <Progress 
                value={licensePercentage} 
                className={cn(
                  'h-2',
                  isLowLicense && 'bg-orange-100'
                )}
              />
            </div>
          )}

          {/* Revenue */}
          {revenue !== undefined && revenue > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="font-semibold text-green-600">
                {revenue.toLocaleString()} {currency}
              </span>
            </div>
          )}

          {/* Low license warning */}
          {isLowLicense && status === 'published' && (
            <div className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <p className="text-xs text-orange-700">
                Licences limitées - Seulement {totalLicenses - activeLicenses} restantes
              </p>
            </div>
          )}
        </div>
      </Card>
    );
  }

  // VARIANT: DETAILED
  return (
    <Card className={cn('p-4', config.borderColor, className)}>
      <div className="space-y-4">
        {/* Header with status and stats */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('p-3 rounded-lg', config.bgColor)}>
              <Icon className={cn('h-6 w-6', config.color)} />
            </div>
            <div>
              <p className={cn('font-bold text-base', config.textColor)}>
                {config.label}
              </p>
              {protectionLevel && (
                <div className="flex items-center gap-1 mt-1">
                  <Shield className={cn('h-3 w-3', PROTECTION_LEVELS[protectionLevel].color)} />
                  <span className={cn('text-xs', PROTECTION_LEVELS[protectionLevel].color)}>
                    Protection {PROTECTION_LEVELS[protectionLevel].label}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Downloads badge */}
          {totalDownloads !== undefined && (
            <div className="text-right">
              <Badge variant="default" className="text-sm">
                <Download className="h-3 w-3 mr-1" />
                {totalDownloads.toLocaleString()}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">
                téléchargements
              </p>
            </div>
          )}
        </div>

        {/* Detailed license progress */}
        {showProgress && totalLicenses && activeLicenses !== undefined && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Licences actives</span>
              <span className="font-medium">{Math.round(licensePercentage)}%</span>
            </div>
            <Progress 
              value={licensePercentage} 
              className={cn(
                'h-3',
                isLowLicense ? 'bg-orange-100' : 'bg-green-100'
              )}
            />
            <p className="text-xs text-muted-foreground">
              {activeLicenses} sur {totalLicenses} licences utilisées
            </p>
          </div>
        )}

        {/* Recent downloads and trend */}
        {recentDownloads !== undefined && (
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">7 derniers jours</p>
                <p className="text-sm font-semibold">{recentDownloads} téléchargements</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {getTrendIcon()}
              <span className="text-xs text-muted-foreground">
                {downloadTrend === 'up' && '+'}
                {downloadTrend === 'down' && '-'}
                {downloadTrend === 'stable' && '='}
              </span>
            </div>
          </div>
        )}

        {/* Revenue & Customers stats */}
        <div className="grid grid-cols-2 gap-3">
          {revenue !== undefined && revenue > 0 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-xs text-green-700 font-medium">Revenue</p>
                  <p className="text-lg font-bold text-green-900">
                    {revenue.toLocaleString()} {currency}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeCustomers !== undefined && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-xs text-blue-700 font-medium">Clients actifs</p>
                  <p className="text-lg font-bold text-blue-900">{activeCustomers}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Alerts */}
        {isLowLicense && status === 'published' && (
          <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-orange-700">
                Licences limitées ({totalLicenses - activeLicenses} restantes)
              </p>
              <p className="text-xs text-orange-600 mt-1">
                Recommandation : Augmenter le nombre de licences disponibles
              </p>
            </div>
          </div>
        )}

        {status === 'draft' && (
          <div className="flex items-start gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <Clock className="h-5 w-5 text-gray-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-700">
                Produit en brouillon
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Publiez ce produit pour le rendre disponible au téléchargement
              </p>
            </div>
          </div>
        )}

        {status === 'suspended' && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-700">
                Produit suspendu
              </p>
              <p className="text-xs text-red-600 mt-1">
                Ce produit n'est plus accessible aux clients
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

DigitalProductStatusIndicator.displayName = 'DigitalProductStatusIndicator';

export default DigitalProductStatusIndicator;

