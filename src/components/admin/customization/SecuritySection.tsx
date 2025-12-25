/**
 * Section Sécurité
 * 2FA, permissions, audit
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Shield, Key, Lock, Plus, X, AlertTriangle } from 'lucide-react';
import { usePlatformCustomization } from '@/hooks/admin/usePlatformCustomization';
import { usePlatformSettings } from '@/hooks/usePlatformSettings';
import { useToast } from '@/hooks/use-toast';

interface SecuritySectionProps {
  onChange?: () => void;
}

export const SecuritySection = ({ onChange }: SecuritySectionProps) => {
  const { customizationData, save } = usePlatformCustomization();
  const { settings: platformSettings, updateSettings } = usePlatformSettings('admin');
  const { toast } = useToast();
  
  const [requireAAL2Routes, setRequireAAL2Routes] = useState<string[]>([]);
  const [newRoute, setNewRoute] = useState('');
  const [require2FAForAdmins, setRequire2FAForAdmins] = useState(false);
  const [require2FAForVendors, setRequire2FAForVendors] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(24); // heures

  useEffect(() => {
    if (platformSettings?.require_aal2_routes) {
      setRequireAAL2Routes(Array.isArray(platformSettings.require_aal2_routes) 
        ? platformSettings.require_aal2_routes 
        : []);
    }
    if (customizationData?.security) {
      setRequire2FAForAdmins(customizationData.security.requireAAL2?.includes('admins') ?? false);
      setRequire2FAForVendors(customizationData.security.requireAAL2?.includes('vendors') ?? false);
    }
  }, [platformSettings, customizationData]);

  const handleAddRoute = async () => {
    if (!newRoute.trim()) {
      toast({
        title: 'Route vide',
        description: 'Veuillez entrer une route valide',
        variant: 'destructive',
      });
      return;
    }

    if (requireAAL2Routes.includes(newRoute)) {
      toast({
        title: 'Route déjà ajoutée',
        description: 'Cette route est déjà dans la liste',
        variant: 'destructive',
      });
      return;
    }

    const updatedRoutes = [...requireAAL2Routes, newRoute];
    setRequireAAL2Routes(updatedRoutes);
    
    await updateSettings({
      require_aal2_routes: updatedRoutes,
    });
    
    setNewRoute('');
    if (onChange) onChange();
    
    toast({
      title: '✅ Route ajoutée',
      description: 'La route a été ajoutée avec succès',
    });
  };

  const handleRemoveRoute = async (route: string) => {
    const updatedRoutes = requireAAL2Routes.filter(r => r !== route);
    setRequireAAL2Routes(updatedRoutes);
    
    await updateSettings({
      require_aal2_routes: updatedRoutes,
    });
    
    if (onChange) onChange();
    
    toast({
      title: 'Route supprimée',
      description: 'La route a été supprimée avec succès',
    });
  };

  const handle2FAChange = async (type: 'admins' | 'vendors', enabled: boolean) => {
    const currentRequireAAL2 = customizationData?.security?.requireAAL2 || [];
    let updatedRequireAAL2: string[];
    
    if (enabled) {
      updatedRequireAAL2 = [...currentRequireAAL2, type];
    } else {
      updatedRequireAAL2 = currentRequireAAL2.filter(t => t !== type);
    }

    if (type === 'admins') {
      setRequire2FAForAdmins(enabled);
    } else {
      setRequire2FAForVendors(enabled);
    }

    await save('security', {
      ...customizationData?.security,
      requireAAL2: updatedRequireAAL2,
    });
    
    if (onChange) onChange();
  };

  const defaultRoutes = [
    '/admin/payments',
    '/admin/audit',
    '/admin/users',
    '/admin/products',
    '/admin/disputes',
    '/admin/settings',
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Authentification 2FA */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Authentification à deux facteurs (2FA)
          </CardTitle>
          <CardDescription>
            Configurez les exigences d'authentification à deux facteurs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>2FA obligatoire pour les administrateurs</Label>
              <p className="text-xs text-muted-foreground">
                Les administrateurs doivent activer 2FA pour accéder à certaines fonctionnalités
              </p>
            </div>
            <Switch
              checked={require2FAForAdmins}
              onCheckedChange={(checked) => handle2FAChange('admins', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>2FA obligatoire pour les vendeurs</Label>
              <p className="text-xs text-muted-foreground">
                Les vendeurs doivent activer 2FA pour accéder à certaines fonctionnalités
              </p>
            </div>
            <Switch
              checked={require2FAForVendors}
              onCheckedChange={(checked) => handle2FAChange('vendors', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Routes protégées AAL2 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Routes protégées AAL2
          </CardTitle>
          <CardDescription>
            Routes nécessitant une authentification de niveau 2 (AAL2)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Ajouter une route</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                value={newRoute}
                onChange={(e) => setNewRoute(e.target.value)}
                placeholder="/admin/example"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddRoute();
                  }
                }}
                className="flex-1 min-w-0"
              />
              <Button onClick={handleAddRoute} size="sm" className="w-full sm:w-auto shrink-0">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Les routes commençant par ce chemin nécessiteront AAL2
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Routes protégées ({requireAAL2Routes.length})</Label>
            {requireAAL2Routes.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Aucune route protégée configurée
              </p>
            ) : (
              <div className="space-y-2">
                {requireAAL2Routes.map((route) => (
                  <div
                    key={route}
                    className="flex items-center justify-between p-2 border rounded-lg"
                  >
                    <code className="text-sm bg-muted px-2 py-1 rounded">{route}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveRoute(route)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Routes par défaut suggérées</Label>
            <div className="flex flex-wrap gap-2">
              {defaultRoutes
                .filter(route => !requireAAL2Routes.includes(route))
                .map((route) => (
                  <Badge
                    key={route}
                    variant="outline"
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => {
                      setNewRoute(route);
                      handleAddRoute();
                    }}
                  >
                    {route}
                  </Badge>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Durée de session */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Durée de session
          </CardTitle>
          <CardDescription>
            Configurez la durée de validité des sessions utilisateur
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Durée de session (heures)</Label>
            <Input
              type="number"
              min="1"
              max="168"
              value={sessionDuration}
              onChange={(e) => setSessionDuration(parseInt(e.target.value) || 24)}
            />
            <p className="text-xs text-muted-foreground">
              Durée avant expiration de la session (1-168 heures)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Avertissement */}
      <Card className="border-amber-500/50 bg-amber-500/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div className="space-y-1">
              <Label className="text-amber-500">Important</Label>
              <p className="text-sm text-muted-foreground">
                Les modifications de sécurité peuvent affecter l'accès des utilisateurs. 
                Assurez-vous de tester les changements avant de les appliquer en production.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

