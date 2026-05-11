/**
 * Page: PaymentMethods
 * Description: Gestion des méthodes de paiement sauvegardées pour les retraits
 * Date: 2025-02-03
 */

import { useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/hooks/useStore';
import { useStorePaymentMethods } from '@/hooks/useStorePaymentMethods';
import { SavedStorePaymentMethod, StorePaymentMethodForm, StorePaymentMethod } from '@/types/store-withdrawals';
import { COUNTRIES } from '@/lib/countries';
import { getMobileMoneyOperatorsForCountry } from '@/lib/mobile-money-operators';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Plus, Edit, Trash2, Star, StarOff, Wallet, CreditCard, Building2, Loader2 } from 'lucide-react';
import { PaymentMethodDialog } from '@/components/store/PaymentMethodDialog';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const PaymentMethods = () => {
  const { store, loading: storeLoading } = useStore();
  const { paymentMethods, loading, createPaymentMethod, updatePaymentMethod, deletePaymentMethod, setAsDefault } = useStorePaymentMethods({
    storeId: store?.id,
    activeOnly: false, // Afficher aussi les méthodes inactives
  });

  const [showDialog, setShowDialog] = useState(false);
  const [editingMethod, setEditingMethod] = useState<SavedStorePaymentMethod | null>(null);
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const methodsRef = useScrollAnimation<HTMLDivElement>();

  const handleCreate = () => {
    setEditingMethod(null);
    setShowDialog(true);
  };

  const handleEdit = (method: SavedStorePaymentMethod) => {
    setEditingMethod(method);
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette méthode de paiement ?')) {
      await deletePaymentMethod(id);
    }
  };

  const handleSubmit = async (formData: StorePaymentMethodForm) => {
    if (editingMethod) {
      await updatePaymentMethod(editingMethod.id, formData);
    } else {
      await createPaymentMethod(formData);
    }
    setShowDialog(false);
    setEditingMethod(null);
  };

  const getPaymentMethodIcon = (method: StorePaymentMethod) => {
    switch (method) {
      case 'mobile_money':
        return <Wallet  className ="h-full w-full" />;
      case 'bank_card':
        return <CreditCard className="h-full w-full" />;
      case 'bank_transfer':
        return <Building2 className="h-full w-full" />;
      default:
        return <Wallet  className ="h-full w-full" />;
    }
  };

  const getPaymentMethodLabel = (method: StorePaymentMethod) => {
    switch (method) {
      case 'mobile_money':
        return 'Mobile Money';
      case 'bank_card':
        return 'Carte bancaire';
      case 'bank_transfer':
        return 'Virement bancaire';
      default:
        return method;
    }
  };

  const formatPaymentDetails = (method: SavedStorePaymentMethod) => {
    const details = method.payment_details;
    if (method.payment_method === 'mobile_money') {
      const mobileDetails = details as any;
      const countryName = mobileDetails.country 
        ? COUNTRIES.find(c => c.code === mobileDetails.country)?.name || mobileDetails.country
        : '';
      const operatorLabel = mobileDetails.operator 
        ? getMobileMoneyOperatorsForCountry(mobileDetails.country || 'BF')
            .find(op => op.value === mobileDetails.operator)?.label || mobileDetails.operator
        : 'N/A';
      return `${mobileDetails.phone}${countryName ? ` (${countryName})` : ''} - ${operatorLabel}`;
    } else if (method.payment_method === 'bank_card') {
      const cardDetails = details as any;
      const cardNumber = cardDetails.card_number || '';
      const masked = cardNumber.length > 4 
        ? `****${cardNumber.slice(-4)}` 
        : '****';
      return `${masked} - ${cardDetails.cardholder_name || 'N/A'}`;
    } else {
      const transferDetails = details as any;
      return `${transferDetails.account_number || 'N/A'} - ${transferDetails.bank_name || 'N/A'}`;
    }
  };

  if (storeLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-64 w-full" />
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (!store) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            <Alert variant="destructive" className="border-border/50 bg-card/50 backdrop-blur-sm">
              <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <AlertDescription className="text-[10px] sm:text-xs md:text-sm">
                Vous devez créer une boutique avant de pouvoir gérer vos méthodes de paiement.
              </AlertDescription>
            </Alert>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
          {/* Header - Responsive & Animated */}
          <div 
            ref={headerRef}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
          >
            <div>
              <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400" aria-hidden="true" />
                </div>
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Méthodes de paiement
                </span>
              </h1>
              <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
                Gérez vos numéros de mobile money et cartes bancaires pour faciliter les retraits
              </p>
            </div>
            <Button 
              onClick={handleCreate}
              className="w-full sm:w-auto min-h-[44px] bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs sm:text-sm"
              size="sm"
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">Ajouter une méthode</span>
              <span className="sm:hidden">Ajouter</span>
            </Button>
          </div>

          {/* Liste des méthodes */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : paymentMethods.length === 0 ? (
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500">
              <CardContent className="pt-6 sm:pt-8 md:pt-12">
                <div className="text-center py-8 sm:py-12 text-muted-foreground">
                  <Wallet  className ="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 opacity-20 animate-in zoom-in-95 duration-500" />
                  <p className="text-xs sm:text-sm md:text-base lg:text-lg font-medium mb-1.5 sm:mb-2">Aucune méthode de paiement</p>
                  <p className="text-[10px] sm:text-xs md:text-sm mb-3 sm:mb-4">
                    Ajoutez vos numéros de mobile money ou cartes bancaires pour faciliter vos retraits
                  </p>
                  <Button onClick={handleCreate} size="sm" className="min-h-[44px] text-xs sm:text-sm">
                    <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    Ajouter une méthode
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div 
              ref={methodsRef}
              className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 duration-700"
            >
              {paymentMethods.map((method, index) => (
                <Card 
                  key={method.id} 
                  className={`border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] ${!method.is_active ? 'opacity-60' : ''} animate-in fade-in slide-in-from-bottom-2`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
                    <div className="flex items-start justify-between gap-2 sm:gap-3">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 flex-shrink-0">
                          <div className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5">
                            {getPaymentMethodIcon(method.payment_method)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-xs sm:text-sm md:text-base lg:text-lg truncate">{method.label}</CardTitle>
                          <CardDescription className="text-[10px] sm:text-xs md:text-sm mt-0.5 sm:mt-1">
                            {getPaymentMethodLabel(method.payment_method)}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                        {method.is_default && (
                          <Badge variant="default" className="text-[9px] sm:text-[10px] md:text-xs">
                            <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                            Défaut
                          </Badge>
                        )}
                        {!method.is_active && (
                          <Badge variant="secondary" className="text-[9px] sm:text-[10px] md:text-xs">
                            Inactif
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                    <div className="space-y-2 sm:space-y-3">
                      <div>
                        <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground mb-0.5 sm:mb-1">Détails</p>
                        <p className="text-xs sm:text-sm md:text-base font-medium break-words">{formatPaymentDetails(method)}</p>
                      </div>
                      {method.notes && (
                        <div>
                          <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground mb-0.5 sm:mb-1">Notes</p>
                          <p className="text-[10px] sm:text-xs md:text-sm break-words">{method.notes}</p>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-2">
                        {!method.is_default && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setAsDefault(method.id)}
                            className="min-h-[44px] text-[10px] sm:text-xs md:text-sm h-8 sm:h-9 px-2 sm:px-3"
                          >
                            <StarOff className="h-3 w-3 sm:h-3.5 sm:w-3.5 sm:mr-1" />
                            <span className="hidden sm:inline">Définir par défaut</span>
                            <span className="sm:hidden">Défaut</span>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(method)}
                          className="min-h-[44px] text-[10px] sm:text-xs md:text-sm h-8 sm:h-9 px-2 sm:px-3"
                        >
                          <Edit className="h-3 w-3 sm:h-3.5 sm:w-3.5 sm:mr-1" />
                          <span className="hidden sm:inline">Modifier</span>
                          <span className="sm:hidden">Mod.</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(method.id)}
                          className="min-h-[44px] text-[10px] sm:text-xs md:text-sm h-8 sm:h-9 px-2 sm:px-3"
                        >
                          <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 sm:mr-1" />
                          <span className="hidden sm:inline">Supprimer</span>
                          <span className="sm:hidden">Suppr.</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Dialog */}
          <PaymentMethodDialog
            open={showDialog}
            onOpenChange={setShowDialog}
            method={editingMethod}
            onSubmit={handleSubmit}
          />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default PaymentMethods;







