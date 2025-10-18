import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Settings, Save, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const AdminSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    platformCommissionRate: 10,
    referralCommissionRate: 2,
    minWithdrawalAmount: 10000,
    autoApproveWithdrawals: false,
    emailNotifications: true,
    smsNotifications: false,
  });

  const handleSave = () => {
    // Ici, vous pouvez sauvegarder les paramètres dans la base de données
    toast({
      title: 'Paramètres sauvegardés',
      description: 'Les paramètres ont été mis à jour avec succès.',
    });
  };

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
                value={settings.platformCommissionRate}
                onChange={(e) =>
                  setSettings({ ...settings, platformCommissionRate: Number(e.target.value) })
                }
                min="0"
                max="100"
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
                value={settings.referralCommissionRate}
                onChange={(e) =>
                  setSettings({ ...settings, referralCommissionRate: Number(e.target.value) })
                }
                min="0"
                max="100"
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
                value={settings.minWithdrawalAmount}
                onChange={(e) =>
                  setSettings({ ...settings, minWithdrawalAmount: Number(e.target.value) })
                }
                min="0"
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
                variant={settings.autoApproveWithdrawals ? 'default' : 'outline'}
                size="sm"
                onClick={() =>
                  setSettings({
                    ...settings,
                    autoApproveWithdrawals: !settings.autoApproveWithdrawals,
                  })
                }
              >
                {settings.autoApproveWithdrawals ? 'Activé' : 'Désactivé'}
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
                variant={settings.emailNotifications ? 'default' : 'outline'}
                size="sm"
                onClick={() =>
                  setSettings({
                    ...settings,
                    emailNotifications: !settings.emailNotifications,
                  })
                }
              >
                {settings.emailNotifications ? 'Activé' : 'Désactivé'}
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
                variant={settings.smsNotifications ? 'default' : 'outline'}
                size="sm"
                onClick={() =>
                  setSettings({
                    ...settings,
                    smsNotifications: !settings.smsNotifications,
                  })
                }
              >
                {settings.smsNotifications ? 'Activé' : 'Désactivé'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} size="lg" className="gap-2">
            <Save className="h-4 w-4" />
            Sauvegarder les paramètres
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
