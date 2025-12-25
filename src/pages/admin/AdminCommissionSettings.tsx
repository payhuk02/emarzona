/**
 * Page Admin - Configuration des Taux de Commission
 * Date: 31 Janvier 2025
 * 
 * Interface pour configurer les taux de commission de parrainage et de plateforme
 */

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Percent,
  Save,
  Info,
  Loader2,
  AlertCircle,
  TrendingUp,
  Users,
  DollarSign,
  Shield,
  RefreshCw,
  Calculator,
} from 'lucide-react';
import { usePlatformSettingsDirect } from '@/hooks/usePlatformSettingsDirect';
import { useToast } from '@/hooks/use-toast';
import { useCurrentAdminPermissions } from '@/hooks/useCurrentAdminPermissions';

export default function AdminCommissionSettings() {
  const { settings, isLoading, error, updateSettings, isUpdating } = usePlatformSettingsDirect();
  const { can } = useCurrentAdminPermissions();
  const { toast } = useToast();

  // États locaux pour le formulaire
  const [localSettings, setLocalSettings] = useState({
    platformCommissionRate: 10.0,
    referralCommissionRate: 2.0,
    minWithdrawalAmount: 10000,
    autoApproveWithdrawals: false,
  });

  // Synchroniser avec les données chargées
  useEffect(() => {
    if (settings) {
      setLocalSettings({
        platformCommissionRate: settings.platform_commission_rate || 10.0,
        referralCommissionRate: settings.referral_commission_rate || 2.0,
        minWithdrawalAmount: settings.min_withdrawal_amount || 10000,
        autoApproveWithdrawals: settings.auto_approve_withdrawals || false,
      });
    }
  }, [settings]);

  // Vérifier les permissions
  if (!can('settings.manage')) {
    return (
      <AdminLayout>
        <div className="container mx-auto p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Vous n'avez pas les permissions nécessaires pour accéder à cette page.
            </AlertDescription>
          </Alert>
        </div>
      </AdminLayout>
    );
  }

  // Gérer la sauvegarde
  const handleSave = async () => {
    // Validation
    if (localSettings.platformCommissionRate < 0 || localSettings.platformCommissionRate > 100) {
      toast({
        title: 'Erreur de validation',
        description: 'Le taux de commission plateforme doit être entre 0 et 100%',
        variant: 'destructive',
      });
      return;
    }

    if (localSettings.referralCommissionRate < 0 || localSettings.referralCommissionRate > 100) {
      toast({
        title: 'Erreur de validation',
        description: 'Le taux de commission parrainage doit être entre 0 et 100%',
        variant: 'destructive',
      });
      return;
    }

    if (localSettings.minWithdrawalAmount < 0) {
      toast({
        title: 'Erreur de validation',
        description: 'Le montant minimum de retrait doit être positif',
        variant: 'destructive',
      });
      return;
    }

    // Sauvegarder
    updateSettings({
      platform_commission_rate: localSettings.platformCommissionRate,
      referral_commission_rate: localSettings.referralCommissionRate,
      min_withdrawal_amount: localSettings.minWithdrawalAmount,
      auto_approve_withdrawals: localSettings.autoApproveWithdrawals,
    });
  };

  // Calculer un exemple de commission
  const calculateExample = (orderAmount: number = 100000) => {
    const platformCommission = orderAmount * (localSettings.platformCommissionRate / 100);
    const referralCommission = orderAmount * (localSettings.referralCommissionRate / 100);
    const sellerAmount = orderAmount - platformCommission;

    return {
      orderAmount,
      platformCommission,
      referralCommission,
      sellerAmount,
    };
  };

  const example = calculateExample();

  // Loading state
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96" />
          <Skeleton className="h-64" />
        </div>
      </AdminLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <AdminLayout>
        <div className="container mx-auto p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Erreur de chargement :</strong> {error instanceof Error ? error.message : 'Erreur inconnue'}
            </AlertDescription>
          </Alert>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto p-6 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent flex items-center gap-3">
              <Percent className="h-8 w-8" />
              Configuration des Commissions
            </h1>
            <p className="text-muted-foreground mt-2">
              Gérez les taux de commission de la plateforme et du parrainage
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            {settings?.updated_at ? `Dernière mise à jour: ${new Date(settings.updated_at).toLocaleDateString('fr-FR')}` : 'Non configuré'}
          </Badge>
        </div>

        {/* Alerte importante */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Note importante :</strong> Les modifications des taux s'appliquent uniquement aux nouvelles transactions. 
            Les transactions existantes conservent leurs taux d'origine.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="commissions" className="space-y-6">
          <TabsList>
            <TabsTrigger value="commissions" className="min-h-[44px]">
              <Percent className="h-4 w-4 mr-2" />
              Commissions
            </TabsTrigger>
            <TabsTrigger value="retraits" className="min-h-[44px]">
              <DollarSign className="h-4 w-4 mr-2" />
              Retraits
            </TabsTrigger>
            <TabsTrigger value="simulation" className="min-h-[44px]">
              <Calculator className="h-4 w-4 mr-2" />
              Simulation
            </TabsTrigger>
          </TabsList>

          {/* Onglet Commissions */}
          <TabsContent value="commissions" className="space-y-6">
            {/* Commission Plateforme */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle>Commission Plateforme</CardTitle>
                      <CardDescription>
                        Pourcentage prélevé par la plateforme sur chaque vente
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-lg">
                    {localSettings.platformCommissionRate}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="platformCommission">
                    Taux de commission plateforme (%)
                  </Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="platformCommission"
                      type="number"
                      value={localSettings.platformCommissionRate}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          platformCommissionRate: parseFloat(e.target.value) || 0,
                        })
                      }
                      min="0"
                      max="100"
                      step="0.01"
                      className="max-w-xs min-h-[44px]"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setLocalSettings({
                            ...localSettings,
                            platformCommissionRate: 5,
                          })
                        }
                      >
                        5%
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setLocalSettings({
                            ...localSettings,
                            platformCommissionRate: 10,
                          })
                        }
                      >
                        10%
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setLocalSettings({
                            ...localSettings,
                            platformCommissionRate: 15,
                          })
                        }
                      >
                        15%
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Recommandé : Entre 5% et 15% selon votre modèle économique
                  </p>
                </div>

                {/* Exemple de calcul */}
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Exemple de calcul :</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Montant de vente :</span>
                      <span className="font-mono">100 000 XOF</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Commission plateforme ({localSettings.platformCommissionRate}%) :</span>
                      <span className="font-mono text-blue-600">
                        {example.platformCommission.toLocaleString('fr-FR')} XOF
                      </span>
                    </div>
                    <div className="flex justify-between font-medium pt-2 border-t">
                      <span>Montant pour le vendeur :</span>
                      <span className="font-mono text-green-600">
                        {example.sellerAmount.toLocaleString('fr-FR')} XOF
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Commission Parrainage */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <CardTitle>Commission Parrainage</CardTitle>
                      <CardDescription>
                        Pourcentage versé au parrain sur les ventes de son filleul
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-lg">
                    {localSettings.referralCommissionRate}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="referralCommission">
                    Taux de commission parrainage (%)
                  </Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="referralCommission"
                      type="number"
                      value={localSettings.referralCommissionRate}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          referralCommissionRate: parseFloat(e.target.value) || 0,
                        })
                      }
                      min="0"
                      max="100"
                      step="0.01"
                      className="max-w-xs"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setLocalSettings({
                            ...localSettings,
                            referralCommissionRate: 1,
                          })
                        }
                      >
                        1%
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setLocalSettings({
                            ...localSettings,
                            referralCommissionRate: 2,
                          })
                        }
                      >
                        2%
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setLocalSettings({
                            ...localSettings,
                            referralCommissionRate: 5,
                          })
                        }
                      >
                        5%
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Recommandé : Entre 1% et 5% pour motiver le parrainage sans impacter la rentabilité
                  </p>
                </div>

                {/* Exemple de calcul */}
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Exemple de calcul :</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Vente du filleul :</span>
                      <span className="font-mono">100 000 XOF</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Commission parrain ({localSettings.referralCommissionRate}%) :</span>
                      <span className="font-mono text-green-600">
                        {example.referralCommission.toLocaleString('fr-FR')} XOF
                      </span>
                    </div>
                  </div>
                </div>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    La commission de parrainage est calculée sur le montant total de la vente, 
                    après déduction de la commission plateforme.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Retraits */}
          <TabsContent value="retraits" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres de Retrait</CardTitle>
                <CardDescription>
                  Configuration des conditions de retrait des commissions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="minWithdrawal">
                    Montant minimum de retrait (XOF)
                  </Label>
                  <Input
                    id="minWithdrawal"
                    type="number"
                    value={localSettings.minWithdrawalAmount}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        minWithdrawalAmount: parseInt(e.target.value) || 0,
                      })
                    }
                    min="0"
                    step="1000"
                    className="max-w-xs"
                  />
                  <p className="text-sm text-muted-foreground">
                    Montant minimum requis pour qu'un utilisateur puisse demander un retrait de ses commissions
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label>Approbation automatique des retraits</Label>
                    <p className="text-sm text-muted-foreground">
                      Si activé, les demandes de retrait seront approuvées automatiquement
                    </p>
                  </div>
                  <Switch
                    checked={localSettings.autoApproveWithdrawals}
                    onCheckedChange={(checked) =>
                      setLocalSettings({
                        ...localSettings,
                        autoApproveWithdrawals: checked,
                      })
                    }
                  />
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    L'approbation automatique est recommandée pour les petits montants. 
                    Pour les montants importants, il est préférable de vérifier manuellement.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Simulation */}
          <TabsContent value="simulation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Simulateur de Commissions</CardTitle>
                <CardDescription>
                  Calculez les commissions pour différents montants de vente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CommissionSimulator
                  platformRate={localSettings.platformCommissionRate}
                  referralRate={localSettings.referralCommissionRate}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Bouton de sauvegarde */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Les modifications seront appliquées immédiatement aux nouvelles transactions
                </p>
              </div>
              <Button
                onClick={handleSave}
                size="lg"
                className="gap-2"
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sauvegarde en cours...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Sauvegarder les paramètres
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

/**
 * Composant simulateur de commissions
 */
function CommissionSimulator({
  platformRate,
  referralRate,
}: {
  platformRate: number;
  referralRate: number;
}) {
  const [orderAmount, setOrderAmount] = useState(100000);

  const platformCommission = orderAmount * (platformRate / 100);
  const sellerAmount = orderAmount - platformCommission;
  const referralCommission = sellerAmount * (referralRate / 100);
  const finalSellerAmount = sellerAmount - referralCommission;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="simulatorAmount">Montant de la vente (XOF)</Label>
        <Input
          id="simulatorAmount"
          type="number"
          value={orderAmount}
          onChange={(e) => setOrderAmount(parseInt(e.target.value) || 0)}
          min="0"
          step="1000"
          className="max-w-xs"
        />
      </div>

      <div className="p-6 bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-lg space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Montant de vente</p>
            <p className="text-2xl font-bold">{orderAmount.toLocaleString('fr-FR')} XOF</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Commission plateforme ({platformRate}%)</p>
            <p className="text-2xl font-bold text-blue-600">
              -{platformCommission.toLocaleString('fr-FR')} XOF
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Commission parrain ({referralRate}%)</p>
            <p className="text-2xl font-bold text-green-600">
              -{referralCommission.toLocaleString('fr-FR')} XOF
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Montant net pour le vendeur</p>
            <p className="text-2xl font-bold text-primary">
              {finalSellerAmount.toLocaleString('fr-FR')} XOF
            </p>
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total commissions :</span>
            <span className="font-bold">
              {(platformCommission + referralCommission).toLocaleString('fr-FR')} XOF
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Pourcentage total :</span>
            <span className="font-bold">
              {((platformCommission + referralCommission) / orderAmount * 100).toFixed(2)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}







