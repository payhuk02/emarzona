/**
 * Page Checkout - Processus de commande unifié
 * Date: 26 Janvier 2025
 * 
 * Fonctionnalités:
 * - Récapitulatif panier
 * - Formulaire informations livraison
 * - Calcul taxes automatique
 * - Calcul shipping automatique
 * - Validation formulaires
 * - Intégration Moneroo
 * - Support 4 types produits
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useCart } from '@/hooks/cart/useCart';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { initiateMonerooPayment } from '@/lib/moneroo-payment';
import { safeRedirect } from '@/lib/url-validator';
import { logger } from '@/lib/logger';
import {
  ShoppingBag,
  User,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  ArrowRight,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface ShippingAddress {
  full_name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  postal_code: string;
  country: string;
  state?: string;
}

export default function Checkout() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { items, summary, isLoading: cartLoading } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState<ShippingAddress>({
    full_name: '',
    email: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    postal_code: '',
    country: 'BF', // Burkina Faso par défaut
    state: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ShippingAddress, string>>>({});

  // Récupérer l'utilisateur pour pré-remplir le formulaire
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  // Pré-remplir avec données utilisateur si disponible
  useMemo(() => {
    if (user?.email && !formData.email) {
      setFormData(prev => ({
        ...prev,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || '',
      }));
    }
  }, [user]);

  // Calculer taxes (exemple : TVA 18% pour BF)
  const taxRate = 0.18; // 18% TVA pour Burkina Faso
  const taxAmount = useMemo(() => {
    return summary.subtotal * taxRate;
  }, [summary.subtotal, taxRate]);

  // Calculer shipping (exemple simple : 5000 XOF pour BF, 15000 pour autres)
  const shippingAmount = useMemo(() => {
    if (formData.country === 'BF') {
      return 5000; // Frais de livraison Burkina Faso
    }
    return 15000; // International
  }, [formData.country]);

  // Total final
  const finalTotal = useMemo(() => {
    return summary.subtotal + taxAmount + shippingAmount - summary.discount_amount;
  }, [summary, taxAmount, shippingAmount]);

  // Validation formulaire
  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof ShippingAddress, string>> = {};

    if (!formData.full_name.trim()) {
      errors.full_name = 'Le nom complet est requis';
    }

    if (!formData.email.trim()) {
      errors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email invalide';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Le téléphone est requis';
    }

    if (!formData.address_line1.trim()) {
      errors.address_line1 = 'L\'adresse est requise';
    }

    if (!formData.city.trim()) {
      errors.city = 'La ville est requise';
    }

    if (!formData.postal_code.trim()) {
      errors.postal_code = 'Le code postal est requis';
    }

    if (!formData.country.trim()) {
      errors.country = 'Le pays est requis';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Traitement de la commande
  const handleCheckout = async () => {
    if (!validateForm()) {
      toast({
        title: 'Formulaire incomplet',
        description: 'Veuillez corriger les erreurs dans le formulaire',
        variant: 'destructive',
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: 'Panier vide',
        description: 'Votre panier est vide',
        variant: 'destructive',
      });
      navigate('/cart');
      return;
    }

    setIsProcessing(true);

    try {
      // Récupérer l'utilisateur
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        toast({
          title: 'Authentification requise',
          description: 'Veuillez vous connecter pour continuer',
          variant: 'destructive',
        });
        navigate('/auth');
        return;
      }

      // Créer la commande dans la base de données
      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', user.id)
        .single();

      // Pour l'instant, utiliser le store_id du premier produit
      // TODO: Gérer multi-stores dans une commande
      const firstProduct = items[0];
      const { data: product } = await supabase
        .from('products')
        .select('store_id')
        .eq('id', firstProduct.product_id)
        .single();

      if (!product?.store_id) {
        throw new Error('Boutique non trouvée');
      }

      // Générer numéro de commande
      const { data: orderNumberData } = await supabase.rpc('generate_order_number');
      const orderNumber = orderNumberData || `ORD-${Date.now()}`;

      // Créer la commande
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          store_id: product.store_id,
          customer_id: user.id,
          order_number: orderNumber,
          total_amount: finalTotal,
          currency: 'XOF',
          payment_status: 'pending',
          status: 'pending',
          shipping_address: formData,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Créer les order_items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        product_type: item.product_type,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: (item.unit_price - (item.discount_amount || 0)) * item.quantity,
        variant_id: item.variant_id,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Initier le paiement Moneroo
      const paymentResult = await initiateMonerooPayment({
        storeId: product.store_id,
        orderId: order.id,
        customerId: user.id,
        amount: finalTotal,
        currency: 'XOF',
        description: `Commande ${orderNumber} - ${items.length} article(s)`,
        customerEmail: formData.email,
        customerName: formData.full_name,
        customerPhone: formData.phone,
        metadata: {
          order_number: orderNumber,
          item_count: items.length,
          shipping_address: formData,
        },
      });

      if (!paymentResult.success || !paymentResult.checkout_url) {
        throw new Error('Impossible d\'initialiser le paiement');
      }

      // Marquer le panier comme récupéré (pour abandoned cart recovery)
      try {
        await markCartRecovered();
      } catch (err) {
        logger.error('Error marking cart as recovered:', err);
      }
      
      // Rediriger vers Moneroo
      safeRedirect(paymentResult.checkout_url, () => {
        toast({
          title: 'Erreur de paiement',
          description: 'URL de paiement invalide',
          variant: 'destructive',
        });
      });

    } catch (error: any) {
      logger.error('Erreur lors du checkout:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de finaliser la commande',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (cartLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
              <Skeleton className="h-10 w-64" />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <Skeleton className="h-96" />
                </div>
                <Skeleton className="h-96" />
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (items.length === 0) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 p-6">
            <div className="max-w-4xl mx-auto">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Votre panier est vide. <Button variant="link" onClick={() => navigate('/cart')}>Retour au panier</Button>
                </AlertDescription>
              </Alert>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50 dark:bg-gray-900">
        <AppSidebar />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <ShoppingBag className="h-8 w-8" />
                Finaliser la commande
              </h1>
              <p className="text-muted-foreground mt-1">
                Remplissez vos informations pour compléter votre achat
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Formulaire (2/3) */}
              <div className="lg:col-span-2 space-y-6">
                {/* Informations de livraison */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Informations de livraison
                    </CardTitle>
                    <CardDescription>
                      Où souhaitez-vous recevoir votre commande ?
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="full_name">
                          Nom complet <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="full_name"
                          value={formData.full_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                          placeholder="Jean Dupont"
                          className={formErrors.full_name ? 'border-red-500' : ''}
                        />
                        {formErrors.full_name && (
                          <p className="text-sm text-red-500">{formErrors.full_name}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">
                          Email <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="jean@example.com"
                            className={`pl-10 ${formErrors.email ? 'border-red-500' : ''}`}
                          />
                        </div>
                        {formErrors.email && (
                          <p className="text-sm text-red-500">{formErrors.email}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">
                        Téléphone <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="+225 07 12 34 56 78"
                          className={`pl-10 ${formErrors.phone ? 'border-red-500' : ''}`}
                        />
                      </div>
                      {formErrors.phone && (
                        <p className="text-sm text-red-500">{formErrors.phone}</p>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label htmlFor="address_line1">
                        Adresse <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="address_line1"
                        value={formData.address_line1}
                        onChange={(e) => setFormData(prev => ({ ...prev, address_line1: e.target.value }))}
                        placeholder="123 Rue principale"
                        className={formErrors.address_line1 ? 'border-red-500' : ''}
                      />
                      {formErrors.address_line1 && (
                        <p className="text-sm text-red-500">{formErrors.address_line1}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address_line2">
                        Complément d'adresse (optionnel)
                      </Label>
                      <Input
                        id="address_line2"
                        value={formData.address_line2}
                        onChange={(e) => setFormData(prev => ({ ...prev, address_line2: e.target.value }))}
                        placeholder="Appartement, étage, etc."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">
                          Ville <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                          placeholder="Abidjan"
                          className={formErrors.city ? 'border-red-500' : ''}
                        />
                        {formErrors.city && (
                          <p className="text-sm text-red-500">{formErrors.city}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="postal_code">
                          Code postal <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="postal_code"
                          value={formData.postal_code}
                          onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
                          placeholder="01 BP 1234"
                          className={formErrors.postal_code ? 'border-red-500' : ''}
                        />
                        {formErrors.postal_code && (
                          <p className="text-sm text-red-500">{formErrors.postal_code}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="country">
                          Pays <span className="text-red-500">*</span>
                        </Label>
                        <select
                          id="country"
                          value={formData.country}
                          onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                          className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${formErrors.country ? 'border-red-500' : ''}`}
                        >
                          <option value="BF">Burkina Faso</option>
                          <option value="CI">Côte d'Ivoire</option>
                          <option value="SN">Sénégal</option>
                          <option value="ML">Mali</option>
                          <option value="BJ">Bénin</option>
                          <option value="TG">Togo</option>
                          <option value="GN">Guinée</option>
                          <option value="NE">Niger</option>
                          <option value="CM">Cameroun</option>
                          <option value="GA">Gabon</option>
                          <option value="CD">Congo</option>
                          <option value="CG">Congo-Brazzaville</option>
                          <option value="TD">Tchad</option>
                          <option value="CF">Centrafrique</option>
                          <option value="FR">France</option>
                          <option value="BE">Belgique</option>
                          <option value="CA">Canada</option>
                          <option value="US">États-Unis</option>
                        </select>
                        {formErrors.country && (
                          <p className="text-sm text-red-500">{formErrors.country}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Méthode de paiement */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Méthode de paiement
                    </CardTitle>
                    <CardDescription>
                      Le paiement sera effectué via Moneroo
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/50">
                      <CreditCard className="h-6 w-6 text-primary" />
                      <div>
                        <p className="font-medium">Moneroo Payment</p>
                        <p className="text-sm text-muted-foreground">
                          Cartes bancaires, Mobile Money, et plus
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Récapitulatif (1/3) */}
              <div className="lg:col-span-1">
                <Card className="sticky top-4">
                  <CardHeader>
                    <CardTitle>Récapitulatif</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Articles */}
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {items.map((item) => (
                        <div key={item.id} className="flex gap-3 text-sm">
                          <div className="w-12 h-12 rounded border overflow-hidden flex-shrink-0">
                            <img
                              src={item.product_image_url || '/placeholder-product.png'}
                              alt={item.product_name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{item.product_name}</p>
                            {item.variant_name && (
                              <p className="text-xs text-muted-foreground">{item.variant_name}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Quantité: {item.quantity}
                            </p>
                          </div>
                          <p className="font-medium whitespace-nowrap">
                            {((item.unit_price - (item.discount_amount || 0)) * item.quantity).toLocaleString('fr-FR')} XOF
                          </p>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    {/* Détails prix */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sous-total</span>
                        <span>{summary.subtotal.toLocaleString('fr-FR')} XOF</span>
                      </div>

                      {summary.discount_amount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Remise</span>
                          <span>-{summary.discount_amount.toLocaleString('fr-FR')} XOF</span>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Livraison</span>
                        <span>{shippingAmount.toLocaleString('fr-FR')} XOF</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Taxes (TVA 18% - BF)</span>
                        <span>{taxAmount.toLocaleString('fr-FR')} XOF</span>
                      </div>
                    </div>

                    <Separator />

                    {/* Total */}
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total</span>
                      <span className="text-2xl text-primary">
                        {finalTotal.toLocaleString('fr-FR')} XOF
                      </span>
                    </div>

                    {/* Bouton checkout */}
                    <Button
                      onClick={handleCheckout}
                      disabled={isProcessing || items.length === 0}
                      className="w-full"
                      size="lg"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Traitement...
                        </>
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Payer {finalTotal.toLocaleString('fr-FR')} XOF
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      {summary.item_count} {summary.item_count > 1 ? 'articles' : 'article'}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

