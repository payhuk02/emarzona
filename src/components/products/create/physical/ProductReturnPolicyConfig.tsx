/**
 * Product Return Policy Configuration
 * Configuration de politique de retour par produit
 * Date: 2025
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useReturnPolicies, type ReturnPolicy } from '@/hooks/physical/useReturns';
import { useStore } from '@/hooks/useStore';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Info } from 'lucide-react';
import { logger } from '@/lib/logger';

interface ProductReturnPolicyConfigProps {
  productId?: string;
  initialPolicyId?: string;
  onPolicyChange?: (policyId: string | null) => void;
}

export function ProductReturnPolicyConfig({
  productId,
  initialPolicyId,
  onPolicyChange,
}: ProductReturnPolicyConfigProps) {
  const { store } = useStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: policies = [] } = useReturnPolicies(store?.id);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(initialPolicyId || null);
  const [isCreatingPolicy, setIsCreatingPolicy] = useState(false);
  const [newPolicy, setNewPolicy] = useState<Partial<ReturnPolicy>>({
    name: '',
    description: '',
    return_window_days: 30,
    requires_receipt: true,
    requires_photos: true,
    requires_original_packaging: false,
    requires_tags: false,
    restocking_fee_percentage: 0,
    restocking_fee_fixed: 0,
    return_shipping_paid_by: 'customer',
    accepted_reasons: [
      'defective',
      'wrong_item',
      'not_as_described',
      'damaged',
      'size_issue',
      'color_issue',
      'changed_mind',
      'late_delivery',
      'other',
    ],
    allowed_refund_methods: ['original_payment', 'store_credit', 'exchange'],
    applies_to_all_products: false,
    specific_product_ids: productId ? [productId] : [],
    is_active: true,
  });

  const createPolicy = useMutation({
    mutationFn: async (policy: Partial<ReturnPolicy>) => {
      if (!store?.id) throw new Error('Store ID manquant');

      const { data, error } = await supabase
        .from('return_policies')
        .insert({
          store_id: store.id,
          ...policy,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ReturnPolicy;
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['return-policies', store?.id] });
      setSelectedPolicyId(data.id);
      onPolicyChange?.(data.id);
      setIsCreatingPolicy(false);
      toast({
        title: '✅ Politique créée',
        description: 'La politique de retour a été créée avec succès',
      });
    },
    onError: (error: Error) => {
      logger.error('Error creating return policy', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer la politique',
        variant: 'destructive',
      });
    },
  });

  const handlePolicySelect = (policyId: string) => {
    setSelectedPolicyId(policyId);
    onPolicyChange?.(policyId);
  };

  const handleCreatePolicy = () => {
    createPolicy.mutate(newPolicy);
  };

  const selectedPolicy = policies.find(p => p.id === selectedPolicyId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Politique de Retour
          </CardTitle>
          <CardDescription>Configurez la politique de retour pour ce produit</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sélection politique existante */}
          <div className="space-y-2">
            <Label>Politique de retour</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={selectedPolicyId || '__none__'} onValueChange={handlePolicySelect}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Sélectionner une politique" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Aucune politique (défaut store)</SelectItem>
                  {policies.map(policy => (
                    <SelectItem key={policy.id} value={policy.id}>
                      {policy.name} {policy.is_default && '(Défaut)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => setIsCreatingPolicy(true)}
                className="w-full sm:w-auto"
              >
                Créer nouvelle
              </Button>
            </div>
          </div>

          {/* Affichage politique sélectionnée */}
          {selectedPolicy && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium">{selectedPolicy.name}</div>
                  {selectedPolicy.description && (
                    <p className="text-sm">{selectedPolicy.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="outline">{selectedPolicy.return_window_days} jours</Badge>
                    {selectedPolicy.requires_photos && (
                      <Badge variant="outline">Photos requises</Badge>
                    )}
                    {selectedPolicy.requires_original_packaging && (
                      <Badge variant="outline">Emballage original</Badge>
                    )}
                    {selectedPolicy.restocking_fee_percentage > 0 && (
                      <Badge variant="outline">
                        Frais: {selectedPolicy.restocking_fee_percentage}%
                      </Badge>
                    )}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Formulaire création politique */}
          {isCreatingPolicy && (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="text-lg">Nouvelle Politique de Retour</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="policy-name">Nom de la politique *</Label>
                  <Input
                    id="policy-name"
                    value={newPolicy.name || ''}
                    onChange={e => setNewPolicy({ ...newPolicy, name: e.target.value })}
                    placeholder="Ex: Politique Standard"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="policy-description">Description</Label>
                  <Textarea
                    id="policy-description"
                    value={newPolicy.description || ''}
                    onChange={e => setNewPolicy({ ...newPolicy, description: e.target.value })}
                    placeholder="Décrivez cette politique..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="return-window">Fenêtre de retour (jours) *</Label>
                    <Input
                      id="return-window"
                      type="number"
                      min="1"
                      value={newPolicy.return_window_days || 30}
                      onChange={e =>
                        setNewPolicy({
                          ...newPolicy,
                          return_window_days: parseInt(e.target.value) || 30,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="restocking-fee">Frais réapprovisionnement (%)</Label>
                    <Input
                      id="restocking-fee"
                      type="number"
                      min="0"
                      max="100"
                      value={newPolicy.restocking_fee_percentage || 0}
                      onChange={e =>
                        setNewPolicy({
                          ...newPolicy,
                          restocking_fee_percentage: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Conditions</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="requires-photos"
                        checked={newPolicy.requires_photos}
                        onCheckedChange={checked =>
                          setNewPolicy({ ...newPolicy, requires_photos: !!checked })
                        }
                      />
                      <Label htmlFor="requires-photos" className="font-normal cursor-pointer">
                        Photos requises
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="requires-packaging"
                        checked={newPolicy.requires_original_packaging}
                        onCheckedChange={checked =>
                          setNewPolicy({
                            ...newPolicy,
                            requires_original_packaging: !!checked,
                          })
                        }
                      />
                      <Label htmlFor="requires-packaging" className="font-normal cursor-pointer">
                        Emballage original requis
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="requires-tags"
                        checked={newPolicy.requires_tags}
                        onCheckedChange={checked =>
                          setNewPolicy({ ...newPolicy, requires_tags: !!checked })
                        }
                      />
                      <Label htmlFor="requires-tags" className="font-normal cursor-pointer">
                        Étiquettes requises (vêtements)
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Qui paie l'expédition retour ?</Label>
                  <Select
                    value={newPolicy.return_shipping_paid_by || 'customer'}
                    onValueChange={(value: 'customer' | 'store') =>
                      setNewPolicy({ ...newPolicy, return_shipping_paid_by: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Client</SelectItem>
                      <SelectItem value="store">Boutique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleCreatePolicy}
                    disabled={!newPolicy.name || createPolicy.isPending}
                  >
                    {createPolicy.isPending ? 'Création...' : 'Créer la politique'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreatingPolicy(false);
                      setNewPolicy({
                        name: '',
                        return_window_days: 30,
                        requires_photos: true,
                        applies_to_all_products: false,
                        specific_product_ids: productId ? [productId] : [],
                      });
                    }}
                  >
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}






