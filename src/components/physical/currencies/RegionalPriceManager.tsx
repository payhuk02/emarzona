/**
 * Composant de gestion des prix régionaux
 * Date: 28 Janvier 2025
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Globe,
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  MapPin,
} from 'lucide-react';
import {
  useRegionalPrices,
  useCreateRegionalPrice,
  useCurrencies,
  useFormatCurrency,
} from '@/hooks/physical/useCurrencies';
import { useToast } from '@/hooks/use-toast';

interface RegionalPriceManagerProps {
  productId: string;
  productName: string;
  basePrice: number;
  baseCurrency?: string;
}

export function RegionalPriceManager({
  productId,
  productName,
  basePrice,
  baseCurrency = 'XOF',
}: RegionalPriceManagerProps) {
  const { toast } = useToast();
  const { data: regionalPrices, isLoading } = useRegionalPrices(productId);
  const { data: currencies } = useCurrencies(true);
  const createRegionalPrice = useCreateRegionalPrice();
  const { formatCurrency } = useFormatCurrency();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    currency_code: '',
    price: 0,
    promotional_price: 0,
    region: '',
  });

  const handleCreate = async () => {
    if (!formData.currency_code || formData.price <= 0) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs requis',
        variant: 'destructive',
      });
      return;
    }

    await createRegionalPrice.mutateAsync({
      product_id: productId,
      currency_code: formData.currency_code,
      price: formData.price,
      promotional_price: formData.promotional_price > 0 ? formData.promotional_price : undefined,
      region: formData.region || undefined,
    });

    setShowCreateDialog(false);
    setFormData({
      currency_code: '',
      price: 0,
      promotional_price: 0,
      region: '',
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Prix Régionaux - {productName}
              </CardTitle>
              <CardDescription>
                Définissez des prix spécifiques par devise et région
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un prix
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <MapPin className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-semibold">Prix de base: {formatCurrency ? formatCurrency(basePrice, baseCurrency) : `${basePrice} ${baseCurrency}`}</p>
                <p className="text-sm text-muted-foreground">
                  Les clients verront automatiquement le prix dans leur devise locale
                </p>
              </div>
            </AlertDescription>
          </Alert>

          {!regionalPrices || regionalPrices.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Aucun prix régional défini. Le prix sera converti automatiquement.
              </AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Devise</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Prix Promo</TableHead>
                  <TableHead>Région</TableHead>
                  <TableHead>Priorité</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regionalPrices.map((regionalPrice) => {
                  const currency = currencies?.find((c) => c.code === regionalPrice.currency_code);
                  return (
                    <TableRow key={regionalPrice.id}>
                      <TableCell>
                        <Badge variant="outline">
                          {currency?.symbol} {regionalPrice.currency_code}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency ? formatCurrency(regionalPrice.price, regionalPrice.currency_code) : regionalPrice.price}
                      </TableCell>
                      <TableCell>
                        {regionalPrice.promotional_price ? (
                          <span className="text-green-600 font-semibold">
                            {formatCurrency ? formatCurrency(regionalPrice.promotional_price, regionalPrice.currency_code) : regionalPrice.promotional_price}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {regionalPrice.region || regionalPrice.country_codes?.join(', ') || '-'}
                      </TableCell>
                      <TableCell>{regionalPrice.priority}</TableCell>
                      <TableCell>
                        {regionalPrice.is_active ? (
                          <Badge variant="default">Actif</Badge>
                        ) : (
                          <Badge variant="secondary">Inactif</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" aria-label={`Supprimer le prix régional pour ${regionalPrice.region || regionalPrice.country_codes?.join(', ') || 'cette région'}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog Création Prix Régional */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un Prix Régional</DialogTitle>
            <DialogDescription>
              Définissez un prix spécifique pour une devise ou région
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Devise</Label>
              <Select
                value={formData.currency_code}
                onValueChange={(value) =>
                  setFormData({ ...formData, currency_code: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une devise" />
                </SelectTrigger>
                <SelectContent>
                  {currencies?.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.name} ({currency.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prix</Label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: Number(e.target.value) })
                }
                min="0"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label>Prix Promotionnel (optionnel)</Label>
              <Input
                type="number"
                value={formData.promotional_price}
                onChange={(e) =>
                  setFormData({ ...formData, promotional_price: Number(e.target.value) })
                }
                min="0"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label>Région (optionnel)</Label>
              <Input
                value={formData.region}
                onChange={(e) =>
                  setFormData({ ...formData, region: e.target.value })
                }
                placeholder="Ex: Europe, Afrique de l'Ouest, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createRegionalPrice.isPending || !formData.currency_code || formData.price <= 0}
            >
              {createRegionalPrice.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                'Créer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}







