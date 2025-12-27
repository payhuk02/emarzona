/**
 * Licenses Tab Component
 * Date: 27 Janvier 2025
 * 
 * Onglet pour afficher les licences du client
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { useUserLicenses } from '@/hooks/digital/useLicenses';
import { Key, Copy, CheckCircle2, XCircle, Clock, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const STATUS_CONFIG = {
  active: {
    label: 'Actif',
    color: 'bg-green-500',
    icon: CheckCircle2,
    variant: 'default' as const,
  },
  suspended: {
    label: 'Suspendu',
    color: 'bg-yellow-500',
    icon: Clock,
    variant: 'secondary' as const,
  },
  expired: {
    label: 'Expiré',
    color: 'bg-red-500',
    icon: XCircle,
    variant: 'destructive' as const,
  },
  revoked: {
    label: 'Révoqué',
    color: 'bg-red-500',
    icon: XCircle,
    variant: 'destructive' as const,
  },
  pending: {
    label: 'En attente',
    color: 'bg-gray-500',
    icon: Clock,
    variant: 'outline' as const,
  },
};

export const LicensesTab = () => {
  const { data: licenses, isLoading } = useUserLicenses();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCopyLicense = (licenseKey: string, licenseId: string) => {
    navigator.clipboard.writeText(licenseKey);
    setCopiedId(licenseId);
    toast({
      title: '✅ Clé copiée',
      description: 'La clé de licence a été copiée dans le presse-papiers',
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="space-y-3 sm:space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border shadow-sm">
            <CardHeader className="pb-3">
              <Skeleton className="h-5 sm:h-6 w-48 sm:w-64" />
              <Skeleton className="h-4 w-32 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!licenses || licenses.length === 0) {
    return (
      <Card className="p-8 sm:p-12 border shadow-sm">
        <div className="text-center space-y-3">
          <Key className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-gray-400 dark:text-gray-500" />
          <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-900 dark:text-gray-50">
            Aucune licence
          </h3>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Vous n'avez pas encore de licences de produits digitaux
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {licenses.map((license: any) => {
        const statusConfig = STATUS_CONFIG[license.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
        const StatusIcon = statusConfig.icon;

        return (
          <Card key={license.id} className="border shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                <div className="flex items-start gap-3 sm:gap-4">
                  {license.digital_product?.product?.image_url && (
                    <img
                      src={license.digital_product.product.image_url}
                      alt={license.digital_product.product.name}
                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base sm:text-lg text-gray-900 dark:text-gray-50 break-words">
                      {license.digital_product?.product?.name || 'Produit inconnu'}
                    </CardTitle>
                    <CardDescription className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
                      <Badge variant={statusConfig.variant} className="text-xs">
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                      <Badge variant="outline" className="text-xs">{license.license_type}</Badge>
                      {license.expires_at && (
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          Expire le {format(new Date(license.expires_at), 'dd MMM yyyy', { locale: fr })}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 pt-0">
              {/* License Key */}
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-50">
                  Clé de licence
                </label>
                <div className="flex gap-2">
                  <Input
                    value={license.license_key}
                    readOnly
                    className="font-mono text-xs sm:text-sm flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopyLicense(license.license_key, license.id)}
                    className="flex-shrink-0"
                    aria-label="Copier la clé de licence"
                  >
                    {copiedId === license.id ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Activations */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                <div>
                  <span className="text-muted-foreground block mb-1">Activations</span>
                  <div className="font-semibold text-gray-900 dark:text-gray-50">
                    {license.current_activations} / {license.max_activations === -1 ? '∞' : license.max_activations}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Émise le</span>
                  <div className="font-semibold text-gray-900 dark:text-gray-50">
                    {format(new Date(license.issued_at), 'dd MMM yyyy', { locale: fr })}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 text-xs sm:text-sm">
                  <Shield className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Gérer les activations
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};







