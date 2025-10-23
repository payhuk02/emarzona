import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ImageUpload } from "@/components/ui/image-upload";
import { 
  Image as ImageIcon, 
  Video, 
  Palette, 
  Layout, 
  Eye, 
  Upload,
  Trash2,
  Download,
  RotateCw,
  Crop,
  Filter,
  Settings,
  Images,
  Camera,
  FileImage,
  Monitor,
  Smartphone,
  Tablet
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Form data interface pour ProductVisualTab
 */
interface ProductFormData {
  name?: string;
  price?: number;
  currency?: string;
  promotional_price?: number;
  short_description?: string;
  description?: string;
  image_url?: string;
  gallery_images?: string[];
  video_url?: string;
  featured?: boolean;
  hide_from_store?: boolean;
  hide_purchase_count?: boolean;
}

interface ProductVisualTabProps {
  formData: ProductFormData;
  updateFormData: (field: string, value: any) => void;
  storeId: string;
}

export const ProductVisualTab = ({ formData, updateFormData, storeId }: ProductVisualTabProps) => {
  const [activePreview, setActivePreview] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const handleImageUpload = (urls: string | string[]) => {
    if (Array.isArray(urls)) {
      updateFormData("gallery_images", urls);
    } else {
      updateFormData("image_url", urls);
    }
  };

  const removeImage = (index: number, type: 'main' | 'gallery') => {
    if (type === 'main') {
      updateFormData("image_url", "");
    } else {
      const newGallery = (formData.gallery_images || []).filter((_: any, i: number) => i !== index);
      updateFormData("gallery_images", newGallery);
    }
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const gallery = [...(formData.gallery_images || [])];
    const [movedImage] = gallery.splice(fromIndex, 1);
    gallery.splice(toIndex, 0, movedImage);
    updateFormData("gallery_images", gallery);
  };

  const getPreviewSize = () => {
    switch (activePreview) {
      case 'mobile': return 'w-80';
      case 'tablet': return 'w-96';
      default: return 'w-full';
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Visuel & Design</h2>
          <p className="text-sm sm:text-base text-gray-600">Configurez l'apparence visuelle de votre produit</p>
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Sélecteur de mode d'aperçu">
          <Button
            variant={activePreview === 'desktop' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActivePreview('desktop')}
            className="touch-manipulation min-h-[44px] min-w-[44px]"
            aria-label="Aperçu desktop"
            aria-pressed={activePreview === 'desktop'}
          >
            <Monitor className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            variant={activePreview === 'tablet' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActivePreview('tablet')}
            className="touch-manipulation min-h-[44px] min-w-[44px]"
            aria-label="Aperçu tablette"
            aria-pressed={activePreview === 'tablet'}
          >
            <Tablet className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            variant={activePreview === 'mobile' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActivePreview('mobile')}
            className="touch-manipulation min-h-[44px] min-w-[44px]"
            aria-label="Aperçu mobile"
            aria-pressed={activePreview === 'mobile'}
          >
            <Smartphone className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration */}
        <div className="space-y-6">
          {/* Image principale */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Image principale
              </CardTitle>
              <CardDescription>
                Image affichée en premier sur votre produit
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUpload
                value={formData.image_url || ""}
                onChange={(url) => updateFormData("image_url", url)}
                storeId={storeId}
                multiple={false}
                maxSize={10}
              />
              
              {formData.image_url && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">Image principale</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(formData.image_url, '_blank')}
                      className="touch-manipulation min-h-[44px]"
                      aria-label="Voir l'image principale en grand"
                    >
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateFormData("image_url", "")}
                      className="touch-manipulation min-h-[44px]"
                      aria-label="Supprimer l'image principale"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                  <img
                    src={formData.image_url}
                    alt="Image principale du produit"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Galerie d'images */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Images className="h-5 w-5" />
                Galerie d'images
              </CardTitle>
              <CardDescription>
                Images supplémentaires pour votre produit
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUpload
                value={formData.gallery_images || []}
                onChange={(urls) => updateFormData("gallery_images", urls)}
                storeId={storeId}
                multiple={true}
                maxFiles={10}
                maxSize={10}
              />
              
              {(formData.gallery_images || []).length > 0 && (
                <div className="mt-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {(formData.gallery_images || []).map((url: string, index: number) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Image ${index + 1} de la galerie`}
                          className="w-full h-24 sm:h-28 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => window.open(url, '_blank')}
                              className="h-10 w-10 p-0 touch-manipulation"
                              aria-label={`Voir l'image ${index + 1} en grand`}
                            >
                              <Eye className="h-4 w-4" aria-hidden="true" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeImage(index, 'gallery')}
                              className="h-10 w-10 p-0 touch-manipulation"
                              aria-label={`Supprimer l'image ${index + 1}`}
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          </div>
                        </div>
                        <div className="absolute top-1 left-1">
                          <Badge variant="secondary" className="text-xs" aria-hidden="true">
                            {index + 1}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vidéo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Vidéo du produit
              </CardTitle>
              <CardDescription>
                Vidéo de présentation ou démonstration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="video_url">URL de la vidéo</Label>
                <Input
                  id="video_url"
                  value={formData.video_url || ""}
                  onChange={(e) => updateFormData("video_url", e.target.value)}
                  placeholder="https://youtube.com/watch?v=... ou https://vimeo.com/..."
                  aria-label="URL de la vidéo du produit"
                  aria-describedby="video-url-hint"
                />
                <p id="video-url-hint" className="text-xs text-gray-500 mt-1">
                  Supporte YouTube, Vimeo et autres plateformes
                </p>
              </div>
              
              {formData.video_url && (
                <div className="mt-4">
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Video className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Aperçu vidéo</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(formData.video_url, '_blank')}
                        className="mt-2 touch-manipulation min-h-[44px]"
                        aria-label="Ouvrir la vidéo dans un nouvel onglet"
                      >
                        Ouvrir la vidéo
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Options d'affichage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Options d'affichage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4 min-h-[60px]">
                <div className="flex-1">
                  <Label htmlFor="featured-switch">Image en vedette</Label>
                  <p className="text-sm text-gray-600">Mettre en avant ce produit</p>
                </div>
                <Switch
                  id="featured-switch"
                  checked={formData.featured || false}
                  onCheckedChange={(checked) => updateFormData("featured", checked)}
                  aria-label="Mettre ce produit en vedette"
                />
              </div>

              <div className="flex items-center justify-between gap-4 min-h-[60px]">
                <div className="flex-1">
                  <Label htmlFor="hide-store-switch">Masquer du magasin</Label>
                  <p className="text-sm text-gray-600">Cacher ce produit de la boutique</p>
                </div>
                <Switch
                  id="hide-store-switch"
                  checked={formData.hide_from_store || false}
                  onCheckedChange={(checked) => updateFormData("hide_from_store", checked)}
                  aria-label="Masquer ce produit du magasin"
                />
              </div>

              <div className="flex items-center justify-between gap-4 min-h-[60px]">
                <div className="flex-1">
                  <Label htmlFor="hide-count-switch">Masquer le compteur d'achats</Label>
                  <p className="text-sm text-gray-600">Ne pas afficher le nombre d'achats</p>
                </div>
                <Switch
                  id="hide-count-switch"
                  checked={formData.hide_purchase_count || false}
                  onCheckedChange={(checked) => updateFormData("hide_purchase_count", checked)}
                  aria-label="Masquer le compteur d'achats"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Aperçu */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Aperçu du produit
              </CardTitle>
              <CardDescription>
                Comment votre produit apparaîtra aux clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={cn("mx-auto bg-white border rounded-lg shadow-sm overflow-hidden", getPreviewSize())}>
                {/* Image principale */}
                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                  {formData.image_url ? (
                    <img
                      src={formData.image_url}
                      alt={`Aperçu du produit ${formData.name || ''}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center text-gray-400">
                      <ImageIcon className="h-12 w-12 mx-auto mb-2" aria-hidden="true" />
                      <p className="text-sm">Aucune image</p>
                    </div>
                  )}
                </div>

                {/* Informations du produit */}
                <div className="p-4 space-y-3">
                  <h3 className="font-semibold text-lg">
                    {formData.name || "Nom du produit"}
                  </h3>
                  
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {formData.short_description || formData.description || "Description du produit"}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">
                        {formData.price ? `${formData.price} ${formData.currency || 'XOF'}` : 'Prix'}
                      </span>
                      {formData.promotional_price && (
                        <span className="text-sm text-gray-500 line-through">
                          {formData.promotional_price} {formData.currency || 'XOF'}
                        </span>
                      )}
                    </div>
                    
                    {formData.featured && (
                      <Badge variant="secondary" aria-label="Produit en vedette">Vedette</Badge>
                    )}
                  </div>

                  {/* Galerie miniatures */}
                  {(formData.gallery_images || []).length > 0 && (
                    <div className="flex gap-2 overflow-x-auto">
                      {(formData.gallery_images || []).slice(0, 4).map((url: string, index: number) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Miniature ${index + 1} de la galerie`}
                          className="w-12 h-12 object-cover rounded border"
                        />
                      ))}
                      {(formData.gallery_images || []).length > 4 && (
                        <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-500">
                          +{(formData.gallery_images || []).length - 4}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistiques visuelles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Statistiques visuelles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Images principales</span>
                  <Badge variant="secondary">
                    {formData.image_url ? 1 : 0}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Images galerie</span>
                  <Badge variant="secondary">
                    {(formData.gallery_images || []).length}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Vidéo</span>
                  <Badge variant={formData.video_url ? "default" : "secondary"}>
                    {formData.video_url ? "Oui" : "Non"}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Statut</span>
                  <Badge variant={formData.featured ? "default" : "secondary"}>
                    {formData.featured ? "Vedette" : "Normal"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};