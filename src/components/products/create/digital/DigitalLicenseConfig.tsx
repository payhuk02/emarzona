/**
 * Digital Product - License Configuration (Step 3)
 * Date: 27 octobre 2025
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Key, Download, Calendar, Shield } from 'lucide-react';

interface DigitalLicenseConfigProps {
  formData: any;
  updateFormData: (updates: any) => void;
}

const LICENSE_TYPES = [
  {
    value: 'single',
    label: 'License unique',
    description: 'Un seul appareil/utilisateur',
    badge: 'Basique',
  },
  {
    value: 'multi',
    label: 'License multiple',
    description: 'Plusieurs appareils (3-5)',
    badge: 'Populaire',
  },
  {
    value: 'unlimited',
    label: 'License illimitée',
    description: 'Utilisation sans limite',
    badge: 'Premium',
  },
];

export const DigitalLicenseConfig = ({
  formData,
  updateFormData,
}: DigitalLicenseConfigProps) => {
  return (
    <div className="space-y-6">
      {/* License Type */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Type de license</CardTitle>
          </div>
          <CardDescription>
            Définissez comment vos clients peuvent utiliser le produit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3">
            {LICENSE_TYPES.map((type) => (
              <div
                key={type.value}
                className={`relative flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  formData.license_type === type.value
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-primary/50'
                }`}
                onClick={() => updateFormData({ license_type: type.value })}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{type.label}</p>
                    <Badge variant="secondary" className="text-xs">
                      {type.badge}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {type.description}
                  </p>
                </div>
                {formData.license_type === type.value && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Download Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Paramètres de téléchargement</CardTitle>
          </div>
          <CardDescription>
            Contrôlez comment les clients téléchargent le produit
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="download_limit">
              Nombre de téléchargements autorisés
            </Label>
            <Select
              value={String(formData.download_limit || 5)}
              onValueChange={(value) => updateFormData({ download_limit: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 téléchargement</SelectItem>
                <SelectItem value="3">3 téléchargements</SelectItem>
                <SelectItem value="5">5 téléchargements</SelectItem>
                <SelectItem value="10">10 téléchargements</SelectItem>
                <SelectItem value="-1">Illimité</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Le client pourra télécharger le fichier {formData.download_limit === -1 ? 'un nombre illimité de fois' : `${formData.download_limit} fois`}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="download_expiry_days">
              Durée de validité du lien (jours)
            </Label>
            <Select
              value={String(formData.download_expiry_days || 30)}
              onValueChange={(value) => updateFormData({ download_expiry_days: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 jours</SelectItem>
                <SelectItem value="14">14 jours</SelectItem>
                <SelectItem value="30">30 jours</SelectItem>
                <SelectItem value="60">60 jours</SelectItem>
                <SelectItem value="90">90 jours</SelectItem>
                <SelectItem value="365">1 an</SelectItem>
                <SelectItem value="-1">Permanent</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Le lien de téléchargement expirera après {formData.download_expiry_days === -1 ? 'jamais' : `${formData.download_expiry_days} jours`}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Protection Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Protection et sécurité</CardTitle>
          </div>
          <CardDescription>
            Ajoutez des mesures de protection supplémentaires
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="watermark">Filigrane automatique</Label>
              <p className="text-sm text-muted-foreground">
                Ajouter un filigrane avec l'email du client
              </p>
            </div>
            <Switch
              id="watermark"
              checked={formData.watermark_enabled || false}
              onCheckedChange={(checked) => updateFormData({ watermark_enabled: checked })}
            />
          </div>

          {formData.watermark_enabled && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">
                ✓ Un filigrane contenant l'email de l'acheteur sera automatiquement ajouté aux fichiers PDF.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">Résumé de la configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Type de license</span>
            <Badge>
              {LICENSE_TYPES.find(t => t.value === formData.license_type)?.label || 'License unique'}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Téléchargements</span>
            <span className="font-medium">
              {formData.download_limit === -1 ? 'Illimité' : `${formData.download_limit} fois`}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Validité du lien</span>
            <span className="font-medium">
              {formData.download_expiry_days === -1 ? 'Permanent' : `${formData.download_expiry_days} jours`}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Filigrane</span>
            <Badge variant={formData.watermark_enabled ? 'default' : 'outline'}>
              {formData.watermark_enabled ? 'Activé' : 'Désactivé'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


