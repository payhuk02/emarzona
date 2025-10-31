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
import { useAdminPermissions, DEFAULT_PERMISSION_KEYS } from '@/hooks/useAdminPermissions';
import { useCurrentAdminPermissions } from '@/hooks/useCurrentAdminPermissions';
import { Admin2FABanner } from '@/components/admin/Admin2FABanner';
import { useAdminMFA } from '@/hooks/useAdminMFA';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const AdminSettings = () => {
  const { settings: dbSettings, loading, error, updateSettings } = usePlatformSettings();
  const { roles, loading: rolesLoading, error: rolesError, updateRolePermissions, refresh } = useAdminPermissions();
  const { can } = useCurrentAdminPermissions();
  const { isAAL2 } = useAdminMFA();
  const [routes, setRoutes] = useState<string[]>(Array.isArray((dbSettings as any)?.require_aal2_routes) ? (dbSettings as any).require_aal2_routes : []);
  const [newRoute, setNewRoute] = useState('');
  const defaultRoutes = ['/admin/payments','/admin/audit','/admin/users','/admin/products','/admin/disputes','/admin/settings'];
  const [roleSearch, setRoleSearch] = useState('');
  useEffect(() => {
    const arr = Array.isArray((dbSettings as any)?.require_aal2_routes) ? (dbSettings as any).require_aal2_routes : [];
    setRoutes(arr);
  }, [dbSettings]);
  
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
        {can('users.roles') && (
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
        )}

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

        {/* RBAC - Gestion des permissions par rôle */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Permissions des rôles (RBAC)</CardTitle>
                <CardDescription>Activez/Désactivez les capacités par rôle administrateur</CardDescription>
              </div>
              <Shield className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {rolesLoading ? (
              <Skeleton className="h-32" />
            ) : rolesError ? (
              <Alert variant="destructive">
                <AlertDescription>{rolesError}</AlertDescription>
              </Alert>
            ) : (
      <div className="space-y-6">
        <Admin2FABanner />
          <Card>
            <CardHeader>
              <CardTitle>État 2FA</CardTitle>
              <CardDescription>Statut actuel d’authentification multi-facteurs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span>Session administrateur:</span>
                <Badge variant={isAAL2 ? 'default' : 'destructive'}>{isAAL2 ? 'AAL2 - 2FA active' : 'AAL1 - 2FA inactive'}</Badge>
              </div>
            </CardContent>
          </Card>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <Input placeholder="Rechercher un rôle…" value={roleSearch} onChange={(e) => setRoleSearch(e.target.value)} className="max-w-sm" />
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        for (const r of roles) {
                          const seed = roles.find(rr => rr.role === r.role)?.permissions || {};
                          await updateRolePermissions(r.role, seed as any);
                        }
                      }}
                    >Réinitialiser tous les rôles</Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const json = JSON.stringify(roles.map(r => ({ role: r.role, permissions: r.permissions })), null, 2);
                        const blob = new Blob([json], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url; a.download = `rbac_${Date.now()}.json`; a.click(); URL.revokeObjectURL(url);
                      }}
                    >Exporter JSON</Button>
                    <label className="text-sm border rounded px-2 py-1 cursor-pointer">
                      Importer JSON
                      <input type="file" accept="application/json" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const text = await file.text();
                        try {
                          const data = JSON.parse(text) as Array<{ role: string; permissions: Record<string, boolean> }>;
                          for (const item of data) {
                            await updateRolePermissions(item.role, item.permissions);
                          }
                        } catch (_) { /* ignore */ }
                        e.currentTarget.value = '';
                      }} />
                    </label>
                  </div>
                </div>
                {roles.filter(r => !roleSearch || r.role.toLowerCase().includes(roleSearch.toLowerCase())).map((r) => (
                  <div key={r.role} className="border rounded-lg p-4">
                    <div className="font-semibold mb-3 capitalize">{r.role.replace('_', ' ')}</div>
                    <div className="flex items-center gap-2 mb-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          const next = Object.fromEntries(Object.keys(r.permissions || {}).map(k => [k, true]));
                          await updateRolePermissions(r.role, next);
                        }}
                      >Tout activer</Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          const next = Object.fromEntries(Object.keys(r.permissions || {}).map(k => [k, false]));
                          await updateRolePermissions(r.role, next);
                        }}
                      >Tout désactiver</Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          // recharger les permissions seed (on part de la source actuelle "roles")
                          const seed = roles.find(rr => rr.role === r.role)?.permissions || {};
                          await updateRolePermissions(r.role, seed as any);
                        }}
                      >Réinitialiser par défaut</Button>
                    </div>
                    {(() => {
                      const grouped = DEFAULT_PERMISSION_KEYS.reduce((acc: Record<string, string[]>, perm: string) => {
                        const grp = perm.split('.')[0] || 'autres';
                        (acc[grp] = acc[grp] || []).push(perm);
                        return acc;
                      }, {});
                      return (
                        <div className="space-y-4">
                          {Object.entries(grouped).map(([grp, perms]) => (
                            <div key={grp}>
                              <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">{grp}</div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {perms.map((perm) => {
                                  const checked = Boolean((r.permissions as any)?.[perm]);
                                  const defaultChecked = Boolean((roles.find(rr => rr.role === r.role)?.permissions as any)?.[perm]);
                                  return (
                                    <label key={perm} className="flex items-center gap-2">
                                      <Checkbox
                                        checked={checked}
                                        onCheckedChange={async (v) => {
                                          const next = { ...(r.permissions as any), [perm]: Boolean(v) };
                                          await updateRolePermissions(r.role, next);
                                        }}
                                      />
                                      <span className={`text-sm ${checked !== defaultChecked ? 'text-amber-600' : 'text-muted-foreground'}`}>{perm}{checked !== defaultChecked ? ' *' : ''}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Routes protégées AAL2 */}
        {can('settings.manage') && (
        <Card>
          <CardHeader>
            <CardTitle>Routes protégées (AAL2)</CardTitle>
            <CardDescription>Liste des préfixes de routes admin nécessitant la 2FA</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => {
                const merged = Array.from(new Set([...(routes||[]), ...defaultRoutes]));
                setRoutes(merged);
              }}>Ajouter suggestions</Button>
              <Button variant="outline" size="sm" onClick={() => setRoutes(defaultRoutes)}>Réinitialiser par défaut</Button>
            </div>
            <div className="flex gap-2">
              <Input placeholder="/admin/xxx" value={newRoute} onChange={e => setNewRoute(e.target.value)} />
              <Button
                onClick={() => {
                  const r = newRoute.trim();
                  if (!r) return;
                  if (routes.includes(r)) return;
                  setRoutes([...routes, r]);
                  setNewRoute('');
                }}
              >Ajouter</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {routes.map(r => (
                <div key={r} className="flex items-center gap-2 border rounded px-2 py-1 text-sm">
                  <code>{r}</code>
                  <Button variant="outline" size="xs" onClick={() => setRoutes(routes.filter(x => x !== r))}>Retirer</Button>
                </div>
              ))}
              {routes.length === 0 && <div className="text-sm text-muted-foreground">Aucune route configurée</div>}
            </div>
            <div className="flex justify-end">
              <Button
                onClick={async () => {
                  await (async () => {
                    await supabase.from('admin_config').upsert({ key: 'admin', settings: { ...(dbSettings as any), require_aal2_routes: routes }, updated_at: new Date().toISOString() }, { onConflict: 'key' });
                  })();
                }}
              >Enregistrer</Button>
            </div>
          </CardContent>
        </Card>
        )}

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
