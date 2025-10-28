/**
 * Digital License Card - Professional
 * Date: 27 octobre 2025
 * 
 * Affichage et gestion des licenses
 */

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Copy,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  Smartphone,
  AlertTriangle,
} from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Progress } from '@/components/ui/progress';

interface DigitalLicenseCardProps {
  license: {
    id: string;
    license_key: string;
    license_type: string;
    status: string;
    max_activations: number;
    current_activations: number;
    issued_at: string;
    expires_at: string | null;
    digital_product: {
      product: {
        name: string;
        image_url: string | null;
      };
    };
  };
  showActions?: boolean;
  onManage?: () => void;
}

const STATUS_CONFIG = {
  active: {
    label: 'Active',
    color: 'bg-green-500',
    icon: CheckCircle2,
    variant: 'default' as const,
  },
  suspended: {
    label: 'Suspendue',
    color: 'bg-yellow-500',
    icon: AlertTriangle,
    variant: 'secondary' as const,
  },
  expired: {
    label: 'Expirée',
    color: 'bg-red-500',
    icon: XCircle,
    variant: 'destructive' as const,
  },
  revoked: {
    label: 'Révoquée',
    color: 'bg-gray-500',
    icon: XCircle,
    variant: 'outline' as const,
  },
  pending: {
    label: 'En attente',
    color: 'bg-blue-500',
    icon: Clock,
    variant: 'secondary' as const,
  },
};

const LICENSE_TYPE_LABELS = {
  single: 'Unique',
  multi: 'Multi-Devices',
  unlimited: 'Illimitée',
  subscription: 'Abonnement',
  lifetime: 'À vie',
};

export const DigitalLicenseCard = ({
  license,
  showActions = true,
  onManage,
}: DigitalLicenseCardProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const statusConfig = STATUS_CONFIG[license.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;

  /**
   * Copy license key to clipboard
   */
  const copyLicenseKey = async () => {
    try {
      await navigator.clipboard.writeText(license.license_key);
      setCopied(true);
      toast({
        title: 'Copié !',
        description: 'Clé de license copiée dans le presse-papiers',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de copier la clé',
        variant: 'destructive',
      });
    }
  };

  /**
   * Calculate expiry status
   */
  const getExpiryStatus = () => {
    if (!license.expires_at) {
      return { label: 'Permanent', variant: 'default' as const, daysLeft: null };
    }

    const expiryDate = new Date(license.expires_at);
    const now = new Date();
    const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) {
      return { label: 'Expirée', variant: 'destructive' as const, daysLeft: 0 };
    }
    if (daysLeft <= 7) {
      return { label: `${daysLeft}j restants`, variant: 'destructive' as const, daysLeft };
    }
    if (daysLeft <= 30) {
      return { label: `${daysLeft}j restants`, variant: 'secondary' as const, daysLeft };
    }
    return { label: `${daysLeft}j restants`, variant: 'outline' as const, daysLeft };
  };

  const expiryStatus = getExpiryStatus();
  const activationProgress = license.max_activations === -1 
    ? 100
    : (license.current_activations / license.max_activations) * 100;

  return (
    <Card className="overflow-hidden">
      {/* Header with product info */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {license.digital_product.product.image_url && (
              <img
                src={license.digital_product.product.image_url}
                alt={license.digital_product.product.name}
                className="w-12 h-12 rounded object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate">
                {license.digital_product.product.name}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Badge variant={statusConfig.variant} className="text-xs">
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusConfig.label}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {LICENSE_TYPE_LABELS[license.license_type as keyof typeof LICENSE_TYPE_LABELS]}
                </Badge>
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* License Key */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Clé de license</label>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-muted rounded text-sm font-mono">
              {license.license_key}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={copyLicenseKey}
              className="flex-shrink-0"
            >
              {copied ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Activations */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Activations
            </span>
            <span className="text-muted-foreground">
              {license.current_activations} / {license.max_activations === -1 ? '∞' : license.max_activations}
            </span>
          </div>
          {license.max_activations !== -1 && (
            <Progress value={activationProgress} className="h-2" />
          )}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground block mb-1">Émise le</span>
            <span className="font-medium">
              {format(new Date(license.issued_at), 'dd MMM yyyy', { locale: fr })}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block mb-1">Expire le</span>
            {license.expires_at ? (
              <div className="space-y-1">
                <span className="font-medium">
                  {format(new Date(license.expires_at), 'dd MMM yyyy', { locale: fr })}
                </span>
                <Badge variant={expiryStatus.variant} className="text-xs ml-2">
                  {expiryStatus.label}
                </Badge>
              </div>
            ) : (
              <Badge className="text-xs">
                <Shield className="h-3 w-3 mr-1" />
                Permanent
              </Badge>
            )}
          </div>
        </div>
      </CardContent>

      {showActions && (
        <CardFooter className="pt-3 border-t">
          <Button
            variant="outline"
            className="w-full"
            onClick={onManage}
          >
            Gérer les activations
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

/**
 * Skeleton for loading state
 */
export const DigitalLicenseCardSkeleton = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-muted rounded animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-muted rounded animate-pulse w-3/4" />
            <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-10 bg-muted rounded animate-pulse" />
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-12 bg-muted rounded animate-pulse" />
          <div className="h-12 bg-muted rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Grid of license cards
 */
export const DigitalLicensesGrid = ({
  licenses,
  loading,
  onManageLicense,
}: {
  licenses: any[];
  loading?: boolean;
  onManageLicense?: (licenseId: string) => void;
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <DigitalLicenseCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (licenses.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Aucune license</h3>
          <p className="text-muted-foreground">
            Vos licenses de produits digitaux apparaîtront ici
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {licenses.map((license) => (
        <DigitalLicenseCard
          key={license.id}
          license={license}
          onManage={() => onManageLicense?.(license.id)}
        />
      ))}
    </div>
  );
};


