/**
 * Payment Options Form - Shared Component
 * Date: 28 octobre 2025
 * 
 * Formulaire de configuration des options de paiement
 * Support: Paiement complet, pourcentage, escrow (delivery_secured)
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard,
  Percent,
  Shield,
  Info,
  CheckCircle,
  TrendingUp,
  Lock
} from 'lucide-react';

export type PaymentType = 'full' | 'percentage' | 'delivery_secured';

interface PaymentOptionsData {
  payment_type: PaymentType;
  percentage_rate?: number;
  min_percentage?: number;
}

interface PaymentOptionsFormProps {
  productPrice: number;
  productType: 'physical' | 'service';
  data: PaymentOptionsData;
  onUpdate: (data: PaymentOptionsData) => void;
}

export const PaymentOptionsForm: React.FC<PaymentOptionsFormProps> = ({
  productPrice,
  productType,
  data,
  onUpdate,
}) => {
  const handlePaymentTypeChange = (value: PaymentType) => {
    onUpdate({
      ...data,
      payment_type: value,
    });
  };

  const handlePercentageChange = (value: string) => {
    const percentage = parseFloat(value) || 0;
    onUpdate({
      ...data,
      percentage_rate: Math.min(Math.max(percentage, 10), 90), // Between 10% and 90%
    });
  };

  const calculateAmount = (percentage: number) => {
    return (productPrice * percentage) / 100;
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Choisissez comment vos clients paieront pour ce {productType === 'physical' ? 'produit' : 'service'}.
          Les options de paiement flexible augmentent les conversions de +30% en moyenne.
        </AlertDescription>
      </Alert>

      {/* Payment Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Type de Paiement</CardTitle>
          <CardDescription>
            Sélectionnez le mode de paiement pour ce produit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={data.payment_type}
            onValueChange={handlePaymentTypeChange}
            className="space-y-4"
          >
            {/* Full Payment */}
            <div className="flex items-start space-x-3 p-4 rounded-lg border-2 hover:border-primary transition-colors cursor-pointer">
              <RadioGroupItem value="full" id="full" className="mt-1" />
              <Label htmlFor="full" className="flex-1 cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      <span className="font-semibold text-base">Paiement Complet</span>
                      <Badge variant="secondary">Par défaut</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Le client paie la totalité immédiatement. Vous recevez le paiement directement.
                    </p>
                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-950 rounded-md">
                      <div className="flex items-center gap-2 text-green-900 dark:text-green-100">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Montant reçu : {productPrice.toLocaleString()} XOF
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Label>
            </div>

            {/* Percentage Payment */}
            <div className="flex items-start space-x-3 p-4 rounded-lg border-2 hover:border-primary transition-colors cursor-pointer">
              <RadioGroupItem value="percentage" id="percentage" className="mt-1" />
              <Label htmlFor="percentage" className="flex-1 cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Percent className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold text-base">Paiement Partiel</span>
                      <Badge variant="default" className="bg-blue-600">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +30% conversions
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Le client paie un acompte maintenant et le solde plus tard. Idéal pour les gros montants.
                    </p>

                    {data.payment_type === 'percentage' && (
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="percentage-rate" className="text-sm">
                            Pourcentage d'acompte (10% - 90%)
                          </Label>
                          <div className="flex items-center gap-3 mt-2">
                            <Input
                              id="percentage-rate"
                              type="number"
                              min="10"
                              max="90"
                              step="5"
                              value={data.percentage_rate || 30}
                              onChange={(e) => handlePercentageChange(e.target.value)}
                              className="w-24"
                            />
                            <span className="text-sm text-muted-foreground">%</span>
                            <div className="flex-1 text-sm">
                              <span className="text-muted-foreground">Acompte :</span>
                              <span className="font-semibold ml-2">
                                {calculateAmount(data.percentage_rate || 30).toLocaleString()} XOF
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
                            <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">Acompte (maintenant)</p>
                            <p className="font-semibold text-blue-900 dark:text-blue-100">
                              {calculateAmount(data.percentage_rate || 30).toLocaleString()} XOF
                            </p>
                          </div>
                          <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-md">
                            <p className="text-xs text-orange-700 dark:text-orange-300 mb-1">Solde (plus tard)</p>
                            <p className="font-semibold text-orange-900 dark:text-orange-100">
                              {(productPrice - calculateAmount(data.percentage_rate || 30)).toLocaleString()} XOF
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Label>
            </div>

            {/* Delivery Secured (Escrow) */}
            <div className="flex items-start space-x-3 p-4 rounded-lg border-2 hover:border-primary transition-colors cursor-pointer">
              <RadioGroupItem value="delivery_secured" id="delivery_secured" className="mt-1" />
              <Label htmlFor="delivery_secured" className="flex-1 cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-5 w-5 text-yellow-600" />
                      <span className="font-semibold text-base">
                        Paiement Sécurisé {productType === 'physical' ? '(à la livraison)' : '(à la prestation)'}
                      </span>
                      <Badge variant="default" className="bg-yellow-600">
                        <Lock className="h-3 w-3 mr-1" />
                        Confiance +40%
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {productType === 'physical' 
                        ? "Le client paie la totalité mais l'argent est retenu par la plateforme jusqu'à confirmation de livraison."
                        : "Le client paie la totalité mais l'argent est retenu par la plateforme jusqu'à confirmation de la prestation."
                      }
                    </p>
                    <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-md border border-yellow-200">
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-yellow-700 dark:text-yellow-300 mt-0.5" />
                          <div className="text-sm text-yellow-900 dark:text-yellow-100">
                            <p className="font-medium mb-1">Protection acheteur et vendeur</p>
                            <ul className="text-xs space-y-1 text-yellow-800 dark:text-yellow-200">
                              <li>• Client paie : {productPrice.toLocaleString()} XOF (retenu en escrow)</li>
                              <li>• {productType === 'physical' ? 'Après livraison confirmée' : 'Après prestation confirmée'} : transfert au vendeur</li>
                              <li>• En cas de problème : médiation plateforme</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-blue-900 dark:text-blue-100">
            <TrendingUp className="h-4 w-4" />
            Recommandations
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
          <p><strong>Paiement complet</strong> : Idéal pour produits &lt; 50,000 XOF</p>
          <p><strong>Paiement partiel</strong> : Recommandé pour produits &gt; 50,000 XOF (débloque gros achats)</p>
          <p><strong>Paiement sécurisé</strong> : Parfait pour nouveaux vendeurs ou produits premium (rassure clients)</p>
        </CardContent>
      </Card>
    </div>
  );
};

