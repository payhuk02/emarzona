/**
 * Composant : Configuration d'affiliation pour cours
 * Permet aux instructeurs de définir les paramètres d'affiliation
 * Date : 27 octobre 2025
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Settings, 
  Info,
  CheckCircle2,
  Lightbulb
} from 'lucide-react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';

export interface CourseAffiliateData {
  affiliate_enabled: boolean;
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

interface CourseAffiliateSettingsProps {
  data: CourseAffiliateData;
  onChange: (data: CourseAffiliateData) => void;
  coursePrice: number;
}

export const CourseAffiliateSettings = ({
  data,
  onChange,
  coursePrice,
}: CourseAffiliateSettingsProps) => {
  const calculateCommission = () => {
    if (data.commission_type === 'percentage') {
      // Commission sur le montant vendeur (après commission plateforme 10%)
      const sellerAmount = coursePrice * 0.90;
      return (sellerAmount * data.commission_rate) / 100;
    }
    return data.fixed_commission_amount;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" />
          Programme d'Affiliation
        </h2>
        <p className="text-muted-foreground mt-1">
          Permettez à des affiliés de promouvoir votre cours et augmentez vos inscriptions
        </p>
      </div>

      {/* Activation */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 h-5 text-primary" />
                Activer l'affiliation
              </CardTitle>
              <CardDescription className="mt-2">
                Les affiliés pourront créer des liens pour promouvoir votre cours
              </CardDescription>
            </div>
            <Switch
              checked={data.affiliate_enabled}
              onCheckedChange={(checked) => onChange({ ...data, affiliate_enabled: checked })}
            />
          </div>
        </CardHeader>

        {data.affiliate_enabled && (
          <CardContent>
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Programme activé ✅</AlertTitle>
              <AlertDescription>
                Les affiliés pourront promouvoir ce cours dès sa publication
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
      </Card>

      {/* Configuration */}
      {data.affiliate_enabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuration de la commission
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
                    data.commission_type === 'percentage' 
                      ? 'border-2 border-primary bg-primary/5' 
                      : 'border-2 border-transparent hover:border-muted'
                  }`}
                  onClick={() => onChange({ ...data, commission_type: 'percentage' })}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <TrendingUp className={`h-5 w-5 mt-0.5 ${
                        data.commission_type === 'percentage' ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                      <div>
                        <h4 className="font-semibold">Pourcentage</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Commission basée sur un % du montant vendeur
                        </p>
                        <Badge variant="outline" className="mt-2">Recommandé</Badge>
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
                  onClick={() => onChange({ ...data, commission_type: 'fixed' })}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <DollarSign className={`h-5 w-5 mt-0.5 ${
                        data.commission_type === 'fixed' ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                      <div>
                        <h4 className="font-semibold">Montant fixe</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Commission fixe par inscription
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Separator />

            {/* Taux de commission */}
            {data.commission_type === 'percentage' ? (
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
                    value={data.commission_rate}
                    onChange={(e) => onChange({ ...data, commission_rate: parseFloat(e.target.value) || 0 })}
                    className="max-w-xs"
                  />
                  <Badge variant="outline" className="text-base px-4 py-2">
                    {data.commission_rate}%
                  </Badge>
                </div>
                
                {/* Calcul exemple */}
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Exemple de calcul pour ce cours</AlertTitle>
                  <AlertDescription>
                    <div className="mt-2 space-y-1 text-sm">
                      <p>Prix cours : <strong>{coursePrice.toLocaleString()} XOF</strong></p>
                      <p>Commission plateforme (10%) : <strong>{(coursePrice * 0.10).toFixed(0)} XOF</strong></p>
                      <p>Montant vendeur : <strong>{(coursePrice * 0.90).toFixed(0)} XOF</strong></p>
                      <p className="text-primary font-semibold mt-2">
                        Commission affilié ({data.commission_rate}%) : {calculateCommission().toFixed(0)} XOF
                      </p>
                      <p className="text-green-600 font-semibold">
                        Vous recevrez : {(coursePrice * 0.90 - calculateCommission()).toFixed(0)} XOF
                      </p>
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
                  value={data.fixed_commission_amount}
                  onChange={(e) => onChange({ ...data, fixed_commission_amount: parseFloat(e.target.value) || 0 })}
                  className="max-w-xs"
                />
                <p className="text-sm text-muted-foreground">
                  Commission fixe versée pour chaque inscription
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
                value={data.cookie_duration_days.toString()}
                onValueChange={(value) => onChange({ ...data, cookie_duration_days: parseInt(value) })}
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
                  Montant minimum d'inscription (XOF)
                </Label>
                <Input
                  id="min_order"
                  type="number"
                  min="0"
                  step="1000"
                  value={data.min_order_amount}
                  onChange={(e) => onChange({ ...data, min_order_amount: parseFloat(e.target.value) || 0 })}
                  className="max-w-xs"
                />
                <p className="text-xs text-muted-foreground">
                  Commission versée uniquement si l'inscription dépasse ce montant (utile pour promotions)
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
                  value={data.max_commission_per_sale || ''}
                  onChange={(e) => onChange({ 
                    ...data, 
                    max_commission_per_sale: e.target.value ? parseFloat(e.target.value) : undefined 
                  })}
                  className="max-w-xs"
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="self_referral">Autoriser l'auto-affiliation</Label>
                  <p className="text-xs text-muted-foreground">
                    Permet aux affiliés d'utiliser leur propre lien d'affiliation
                  </p>
                </div>
                <Switch
                  id="self_referral"
                  checked={data.allow_self_referral}
                  onCheckedChange={(checked) => onChange({ ...data, allow_self_referral: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="require_approval">Approbation manuelle</Label>
                  <p className="text-xs text-muted-foreground">
                    Vous devrez approuver chaque nouvel affilié manuellement
                  </p>
                </div>
                <Switch
                  id="require_approval"
                  checked={data.require_approval}
                  onCheckedChange={(checked) => onChange({ ...data, require_approval: checked })}
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
                placeholder="Ex: Les affiliés doivent promouvoir le cours de manière éthique et honnête..."
                value={data.terms_and_conditions}
                onChange={(e) => onChange({ ...data, terms_and_conditions: e.target.value })}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Règles que les affiliés doivent respecter pour promouvoir votre cours
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conseils */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            💡 Conseils pour l'affiliation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>✅ <strong>Taux recommandé :</strong> 20-30% pour les cours en ligne</p>
          <p>✅ <strong>Cookie 30 jours :</strong> Durée standard et équitable</p>
          <p>✅ <strong>Approbation auto :</strong> Gagnez du temps en acceptant automatiquement les affiliés</p>
          <p>✅ <strong>Commission attractive :</strong> Plus elle est élevée, plus vous aurez d'affiliés motivés</p>
          <p>⚠️ <strong>Auto-affiliation :</strong> Désactivez-la si vous voulez éviter les abus</p>
        </CardContent>
      </Card>
    </div>
  );
};

