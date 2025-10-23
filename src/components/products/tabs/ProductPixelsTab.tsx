import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Target, 
  Facebook, 
  TrendingUp,
  Zap,
  Settings,
  Eye,
  MousePointer,
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  Info,
  HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PixelConfigCard } from "./ProductPixelsTab/PixelConfigCard";

/**
 * Interface stricte pour les données du formulaire produit
 */
interface ProductFormData {
  // Pixels IDs
  facebook_pixel_id?: string;
  google_analytics_id?: string;
  google_tag_manager_id?: string;
  tiktok_pixel_id?: string;
  pinterest_pixel_id?: string;
  
  // Pixels enabled
  facebook_pixel_enabled?: boolean;
  google_enhanced_ecommerce?: boolean;
  tiktok_pixel_enabled?: boolean;
  pinterest_pixel_enabled?: boolean;
  
  // Events tracking
  facebook_viewcontent?: boolean;
  facebook_addtocart?: boolean;
  facebook_purchase?: boolean;
  facebook_lead?: boolean;
  
  tiktok_viewcontent?: boolean;
  tiktok_addtocart?: boolean;
  tiktok_completepayment?: boolean;
  
  pinterest_pagevisit?: boolean;
  pinterest_addtocart?: boolean;
  pinterest_checkout?: boolean;
  pinterest_purchase?: boolean;
  
  // Advanced options
  cross_domain_tracking?: boolean;
  privacy_compliant?: boolean;
  debug_mode?: boolean;
  custom_events?: string;
}

interface ProductPixelsTabProps {
  formData: ProductFormData;
  updateFormData: <K extends keyof ProductFormData>(
    field: K,
    value: ProductFormData[K]
  ) => void;
}

interface PixelPlatform {
  id: string;
  name: string;
  icon: typeof Facebook;
  color: 'blue' | 'green' | 'red' | 'pink';
  description: string;
  events: string[];
}

/**
 * Plateformes de pixels supportées avec leur configuration
 */
const PIXEL_PLATFORMS: PixelPlatform[] = [
  {
    id: 'facebook',
    name: 'Facebook',
    icon: Facebook,
    color: 'blue',
    description: 'Suivi des conversions et création d\'audiences',
    events: ['ViewContent', 'AddToCart', 'Purchase', 'Lead']
  },
  {
    id: 'google',
    name: 'Google Analytics',
    icon: TrendingUp,
    color: 'green',
    description: 'Analyse du comportement et des conversions',
    events: ['page_view', 'add_to_cart', 'purchase', 'conversion']
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: Target,
    color: 'red',
    description: 'Optimisation des campagnes TikTok Ads',
    events: ['ViewContent', 'AddToCart', 'CompletePayment']
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    icon: Target,
    color: 'pink',
    description: 'Suivi des conversions Pinterest',
    events: ['PageVisit', 'AddToCart', 'Checkout', 'Purchase']
  }
];

export const ProductPixelsTab = ({ formData, updateFormData }: ProductPixelsTabProps) => {
  const [pixelStatus, setPixelStatus] = useState({
    facebook: false,
    google: false,
    tiktok: false,
    pinterest: false
  });

  /**
   * Met à jour le statut des pixels en fonction de la présence des IDs
   */
  useEffect(() => {
    setPixelStatus({
      facebook: !!(formData.facebook_pixel_id && formData.facebook_pixel_id.length > 0),
      google: !!(formData.google_analytics_id && formData.google_analytics_id.length > 0),
      tiktok: !!(formData.tiktok_pixel_id && formData.tiktok_pixel_id.length > 0),
      pinterest: !!(formData.pinterest_pixel_id && formData.pinterest_pixel_id.length > 0)
    });
  }, [formData.facebook_pixel_id, formData.google_analytics_id, formData.tiktok_pixel_id, formData.pinterest_pixel_id]);

  /**
   * Calcule le nombre total de pixels actifs
   */
  const activePixelsCount = Object.values(pixelStatus).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* En-tête avec statut global */}
      <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Target className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-white">Pixels de Tracking</CardTitle>
                <CardDescription className="text-gray-400">
                  Configurez les pixels de conversion pour vos campagnes publicitaires
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={activePixelsCount > 0 ? "default" : "secondary"}
                className={cn(
                  "text-sm font-medium",
                  activePixelsCount > 0 
                    ? "bg-green-500/20 text-green-400 border-green-500/30" 
                    : "bg-gray-700 text-gray-400"
                )}
              >
                {activePixelsCount} pixel{activePixelsCount > 1 ? 's' : ''} actif{activePixelsCount > 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Vue d'ensemble des pixels */}
      <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Eye className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-white">Statut des pixels</CardTitle>
              <CardDescription className="text-gray-400">
                Surveillez l'état de vos pixels de conversion
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {PIXEL_PLATFORMS.map((platform) => {
              const Icon = platform.icon;
              const isActive = pixelStatus[platform.id as keyof typeof pixelStatus];
              
              return (
                <div key={platform.id} className="text-center">
                  <div className={cn(
                    "mx-auto w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mb-2 transition-all",
                    isActive ? 'bg-green-500/20' : 'bg-gray-700/50'
                  )}>
                    <Icon className={cn(
                      "h-6 w-6 sm:h-8 sm:w-8",
                      isActive ? 'text-green-400' : 'text-gray-500'
                    )} />
                  </div>
                  <div className="text-sm font-medium text-white">{platform.name}</div>
                  <div className={cn(
                    "text-xs mt-1",
                    isActive ? 'text-green-400' : 'text-gray-500'
                  )}>
                    {isActive ? 'Actif' : 'Inactif'}
                  </div>
                  {isActive ? (
                    <CheckCircle2 className="h-4 w-4 text-green-400 mx-auto mt-1" aria-hidden="true" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-gray-500 mx-auto mt-1" aria-hidden="true" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Configuration des pixels */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-yellow-500/20">
            <Settings className="h-5 w-5 text-yellow-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Configuration des pixels</h3>
            <p className="text-sm text-gray-400">Configurez chaque plateforme individuellement</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Facebook Pixel */}
          <PixelConfigCard
            platform={PIXEL_PLATFORMS[0]}
            pixelId={formData.facebook_pixel_id || ""}
            isEnabled={formData.facebook_pixel_enabled || false}
            isActive={pixelStatus.facebook}
            events={{
              facebook_viewcontent: formData.facebook_viewcontent || false,
              facebook_addtocart: formData.facebook_addtocart || false,
              facebook_purchase: formData.facebook_purchase || false,
              facebook_lead: formData.facebook_lead || false,
            }}
            onPixelIdChange={(value) => updateFormData("facebook_pixel_id", value)}
            onEnabledChange={(checked) => updateFormData("facebook_pixel_enabled", checked)}
            onEventChange={(eventId, checked) => {
              updateFormData(eventId as keyof ProductFormData, checked);
            }}
          />

          {/* Google Analytics */}
          <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-white">Google Analytics</CardTitle>
                  <CardDescription className="text-gray-400">
                    Analyse du comportement et des conversions
                  </CardDescription>
                </div>
              </div>
              {pixelStatus.google && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 absolute top-4 right-4">
                  Actif
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label 
                  htmlFor="google_analytics_id"
                  className="text-sm font-medium text-white"
                >
                  Google Analytics ID
                </Label>
                <Input
                  id="google_analytics_id"
                  value={formData.google_analytics_id || ""}
                  onChange={(e) => updateFormData("google_analytics_id", e.target.value)}
                  placeholder="GA-XXXXXXXXX ou G-XXXXXXXXXX"
                  aria-label="ID Google Analytics"
                  className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20 min-h-[44px]"
                />
              </div>

              <div className="space-y-2">
                <Label 
                  htmlFor="google_tag_manager_id"
                  className="text-sm font-medium text-white"
                >
                  Google Tag Manager ID
                </Label>
                <Input
                  id="google_tag_manager_id"
                  value={formData.google_tag_manager_id || ""}
                  onChange={(e) => updateFormData("google_tag_manager_id", e.target.value)}
                  placeholder="GTM-XXXXXXX"
                  aria-label="ID Google Tag Manager"
                  className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20 min-h-[44px]"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600">
                <div className="space-y-0.5">
                  <Label 
                    htmlFor="google_enhanced_ecommerce"
                    className="text-sm font-medium text-white"
                  >
                    Enhanced Ecommerce
                  </Label>
                  <p className="text-sm text-gray-400">Tracking e-commerce avancé</p>
                </div>
                <Switch
                  id="google_enhanced_ecommerce"
                  checked={formData.google_enhanced_ecommerce || false}
                  onCheckedChange={(checked) => updateFormData("google_enhanced_ecommerce", checked)}
                  aria-label="Activer Google Enhanced Ecommerce"
                  className="touch-manipulation"
                />
              </div>
            </CardContent>
          </Card>

          {/* TikTok Pixel */}
          <PixelConfigCard
            platform={PIXEL_PLATFORMS[2]}
            pixelId={formData.tiktok_pixel_id || ""}
            isEnabled={formData.tiktok_pixel_enabled || false}
            isActive={pixelStatus.tiktok}
            events={{
              tiktok_viewcontent: formData.tiktok_viewcontent || false,
              tiktok_addtocart: formData.tiktok_addtocart || false,
              tiktok_completepayment: formData.tiktok_completepayment || false,
            }}
            onPixelIdChange={(value) => updateFormData("tiktok_pixel_id", value)}
            onEnabledChange={(checked) => updateFormData("tiktok_pixel_enabled", checked)}
            onEventChange={(eventId, checked) => {
              updateFormData(eventId as keyof ProductFormData, checked);
            }}
          />

          {/* Pinterest Pixel */}
          <PixelConfigCard
            platform={PIXEL_PLATFORMS[3]}
            pixelId={formData.pinterest_pixel_id || ""}
            isEnabled={formData.pinterest_pixel_enabled || false}
            isActive={pixelStatus.pinterest}
            events={{
              pinterest_pagevisit: formData.pinterest_pagevisit || false,
              pinterest_addtocart: formData.pinterest_addtocart || false,
              pinterest_checkout: formData.pinterest_checkout || false,
              pinterest_purchase: formData.pinterest_purchase || false,
            }}
            onPixelIdChange={(value) => updateFormData("pinterest_pixel_id", value)}
            onEnabledChange={(checked) => updateFormData("pinterest_pixel_enabled", checked)}
            onEventChange={(eventId, checked) => {
              updateFormData(eventId as keyof ProductFormData, checked);
            }}
          />
        </div>
      </div>

      <Separator className="bg-gray-700" />

      {/* Configuration avancée */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/20">
            <Zap className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Configuration avancée</h3>
            <p className="text-sm text-gray-400">Personnalisation avancée du tracking</p>
          </div>
        </div>

        <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/20">
                <Settings className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-white">Options avancées</CardTitle>
                <CardDescription className="text-gray-400">
                  Configurations techniques et conformité
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600">
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center gap-2">
                  <Label 
                    htmlFor="cross_domain_tracking"
                    className="text-sm font-medium text-white"
                  >
                    Tracking cross-domain
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Suivi entre différents domaines</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-sm text-gray-400">Suivi entre différents domaines</p>
              </div>
              <Switch
                id="cross_domain_tracking"
                checked={formData.cross_domain_tracking || false}
                onCheckedChange={(checked) => updateFormData("cross_domain_tracking", checked)}
                aria-label="Activer le tracking cross-domain"
                className="touch-manipulation"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600">
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center gap-2">
                  <Label 
                    htmlFor="privacy_compliant"
                    className="text-sm font-medium text-white"
                  >
                    Respect de la vie privée
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Conformité RGPD/GDPR</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-sm text-gray-400">Conformité RGPD/GDPR</p>
              </div>
              <Switch
                id="privacy_compliant"
                checked={formData.privacy_compliant || false}
                onCheckedChange={(checked) => updateFormData("privacy_compliant", checked)}
                aria-label="Activer la conformité RGPD"
                className="touch-manipulation"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600">
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center gap-2">
                  <Label 
                    htmlFor="debug_mode"
                    className="text-sm font-medium text-white"
                  >
                    Mode debug
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Logs détaillés pour le développement</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-sm text-gray-400">Logs détaillés pour le développement</p>
              </div>
              <Switch
                id="debug_mode"
                checked={formData.debug_mode || false}
                onCheckedChange={(checked) => updateFormData("debug_mode", checked)}
                aria-label="Activer le mode debug"
                className="touch-manipulation"
              />
            </div>

            <div className="space-y-2">
              <Label 
                htmlFor="custom_events"
                className="text-sm font-medium text-white flex items-center gap-2"
              >
                Événements personnalisés
              </Label>
              <Input
                id="custom_events"
                value={formData.custom_events || ""}
                onChange={(e) => updateFormData("custom_events", e.target.value)}
                placeholder="event1,event2,event3"
                aria-label="Événements personnalisés"
                aria-describedby="custom_events_help"
                className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20 min-h-[44px]"
              />
              <p id="custom_events_help" className="text-xs text-gray-400">
                Séparez les événements personnalisés par des virgules
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator className="bg-gray-700" />

      {/* Test des pixels */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/20">
            <Eye className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Test des pixels</h3>
            <p className="text-sm text-gray-400">Vérifiez que vos pixels fonctionnent correctement</p>
          </div>
        </div>

        <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-500/20">
                <MousePointer className="h-5 w-5 text-teal-400" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-white">Vérification du tracking</CardTitle>
                <CardDescription className="text-gray-400">
                  Testez vos pixels pour vérifier qu'ils fonctionnent correctement
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-white">Événements de test</Label>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full bg-gray-700/50 border-gray-600 text-white hover:bg-gray-700 hover:text-white min-h-[44px]"
                    aria-label="Tester l'événement ViewContent"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Test ViewContent
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full bg-gray-700/50 border-gray-600 text-white hover:bg-gray-700 hover:text-white min-h-[44px]"
                    aria-label="Tester l'événement AddToCart"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Test AddToCart
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full bg-gray-700/50 border-gray-600 text-white hover:bg-gray-700 hover:text-white min-h-[44px]"
                    aria-label="Tester l'événement Purchase"
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Test Purchase
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-white">Outils de vérification</Label>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full bg-gray-700/50 border-gray-600 text-white hover:bg-gray-700 hover:text-white min-h-[44px]"
                    aria-label="Ouvrir Facebook Pixel Helper"
                  >
                    <Info className="h-4 w-4 mr-2" />
                    Facebook Pixel Helper
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full bg-gray-700/50 border-gray-600 text-white hover:bg-gray-700 hover:text-white min-h-[44px]"
                    aria-label="Ouvrir Google Tag Assistant"
                  >
                    <Info className="h-4 w-4 mr-2" />
                    Google Tag Assistant
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full bg-gray-700/50 border-gray-600 text-white hover:bg-gray-700 hover:text-white min-h-[44px]"
                    aria-label="Ouvrir TikTok Pixel Helper"
                  >
                    <Info className="h-4 w-4 mr-2" />
                    TikTok Pixel Helper
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Résumé de la configuration */}
      <Card className="border-2 border-gray-700 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-white">Résumé de la configuration</CardTitle>
              <CardDescription className="text-gray-400">
                Vue d'ensemble de vos pixels configurés
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {PIXEL_PLATFORMS.map((platform) => {
              const isActive = pixelStatus[platform.id as keyof typeof pixelStatus];
              return (
                <div key={platform.id} className="flex items-center justify-between p-3 bg-gray-700/20 rounded-lg border border-gray-600">
                  <span className="text-sm text-white font-medium">{platform.name}</span>
                  <div className="flex items-center gap-2">
                    {isActive ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-400" aria-hidden="true" />
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          Actif
                        </Badge>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-gray-500" aria-hidden="true" />
                        <Badge variant="secondary" className="bg-gray-700 text-gray-400">
                          Inactif
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
