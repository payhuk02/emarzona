/**
 * Composant de configuration Commerce pour une boutique
 * Gère les zones de livraison et les configurations de taxes
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShippingZonesManager } from '@/components/shipping/ShippingZonesManager';
import { ShippingRatesManager } from '@/components/shipping/ShippingRatesManager';
import { StorePaymentSettings } from '@/components/store/StorePaymentSettings';
import {
  useTaxConfigurations,
  useCreateTaxConfiguration,
  useUpdateTaxConfiguration,
  useDeleteTaxConfiguration,
} from '@/hooks/admin/useTaxConfigurations';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Truck,
  Receipt,
  CreditCard,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  Info,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import type { TaxConfiguration, TaxType } from '@/types/invoice';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface StoreCommerceSettingsProps {
  storeId: string;
}

const COUNTRY_CODES = [
  'BF',
  'CI',
  'SN',
  'ML',
  'NE',
  'TG',
  'BJ',
  'GH',
  'NG',
  'GN',
  'FR',
  'US',
] as const;

const TAX_TYPE_VALUES: TaxType[] = ['VAT', 'GST', 'SALES_TAX', 'CUSTOM'];

export const StoreCommerceSettings = ({ storeId }: StoreCommerceSettingsProps) => {
  const { t, i18n } = useTranslation();
  const [taxDialogOpen, setTaxDialogOpen] = useState(false);
  const [editingTax, setEditingTax] = useState<TaxConfiguration | null>(null);
  const [deletingTaxId, setDeletingTaxId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<TaxConfiguration>>({
    country_code: 'BF',
    state_province: '',
    tax_type: 'VAT',
    tax_name: 'TVA',
    rate: 18,
    applies_to_product_types: [],
    applies_to_shipping: false,
    tax_inclusive: false,
    priority: 0,
    effective_from: new Date().toISOString().split('T')[0],
    effective_to: '',
    is_active: true,
  });

  const { data: taxConfigs = [], isLoading: taxesLoading } = useTaxConfigurations(storeId);
  const createTax = useCreateTaxConfiguration();
  const updateTax = useUpdateTaxConfiguration();
  const deleteTax = useDeleteTaxConfiguration();

  // Store data for payment settings
  const [storeData, setStoreData] = useState<{
    minimum_order_amount?: number | null;
    maximum_order_amount?: number | null;
    accepted_currencies?: string[] | null;
    allow_partial_payment?: boolean;
    payment_terms?: string | null;
    invoice_prefix?: string | null;
    invoice_numbering?: 'sequential' | 'random' | null;
    free_shipping_threshold?: number | null;
    enabled_payment_providers?: string[] | null;
  } | null>(null);
  const [storeLoading, setStoreLoading] = useState(true);

  useEffect(() => {
    const loadStoreData = async () => {
      try {
        const { data, error } = await supabase
          .from('stores')
          .select(
            'minimum_order_amount, maximum_order_amount, accepted_currencies, allow_partial_payment, payment_terms, invoice_prefix, invoice_numbering, free_shipping_threshold, enabled_payment_providers'
          )
          .eq('id', storeId)
          .single();

        if (error) throw error;
        setStoreData(data);
      } catch (_error) {
        logger.error('Error loading store data', { error });
      } finally {
        setStoreLoading(false);
      }
    };

    loadStoreData();
  }, [storeId]);

  const handleOpenCreateTax = () => {
    setEditingTax(null);
    setFormData({
      country_code: 'BF',
      state_province: '',
      tax_type: 'VAT',
      tax_name: 'TVA',
      rate: 18,
      applies_to_product_types: [],
      applies_to_shipping: false,
      tax_inclusive: false,
      priority: 0,
      effective_from: new Date().toISOString().split('T')[0],
      effective_to: '',
      is_active: true,
    });
    setTaxDialogOpen(true);
  };

  const handleOpenEditTax = (tax: TaxConfiguration) => {
    setEditingTax(tax);
    setFormData({
      country_code: tax.country_code,
      state_province: tax.state_province || '',
      tax_type: tax.tax_type,
      tax_name: tax.tax_name,
      rate: tax.rate,
      applies_to_product_types: tax.applies_to_product_types || [],
      applies_to_shipping: tax.applies_to_shipping,
      tax_inclusive: tax.tax_inclusive,
      priority: tax.priority,
      effective_from: tax.effective_from,
      effective_to: tax.effective_to || '',
      is_active: tax.is_active,
    });
    setTaxDialogOpen(true);
  };

  const handleSaveTax = async () => {
    try {
      const taxData = {
        ...formData,
        store_id: storeId,
      };

      if (editingTax) {
        await updateTax.mutateAsync({ id: editingTax.id, ...taxData } as TaxConfiguration & {
          id: string;
        });
      } else {
        await createTax.mutateAsync(taxData);
      }
      setTaxDialogOpen(false);
    } catch (_error) {
      // Error handled by mutation
    }
  };

  const handleDeleteTax = async (taxId: string) => {
    try {
      await deleteTax.mutateAsync(taxId);
      setDeletingTaxId(null);
    } catch (_error) {
      // Error handled by mutation
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>{t('store.form.commerce.alertTitle')}</AlertTitle>
        <AlertDescription>{t('store.form.commerce.alertDescription')}</AlertDescription>
      </Alert>

      <Tabs defaultValue="shipping" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="shipping" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            {t('store.form.commerce.shippingZones')}
          </TabsTrigger>
          <TabsTrigger value="taxes" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            {t('store.form.commerce.taxes')}
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            {t('store.form.commerce.payment')}
          </TabsTrigger>
        </TabsList>

        {/* Onglet Zones de livraison */}
        <TabsContent value="shipping" className="space-y-6 mt-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">
                {t('store.form.commerce.shippingZones')}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t('store.form.commerce.shippingZonesDescription')}
              </p>
            </div>
            <ShippingZonesManager storeId={storeId} />
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">
                {t('store.form.commerce.shippingRates')}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t('store.form.commerce.shippingRatesDescription')}
              </p>
            </div>
            <ShippingRatesManager storeId={storeId} />
          </div>
        </TabsContent>

        {/* Onglet Taxes */}
        <TabsContent value="taxes" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('store.form.commerce.taxConfigurations')}</CardTitle>
                  <CardDescription>
                    {t('store.form.commerce.taxConfigurationsDescription')}
                  </CardDescription>
                </div>
                <Button onClick={handleOpenCreateTax} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('store.form.commerce.addTax')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {taxesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : taxConfigs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t('store.form.commerce.noTaxConfig')}</p>
                  <p className="text-sm mt-2">{t('store.form.commerce.createFirstTax')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {taxConfigs.map(tax => (
                    <div
                      key={tax.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{tax.tax_name}</span>
                          <Badge variant="outline">{tax.tax_type}</Badge>
                          {tax.is_active ? (
                            <Badge variant="default" className="bg-green-500">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              {t('store.form.commerce.active')}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <XCircle className="h-3 w-3 mr-1" />
                              {t('store.form.commerce.inactive')}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>
                            <strong>{t('store.form.commerce.country')}:</strong>{' '}
                            {t(`store.form.commerce.countries.${tax.country_code}`, {
                              defaultValue: tax.country_code,
                            })}
                            {tax.state_province && ` - ${tax.state_province}`}
                          </p>
                          <p>
                            <strong>{t('store.form.commerce.rate')}:</strong> {tax.rate}%
                          </p>
                          <p>
                            <strong>{t('store.form.commerce.effectiveDate')}:</strong>{' '}
                            {new Date(tax.effective_from).toLocaleDateString(i18n.language)}
                            {tax.effective_to &&
                              ` → ${new Date(tax.effective_to).toLocaleDateString(i18n.language)}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenEditTax(tax)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeletingTaxId(tax.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Paiement */}
        <TabsContent value="payment" className="space-y-6 mt-6">
          {storeLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : storeData ? (
            <StorePaymentSettings
              storeId={storeId}
              store={storeData}
              onUpdate={() => {
                // Recharger les données du store après mise à jour
                const loadStoreData = async () => {
                  const { data, error } = await supabase
                    .from('stores')
                    .select(
                      'minimum_order_amount, maximum_order_amount, accepted_currencies, allow_partial_payment, payment_terms, invoice_prefix, invoice_numbering, free_shipping_threshold, enabled_payment_providers'
                    )
                    .eq('id', storeId)
                    .single();

                  if (!error && data) {
                    setStoreData(data);
                  }
                };
                loadStoreData();
              }}
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('store.form.commerce.loadStoreError')}</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog Création/Édition Taxe */}
      <Dialog open={taxDialogOpen} onOpenChange={setTaxDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTax
                ? t('store.form.commerce.editTaxTitle')
                : t('store.form.commerce.newTaxTitle')}
            </DialogTitle>
            <DialogDescription>{t('store.form.commerce.taxDialogDescription')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tax_country">{t('store.form.commerce.taxCountry')}</Label>
                <Select
                  value={formData.country_code}
                  onValueChange={value => setFormData({ ...formData, country_code: value })}
                >
                  <SelectTrigger id="tax_country">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRY_CODES.map(countryCode => (
                      <SelectItem key={countryCode} value={countryCode}>
                        {t(`store.form.commerce.countries.${countryCode}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax_state">{t('store.form.commerce.taxState')}</Label>
                <Input
                  id="tax_state"
                  value={formData.state_province || ''}
                  onChange={e => setFormData({ ...formData, state_province: e.target.value })}
                  placeholder={t('store.form.commerce.taxStatePlaceholder')}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tax_type">{t('store.form.commerce.taxType')}</Label>
                <Select
                  value={formData.tax_type}
                  onValueChange={value => setFormData({ ...formData, tax_type: value as TaxType })}
                >
                  <SelectTrigger id="tax_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TAX_TYPE_VALUES.map(type => (
                      <SelectItem key={type} value={type}>
                        {t(`store.form.commerce.taxTypes.${type}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax_name">{t('store.form.commerce.taxName')}</Label>
                <Input
                  id="tax_name"
                  value={formData.tax_name || ''}
                  onChange={e => setFormData({ ...formData, tax_name: e.target.value })}
                  placeholder={t('store.form.commerce.taxNamePlaceholder')}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tax_rate">{t('store.form.commerce.taxRate')}</Label>
                <Input
                  id="tax_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.rate || 0}
                  onChange={e =>
                    setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })
                  }
                  placeholder={t('store.form.commerce.taxRatePlaceholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax_priority">{t('store.form.commerce.taxPriority')}</Label>
                <Input
                  id="tax_priority"
                  type="number"
                  value={formData.priority || 0}
                  onChange={e =>
                    setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })
                  }
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  {t('store.form.commerce.taxPriorityHint')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tax_effective_from">
                  {t('store.form.commerce.taxEffectiveFrom')}
                </Label>
                <Input
                  id="tax_effective_from"
                  type="date"
                  value={formData.effective_from || ''}
                  onChange={e => setFormData({ ...formData, effective_from: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax_effective_to">{t('store.form.commerce.taxEffectiveTo')}</Label>
                <Input
                  id="tax_effective_to"
                  type="date"
                  value={formData.effective_to || ''}
                  onChange={e =>
                    setFormData({ ...formData, effective_to: e.target.value || undefined })
                  }
                />
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="tax_inclusive">{t('store.form.commerce.taxInclusive')}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t('store.form.commerce.taxInclusiveHint')}
                  </p>
                </div>
                <Switch
                  id="tax_inclusive"
                  checked={formData.tax_inclusive || false}
                  onCheckedChange={checked => setFormData({ ...formData, tax_inclusive: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="tax_applies_shipping">
                    {t('store.form.commerce.taxAppliesShipping')}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t('store.form.commerce.taxAppliesShippingHint')}
                  </p>
                </div>
                <Switch
                  id="tax_applies_shipping"
                  checked={formData.applies_to_shipping || false}
                  onCheckedChange={checked =>
                    setFormData({ ...formData, applies_to_shipping: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="tax_active">{t('store.form.commerce.taxActivate')}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t('store.form.commerce.taxActivateHint')}
                  </p>
                </div>
                <Switch
                  id="tax_active"
                  checked={formData.is_active !== false}
                  onCheckedChange={checked => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTaxDialogOpen(false)}>
              {t('store.form.common.cancel')}
            </Button>
            <Button onClick={handleSaveTax} disabled={createTax.isPending || updateTax.isPending}>
              {createTax.isPending || updateTax.isPending ? (
                <>{t('store.form.common.saving')}</>
              ) : (
                <>{t('store.form.common.save')}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmation Suppression */}
      <Dialog open={!!deletingTaxId} onOpenChange={open => !open && setDeletingTaxId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('store.form.commerce.confirmDeleteTitle')}</DialogTitle>
            <DialogDescription>
              {t('store.form.commerce.confirmDeleteDescription')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingTaxId(null)}>
              {t('store.form.common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingTaxId && handleDeleteTax(deletingTaxId)}
              disabled={deleteTax.isPending}
            >
              {deleteTax.isPending
                ? t('store.form.commerce.deleting')
                : t('store.form.commerce.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
