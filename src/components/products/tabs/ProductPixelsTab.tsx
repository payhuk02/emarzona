import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { 
  Target, 
  Facebook, 
  Instagram, 
  Twitter, 
  Youtube, 
  Linkedin,
  Zap,
  Settings,
  Eye,
  MousePointer,
  ShoppingCart,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Info
} from "lucide-react";

interface ProductPixelsTabProps {
  formData: any;
  updateFormData: (field: string, value: any) => void;
}

export const ProductPixelsTab = ({ formData, updateFormData }: ProductPixelsTabProps) => {
  const [pixelStatus, setPixelStatus] = useState({
    facebook: false,
    google: false,
    tiktok: false,
    pinterest: false
  });

  // Vérifier le statut des pixels
  useEffect(() => {
    setPixelStatus({
      facebook: !!(formData.facebook_pixel_id && formData.facebook_pixel_id.length > 0),
      google: !!(formData.google_analytics_id && formData.google_analytics_id.length > 0),
      tiktok: !!(formData.tiktok_pixel_id && formData.tiktok_pixel_id.length > 0),
      pinterest: !!(formData.pinterest_pixel_id && formData.pinterest_pixel_id.length > 0)
    });
  }, [formData]);

  const pixelPlatforms = [
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

  return (
    <div className="space-y-6">
      {/* Vue d'ensemble des pixels */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Statut des pixels de tracking
          </CardTitle>
          <CardDescription>
            Surveillez l'état de vos pixels de conversion
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {pixelPlatforms.map((platform) => {
              const Icon = platform.icon;
              const isActive = pixelStatus[platform.id as keyof typeof pixelStatus];
              
              return (
                <div key={platform.id} className="text-center">
                  <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                    isActive ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <Icon className={`h-6 w-6 ${isActive ? 'text-green-600' : 'text-gray-400'}`} />
                  </div>
                  <div className="text-sm font-medium">{platform.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {isActive ? 'Actif' : 'Inactif'}
                  </div>
                  {isActive ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto mt-1" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-gray-400 mx-auto mt-1" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Configuration des pixels */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Configuration des pixels
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* Facebook Pixel */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Facebook className="h-4 w-4 text-blue-600" />
                Facebook Pixel
              </CardTitle>
              <CardDescription>
                Suivi des conversions Facebook et Instagram
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="facebook_pixel_id">Facebook Pixel ID</Label>
                <Input
                  id="facebook_pixel_id"
                  value={formData.facebook_pixel_id || ""}
                  onChange={(e) => updateFormData("facebook_pixel_id", e.target.value)}
                  placeholder="123456789012345"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Activer le pixel</Label>
                  <p className="text-sm text-muted-foreground">Tracking automatique</p>
                </div>
                <Switch
                  checked={formData.facebook_pixel_enabled || false}
                  onCheckedChange={(checked) => updateFormData("facebook_pixel_enabled", checked)}
                />
              </div>

              <div className="space-y-2">
                <Label>Événements à tracker</Label>
                <div className="space-y-1">
                  {['ViewContent', 'AddToCart', 'Purchase', 'Lead'].map((event) => (
                    <div key={event} className="flex items-center justify-between">
                      <span className="text-sm">{event}</span>
                      <Switch
                        checked={formData[`facebook_${event.toLowerCase()}`] || false}
                        onCheckedChange={(checked) => updateFormData(`facebook_${event.toLowerCase()}`, checked)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Google Analytics */}
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Google Analytics
              </CardTitle>
              <CardDescription>
                Analyse du comportement et des conversions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="google_analytics_id">Google Analytics ID</Label>
                <Input
                  id="google_analytics_id"
                  value={formData.google_analytics_id || ""}
                  onChange={(e) => updateFormData("google_analytics_id", e.target.value)}
                  placeholder="GA-XXXXXXXXX"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="google_tag_manager_id">Google Tag Manager ID</Label>
                <Input
                  id="google_tag_manager_id"
                  value={formData.google_tag_manager_id || ""}
                  onChange={(e) => updateFormData("google_tag_manager_id", e.target.value)}
                  placeholder="GTM-XXXXXXX"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Activer Enhanced Ecommerce</Label>
                  <p className="text-sm text-muted-foreground">Tracking e-commerce avancé</p>
                </div>
                <Switch
                  checked={formData.google_enhanced_ecommerce || false}
                  onCheckedChange={(checked) => updateFormData("google_enhanced_ecommerce", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* TikTok Pixel */}
          <Card className="border-red-200 bg-red-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-red-600" />
                TikTok Pixel
              </CardTitle>
              <CardDescription>
                Optimisation des campagnes TikTok Ads
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tiktok_pixel_id">TikTok Pixel ID</Label>
                <Input
                  id="tiktok_pixel_id"
                  value={formData.tiktok_pixel_id || ""}
                  onChange={(e) => updateFormData("tiktok_pixel_id", e.target.value)}
                  placeholder="CXXXXXXXXXXXXXXX"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Activer le pixel</Label>
                  <p className="text-sm text-muted-foreground">Tracking automatique</p>
                </div>
                <Switch
                  checked={formData.tiktok_pixel_enabled || false}
                  onCheckedChange={(checked) => updateFormData("tiktok_pixel_enabled", checked)}
                />
              </div>

              <div className="space-y-2">
                <Label>Événements à tracker</Label>
                <div className="space-y-1">
                  {['ViewContent', 'AddToCart', 'CompletePayment'].map((event) => (
                    <div key={event} className="flex items-center justify-between">
                      <span className="text-sm">{event}</span>
                      <Switch
                        checked={formData[`tiktok_${event.toLowerCase()}`] || false}
                        onCheckedChange={(checked) => updateFormData(`tiktok_${event.toLowerCase()}`, checked)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pinterest Pixel */}
          <Card className="border-pink-200 bg-pink-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-pink-600" />
                Pinterest Pixel
              </CardTitle>
              <CardDescription>
                Suivi des conversions Pinterest
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pinterest_pixel_id">Pinterest Pixel ID</Label>
                <Input
                  id="pinterest_pixel_id"
                  value={formData.pinterest_pixel_id || ""}
                  onChange={(e) => updateFormData("pinterest_pixel_id", e.target.value)}
                  placeholder="123456789012345"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Activer le pixel</Label>
                  <p className="text-sm text-muted-foreground">Tracking automatique</p>
                </div>
                <Switch
                  checked={formData.pinterest_pixel_enabled || false}
                  onCheckedChange={(checked) => updateFormData("pinterest_pixel_enabled", checked)}
                />
              </div>

              <div className="space-y-2">
                <Label>Événements à tracker</Label>
                <div className="space-y-1">
                  {['PageVisit', 'AddToCart', 'Checkout', 'Purchase'].map((event) => (
                    <div key={event} className="flex items-center justify-between">
                      <span className="text-sm">{event}</span>
                      <Switch
                        checked={formData[`pinterest_${event.toLowerCase()}`] || false}
                        onCheckedChange={(checked) => updateFormData(`pinterest_${event.toLowerCase()}`, checked)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Configuration avancée */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Configuration avancée
        </h3>

        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-4 w-4 text-purple-600" />
              Options avancées
            </CardTitle>
            <CardDescription>
              Personnalisation avancée du tracking
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Tracking cross-domain</Label>
                <p className="text-sm text-muted-foreground">Suivi entre différents domaines</p>
              </div>
              <Switch
                checked={formData.cross_domain_tracking || false}
                onCheckedChange={(checked) => updateFormData("cross_domain_tracking", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Respect de la vie privée</Label>
                <p className="text-sm text-muted-foreground">Conformité RGPD/GDPR</p>
              </div>
              <Switch
                checked={formData.privacy_compliant || false}
                onCheckedChange={(checked) => updateFormData("privacy_compliant", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Mode debug</Label>
                <p className="text-sm text-muted-foreground">Logs détaillés pour le développement</p>
              </div>
              <Switch
                checked={formData.debug_mode || false}
                onCheckedChange={(checked) => updateFormData("debug_mode", checked)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom_events">Événements personnalisés</Label>
              <Input
                id="custom_events"
                value={formData.custom_events || ""}
                onChange={(e) => updateFormData("custom_events", e.target.value)}
                placeholder="event1,event2,event3"
              />
              <div className="text-xs text-muted-foreground">
                Séparez les événements personnalisés par des virgules
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Test des pixels */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Eye className="h-5 w-5 text-primary" />
          Test des pixels
        </h3>

        <Card className="border-gray-200 bg-gray-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MousePointer className="h-4 w-4 text-gray-600" />
              Vérification du tracking
            </CardTitle>
            <CardDescription>
              Testez vos pixels pour vérifier qu'ils fonctionnent correctement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label>Événements de test</Label>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    Test ViewContent
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Test AddToCart
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    <Target className="h-4 w-4 mr-2" />
                    Test Purchase
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Outils de vérification</Label>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full">
                    <Info className="h-4 w-4 mr-2" />
                    Facebook Pixel Helper
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    <Info className="h-4 w-4 mr-2" />
                    Google Tag Assistant
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
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
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Résumé de la configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {pixelPlatforms.map((platform) => {
              const isActive = pixelStatus[platform.id as keyof typeof pixelStatus];
              return (
                <div key={platform.id} className="flex items-center justify-between">
                  <span className="text-sm">{platform.name}</span>
                  <div className="flex items-center gap-2">
                    {isActive ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <Badge className="bg-green-100 text-green-800">Actif</Badge>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-gray-400" />
                        <Badge variant="secondary">Inactif</Badge>
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
