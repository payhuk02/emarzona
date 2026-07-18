import React from 'react';
import { AppPageShell } from '@/components/layout/AppPageShell';
import { useTranslation } from 'react-i18next';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/hooks/useStore';
import { STORE_CREATE_PATH } from '@/lib/store/store-create-path';

const AdvancedOrderManagementSimple = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { store, loading: storeLoading } = useStore();

  if (storeLoading) {
    return (
      <AppPageShell>
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-2 text-muted-foreground">{t('common.loading', 'Chargement...')}</p>
        </div>
      </AppPageShell>
    );
  }

  if (!store) {
    return (
      <AppPageShell>
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            <CardTitle>
              {t('dashboard.createStorePrompt', "Créez votre boutique d'abord")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              {t(
                'dashboard.createStoreDescription',
                'Vous devez créer une boutique avant de pouvoir gérer les commandes avancées'
              )}
            </p>
            <Button onClick={() => navigate(STORE_CREATE_PATH)}>
              {t('dashboard.createStoreButton', 'Créer ma boutique')}
            </Button>
          </CardContent>
        </Card>
      </AppPageShell>
    );
  }

  return (
    <AppPageShell mainClassName="p-4 sm:p-6 bg-gradient-hero">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Test de chargement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Boutique ID: {store.id}</p>
            <p>Boutique Nom: {store.name}</p>
            <p className="mt-4 text-green-600 font-semibold">
              ✅ Si vous voyez ce message, le problème vient des hooks useAdvancedPayments ou
              useMessaging
            </p>
          </CardContent>
        </Card>
      </div>
    </AppPageShell>
  );
};

export default AdvancedOrderManagementSimple;
