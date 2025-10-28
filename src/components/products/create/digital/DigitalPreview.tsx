/**
 * Digital Product - Preview (Step 4)
 * Date: 27 octobre 2025
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Package, 
  DollarSign, 
  File, 
  Key, 
  Download, 
  Calendar,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface DigitalPreviewProps {
  formData: any;
}

export const DigitalPreview = ({ formData }: DigitalPreviewProps) => {
  /**
   * Format file size
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  /**
   * Calculate total files size
   */
  const getTotalSize = () => {
    if (!formData.downloadable_files || formData.downloadable_files.length === 0) {
      return 0;
    }
    return formData.downloadable_files.reduce((total: number, file: any) => total + (file.size || 0), 0);
  };

  /**
   * Check if ready to publish
   */
  const isReadyToPublish = () => {
    return (
      formData.name &&
      formData.price >= 0 &&
      formData.main_file_url &&
      formData.category
    );
  };

  const readyItems = [
    { label: 'Nom du produit', ready: !!formData.name },
    { label: 'Prix défini', ready: formData.price >= 0 },
    { label: 'Fichier principal', ready: !!formData.main_file_url },
    { label: 'Catégorie', ready: !!formData.category },
  ];

  const completedCount = readyItems.filter(item => item.ready).length;

  return (
    <div className="space-y-6">
      {/* Readiness Check */}
      <Card className={isReadyToPublish() ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900' : 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900'}>
        <CardHeader>
          <div className="flex items-center gap-3">
            {isReadyToPublish() ? (
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            )}
            <div>
              <CardTitle className="text-lg">
                {isReadyToPublish() ? 'Prêt à publier !' : 'Vérification en cours'}
              </CardTitle>
              <CardDescription>
                {completedCount}/{readyItems.length} éléments complétés
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {readyItems.map((item, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                {item.ready ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-yellow-600" />
                )}
                <span className={item.ready ? 'text-green-900 dark:text-green-100' : 'text-yellow-900 dark:text-yellow-100'}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Product Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Informations du produit</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.image_url && (
            <div className="flex justify-center">
              <img
                src={formData.image_url}
                alt={formData.name}
                className="h-48 w-48 object-cover rounded-lg border"
              />
            </div>
          )}

          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Nom du produit</p>
              <p className="font-medium text-lg">{formData.name || 'Non défini'}</p>
            </div>

            {formData.short_description && (
              <div>
                <p className="text-sm text-muted-foreground">Description courte</p>
                <p className="text-sm">{formData.short_description}</p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Badge>{formData.category || 'Aucune catégorie'}</Badge>
              <Badge variant="outline">Produit Digital</Badge>
            </div>

            {formData.slug && (
              <div>
                <p className="text-sm text-muted-foreground">URL</p>
                <code className="text-sm bg-muted px-2 py-1 rounded">
                  /products/{formData.slug}
                </code>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Tarification</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-baseline gap-2">
            {formData.promotional_price && formData.promotional_price < formData.price ? (
              <>
                <span className="text-3xl font-bold text-primary">
                  {formData.promotional_price} {formData.currency}
                </span>
                <span className="text-lg text-muted-foreground line-through">
                  {formData.price} {formData.currency}
                </span>
                <Badge variant="destructive">
                  -{Math.round(((formData.price - formData.promotional_price) / formData.price) * 100)}%
                </Badge>
              </>
            ) : (
              <span className="text-3xl font-bold text-primary">
                {formData.price || 0} {formData.currency}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Files */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <File className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Fichiers</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="font-medium">Fichier principal</p>
              <p className="text-sm text-muted-foreground">
                {formData.main_file_url ? 'Configuré' : 'Non configuré'}
              </p>
            </div>
            {formData.main_file_url && (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            )}
          </div>

          {formData.downloadable_files && formData.downloadable_files.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Fichiers additionnels ({formData.downloadable_files.length})
              </p>
              <div className="space-y-2">
                {formData.downloadable_files.map((file: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Taille totale : {formatFileSize(getTotalSize())}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* License & Download Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Configuration</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Type de license</span>
            <Badge>
              {formData.license_type === 'single' && 'License unique'}
              {formData.license_type === 'multi' && 'License multiple'}
              {formData.license_type === 'unlimited' && 'License illimitée'}
            </Badge>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Téléchargements autorisés</span>
            <span className="font-medium">
              {formData.download_limit === -1 ? 'Illimité' : `${formData.download_limit || 5} fois`}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Validité du lien</span>
            <span className="font-medium">
              {formData.download_expiry_days === -1 ? 'Permanent' : `${formData.download_expiry_days || 30} jours`}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Filigrane</span>
            <Badge variant={formData.watermark_enabled ? 'default' : 'outline'}>
              {formData.watermark_enabled ? 'Activé' : 'Désactivé'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Final Note */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <p className="text-sm text-center text-muted-foreground">
            Une fois publié, votre produit sera visible dans votre boutique et disponible à l'achat.
            Vous pourrez le modifier à tout moment depuis le tableau de bord.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};


