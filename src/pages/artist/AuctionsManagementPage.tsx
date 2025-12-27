/**
 * Page de Gestion des Ventes aux Enchères
 * Date: 1 Février 2025
 * 
 * Interface complète pour gérer les ventes aux enchères d'œuvres d'artistes :
 * - Création et édition d'enchères
 * - Suivi des offres
 * - Gestion des enchères actives
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { _Tabs, _TabsContent, _TabsList, _TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Gavel,
  Plus,
  Edit,
  Trash2,
  Eye,
  _Clock,
  TrendingUp,
  Users,
  DollarSign,
  _Calendar,
  _Settings,
  _CheckCircle2,
  _XCircle,
  _AlertCircle,
} from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { useToast } from '@/hooks/use-toast';
import {
  _useActiveAuctions,
  useStoreAuctions,
  useCreateAuction,
  useUpdateAuction,
  useDeleteAuction,
  type ArtistProductAuction,
} from '@/hooks/artist/useArtistAuctions';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AuctionsManagementPage() {
  const { store } = useStore();
  const navigate = useNavigate();
  const { _toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState<ArtistProductAuction | null>(null);

  const { data: auctions, isLoading } = useStoreAuctions(store?.id || '');
  const createAuction = useCreateAuction();
  const updateAuction = useUpdateAuction();
  const deleteAuction = useDeleteAuction();

  const handleCreateAuction = async (formData: Partial<ArtistProductAuction>) => {
    if (!store?.id) return;

    try {
      await createAuction.mutateAsync({
        ...formData,
        store_id: store.id,
      } as Partial<ArtistProductAuction> & { store_id: string });
      setIsCreateDialogOpen(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const getStatusBadge = (status: string) => {
    const  variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      draft: 'secondary',
      scheduled: 'outline',
      active: 'default',
      paused: 'secondary',
      ended: 'secondary',
      cancelled: 'destructive',
      sold: 'default',
    };

    const  colors: Record<string, string> = {
      active: 'bg-green-500',
      sold: 'bg-blue-500',
    };

    return (
      <Badge variant={variants[status] || 'secondary'} className={colors[status]}>
        {status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 p-8">
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-64 w-full" />
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Gavel className="h-8 w-8" />
                  Ventes aux Enchères
                </h1>
                <p className="text-muted-foreground mt-2">
                  Gérez vos ventes aux enchères d'œuvres d'artistes
                </p>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle Enchère
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Créer une Nouvelle Enchère</DialogTitle>
                    <DialogDescription>
                      Configurez une nouvelle vente aux enchères pour une œuvre d'artiste
                    </DialogDescription>
                  </DialogHeader>
                  <CreateAuctionForm
                    onSubmit={handleCreateAuction}
                    onCancel={() => setIsCreateDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Enchères Actives</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {auctions?.filter(a => a.status === 'active').length || 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Enchères</CardTitle>
                  <Gavel className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{auctions?.length || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Offres</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {auctions?.reduce((sum, a) => sum + (a.total_bids || 0), 0) || 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Valeur Totale</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {auctions?.reduce((sum, a) => sum + (a.current_bid || 0), 0).toLocaleString('fr-FR') || 0} XOF
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Auctions List */}
            {auctions && auctions.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Liste des Enchères</CardTitle>
                  <CardDescription>Toutes vos ventes aux enchères</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Œuvre</TableHead>
                        <TableHead>Titre</TableHead>
                        <TableHead>Prix Actuel</TableHead>
                        <TableHead>Offres</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Dates</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auctions.map((auction) => (
                        <TableRow key={auction.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {auction.artist_products?.products?.image_url && (
                                <img
                                  src={auction.artist_products.products.image_url}
                                  alt={auction.auction_title}
                                  className="h-10 w-10 rounded object-cover"
                                />
                              )}
                              <div>
                                <p className="font-medium">{auction.artist_products?.artwork_title}</p>
                                <p className="text-sm text-muted-foreground">
                                  {auction.artist_products?.artist_name}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium">{auction.auction_title}</p>
                          </TableCell>
                          <TableCell>
                            <p className="font-semibold">{auction.current_bid.toLocaleString('fr-FR')} XOF</p>
                            {auction.reserve_price && (
                              <p className="text-xs text-muted-foreground">
                                Réserve: {auction.reserve_price.toLocaleString('fr-FR')} XOF
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span>{auction.total_bids}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {auction.unique_bidders} enchérisseurs
                            </p>
                          </TableCell>
                          <TableCell>{getStatusBadge(auction.status)}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>Début: {format(new Date(auction.start_date), 'PP', { locale: fr })}</p>
                              <p>Fin: {format(new Date(auction.end_date), 'PP', { locale: fr })}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/auctions/${auction.auction_slug}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedAuction(auction)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (confirm('Êtes-vous sûr de vouloir supprimer cette enchère ?')) {
                                    deleteAuction.mutate(auction.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Gavel className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucune enchère</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Commencez par créer une nouvelle vente aux enchères pour une œuvre d'artiste
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer une enchère
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Edit Auction Dialog */}
            {selectedAuction && (
              <EditAuctionDialog
                auction={selectedAuction}
                onClose={() => setSelectedAuction(null)}
                onUpdate={updateAuction.mutateAsync}
              />
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

function CreateAuctionForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: Partial<ArtistProductAuction>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<Partial<ArtistProductAuction>>({
    status: 'draft',
    allow_automatic_extension: true,
    extension_minutes: 5,
    require_verification: false,
    minimum_bid_increment: 1000,
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(formData);
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="auction_title">Titre de l'enchère *</Label>
        <Input
          id="auction_title"
          value={formData.auction_title || ''}
          onChange={(e) => setFormData({ ...formData, auction_title: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="auction_description">Description</Label>
        <Textarea
          id="auction_description"
          value={formData.auction_description || ''}
          onChange={(e) => setFormData({ ...formData, auction_description: e.target.value })}
          rows={4}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="starting_price">Prix de départ (XOF) *</Label>
          <Input
            id="starting_price"
            type="number"
            value={formData.starting_price || ''}
            onChange={(e) => setFormData({ ...formData, starting_price: parseFloat(e.target.value) })}
            required
            min={0}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reserve_price">Prix de réserve (XOF)</Label>
          <Input
            id="reserve_price"
            type="number"
            value={formData.reserve_price || ''}
            onChange={(e) => setFormData({ ...formData, reserve_price: parseFloat(e.target.value) || undefined })}
            min={0}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date">Date de début *</Label>
          <Input
            id="start_date"
            type="datetime-local"
            value={formData.start_date ? format(new Date(formData.start_date), "yyyy-MM-dd'T'HH:mm") : ''}
            onChange={(e) => setFormData({ ...formData, start_date: new Date(e.target.value).toISOString() })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="end_date">Date de fin *</Label>
          <Input
            id="end_date"
            type="datetime-local"
            value={formData.end_date ? format(new Date(formData.end_date), "yyyy-MM-dd'T'HH:mm") : ''}
            onChange={(e) => setFormData({ ...formData, end_date: new Date(e.target.value).toISOString() })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="minimum_bid_increment">Incrément minimum (XOF)</Label>
        <Input
          id="minimum_bid_increment"
          type="number"
          value={formData.minimum_bid_increment || 1000}
          onChange={(e) => setFormData({ ...formData, minimum_bid_increment: parseFloat(e.target.value) })}
          min={1}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="allow_automatic_extension">Prolongation automatique</Label>
        <Switch
          id="allow_automatic_extension"
          checked={formData.allow_automatic_extension}
          onCheckedChange={(checked) => setFormData({ ...formData, allow_automatic_extension: checked })}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">Créer</Button>
      </div>
    </form>
  );
}

function EditAuctionDialog({
  auction,
  onClose,
  onUpdate,
}: {
  auction: ArtistProductAuction;
  onClose: () => void;
  onUpdate: (data: Partial<ArtistProductAuction> & { id: string }) => Promise<void>;
}) {
  const [formData, setFormData] = useState(auction);
  const { _toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onUpdate({ id: auction.id, ...formData });
      toast({
        title: 'Enchère mise à jour',
        description: 'L\'enchère a été mise à jour avec succès.',
      });
      onClose();
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <Dialog open={!!auction} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier l'Enchère</DialogTitle>
          <DialogDescription>Modifiez les paramètres de l'enchère</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="status">Statut</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value as ArtistProductAuction['status'] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="scheduled">Programmée</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">En pause</SelectItem>
                <SelectItem value="ended">Terminée</SelectItem>
                <SelectItem value="cancelled">Annulée</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="allow_automatic_extension">Prolongation automatique</Label>
            <Switch
              id="allow_automatic_extension"
              checked={formData.allow_automatic_extension}
              onCheckedChange={(checked) => setFormData({ ...formData, allow_automatic_extension: checked })}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit">Enregistrer</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}







