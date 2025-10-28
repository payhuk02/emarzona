/**
 * My Licenses Page - Customer View
 * Date: 27 octobre 2025
 * 
 * Page pour gérer les licenses des produits digitaux
 */

import { useState } from 'react';
import { useUserLicenses, useLicenseActivations, useDeactivateLicense } from '@/hooks/digital/useLicenses';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  Search,
  Smartphone,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Monitor,
} from 'lucide-react';
import { DigitalLicensesGrid } from '@/components/digital';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

export const MyLicenses = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLicenseId, setSelectedLicenseId] = useState<string | null>(null);
  const { data: licenses, isLoading } = useUserLicenses();
  const { toast } = useToast();

  /**
   * Filter licenses
   */
  const filteredLicenses = licenses?.filter((license) => {
    const productName = license.digital_product?.product?.name || '';
    return productName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  /**
   * Calculate stats
   */
  const stats = {
    total: licenses?.length || 0,
    active: licenses?.filter((l) => l.status === 'active').length || 0,
    expired: licenses?.filter((l) => l.status === 'expired').length || 0,
    suspended: licenses?.filter((l) => l.status === 'suspended').length || 0,
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <main className="flex-1 overflow-x-hidden">
          <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold">Mes Licenses</h1>
              <p className="text-muted-foreground mt-1">
                Gérez vos licenses de produits digitaux
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground">
                    Licenses
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Actives</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {stats.active}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Expirées</CardTitle>
                  <XCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {stats.expired}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Suspendues</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {stats.suspended}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Rechercher</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher une license..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Licenses Grid */}
            <DigitalLicensesGrid
              licenses={filteredLicenses || []}
              loading={isLoading}
              onManageLicense={(licenseId) => setSelectedLicenseId(licenseId)}
            />

            {/* License Management Dialog */}
            {selectedLicenseId && (
              <LicenseManagementDialog
                licenseId={selectedLicenseId}
                open={!!selectedLicenseId}
                onClose={() => setSelectedLicenseId(null)}
              />
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

/**
 * License Management Dialog
 */
const LicenseManagementDialog = ({
  licenseId,
  open,
  onClose,
}: {
  licenseId: string;
  open: boolean;
  onClose: () => void;
}) => {
  const { data: activations, isLoading } = useLicenseActivations(licenseId);
  const deactivate = useDeactivateLicense();
  const { toast } = useToast();

  const handleDeactivate = async (activationId: string) => {
    try {
      await deactivate.mutateAsync({
        licenseId,
        activationId,
      });
      toast({
        title: 'Succès',
        description: 'Appareil désactivé',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de désactiver',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gérer les activations</DialogTitle>
          <DialogDescription>
            Activations de cette license sur vos appareils
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : !activations || activations.length === 0 ? (
            <Card className="p-6">
              <div className="text-center">
                <Smartphone className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Aucune activation
                </p>
              </div>
            </Card>
          ) : (
            activations.map((activation: any) => (
              <Card key={activation.id} className={!activation.is_active ? 'opacity-50' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 rounded-lg bg-muted">
                        <Monitor className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium truncate">
                            {activation.device_name || 'Appareil sans nom'}
                          </h4>
                          <Badge variant={activation.is_active ? 'default' : 'secondary'}>
                            {activation.is_active ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1 text-sm text-muted-foreground">
                          {activation.os_name && (
                            <p>{activation.os_name} {activation.os_version}</p>
                          )}
                          <p>IP: {activation.ip_address}</p>
                          {activation.country && (
                            <p>Pays: {activation.country}</p>
                          )}
                          <p className="text-xs">
                            Activé le {format(new Date(activation.activated_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {activation.is_active && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeactivate(activation.id)}
                        disabled={deactivate.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MyLicenses;


