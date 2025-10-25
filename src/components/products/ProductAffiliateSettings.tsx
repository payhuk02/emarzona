/**
 * Component: ProductAffiliateSettings
 * Description: Configuration de l'affiliation pour un produit
 * Date: 25/10/2025
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useProductAffiliateSettings } from '@/hooks/useProductAffiliateSettings';
import { ProductAffiliateSettingsForm } from '@/types/affiliate';
import { 
  TrendingUp, 
  Users, 
  Clock, 
  DollarSign, 
  Settings, 
  Info,
  Save,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

interface ProductAffiliateSettingsProps {
  productId: string;
  storeId: string;
  productName: string;
  productPrice: number;
}

export const ProductAffiliateSettings = ({
  productId,
  storeId,
  productName,
  productPrice,
}: ProductAffiliateSettingsProps) => {
  const { settings, loading, hasSettings, isEnabled, createOrUpdateSettings, toggleAffiliateEnabled, deleteSettings } = 
    useProductAffiliateSettings(productId);

  const [formData, setFormData] = useState<ProductAffiliateSettingsForm>({
    affiliate_enabled: false,
    commission_rate: 20,
    commission_type: 'percentage',
    fixed_commission_amount: 0,
    cookie_duration_days: 30,
    max_commission_per_sale: undefined,
    min_order_amount: 0,
    allow_self_referral: false,
    require_approval: false,
    terms_and_conditions: '',
    promotional_materials: {},
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        affiliate_enabled: settings.affiliate_enabled,
        commission_rate: settings.commission_rate,
        commission_type: settings.commission_type,
        fixed_commission_amount: settings.fixed_commission_amount || 0,
        cookie_duration_days: settings.cookie_duration_days,
        max_commission_per_sale: settings.max_commission_per_sale,
        min_order_amount: settings.min_order_amount,
        allow_self_referral: settings.allow_self_referral,
        require_approval: settings.require_approval,
        terms_and_conditions: settings.terms_and_conditions || '',
        promotional_materials: settings.promotional_materials || {},
      });
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    const success = await createOrUpdateSettings(productId, storeId, formData);
    setSaving(false);
    
    if (success) {
      // Actualiser les données
    }
  };

  const handleToggle = async () => {
    await toggleAffiliateEnabled(productId, !formData.affiliate_enabled);
  };

  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer la configuration d\'affiliation ?')) {
      await deleteSettings(productId);
    }
  };

  const calculateCommission = () => {
    if (formData.commission_type === 'percentage') {
      // Commission sur le montant vendeur (après commission plateforme 10%)
      const sellerAmount = productPrice * 0.90;
      return (sellerAmount * formData.commission_rate) / 100;
    }
    return formData.fixed_commission_amount;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Programme d'affiliation
              </CardTitle>
              <CardDescription className="mt-2">
                Permettez à des affiliés de promouvoir "{productName}" et gagnez plus de ventes
              </CardDescription>
            </div>
            <Switch
              checked={formData.affiliate_enabled}
              onCheckedChange={(checked) => {
                setFormData({ ...formData, affiliate_enabled: checked });
                if (hasSettings) {
                  handleToggle();
                }
              }}
            />
          </div>
        </CardHeader>

        {formData.affiliate_enabled && (
          <CardContent>
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Programme activé</AlertTitle>
              <AlertDescription>
                Les affiliés peuvent maintenant créer des liens pour promouvoir ce produit
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
      </Card>

      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Type de commission */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold">Type de commission</Label>
              <p className="text-sm text-muted-foreground">
                Choisissez comment calculer la commission des affiliés
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card 
                className={`cursor-pointer transition-all ${
                  formData.commission_type === 'percentage' 
                    ? 'border-2 border-primary bg-primary/5' 
                    : 'border-2 border-transparent hover:border-muted'
                }`}
                onClick={() => setFormData({ ...formData, commission_type: 'percentage' })}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <TrendingUp className={`h-5 w-5 mt-0.5 ${
                      formData.commission_type === 'percentage' ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                    <div>
                      <h4 className="font-semibold">Pourcentage</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Commission basée sur un % du montant vendeur
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all ${
                  formData.commission_type === 'fixed' 
                    ? 'border-2 border-primary bg-primary/5' 
                    : 'border-2 border-transparent hover:border-muted'
                }`}
                onClick={() => setFormData({ ...formData, commission_type: 'fixed' })}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <DollarSign className={`h-5 w-5 mt-0.5 ${
                      formData.commission_type === 'fixed' ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                    <div>
                      <h4 className="font-semibold">Montant fixe</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Commission fixe par vente (en XOF)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator />

          {/* Taux de commission */}
          {formData.commission_type === 'percentage' ? (
            <div className="space-y-3">
              <Label htmlFor="commission_rate" className="text-base font-semibold">
                Taux de commission (%)
              </Label>
              <p className="text-sm text-muted-foreground">
                Pourcentage du montant vendeur (après commission plateforme de 10%)
              </p>
              <div className="flex items-center gap-4">
                <Input
                  id="commission_rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={formData.commission_rate}
                  onChange={(e) => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) })}
                  className="max-w-xs"
                />
                <Badge variant="outline" className="text-base px-4 py-2">
                  {formData.commission_rate}%
                </Badge>
              </div>
              
              {/* Calcul exemple */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Exemple de calcul</AlertTitle>
                <AlertDescription>
                  <div className="mt-2 space-y-1 text-sm">
                    <p>Prix produit : <strong>{productPrice} XOF</strong></p>
                    <p>Commission plateforme (10%) : <strong>{(productPrice * 0.10).toFixed(0)} XOF</strong></p>
                    <p>Montant vendeur : <strong>{(productPrice * 0.90).toFixed(0)} XOF</strong></p>
                    <p className="text-primary font-semibold">
                      Commission affilié ({formData.commission_rate}%) : {calculateCommission().toFixed(0)} XOF
                    </p>
                    <p>Vous recevrez : <strong>{(productPrice * 0.90 - calculateCommission()).toFixed(0)} XOF</strong></p>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <div className="space-y-3">
              <Label htmlFor="fixed_commission" className="text-base font-semibold">
                Montant fixe de commission (XOF)
              </Label>
              <Input
                id="fixed_commission"
                type="number"
                min="0"
                step="100"
                value={formData.fixed_commission_amount}
                onChange={(e) => setFormData({ ...formData, fixed_commission_amount: parseFloat(e.target.value) })}
                className="max-w-xs"
              />
              <p className="text-sm text-muted-foreground">
                Commission fixe versée pour chaque vente
              </p>
            </div>
          )}

          <Separator />

          {/* Durée du cookie */}
          <div className="space-y-3">
            <Label htmlFor="cookie_duration" className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Durée du cookie de tracking
            </Label>
            <p className="text-sm text-muted-foreground">
              Période pendant laquelle un clic est attribué à l'affilié
            </p>
            <Select
              value={formData.cookie_duration_days.toString()}
              onValueChange={(value) => setFormData({ ...formData, cookie_duration_days: parseInt(value) })}
            >
              <SelectTrigger className="max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 jours</SelectItem>
                <SelectItem value="15">15 jours</SelectItem>
                <SelectItem value="30">30 jours (recommandé)</SelectItem>
                <SelectItem value="60">60 jours</SelectItem>
                <SelectItem value="90">90 jours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Options avancées */}
          <div className="space-y-4">
            <h4 className="text-base font-semibold">Options avancées</h4>

            <div className="space-y-3">
              <Label htmlFor="min_order" className="text-sm">
                Montant minimum de commande (XOF)
              </Label>
              <Input
                id="min_order"
                type="number"
                min="0"
                step="1000"
                value={formData.min_order_amount}
                onChange={(e) => setFormData({ ...formData, min_order_amount: parseFloat(e.target.value) })}
                className="max-w-xs"
              />
              <p className="text-xs text-muted-foreground">
                Commission versée uniquement si la commande dépasse ce montant
              </p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="max_commission" className="text-sm">
                Commission maximum par vente (XOF) - Optionnel
              </Label>
              <Input
                id="max_commission"
                type="number"
                min="0"
                step="1000"
                placeholder="Illimité"
                value={formData.max_commission_per_sale || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  max_commission_per_sale: e.target.value ? parseFloat(e.target.value) : undefined 
                })}
                className="max-w-xs"
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="self_referral">Autoriser l'auto-affiliation</Label>
                <p className="text-xs text-muted-foreground">
                  Permet aux affiliés d'utiliser leur propre lien
                </p>
              </div>
              <Switch
                id="self_referral"
                checked={formData.allow_self_referral}
                onCheckedChange={(checked) => setFormData({ ...formData, allow_self_referral: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="require_approval">Approbation manuelle</Label>
                <p className="text-xs text-muted-foreground">
                  Vous devrez approuver chaque nouvel affilié
                </p>
              </div>
              <Switch
                id="require_approval"
                checked={formData.require_approval}
                onCheckedChange={(checked) => setFormData({ ...formData, require_approval: checked })}
              />
            </div>
          </div>

          <Separator />

          {/* Conditions */}
          <div className="space-y-3">
            <Label htmlFor="terms" className="text-base font-semibold">
              Conditions spécifiques (optionnel)
            </Label>
            <Textarea
              id="terms"
              placeholder="Ex: Les affiliés doivent promouvoir le produit de manière éthique..."
              value={formData.terms_and_conditions}
              onChange={(e) => setFormData({ ...formData, terms_and_conditions: e.target.value })}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div>
          {hasSettings && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Supprimer la configuration
            </Button>
          )}
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="gap-2"
          size="lg"
        >
          {saving ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Enregistrer la configuration
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

