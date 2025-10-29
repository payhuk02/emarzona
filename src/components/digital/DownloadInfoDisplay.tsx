import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import {
  Download,
  Calendar,
  Clock,
  User,
  Mail,
  FileText,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Shield,
  Key,
  Copy,
  ExternalLink,
  Eye,
  Package,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Statuts possibles pour un téléchargement
 */
export type DownloadStatus =
  | 'pending'        // En attente (paiement non confirmé)
  | 'active'         // Actif (accès autorisé)
  | 'completed'      // Téléchargement effectué
  | 'expired'        // Expiré (délai dépassé)
  | 'revoked'        // Révoqué (accès retiré)
  | 'suspended';     // Suspendu (activité suspecte)

/**
 * Variantes d'affichage du composant
 */
export type DownloadInfoVariant = 'compact' | 'default' | 'detailed';

/**
 * Informations client
 */
export interface DownloadCustomer {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  ipAddress?: string;
  location?: string;
}

/**
 * Informations produit
 */
export interface DownloadProduct {
  id: string;
  name: string;
  version?: string;
  fileSize: number; // en MB
  fileType: string;
  price: number;
  currency?: string;
}

/**
 * Props pour DownloadInfoDisplay
 */
export interface DownloadInfoDisplayProps {
  /** ID unique du téléchargement */
  downloadId: string;
  
  /** Statut du téléchargement */
  status: DownloadStatus;
  
  /** Date d'achat/activation */
  purchaseDate: Date | string;
  
  /** Informations client */
  customer: DownloadCustomer;
  
  /** Informations produit */
  product: DownloadProduct;
  
  /** Nombre de téléchargements effectués */
  downloadCount?: number;
  
  /** Limite de téléchargements */
  downloadLimit?: number;
  
  /** Clé de licence (si applicable) */
  licenseKey?: string;
  
  /** Variante d'affichage */
  variant?: DownloadInfoVariant;
  
  /** Classe CSS personnalisée */
  className?: string;
  
  /** Date de dernière activité */
  lastActivity?: Date | string;
  
  /** Date d'expiration */
  expiryDate?: Date | string;
  
  /** Montant payé */
  amountPaid?: number;
  
  /** Méthode de paiement */
  paymentMethod?: string;
  
  /** Niveau de protection */
  protectionLevel?: 'basic' | 'standard' | 'advanced';
  
  /** Callback pour actions */
  onAction?: (action: string) => void;
  
  /** Afficher les boutons d'action */
  showActions?: boolean;
}

/**
 * Configuration des statuts
 */
const STATUS_CONFIG: Record<
  DownloadStatus,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    textColor: string;
  }
> = {
  pending: {
    label: 'En attente',
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
  },
  active: {
    label: 'Actif',
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
  },
  completed: {
    label: 'Téléchargé',
    icon: Download,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
  },
  expired: {
    label: 'Expiré',
    icon: AlertCircle,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
  },
  revoked: {
    label: 'Révoqué',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
  },
  suspended: {
    label: 'Suspendu',
    icon: Shield,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    textColor: 'text-pink-700',
  },
};

/**
 * DownloadInfoDisplay - Composant d'affichage des informations de téléchargement
 * 
 * @example
 * ```tsx
 * <DownloadInfoDisplay 
 *   downloadId="DL-12345"
 *   status="active"
 *   purchaseDate={new Date()}
 *   customer={{ id: '1', name: 'John Doe', email: 'john@example.com' }}
 *   product={{ id: '1', name: 'Ebook React', version: '2.0', fileSize: 25, fileType: 'PDF', price: 29 }}
 *   downloadCount={2}
 *   downloadLimit={5}
 *   variant="detailed"
 * />
 * ```
 */
export const DownloadInfoDisplay: React.FC<DownloadInfoDisplayProps> = ({
  downloadId,
  status,
  purchaseDate,
  customer,
  product,
  downloadCount,
  downloadLimit,
  licenseKey,
  variant = 'default',
  className,
  lastActivity,
  expiryDate,
  amountPaid,
  paymentMethod,
  protectionLevel,
  onAction,
  showActions = false,
}) => {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  // Formater la date
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Formater la taille de fichier
  const formatFileSize = (mb: number) => {
    if (mb < 1) return `${(mb * 1024).toFixed(0)} KB`;
    return `${mb.toFixed(1)} MB`;
  };

  // Copier dans le presse-papier
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Calculer le pourcentage de téléchargements utilisés
  const downloadPercentage = downloadCount !== undefined && downloadLimit
    ? (downloadCount / downloadLimit) * 100
    : 0;

  // VARIANT: COMPACT
  if (variant === 'compact') {
    return (
      <Card className={cn('p-3', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', config.bgColor)}>
              <Icon className={cn('h-4 w-4', config.color)} />
            </div>
            <div>
              <p className="font-semibold text-sm">{customer.name}</p>
              <p className="text-xs text-muted-foreground">{product.name}</p>
            </div>
          </div>

          <div className="text-right">
            {downloadCount !== undefined && downloadLimit && (
              <p className="text-sm font-medium">{downloadCount}/{downloadLimit}</p>
            )}
            <p className="text-xs text-muted-foreground">#{downloadId}</p>
          </div>
        </div>
      </Card>
    );
  }

  // VARIANT: DEFAULT
  if (variant === 'default') {
    return (
      <Card className={cn('p-4', className)}>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={cn('p-3 rounded-lg', config.bgColor)}>
                <Icon className={cn('h-5 w-5', config.color)} />
              </div>
              <div>
                <p className={cn('font-semibold', config.textColor)}>
                  {config.label}
                </p>
                <p className="text-sm text-muted-foreground">#{downloadId}</p>
              </div>
            </div>
            {protectionLevel && (
              <Badge variant="outline" className="text-xs">
                <Shield className="h-3 w-3 mr-1" />
                {protectionLevel}
              </Badge>
            )}
          </div>

          <Separator />

          {/* Customer info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{customer.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{customer.email}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => copyToClipboard(customer.email)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Product info */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Package className="h-4 w-4 text-muted-foreground" />
              <p className="font-medium text-sm">{product.name}</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {product.version && <span>v{product.version}</span>}
              <span>•</span>
              <span>{product.fileType}</span>
              <span>•</span>
              <span>{formatFileSize(product.fileSize)}</span>
            </div>
          </div>

          {/* Download progress */}
          {downloadCount !== undefined && downloadLimit && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Téléchargements</span>
                <span className="font-medium">{downloadCount}/{downloadLimit}</span>
              </div>
              <Progress value={downloadPercentage} className="h-2" />
            </div>
          )}

          {/* License key */}
          {licenseKey && (
            <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
              <Key className="h-4 w-4 text-blue-600" />
              <code className="flex-1 text-xs font-mono">{licenseKey}</code>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => copyToClipboard(licenseKey)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* Actions */}
          {showActions && onAction && status === 'active' && (
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                onClick={() => onAction('download')}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Télécharger
              </Button>
            </div>
          )}
        </div>
      </Card>
    );
  }

  // VARIANT: DETAILED
  return (
    <Card className={cn('p-6', className)}>
      <div className="space-y-6">
        {/* Header with full status */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={cn('p-4 rounded-xl', config.bgColor)}>
              <Icon className={cn('h-6 w-6', config.color)} />
            </div>
            <div>
              <h3 className={cn('text-lg font-bold', config.textColor)}>
                {config.label}
              </h3>
              <p className="text-sm text-muted-foreground">
                Téléchargement #{downloadId}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {protectionLevel && (
              <Badge variant="outline">
                <Shield className="h-4 w-4 mr-1" />
                {protectionLevel}
              </Badge>
            )}
            {downloadCount !== undefined && downloadLimit && (
              <Badge variant="secondary">
                <Download className="h-4 w-4 mr-1" />
                {downloadCount}/{downloadLimit}
              </Badge>
            )}
          </div>
        </div>

        <Separator />

        {/* Dates */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-4 bg-muted/30">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground font-medium">Date d'achat</p>
                <p className="text-base font-semibold mt-1">
                  {formatDate(purchaseDate)}
                </p>
              </div>
            </div>
          </Card>
          
          {lastActivity && (
            <Card className="p-4 bg-muted/30">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Dernière activité</p>
                  <p className="text-base font-semibold mt-1">
                    {formatDate(lastActivity)}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Customer detailed info */}
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <User className="h-4 w-4" />
            Informations client
          </h4>
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {customer.avatar && (
                  <img
                    src={customer.avatar}
                    alt={customer.name}
                    className="h-10 w-10 rounded-full"
                  />
                )}
                <div>
                  <p className="font-semibold">{customer.name}</p>
                  <p className="text-xs text-muted-foreground">ID: {customer.id}</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Voir profil
                <ExternalLink className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{customer.email}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={() => copyToClipboard(customer.email)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            {customer.location && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Globe className="h-4 w-4" />
                <span>{customer.location}</span>
              </div>
            )}
          </Card>
        </div>

        {/* Product detailed info */}
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Détails du produit
          </h4>
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{product.name}</p>
                {product.version && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Version {product.version}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">
                  {product.price} {product.currency || 'EUR'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {product.fileType} • {formatFileSize(product.fileSize)}
                </p>
              </div>
            </div>
            {amountPaid !== undefined && (
              <>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Paiement effectué</span>
                  </div>
                  <span className="font-semibold">
                    {amountPaid} {product.currency || 'EUR'}
                    {paymentMethod && (
                      <span className="text-xs text-muted-foreground ml-2">
                        via {paymentMethod}
                      </span>
                    )}
                  </span>
                </div>
              </>
            )}
          </Card>
        </div>

        {/* Download detailed progress */}
        {downloadCount !== undefined && downloadLimit && (
          <div>
            <h4 className="text-sm font-semibold mb-3">Utilisation</h4>
            <Card className="p-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Téléchargements utilisés</span>
                <span className="text-2xl font-bold text-primary">
                  {downloadCount}/{downloadLimit}
                </span>
              </div>
              <Progress value={downloadPercentage} className="h-3" />
              <p className="text-xs text-muted-foreground">
                {downloadLimit - downloadCount} téléchargement{downloadLimit - downloadCount > 1 ? 's' : ''} restant{downloadLimit - downloadCount > 1 ? 's' : ''}
              </p>
            </Card>
          </div>
        )}

        {/* License key */}
        {licenseKey && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Key className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-blue-700">Clé de licence</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-2 bg-white rounded font-mono text-sm">
                {licenseKey}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(licenseKey)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Expiry warning */}
        {expiryDate && status === 'active' && (
          <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-orange-700">
                Accès expire le {formatDate(expiryDate)}
              </p>
              <p className="text-xs text-orange-600 mt-1">
                Le client perdra l'accès au téléchargement après cette date
              </p>
            </div>
          </div>
        )}

        {/* Detailed actions */}
        {showActions && onAction && (
          <div className="flex gap-3 pt-4">
            {status === 'active' && (
              <>
                <Button
                  size="default"
                  onClick={() => onAction('download')}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger le fichier
                </Button>
                <Button
                  size="default"
                  variant="outline"
                  onClick={() => onAction('view_details')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Détails
                </Button>
              </>
            )}
            {status === 'pending' && (
              <Button
                size="default"
                onClick={() => onAction('complete_payment')}
                className="w-full"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Compléter le paiement
              </Button>
            )}
            {status === 'revoked' && (
              <Button
                size="default"
                variant="outline"
                onClick={() => onAction('contact_support')}
                className="w-full"
              >
                Contacter le support
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

DownloadInfoDisplay.displayName = 'DownloadInfoDisplay';

export default DownloadInfoDisplay;

