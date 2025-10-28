/**
 * License Generator Component
 * Date: 27 octobre 2025
 * 
 * Générateur de licenses pour produits digitaux
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, RefreshCw, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDigitalProducts } from '@/hooks/digital/useDigitalProducts';
import { supabase } from '@/integrations/supabase/client';

interface LicenseGeneratorProps {
  onSuccess?: () => void;
}

export const LicenseGenerator = ({ onSuccess }: LicenseGeneratorProps) => {
  const { toast } = useToast();
  const { data: digitalProducts, isLoading } = useDigitalProducts();
  const [quantity, setQuantity] = useState(1);
  const [productId, setProductId] = useState('');
  const [duration, setDuration] = useState('365');
  const [maxActivations, setMaxActivations] = useState('1');
  const [generatedKeys, setGeneratedKeys] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const generateLicenseKey = (): string => {
    const segments = 4;
    const segmentLength = 4;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    
    const key = Array(segments)
      .fill(0)
      .map(() => {
        return Array(segmentLength)
          .fill(0)
          .map(() => chars[Math.floor(Math.random() * chars.length)])
          .join('');
      })
      .join('-');

    return key;
  };

  const handleGenerate = () => {
    const keys = Array(quantity)
      .fill(0)
      .map(() => generateLicenseKey());

    setGeneratedKeys(keys);

    toast({
      title: 'Licenses générées',
      description: `${keys.length} license(s) générée(s) avec succès`,
    });
  };

  const handleCopy = (key: string, index: number) => {
    navigator.clipboard.writeText(key);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    
    toast({
      title: 'Copié',
      description: 'Clé copiée dans le presse-papier',
    });
  };

  const handleCopyAll = () => {
    const allKeys = generatedKeys.join('\n');
    navigator.clipboard.writeText(allKeys);
    
    toast({
      title: 'Toutes les clés copiées',
      description: `${generatedKeys.length} clé(s) copiée(s)`,
    });
  };

  const handleSave = async () => {
    if (!productId || generatedKeys.length === 0) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un produit et générer des clés',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    
    try {
      // Calculate expiry date
      const expiresAt = duration 
        ? new Date(Date.now() + parseInt(duration) * 24 * 60 * 60 * 1000).toISOString()
        : null;

      // Create licenses in database
      const licensesData = generatedKeys.map(key => ({
        digital_product_id: productId,
        license_key: key,
        license_type: parseInt(maxActivations) === 1 ? 'single' : 'multi',
        max_activations: parseInt(maxActivations),
        activations_count: 0,
        expires_at: expiresAt,
        is_active: true,
      }));

      const { error } = await supabase
        .from('digital_licenses')
        .insert(licensesData);

      if (error) throw error;

      toast({
        title: '✅ Succès',
        description: `${generatedKeys.length} license(s) enregistrée(s) avec succès`,
      });
      
      // Reset form
      setGeneratedKeys([]);
      setProductId('');
      setQuantity(1);
      
      onSuccess?.();
    } catch (error: any) {
      console.error('Save licenses error:', error);
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible d\'enregistrer les licenses',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="product">Produit Digital *</Label>
          <Select value={productId} onValueChange={setProductId} disabled={isLoading}>
            <SelectTrigger id="product">
              <SelectValue placeholder={isLoading ? "Chargement..." : "Sélectionner un produit"} />
            </SelectTrigger>
            <SelectContent>
              {digitalProducts && digitalProducts.length > 0 ? (
                digitalProducts.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.product?.name || 'Produit sans nom'}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>
                  Aucun produit digital trouvé
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantity">Quantité</Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            max="100"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">Durée (jours)</Label>
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger id="duration">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 jours</SelectItem>
              <SelectItem value="90">90 jours</SelectItem>
              <SelectItem value="180">6 mois</SelectItem>
              <SelectItem value="365">1 an</SelectItem>
              <SelectItem value="-1">À vie</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="activations">Max Activations</Label>
          <Select value={maxActivations} onValueChange={setMaxActivations}>
            <SelectTrigger id="activations">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 appareil</SelectItem>
              <SelectItem value="3">3 appareils</SelectItem>
              <SelectItem value="5">5 appareils</SelectItem>
              <SelectItem value="-1">Illimité</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        disabled={!productId}
        className="w-full"
        size="lg"
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Générer {quantity} License{quantity > 1 ? 's' : ''}
      </Button>

      {/* Generated Keys */}
      {generatedKeys.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">
              Clés Générées ({generatedKeys.length})
            </h3>
            <Button variant="outline" size="sm" onClick={handleCopyAll}>
              <Copy className="h-4 w-4 mr-2" />
              Copier tout
            </Button>
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {generatedKeys.map((key, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Badge variant="outline">{index + 1}</Badge>
                      <code className="font-mono text-sm flex-1 truncate">
                        {key}
                      </code>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(key, index)}
                    >
                      {copiedIndex === index ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Save Button */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setGeneratedKeys([])} className="flex-1">
              Annuler
            </Button>
            <Button onClick={handleSave} className="flex-1" disabled={isSaving || !productId || generatedKeys.length === 0}>
              {isSaving ? 'Enregistrement...' : 'Sauvegarder les Licenses'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

