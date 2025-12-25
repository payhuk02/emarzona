/**
 * MyDigitalProducts - Liste des produits digitaux achetés par le client
 * Date: 2025-01-27
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Download,
  ExternalLink,
  Search,
  Filter,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { AlertCircleIcon } from '@/components/icons/AlertCircleIcon';
import { useCustomerPurchasedProducts, PurchasedDigitalProduct } from '@/hooks/digital/useCustomerPurchasedProducts';
import { useGenerateDownloadLink } from '@/hooks/digital/useDownloads';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

export const MyDigitalProducts = () => {
  const { data: products, isLoading, error } = useCustomerPurchasedProducts();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const generateLink = useGenerateDownloadLink();
  const { toast } = useToast();

  const filteredProducts = products?.filter(product => {
    const matchesSearch = product.product_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    const matchesType = typeFilter === 'all' || product.digital_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  }) || [];

  const handleDownload = async (product: PurchasedDigitalProduct) => {
    try {
      const result = await generateLink.mutateAsync({
        digitalProductId: product.digital_product_id,
        fileId: null, // Main file
      });

      if (result.downloadUrl) {
        window.open(result.downloadUrl, '_blank');
        toast({
          title: 'Téléchargement démarré',
          description: 'Le téléchargement a été lancé dans un nouvel onglet',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de générer le lien de téléchargement',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">Actif</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expiré</Badge>;
      case 'suspended':
        return <Badge variant="secondary">Suspendu</Badge>;
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
          Erreur lors du chargement de vos produits. Veuillez réessayer plus tard.
        </AlertDescription>
      </Alert>
    );
  }

  if (!products || products.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun produit digital acheté</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Vous n'avez pas encore acheté de produits digitaux. Parcourez notre catalogue pour découvrir nos produits.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtres et recherche */}
      <Card>
        <CardHeader>
          <CardTitle>Recherche et Filtres</CardTitle>
          <CardDescription>
            Trouvez rapidement vos produits digitaux
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Rechercher</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nom du produit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="expired">Expiré</SelectItem>
                  <SelectItem value="suspended">Suspendu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="software">Logiciel</SelectItem>
                  <SelectItem value="ebook">Livre numérique</SelectItem>
                  <SelectItem value="template">Template</SelectItem>
                  <SelectItem value="plugin">Plugin</SelectItem>
                  <SelectItem value="music">Musique</SelectItem>
                  <SelectItem value="video">Vidéo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{products.length}</div>
            <div className="text-sm text-muted-foreground">Produits achetés</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {products.filter(p => p.status === 'active').length}
            </div>
            <div className="text-sm text-muted-foreground">Produits actifs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {products.reduce((sum, p) => sum + p.download_count, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Téléchargements</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {products.filter(p => p.license_key).length}
            </div>
            <div className="text-sm text-muted-foreground">Licences</div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des produits */}
      <div className="space-y-4">
        {filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Filter className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun produit trouvé</h3>
              <p className="text-muted-foreground">
                Aucun produit ne correspond à vos critères de recherche.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredProducts.map((product) => (
            <Card key={product.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Image */}
                  {product.product_image_url && (
                    <div className="flex-shrink-0">
                      <img
                        src={product.product_image_url}
                        alt={product.product_name}
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                    </div>
                  )}

                  {/* Informations */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-xl font-semibold">{product.product_name}</h3>
                        {getStatusBadge(product.status)}
                      </div>
                      {product.product_description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {product.product_description}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Type</div>
                        <div className="font-medium capitalize">{product.digital_type}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Acheté le</div>
                        <div className="font-medium">
                          {format(new Date(product.order_date), 'dd/MM/yyyy', { locale: fr })}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Téléchargements</div>
                        <div className="font-medium">
                          {product.download_count}
                          {product.download_limit > 0 && ` / ${product.download_limit}`}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Prix</div>
                        <div className="font-medium">
                          {product.purchase_amount.toLocaleString()} XOF
                        </div>
                      </div>
                    </div>

                    {/* Expiration */}
                    {product.expiry_date && (
                      <div className={cn(
                        "flex items-center gap-2 text-sm",
                        new Date(product.expiry_date) < new Date()
                          ? "text-red-600"
                          : new Date(product.expiry_date).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000
                          ? "text-orange-600"
                          : "text-muted-foreground"
                      )}>
                        <Clock className="h-4 w-4" />
                        {product.status === 'expired' ? (
                          <span>Expiré le {format(new Date(product.expiry_date), 'dd/MM/yyyy', { locale: fr })}</span>
                        ) : (
                          <span>Expire le {format(new Date(product.expiry_date), 'dd/MM/yyyy', { locale: fr })}</span>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        onClick={() => handleDownload(product)}
                        disabled={generateLink.isPending || product.status !== 'active'}
                        variant="default"
                        size="sm"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/digital/${product.product_id}`, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Voir le produit
                      </Button>
                      {product.license_key && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(product.license_key!);
                            toast({
                              title: 'Clé copiée',
                              description: 'La clé de licence a été copiée dans le presse-papiers',
                            });
                          }}
                        >
                          <Key className="h-4 w-4 mr-2" />
                          Copier la clé
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

