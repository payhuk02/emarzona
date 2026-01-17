/**
 * Exemple de composant utilisant le système offline-first
 * Création de commande avec support automatique du mode hors ligne
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useOfflineActions } from '@/hooks/useOfflineActions';
import { useOfflineMode } from '@/hooks/useOfflineMode';
import { ShoppingCart, Wifi, WifiOff, CheckCircle, Clock } from 'lucide-react';
import { logger } from '@/lib/logger';

interface OrderItem {
  product_id: string;
  quantity: number;
  unit_price: number;
}

interface OrderCreatorProps {
  storeId: string;
  userId: string;
  onOrderCreated?: (orderId: string) => void;
}

export const OrderCreator = ({ storeId, userId, onOrderCreated }: OrderCreatorProps) => {
  const { createOrder } = useOfflineActions();
  const { connectionStatus, pendingActions } = useOfflineMode();

  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState({
    order_number: '',
    total_amount: 0,
    currency: 'EUR',
    shipping_address: {
      street: '',
      city: '',
      postal_code: '',
      country: ''
    },
    billing_address: {
      street: '',
      city: '',
      postal_code: '',
      country: ''
    },
    payment_method: 'card',
    items: [] as OrderItem[]
  });

  // Ajouter un produit à la commande
  const addProduct = () => {
    setOrderData(prev => ({
      ...prev,
      items: [...prev.items, {
        product_id: `product_${Date.now()}`, // En production: ID réel du produit
        quantity: 1,
        unit_price: 10.00 // En production: prix réel du produit
      }]
    }));
  };

  // Calculer le total
  const calculateTotal = () => {
    return orderData.items.reduce((total, item) => total + (item.quantity * item.unit_price), 0);
  };

  // Créer la commande
  const handleCreateOrder = async () => {
    if (!orderData.order_number.trim()) {
      alert('Veuillez saisir un numéro de commande');
      return;
    }

    if (orderData.items.length === 0) {
      alert('Veuillez ajouter au moins un produit');
      return;
    }

    setLoading(true);

    try {
      const finalOrderData = {
        ...orderData,
        total_amount: calculateTotal(),
        // En production, ces données viendraient du contexte utilisateur
        user_id: userId,
        store_id: storeId
      };

      const result = await createOrder(storeId, finalOrderData);

      if (result.success) {
        if (!result.offline) {
          // Mode online - commande créée immédiatement
          logger.info('Commande créée avec succès:', result.orderId);
          onOrderCreated?.(result.orderId!);
        } else {
          // Mode offline - commande en queue
          logger.info('Commande mise en queue offline');
        }

        // Reset form
        setOrderData({
          order_number: '',
          total_amount: 0,
          currency: 'EUR',
          shipping_address: {
            street: '',
            city: '',
            postal_code: '',
            country: ''
          },
          billing_address: {
            street: '',
            city: '',
            postal_code: '',
            country: ''
          },
          payment_method: 'card',
          items: []
        });

      } else {
        alert('Erreur lors de la création de la commande');
      }

    } catch (error) {
      logger.error('Erreur création commande:', error);
      alert('Erreur lors de la création de la commande');
    } finally {
      setLoading(false);
    }
  };

  const isOffline = connectionStatus === 'offline' || connectionStatus === 'backend_down';

  return (
    <div className="space-y-6">
      {/* Statut de connectivité */}
      <Alert className={isOffline ? "border-orange-200 bg-orange-50" : "border-green-200 bg-green-50"}>
        {isOffline ? (
          <WifiOff className="h-4 w-4 text-orange-600" />
        ) : (
          <Wifi className="h-4 w-4 text-green-600" />
        )}
        <AlertDescription className={isOffline ? "text-orange-800" : "text-green-800"}>
          {isOffline ? (
            <>
              <strong>Mode hors ligne détecté</strong> - Votre commande sera enregistrée localement
              et synchronisée automatiquement dès que possible.
            </>
          ) : (
            <>
              <strong>Connecté</strong> - Votre commande sera traitée immédiatement.
            </>
          )}
        </AlertDescription>
      </Alert>

      {/* Actions en attente */}
      {pendingActions > 0 && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            <strong>{pendingActions} action(s) en attente de synchronisation</strong>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Créer une commande
          </CardTitle>
          <CardDescription>
            Création de commande avec support offline automatique
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Informations de base */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="order_number">Numéro de commande</Label>
              <Input
                id="order_number"
                value={orderData.order_number}
                onChange={(e) => setOrderData(prev => ({ ...prev, order_number: e.target.value }))}
                placeholder="CMD-2025-001"
              />
            </div>

            <div>
              <Label htmlFor="payment_method">Mode de paiement</Label>
              <select
                id="payment_method"
                className="w-full p-2 border rounded"
                value={orderData.payment_method}
                onChange={(e) => setOrderData(prev => ({ ...prev, payment_method: e.target.value }))}
              >
                <option value="card">Carte bancaire</option>
                <option value="paypal">PayPal</option>
                <option value="bank_transfer">Virement bancaire</option>
                <option value="cash">Espèces</option>
              </select>
            </div>
          </div>

          {/* Adresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Adresse de livraison */}
            <div className="space-y-4">
              <h3 className="font-medium">Adresse de livraison</h3>
              <div className="space-y-2">
                <Input
                  placeholder="Rue"
                  value={orderData.shipping_address.street}
                  onChange={(e) => setOrderData(prev => ({
                    ...prev,
                    shipping_address: { ...prev.shipping_address, street: e.target.value }
                  }))}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Ville"
                    value={orderData.shipping_address.city}
                    onChange={(e) => setOrderData(prev => ({
                      ...prev,
                      shipping_address: { ...prev.shipping_address, city: e.target.value }
                    }))}
                  />
                  <Input
                    placeholder="Code postal"
                    value={orderData.shipping_address.postal_code}
                    onChange={(e) => setOrderData(prev => ({
                      ...prev,
                      shipping_address: { ...prev.shipping_address, postal_code: e.target.value }
                    }))}
                  />
                </div>
                <Input
                  placeholder="Pays"
                  value={orderData.shipping_address.country}
                  onChange={(e) => setOrderData(prev => ({
                    ...prev,
                    shipping_address: { ...prev.shipping_address, country: e.target.value }
                  }))}
                />
              </div>
            </div>

            {/* Adresse de facturation */}
            <div className="space-y-4">
              <h3 className="font-medium">Adresse de facturation</h3>
              <div className="space-y-2">
                <Input
                  placeholder="Rue"
                  value={orderData.billing_address.street}
                  onChange={(e) => setOrderData(prev => ({
                    ...prev,
                    billing_address: { ...prev.billing_address, street: e.target.value }
                  }))}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Ville"
                    value={orderData.billing_address.city}
                    onChange={(e) => setOrderData(prev => ({
                      ...prev,
                      billing_address: { ...prev.billing_address, city: e.target.value }
                    }))}
                  />
                  <Input
                    placeholder="Code postal"
                    value={orderData.billing_address.postal_code}
                    onChange={(e) => setOrderData(prev => ({
                      ...prev,
                      billing_address: { ...prev.billing_address, postal_code: e.target.value }
                    }))}
                  />
                </div>
                <Input
                  placeholder="Pays"
                  value={orderData.billing_address.country}
                  onChange={(e) => setOrderData(prev => ({
                    ...prev,
                    billing_address: { ...prev.billing_address, country: e.target.value }
                  }))}
                />
              </div>
            </div>
          </div>

          {/* Produits */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Produits</h3>
              <Button onClick={addProduct} variant="outline" size="sm">
                + Ajouter un produit
              </Button>
            </div>

            {orderData.items.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Aucun produit ajouté
              </p>
            ) : (
              <div className="space-y-2">
                {orderData.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{item.product_id}</Badge>
                      <span>Quantité: {item.quantity}</span>
                      <span>Prix: {item.unit_price}€</span>
                      <span>Total: {(item.quantity * item.unit_price).toFixed(2)}€</span>
                    </div>
                    <Button
                      onClick={() => {
                        setOrderData(prev => ({
                          ...prev,
                          items: prev.items.filter((_, i) => i !== index)
                        }));
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Supprimer
                    </Button>
                  </div>
                ))}

                <div className="flex justify-end pt-4 border-t">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-xl font-bold">{calculateTotal().toFixed(2)}€</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bouton de création */}
          <div className="flex justify-end">
            <Button
              onClick={handleCreateOrder}
              disabled={loading || !orderData.order_number.trim() || orderData.items.length === 0}
              className="min-w-32"
            >
              {loading ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  {isOffline ? 'Mise en queue...' : 'Création...'}
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {isOffline ? 'Enregistrer hors ligne' : 'Créer la commande'}
                </>
              )}
            </Button>
          </div>

          {/* Message informatif */}
          <div className="text-sm text-muted-foreground bg-blue-50 p-4 rounded-lg">
            <p className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Sécurité garantie :</strong> Toutes les commandes sont validées
                par le serveur avant application. En mode hors ligne, vos données sont
                chiffrées localement et synchronisées automatiquement.
              </span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};