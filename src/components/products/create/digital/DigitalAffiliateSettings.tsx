/**
 * Digital Product Affiliate Settings
 * Date: 28 octobre 2025
 * 
 * Configuration de l'affiliation spécifique aux produits digitaux
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  Users, 
  Clock, 
  DollarSign, 
  Info,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';

interface AffiliateSettings {
  enabled: boolean;
  commission_rate: number;
  commission_type: 'percentage' | 'fixed';
  fixed_commission_amount: number;
  cookie_duration_days: number;
  max_commission_per_sale?: number;
  min_order_amount: number;
  allow_self_referral: boolean;
  require_approval: boolean;
  terms_and_conditions: string;
}

interface DigitalAffiliateSettingsProps {
  productPrice: number;
  productName: string;
  data: Partial<AffiliateSettings>;
  onUpdate: (data: Partial<AffiliateSettings>) => void;
}

export const DigitalAffiliateSettings = ({
  productPrice,
  productName,
  data,
  onUpdate,
}: DigitalAffiliateSettingsProps) => {

  const calculateCommission = () => {
    if (data.commission_type === 'percentage') {
      // Commission sur le montant vendeur (après commission plateforme 10%)
      const sellerAmount = productPrice * 0.90;
      return (sellerAmount * (data.commission_rate || 20)) / 100;
    }
    return data.fixed_commission_amount || 0;
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Programme d'affiliation
                <Sparkles className="h-4 w-4 text-yellow-500" />
              </CardTitle>
              <CardDescription className="text-base">
                Boostez vos ventes en permettant à des affiliés de promouvoir votre produit digital
              </CardDescription>
            </div>
            <Switch
              checked={data.enabled || false}
              onCheckedChange={(checked) => onUpdate({ ...data, enabled: checked })}
            />
          </div>
        </CardHeader>

        {data.enabled && (
          <CardContent>
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Programme activé ✨</AlertTitle>
              <AlertDescription>
                Vos affiliés pourront créer des liens personnalisés et gagner des commissions sur chaque vente
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
      </Card>

      {/* Configuration visible seulement si activé */}
      {data.enabled && (
        <>
          {/* Type de commission */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Type de commission</CardTitle>
              <CardDescription>
                Choisissez comment récompenser vos affiliés
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card 
                  className={`cursor-pointer transition-all ${
                    data.commission_type === 'percentage' 
                      ? 'border-2 border-primary bg-primary/5' 
                      : 'border-2 border-transparent hover:border-muted'
                  }`}
                  onClick={() => onUpdate({ ...data, commission_type: 'percentage' })}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <TrendingUp className={`h-5 w-5 mt-0.5 ${
                        data.commission_type === 'percentage' ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                      <div>
                        <h4 className="font-semibold">Pourcentage</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          % du montant vendeur (après commission plateforme)
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className={`cursor-pointer transition-all ${
                    data.commission_type === 'fixed' 
                      ? 'border-2 border-primary bg-primary/5' 
                      : 'border-2 border-transparent hover:border-muted'
                  }`}
                  onClick={() => onUpdate({ ...data, commission_type: 'fixed' })}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <DollarSign className={`h-5 w-5 mt-0.5 ${
                        data.commission_type === 'fixed' ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                      <div>
                        <h4 className="font-semibold">Montant fixe</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Montant fixe par vente (XOF)
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Taux ou montant */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {data.commission_type === 'percentage' ? 'Taux de commission' : 'Montant de commission'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.commission_type === 'percentage' ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={data.commission_rate || 20}
                      onChange={(e) => onUpdate({ ...data, commission_rate: parseFloat(e.target.value) })}
                      className="max-w-xs"
                    />
                    <Badge variant="outline" className="text-base px-4 py-2">
                      {data.commission_rate || 20}%
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
                          Commission affilié ({data.commission_rate || 20}%) : {calculateCommission().toFixed(0)} XOF
                        </p>
                        <p>Vous recevrez : <strong>{(productPrice * 0.90 - calculateCommission()).toFixed(0)} XOF</strong></p>
                      </div>
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <div className="space-y-3">
                  <Input
                    type="number"
                    min="0"
                    step="100"
                    value={data.fixed_commission_amount || 0}
                    onChange={(e) => onUpdate({ ...data, fixed_commission_amount: parseFloat(e.target.value) })}
                    className="max-w-xs"
                  />
                  <p className="text-sm text-muted-foreground">
                    Commission fixe versée pour chaque vente
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Durée du cookie */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Durée du cookie de tracking
              </CardTitle>
              <CardDescription>
                Période pendant laquelle un clic est attribué à l'affilié
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={(data.cookie_duration_days || 30).toString()}
                onValueChange={(value) => onUpdate({ ...data, cookie_duration_days: parseInt(value) })}
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
            </CardContent>
          </Card>

          {/* Options avancées */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Options avancées</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor="min_order">
                  Montant minimum de commande (XOF)
                </Label>
                <Input
                  id="min_order"
                  type="number"
                  min="0"
                  step="1000"
                  value={data.min_order_amount || 0}
                  onChange={(e) => onUpdate({ ...data, min_order_amount: parseFloat(e.target.value) })}
                  className="max-w-xs"
                />
                <p className="text-xs text-muted-foreground">
                  Commission versée uniquement si la commande dépasse ce montant
                </p>
              </div>

              <Separator />

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>Autoriser l'auto-affiliation</Label>
                  <p className="text-xs text-muted-foreground">
                    Permet aux affiliés d'utiliser leur propre lien
                  </p>
                </div>
                <Switch
                  checked={data.allow_self_referral || false}
                  onCheckedChange={(checked) => onUpdate({ ...data, allow_self_referral: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>Approbation manuelle des affiliés</Label>
                  <p className="text-xs text-muted-foreground">
                    Vous devrez approuver chaque nouvel affilié
                  </p>
                </div>
                <Switch
                  checked={data.require_approval || false}
                  onCheckedChange={(checked) => onUpdate({ ...data, require_approval: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Conditions spécifiques */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Conditions spécifiques (optionnel)</CardTitle>
              <CardDescription>
                Règles supplémentaires pour vos affiliés
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Ex: Les affiliés doivent promouvoir le produit de manière éthique et respectueuse..."
                value={data.terms_and_conditions || ''}
                onChange={(e) => onUpdate({ ...data, terms_and_conditions: e.target.value })}
                rows={4}
              />
            </CardContent>
          </Card>
        </>
      )}

      {/* Message si désactivé */}
      {!data.enabled && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Programme d'affiliation désactivé</AlertTitle>
          <AlertDescription>
            Activez le programme pour permettre à des affiliés de promouvoir votre produit digital et augmenter vos ventes jusqu'à 30%+
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

