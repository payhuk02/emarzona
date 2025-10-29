/**
 * LicenseManagementDashboard - Tableau de bord de gestion des licences
 * 
 * Interface professionnelle pour vendeurs permettant de :
 * - Voir toutes les licences d'un produit
 * - Générer de nouvelles licences
 * - Voir les activations
 * - Révoquer des licences
 * - Exporter les données
 */

import { useState } from 'react';
import { 
  useLicenseManagement,
  type DigitalProductLicense,
  formatLicenseKey,
  isLicenseExpired,
  getDaysUntilExpiry,
} from '@/hooks/digital/useLicenseManagement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Key,
  Plus,
  Search,
  Download,
  MoreVertical,
  Ban,
  Eye,
  Copy,
  AlertCircle,
  CheckCircle2,
  Clock,
  Smartphone,
  TrendingUp,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface LicenseManagementDashboardProps {
  productId: string;
  productName: string;
  storeId: string;
}

export const LicenseManagementDashboard = ({
  productId,
  productName,
  storeId,
}: LicenseManagementDashboardProps) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLicense, setSelectedLicense] = useState<DigitalProductLicense | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);
  
  const {
    licenses,
    loadingLicenses,
    revokeLicense,
    isRevoking,
    useActivations,
  } = useLicenseManagement(productId);

  // Filtrer les licences
  const filteredLicenses = licenses.filter(license =>
    license.license_key.toLowerCase().includes(searchQuery.toLowerCase()) ||
    license.customer_id?.includes(searchQuery)
  );

  // Statistiques
  const stats = {
    total: licenses.length,
    active: licenses.filter(l => l.status === 'active').length,
    expired: licenses.filter(l => isLicenseExpired(l)).length,
    revoked: licenses.filter(l => l.status === 'revoked').length,
    totalActivations: licenses.reduce((sum, l) => sum + l.current_activations, 0),
  };

  // Copier une clé
  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({
      title: '✅ Copié !',
      description: 'Clé de licence copiée dans le presse-papiers',
    });
  };

  // Révoquer une licence
  const handleRevoke = async (licenseId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir révoquer cette licence ?')) return;
    
    try {
      await revokeLicense(licenseId);
    } catch (error) {
      // Error handled by hook
    }
  };

  // Badge de statut
  const StatusBadge = ({ license }: { license: DigitalProductLicense }) => {
    if (license.status === 'revoked') {
      return <Badge variant="destructive">Révoquée</Badge>;
    }
    if (isLicenseExpired(license)) {
      return <Badge variant="outline" className="border-orange-500 text-orange-500">Expirée</Badge>;
    }
    if (license.status === 'active') {
      return <Badge variant="default" className="bg-green-500">Active</Badge>;
    }
    return <Badge variant="secondary">{license.status}</Badge>;
  };

  // Type de licence
  const TypeBadge = ({ type }: { type: string }) => {
    const colors = {
      single: 'bg-blue-100 text-blue-800',
      multi: 'bg-purple-100 text-purple-800',
      unlimited: 'bg-yellow-100 text-yellow-800',
      subscription: 'bg-green-100 text-green-800',
    };
    
    const labels = {
      single: 'Unique',
      multi: 'Multi',
      unlimited: 'Illimité',
      subscription: 'Abonnement',
    };

    return (
      <Badge variant="secondary" className={colors[type as keyof typeof colors]}>
        {labels[type as keyof typeof labels] || type}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header avec Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Key className="h-6 w-6 text-primary" />
            Gestion des Licences
          </h2>
          <p className="text-muted-foreground">
            {productName}
          </p>
        </div>
        
        <Button onClick={() => setShowGenerator(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Générer une licence
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Licences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Actives</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Expirées</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.expired}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Révoquées</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.revoked}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Activations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalActivations}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recherche et Filtres */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par clé de licence..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exporter
        </Button>
      </div>

      {/* Table des licences */}
      <Card>
        <CardHeader>
          <CardTitle>Licences ({filteredLicenses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingLicenses ? (
            <div className="text-center py-12 text-muted-foreground">
              Chargement...
            </div>
          ) : filteredLicenses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune licence trouvée</p>
              <Button onClick={() => setShowGenerator(true)} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Créer votre première licence
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Clé de Licence</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Activations</TableHead>
                  <TableHead>Créée le</TableHead>
                  <TableHead>Expire le</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLicenses.map((license) => (
                  <TableRow key={license.id}>
                    <TableCell className="font-mono">
                      <div className="flex items-center gap-2">
                        <span>{formatLicenseKey(license.license_key)}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopyKey(license.license_key)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <TypeBadge type={license.license_type} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge license={license} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Smartphone className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{license.current_activations}</span>
                        <span className="text-muted-foreground">
                          / {license.license_type === 'unlimited' ? '∞' : license.max_activations}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(license.created_at), 'dd MMM yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell>
                      {license.expires_at ? (
                        <div className="flex items-center gap-1">
                          {isLicenseExpired(license) ? (
                            <AlertCircle className="h-3 w-3 text-orange-500" />
                          ) : (
                            <Clock className="h-3 w-3 text-muted-foreground" />
                          )}
                          <span>
                            {format(new Date(license.expires_at), 'dd MMM yyyy', { locale: fr })}
                          </span>
                          {!isLicenseExpired(license) && (
                            <span className="text-xs text-muted-foreground">
                              ({getDaysUntilExpiry(license)}j)
                            </span>
                          )}
                        </div>
                      ) : (
                        <Badge variant="outline">Lifetime</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedLicense(license)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCopyKey(license.license_key)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copier clé
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleRevoke(license.id)}
                            className="text-destructive"
                            disabled={license.status === 'revoked' || isRevoking}
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            Révoquer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog Détails Licence */}
      {selectedLicense && (
        <LicenseDetailDialog
          license={selectedLicense}
          open={!!selectedLicense}
          onClose={() => setSelectedLicense(null)}
        />
      )}

      {/* Dialog Génération */}
      {showGenerator && (
        <LicenseGeneratorDialog
          productId={productId}
          storeId={storeId}
          open={showGenerator}
          onClose={() => setShowGenerator(false)}
        />
      )}
    </div>
  );
};

// ============================================================================
// COMPOSANT: LicenseDetailDialog
// ============================================================================

interface LicenseDetailDialogProps {
  license: DigitalProductLicense;
  open: boolean;
  onClose: () => void;
}

const LicenseDetailDialog = ({ license, open, onClose }: LicenseDetailDialogProps) => {
  const { useActivations, useEvents } = useLicenseManagement();
  const { data: activations = [] } = useActivations(license.id);
  const { data: events = [] } = useEvents(license.id);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Détails de la Licence
          </DialogTitle>
          <DialogDescription className="font-mono">
            {formatLicenseKey(license.license_key)}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Informations</TabsTrigger>
            <TabsTrigger value="activations">
              Activations ({activations.length})
            </TabsTrigger>
            <TabsTrigger value="history">
              Historique ({events.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Type</label>
                <p className="font-medium">{license.license_type}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Statut</label>
                <p className="font-medium">{license.status}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Activations</label>
                <p className="font-medium">
                  {license.current_activations} / {license.max_activations}
                </p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Transférable</label>
                <p className="font-medium">{license.transferable ? 'Oui' : 'Non'}</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="activations">
            {activations.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                Aucune activation
              </p>
            ) : (
              <div className="space-y-2">
                {activations.map((activation) => (
                  <Card key={activation.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{activation.device_name || 'Appareil inconnu'}</p>
                          <p className="text-sm text-muted-foreground">
                            IP: {activation.ip_address}
                          </p>
                        </div>
                        <Badge variant={activation.status === 'active' ? 'default' : 'secondary'}>
                          {activation.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            {events.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                Aucun événement
              </p>
            ) : (
              <div className="space-y-2">
                {events.map((event) => (
                  <div key={event.id} className="flex items-start gap-3 text-sm">
                    <div className="text-muted-foreground">
                      {format(new Date(event.created_at), 'HH:mm', { locale: fr })}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{event.event_type}</p>
                      {event.description && (
                        <p className="text-muted-foreground">{event.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

// ============================================================================
// COMPOSANT: LicenseGeneratorDialog
// ============================================================================

interface LicenseGeneratorDialogProps {
  productId: string;
  storeId: string;
  open: boolean;
  onClose: () => void;
}

const LicenseGeneratorDialog = ({
  productId,
  storeId,
  open,
  onClose,
}: LicenseGeneratorDialogProps) => {
  const { generateLicense, isGenerating } = useLicenseManagement();
  const [licenseType, setLicenseType] = useState<'single' | 'multi' | 'unlimited'>('single');
  const [maxActivations, setMaxActivations] = useState(1);

  const handleGenerate = async () => {
    try {
      await generateLicense({
        product_id: productId,
        store_id: storeId,
        license_type: licenseType,
        max_activations: maxActivations,
      });
      onClose();
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Générer une Nouvelle Licence</DialogTitle>
          <DialogDescription>
            La clé sera générée automatiquement
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Type de licence</label>
            <select
              value={licenseType}
              onChange={(e) => setLicenseType(e.target.value as any)}
              className="w-full mt-1 p-2 border rounded"
            >
              <option value="single">Unique (1 activation)</option>
              <option value="multi">Multi (plusieurs activations)</option>
              <option value="unlimited">Illimité</option>
            </select>
          </div>

          {licenseType === 'multi' && (
            <div>
              <label className="text-sm font-medium">Nombre d'activations max</label>
              <Input
                type="number"
                min={1}
                max={100}
                value={maxActivations}
                onChange={(e) => setMaxActivations(parseInt(e.target.value))}
              />
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? 'Génération...' : 'Générer la Licence'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

