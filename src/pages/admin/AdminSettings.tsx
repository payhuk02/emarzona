import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePlatformSettings } from '@/hooks/usePlatformSettings';
import { Settings, Save, Info, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

const AdminSettings = () => {
  const { settings: dbSettings, loading, error, updateSettings } = usePlatformSettings();
  
  // État local pour le formulaire
  const [localSettings, setLocalSettings] = useState({
    platformCommissionRate: 10,
    referralCommissionRate: 2,
    minWithdrawalAmount: 10000,
    autoApproveWithdrawals: false,
    emailNotifications: true,
    smsNotifications: false,
  });

  const [isSaving, setIsSaving] = useState(false);

  // Synchroniser l'état local avec les paramètres chargés depuis la DB
  useEffect(() => {
    if (dbSettings) {
      setLocalSettings({
        platformCommissionRate: dbSettings.platform_commission_rate,
        referralCommissionRate: dbSettings.referral_commission_rate,
        minWithdrawalAmount: dbSettings.min_withdrawal_amount,
        autoApproveWithdrawals: dbSettings.auto_approve_withdrawals,
        emailNotifications: dbSettings.email_notifications,
        smsNotifications: dbSettings.sms_notifications,
      });
    }
  }, [dbSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    
    const success = await updateSettings({
      platform_commission_rate: localSettings.platformCommissionRate,
      referral_commission_rate: localSettings.referralCommissionRate,
      min_withdrawal_amount: localSettings.minWithdrawalAmount,
      auto_approve_withdrawals: localSettings.autoApproveWithdrawals,
      email_notifications: localSettings.emailNotifications,
      sms_notifications: localSettings.smsNotifications,
    });
    
    setIsSaving(false);
  };

  // Loading state
  if (loading) {
    return (
      <AdminLayout>
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </AdminLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <AdminLayout>
        <div className="container mx-auto p-6 space-y-6 animate-fade-in">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Erreur de chargement :</strong> {error}
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
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Paramètres
            </h1>
            <p className="text-muted-foreground mt-2">
              Configuration de la plateforme
            </p>
          </div>
          <Settings className="h-8 w-8 text-muted-foreground" />
        </div>

        {/* Commission Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Taux de commission</CardTitle>
            <CardDescription>
              Configurer les commissions de la plateforme
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="platformCommission">Commission Plateforme (%)</Label>
              <Input
                id="platformCommission"
                type="number"
                value={localSettings.platformCommissionRate}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, platformCommissionRate: Number(e.target.value) })
                }
                min="0"
                max="100"
                step="0.01"
              />
              <p className="text-sm text-muted-foreground">
                Commission prélevée sur chaque vente
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="referralCommission">Commission Parrainage (%)</Label>
              <Input
                id="referralCommission"
                type="number"
                value={localSettings.referralCommissionRate}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, referralCommissionRate: Number(e.target.value) })
                }
                min="0"
                max="100"
                step="0.01"
              />
              <p className="text-sm text-muted-foreground">
                Commission versée au parrain sur les ventes du filleul
              </p>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Les modifications des taux s'appliquent uniquement aux nouvelles transactions.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Withdrawal Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Paramètres de retrait</CardTitle>
            <CardDescription>
              Configuration des retraits de fonds
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="minWithdrawal">Montant minimum de retrait (XOF)</Label>
              <Input
                id="minWithdrawal"
                type="number"
                value={localSettings.minWithdrawalAmount}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, minWithdrawalAmount: Number(e.target.value) })
                }
                min="0"
                step="1"
              />
              <p className="text-sm text-muted-foreground">
                Montant minimum requis pour effectuer un retrait
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Approbation automatique</Label>
                <p className="text-sm text-muted-foreground">
                  Approuver automatiquement les demandes de retrait
                </p>
              </div>
              <Button
                variant={localSettings.autoApproveWithdrawals ? 'default' : 'outline'}
                size="sm"
                onClick={() =>
                  setLocalSettings({
                    ...localSettings,
                    autoApproveWithdrawals: !localSettings.autoApproveWithdrawals,
                  })
                }
              >
                {localSettings.autoApproveWithdrawals ? 'Activé' : 'Désactivé'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              Configuration des notifications automatiques
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notifications Email</Label>
                <p className="text-sm text-muted-foreground">
                  Envoyer des emails aux utilisateurs pour les événements importants
                </p>
              </div>
              <Button
                variant={localSettings.emailNotifications ? 'default' : 'outline'}
                size="sm"
                onClick={() =>
                  setLocalSettings({
                    ...localSettings,
                    emailNotifications: !localSettings.emailNotifications,
                  })
                }
              >
                {localSettings.emailNotifications ? 'Activé' : 'Désactivé'}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notifications SMS</Label>
                <p className="text-sm text-muted-foreground">
                  Envoyer des SMS pour les transactions et événements critiques
                </p>
              </div>
              <Button
                variant={localSettings.smsNotifications ? 'default' : 'outline'}
                size="sm"
                onClick={() =>
                  setLocalSettings({
                    ...localSettings,
                    smsNotifications: !localSettings.smsNotifications,
                  })
                }
              >
                {localSettings.smsNotifications ? 'Activé' : 'Désactivé'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            size="lg" 
            className="gap-2"
            disabled={isSaving}
          >
            {isSaving ? (
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
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
