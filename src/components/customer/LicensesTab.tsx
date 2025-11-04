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
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-64" />
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
      <Card className="p-12">
        <div className="text-center">
          <Key className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Aucune licence</h3>
          <p className="text-muted-foreground">
            Vous n'avez pas encore de licences de produits digitaux
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {licenses.map((license: any) => {
        const statusConfig = STATUS_CONFIG[license.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
        const StatusIcon = statusConfig.icon;

        return (
          <Card key={license.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  {license.digital_product?.product?.image_url && (
                    <img
                      src={license.digital_product.product.image_url}
                      alt={license.digital_product.product.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <CardTitle>{license.digital_product?.product?.name || 'Produit inconnu'}</CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-2">
                      <Badge variant={statusConfig.variant}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                      <Badge variant="outline">{license.license_type}</Badge>
                      {license.expires_at && (
                        <span className="text-xs">
                          Expire le {format(new Date(license.expires_at), 'dd MMM yyyy', { locale: fr })}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* License Key */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Clé de licence</label>
                <div className="flex gap-2">
                  <Input
                    value={license.license_key}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopyLicense(license.license_key, license.id)}
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
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Activations</span>
                  <div className="font-semibold">
                    {license.current_activations} / {license.max_activations === -1 ? '∞' : license.max_activations}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Émise le</span>
                  <div className="font-semibold">
                    {format(new Date(license.issued_at), 'dd MMM yyyy', { locale: fr })}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Shield className="h-4 w-4 mr-2" />
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

