/**
 * MyLicenses - Gestion des licences du client
 * Date: 2025-01-27
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Key,
  Copy,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  Eye,
  EyeOff,
  History,
  Smartphone,
  Trash2,
  RefreshCw,
  ArrowRightLeft,
} from 'lucide-react';
import { AlertCircleIcon } from '@/components/icons/AlertCircleIcon';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { logger } from '@/lib/logger';
import { useLicenseManagement, type LicenseActivation, type LicenseEvent } from '@/hooks/digital/useLicenseManagement';

interface CustomerLicense {
  id: string;
  license_key: string;
  product_name: string;
  product_image_url: string | null;
  license_type: string;
  status: string;
  max_activations: number;
  current_activations: number;
  issued_at: string;
  activated_at: string | null;
  expires_at: string | null;
  last_used_at: string | null;
  transferable: boolean;
}

export const MyLicenses = () => {
  const { toast } = useToast();
  const [selectedLicense, setSelectedLicense] = useState<CustomerLicense | null>(null);
  const [showLicenseKey, setShowLicenseKey] = useState<Record<string, boolean>>({});

  const { data: licenses, isLoading, error } = useQuery({
    queryKey: ['customerLicenses'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Récupérer le customer_id
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('email', user.email)
        .limit(1)
        .single();

      if (!customer) return [];

      // Récupérer les licences
      const { data, error } = await supabase
        .from('digital_licenses')
        .select(`
          *,
          digital_product:digital_products!inner (
            product:products!inner (
              id,
              name,
              image_url
            )
          )
        `)
        .eq('user_id', user.id)
        .order('issued_at', { ascending: false });

      if (error) {
        logger.error('Error fetching licenses', { error });
        throw error;
      }

      return (data || []).map((license: any) => ({
        id: license.id,
        license_key: license.license_key,
        product_name: license.digital_product?.product?.name || 'Produit supprimé',
        product_image_url: license.digital_product?.product?.image_url,
        license_type: license.license_type,
        status: license.status,
        max_activations: license.max_activations,
        current_activations: license.current_activations,
        issued_at: license.issued_at,
        activated_at: license.activated_at,
        expires_at: license.expires_at,
        last_used_at: license.last_used_at,
        transferable: license.allow_license_transfer || false,
      })) as CustomerLicense[];
    },
  });

  const copyLicenseKey = (licenseKey: string, licenseId: string) => {
    navigator.clipboard.writeText(licenseKey);
    toast({
      title: 'Clé copiée',
      description: 'La clé de licence a été copiée dans le presse-papiers',
    });
  };

  const toggleLicenseKeyVisibility = (licenseId: string) => {
    setShowLicenseKey(prev => ({
      ...prev,
      [licenseId]: !prev[licenseId],
    }));
  };

  const maskLicenseKey = (key: string) => {
    if (key.length <= 8) return key;
    return `${key.substring(0, 4)}-****-****-${key.substring(key.length - 4)}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">Actif</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expiré</Badge>;
      case 'suspended':
        return <Badge variant="secondary">Suspendu</Badge>;
      case 'revoked':
        return <Badge variant="destructive">Révoqué</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircleIcon className="h-4 w-4" size={16} />
        <AlertDescription>
          Erreur lors du chargement de vos licences. Veuillez réessayer plus tard.
        </AlertDescription>
      </Alert>
    );
  }

  if (!licenses || licenses.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Key className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucune licence</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Vous n'avez pas encore de licences. Les licences sont générées automatiquement lors de l'achat de produits nécessitant une activation.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{licenses.length}</div>
            <div className="text-sm text-muted-foreground">Licences totales</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {licenses.filter(l => l.status === 'active').length}
            </div>
            <div className="text-sm text-muted-foreground">Licences actives</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {licenses.reduce((sum, l) => sum + l.current_activations, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Activations</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {licenses.filter(l => l.status === 'expired' || l.status === 'revoked').length}
            </div>
            <div className="text-sm text-muted-foreground">Expirées/Révoquées</div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des licences */}
      <div className="space-y-4">
        {licenses.map((license) => (
          <Card key={license.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Image produit */}
                {license.product_image_url && (
                  <div className="flex-shrink-0">
                    <img
                      src={license.product_image_url}
                      alt={license.product_name}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  </div>
                )}

                {/* Informations */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">{license.product_name}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(license.status)}
                        <Badge variant="outline" className="capitalize">
                          {license.license_type}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Clé de licence */}
                  <div className="space-y-2">
                    <Label>Clé de licence</Label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex items-center gap-2 p-3 bg-muted rounded-lg font-mono text-sm">
                        <Key className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {showLicenseKey[license.id]
                            ? license.license_key
                            : maskLicenseKey(license.license_key)}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => toggleLicenseKeyVisibility(license.id)}
                        aria-label={showLicenseKey[license.id] ? "Masquer la clé de licence" : "Afficher la clé de licence"}
                      >
                        {showLicenseKey[license.id] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyLicenseKey(license.license_key, license.id)}
                        aria-label="Copier la clé de licence"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Activations */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Activations</div>
                      <div className="font-medium">
                        {license.current_activations} / {license.max_activations === -1 ? '∞' : license.max_activations}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Délivrée le</div>
                      <div className="font-medium">
                        {format(new Date(license.issued_at), 'dd/MM/yyyy', { locale: fr })}
                      </div>
                    </div>
                    {license.activated_at && (
                      <div>
                        <div className="text-muted-foreground">Activée le</div>
                        <div className="font-medium">
                          {format(new Date(license.activated_at), 'dd/MM/yyyy', { locale: fr })}
                        </div>
                      </div>
                    )}
                    {license.expires_at && (
                      <div>
                        <div className="text-muted-foreground">Expire le</div>
                        <div className={license.status === 'expired' ? 'text-red-600 font-medium' : 'font-medium'}>
                          {format(new Date(license.expires_at), 'dd/MM/yyyy', { locale: fr })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Dernière utilisation */}
                  {license.last_used_at && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        Dernière utilisation : {format(new Date(license.last_used_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                      </span>
                    </div>
                  )}

                  {/* Transfert */}
                  {license.transferable && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Shield className="h-4 w-4" />
                      <span>Cette licence peut être transférée</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedLicense(license)}
                    >
                      <History className="h-4 w-4 mr-2" />
                      Voir détails
                    </Button>
                    {license.transferable && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTransferLicense(license)}
                      >
                        <ArrowRightLeft className="h-4 w-4 mr-2" />
                        Transférer
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog de détails de licence */}
      {selectedLicense && (
        <LicenseDetailsDialog
          license={selectedLicense}
          onClose={() => setSelectedLicense(null)}
        />
      )}
    </div>
  );
};

// Composant pour afficher les détails d'une licence
function LicenseDetailsDialog({
  license,
  onClose,
}: {
  license: CustomerLicense;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupérer les activations
  const { data: activations = [], isLoading: loadingActivations } = useQuery({
    queryKey: ['license-activations', license.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('license_activations')
        .select('*')
        .eq('license_id', license.id)
        .order('activated_at', { ascending: false });

      if (error) throw error;
      return data as LicenseActivation[];
    },
  });

  // Récupérer l'historique
  const { data: events = [], isLoading: loadingEvents } = useQuery({
    queryKey: ['license-events', license.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('license_events')
        .select('*')
        .eq('license_id', license.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as LicenseEvent[];
    },
  });

  // Désactiver une activation
  const deactivateActivation = useMutation({
    mutationFn: async (activationId: string) => {
      const { data: activation, error } = await supabase
        .from('license_activations')
        .update({
          status: 'deactivated',
          deactivated_at: new Date().toISOString(),
        })
        .eq('id', activationId)
        .select()
        .single();

      if (error) throw error;

      // Décrémenter le compteur
      const { data: licenseData } = await supabase
        .from('digital_licenses')
        .select('current_activations')
        .eq('id', license.id)
        .single();

      if (licenseData) {
        await supabase
          .from('digital_licenses')
          .update({
            current_activations: Math.max(0, licenseData.current_activations - 1),
          })
          .eq('id', license.id);
      }

      return activation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['license-activations', license.id] });
      queryClient.invalidateQueries({ queryKey: ['customerLicenses'] });
      toast({
        title: '✅ Activation désactivée',
        description: 'L\'activation a été désactivée avec succès',
      });
    },
    onError: (error: any) => {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de désactiver l\'activation',
        variant: 'destructive',
      });
    },
  });

  return (
    <Dialog open={!!license} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Détails de la licence</span>
            <Badge variant="outline">{license.license_key}</Badge>
          </DialogTitle>
          <DialogDescription>
            {license.product_name} - {license.license_type}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="activations" className="w-full">
          <TabsList>
            <TabsTrigger value="activations">
              <Smartphone className="h-4 w-4 mr-2" />
              Activations ({activations.length})
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="h-4 w-4 mr-2" />
              Historique ({events.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="activations" className="space-y-4">
            {loadingActivations ? (
              <Skeleton className="h-32 w-full" />
            ) : activations.length === 0 ? (
              <Alert>
                <AlertDescription>
                  Aucune activation enregistrée pour cette licence.
                </AlertDescription>
              </Alert>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Appareil</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Activée le</TableHead>
                    <TableHead>Dernière vue</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activations.map((activation) => (
                    <TableRow key={activation.id}>
                      <TableCell>
                        {activation.device_name || activation.device_fingerprint?.substring(0, 8) || 'Inconnu'}
                      </TableCell>
                      <TableCell>{activation.ip_address || '-'}</TableCell>
                      <TableCell>
                        {activation.status === 'active' ? (
                          <Badge variant="default" className="bg-green-500">Actif</Badge>
                        ) : (
                          <Badge variant="secondary">Désactivé</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(activation.activated_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        {activation.last_seen_at
                          ? format(new Date(activation.last_seen_at), 'dd/MM/yyyy HH:mm', { locale: fr })
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {activation.status === 'active' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deactivateActivation.mutate(activation.id)}
                            disabled={deactivateActivation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {loadingEvents ? (
              <Skeleton className="h-32 w-full" />
            ) : events.length === 0 ? (
              <Alert>
                <AlertDescription>
                  Aucun événement enregistré pour cette licence.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2">
                {events.map((event) => (
                  <Card key={event.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">{event.event_type}</div>
                          {event.description && (
                            <div className="text-sm text-muted-foreground">{event.description}</div>
                          )}
                          <div className="text-xs text-muted-foreground mt-1">
                            {format(new Date(event.created_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                          </div>
                        </div>
                        {event.ip_address && (
                          <Badge variant="outline" className="text-xs">
                            {event.ip_address}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Fonction pour gérer le transfert de licence
function handleTransferLicense(license: CustomerLicense) {
  // TODO: Implémenter le transfert de licence
  console.log('Transfer license', license);
}

