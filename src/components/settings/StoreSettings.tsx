import { useState, useEffect } from "react";
import { useStore } from "@/hooks/use-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Store, 
  Settings, 
  Save, 
  RotateCcw, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Globe,
  Palette,
  CreditCard,
  Users,
  TrendingUp,
  Shield,
  Eye,
  EyeOff,
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
  Mail,
  Phone,
  MapPin,
  Calendar,
  BarChart3,
  DollarSign,
  Tag,
  Star,
  Heart,
  Share2,
  Download,
  Copy,
  ExternalLink
} from "lucide-react";

interface StoreSettingsData {
  // Basic Information
  name: string;
  slug: string;
  description: string;
  about: string;
  
  // Contact Information
  contact_email: string;
  contact_phone: string;
  facebook_url: string;
  instagram_url: string;
  linkedin_url: string;
  twitter_url: string;
  
  // Appearance
  logo_url: string;
  banner_url: string;
  theme_color: string;
  
  // Business Settings
  default_currency: string;
  timezone: string;
  language: string;
  
  // Features
  enable_reviews: boolean;
  enable_wishlist: boolean;
  enable_comparison: boolean;
  enable_social_sharing: boolean;
  enable_analytics: boolean;
  
  // SEO
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  og_image: string;
  
  // Privacy & Security
  privacy_policy: string;
  terms_of_service: string;
  cookie_policy: string;
  
  // Analytics
  google_analytics_id: string;
  facebook_pixel_id: string;
  custom_tracking_code: string;
}

export const StoreSettings = () => {
  const { store, loading: storeLoading, refetch } = useStore();
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [settings, setSettings] = useState<StoreSettingsData>({
    name: "",
    slug: "",
    description: "",
    about: "",
    contact_email: "",
    contact_phone: "",
    facebook_url: "",
    instagram_url: "",
    linkedin_url: "",
    twitter_url: "",
    logo_url: "",
    banner_url: "",
    theme_color: "#3B82F6",
    default_currency: "XOF",
    timezone: "Africa/Abidjan",
    language: "fr",
    enable_reviews: true,
    enable_wishlist: true,
    enable_comparison: true,
    enable_social_sharing: true,
    enable_analytics: true,
    meta_title: "",
    meta_description: "",
    meta_keywords: "",
    og_image: "",
    privacy_policy: "",
    terms_of_service: "",
    cookie_policy: "",
    google_analytics_id: "",
    facebook_pixel_id: "",
    custom_tracking_code: "",
  });

  useEffect(() => {
    if (store) {
      setSettings(prev => ({
        ...prev,
        name: store.name || "",
        slug: store.slug || "",
        description: store.description || "",
        about: store.about || "",
        contact_email: store.contact_email || "",
        contact_phone: store.contact_phone || "",
        facebook_url: store.facebook_url || "",
        instagram_url: store.instagram_url || "",
        linkedin_url: store.linkedin_url || "",
        twitter_url: store.twitter_url || "",
        logo_url: store.logo_url || "",
        banner_url: store.banner_url || "",
        theme_color: store.theme_color || "#3B82F6",
        default_currency: store.default_currency || "XOF",
        meta_title: store.meta_title || "",
        meta_description: store.meta_description || "",
        meta_keywords: store.meta_keywords || "",
        og_image: store.og_image || "",
      }));
    }
  }, [store]);

  const saveSettings = async () => {
    if (!user || !store) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('stores')
        .update({
          name: settings.name,
          slug: settings.slug,
          description: settings.description,
          about: settings.about,
          contact_email: settings.contact_email,
          contact_phone: settings.contact_phone,
          facebook_url: settings.facebook_url,
          instagram_url: settings.instagram_url,
          linkedin_url: settings.linkedin_url,
          twitter_url: settings.twitter_url,
          logo_url: settings.logo_url,
          banner_url: settings.banner_url,
          theme_color: settings.theme_color,
          default_currency: settings.default_currency,
          meta_title: settings.meta_title,
          meta_description: settings.meta_description,
          meta_keywords: settings.meta_keywords,
          og_image: settings.og_image,
          updated_at: new Date().toISOString(),
        })
        .eq('id', store.id);

      if (error) throw error;

      await refetch();
      toast({
        title: "Succès",
        description: "Paramètres de boutique sauvegardés",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof StoreSettingsData, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (name: string) => {
    updateSetting('name', name);
    if (!settings.slug || settings.slug === generateSlug(settings.name)) {
      updateSetting('slug', generateSlug(name));
    }
  };

  const tabs = [
    { id: "basic", label: "Informations de base", icon: Store },
    { id: "appearance", label: "Apparence", icon: Palette },
    { id: "contact", label: "Contact", icon: Mail },
    { id: "features", label: "Fonctionnalités", icon: Settings },
    { id: "seo", label: "SEO", icon: Globe },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
  ];

  if (storeLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement des paramètres de boutique...</span>
      </div>
    );
  }

  if (!store) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Vous n'avez pas encore de boutique. Créez-en une depuis la page "Ma boutique".
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Store className="h-5 w-5" />
            Paramètres de boutique
          </h3>
          <p className="text-sm text-muted-foreground">
            Gérez les paramètres et l'apparence de votre boutique
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Boutique active
        </Badge>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "ghost"}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2"
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Basic Information Tab */}
      {activeTab === "basic" && (
        <Card>
          <CardHeader>
            <CardTitle>Informations de base</CardTitle>
            <CardDescription>
              Configurez les informations principales de votre boutique
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de la boutique</Label>
              <Input
                id="name"
                value={settings.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Nom de votre boutique"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">URL de la boutique</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">payhuk.vercel.app/</span>
                <Input
                  id="slug"
                  value={settings.slug}
                  onChange={(e) => updateSetting('slug', e.target.value)}
                  placeholder="url-de-votre-boutique"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description courte</Label>
              <Textarea
                id="description"
                value={settings.description}
                onChange={(e) => updateSetting('description', e.target.value)}
                placeholder="Une courte description de votre boutique"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="about">À propos</Label>
              <Textarea
                id="about"
                value={settings.about}
                onChange={(e) => updateSetting('about', e.target.value)}
                placeholder="Parlez de votre boutique, votre histoire, vos valeurs..."
                rows={5}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Devise par défaut</Label>
                <Select
                  value={settings.default_currency}
                  onValueChange={(value) => updateSetting('default_currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="XOF">XOF - Franc CFA</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="USD">USD - Dollar US</SelectItem>
                    <SelectItem value="GBP">GBP - Livre Sterling</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Fuseau horaire</Label>
                <Select
                  value={settings.timezone}
                  onValueChange={(value) => updateSetting('timezone', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Africa/Abidjan">Afrique/Abidjan</SelectItem>
                    <SelectItem value="Africa/Dakar">Afrique/Dakar</SelectItem>
                    <SelectItem value="Africa/Lagos">Afrique/Lagos</SelectItem>
                    <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Appearance Tab */}
      {activeTab === "appearance" && (
        <Card>
          <CardHeader>
            <CardTitle>Apparence</CardTitle>
            <CardDescription>
              Personnalisez l'apparence de votre boutique
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Couleur du thème</Label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={settings.theme_color}
                  onChange={(e) => updateSetting('theme_color', e.target.value)}
                  className="w-12 h-12 rounded border"
                />
                <Input
                  value={settings.theme_color}
                  onChange={(e) => updateSetting('theme_color', e.target.value)}
                  placeholder="#3B82F6"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Logo de la boutique</Label>
              <div className="flex items-center gap-4">
                {settings.logo_url && (
                  <img
                    src={settings.logo_url}
                    alt="Logo"
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <Input
                    value={settings.logo_url}
                    onChange={(e) => updateSetting('logo_url', e.target.value)}
                    placeholder="URL du logo"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Recommandé: 200x200px, format PNG ou JPG
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Bannière de la boutique</Label>
              <div className="flex items-center gap-4">
                {settings.banner_url && (
                  <img
                    src={settings.banner_url}
                    alt="Banner"
                    className="w-32 h-16 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <Input
                    value={settings.banner_url}
                    onChange={(e) => updateSetting('banner_url', e.target.value)}
                    placeholder="URL de la bannière"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Recommandé: 1200x400px, format PNG ou JPG
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contact Tab */}
      {activeTab === "contact" && (
        <Card>
          <CardHeader>
            <CardTitle>Informations de contact</CardTitle>
            <CardDescription>
              Configurez les informations de contact de votre boutique
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_email">Email de contact</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={settings.contact_email}
                  onChange={(e) => updateSetting('contact_email', e.target.value)}
                  placeholder="contact@votre-boutique.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_phone">Téléphone</Label>
                <Input
                  id="contact_phone"
                  type="tel"
                  value={settings.contact_phone}
                  onChange={(e) => updateSetting('contact_phone', e.target.value)}
                  placeholder="+33 1 23 45 67 89"
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium">Réseaux sociaux</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="facebook_url">Facebook</Label>
                  <Input
                    id="facebook_url"
                    value={settings.facebook_url}
                    onChange={(e) => updateSetting('facebook_url', e.target.value)}
                    placeholder="https://facebook.com/votre-page"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instagram_url">Instagram</Label>
                  <Input
                    id="instagram_url"
                    value={settings.instagram_url}
                    onChange={(e) => updateSetting('instagram_url', e.target.value)}
                    placeholder="https://instagram.com/votre-compte"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkedin_url">LinkedIn</Label>
                  <Input
                    id="linkedin_url"
                    value={settings.linkedin_url}
                    onChange={(e) => updateSetting('linkedin_url', e.target.value)}
                    placeholder="https://linkedin.com/company/votre-entreprise"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="twitter_url">Twitter</Label>
                  <Input
                    id="twitter_url"
                    value={settings.twitter_url}
                    onChange={(e) => updateSetting('twitter_url', e.target.value)}
                    placeholder="https://twitter.com/votre-compte"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Features Tab */}
      {activeTab === "features" && (
        <Card>
          <CardHeader>
            <CardTitle>Fonctionnalités</CardTitle>
            <CardDescription>
              Activez ou désactivez les fonctionnalités de votre boutique
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Avis et évaluations
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Permettre aux clients de laisser des avis sur vos produits
                  </p>
                </div>
                <Switch
                  checked={settings.enable_reviews}
                  onCheckedChange={(checked) => updateSetting('enable_reviews', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Liste de souhaits
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Permettre aux clients d'ajouter des produits à leurs favoris
                  </p>
                </div>
                <Switch
                  checked={settings.enable_wishlist}
                  onCheckedChange={(checked) => updateSetting('enable_wishlist', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Comparaison de produits
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Permettre aux clients de comparer plusieurs produits
                  </p>
                </div>
                <Switch
                  checked={settings.enable_comparison}
                  onCheckedChange={(checked) => updateSetting('enable_comparison', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Share2 className="h-4 w-4" />
                    Partage social
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Permettre le partage de produits sur les réseaux sociaux
                  </p>
                </div>
                <Switch
                  checked={settings.enable_social_sharing}
                  onCheckedChange={(checked) => updateSetting('enable_social_sharing', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Analytics
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Activer le suivi des performances de votre boutique
                  </p>
                </div>
                <Switch
                  checked={settings.enable_analytics}
                  onCheckedChange={(checked) => updateSetting('enable_analytics', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SEO Tab */}
      {activeTab === "seo" && (
        <Card>
          <CardHeader>
            <CardTitle>Optimisation SEO</CardTitle>
            <CardDescription>
              Améliorez la visibilité de votre boutique dans les moteurs de recherche
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="meta_title">Titre SEO</Label>
              <Input
                id="meta_title"
                value={settings.meta_title}
                onChange={(e) => updateSetting('meta_title', e.target.value)}
                placeholder="Titre qui apparaîtra dans les résultats de recherche"
                maxLength={60}
              />
              <p className="text-xs text-muted-foreground">
                {settings.meta_title.length}/60 caractères
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="meta_description">Description SEO</Label>
              <Textarea
                id="meta_description"
                value={settings.meta_description}
                onChange={(e) => updateSetting('meta_description', e.target.value)}
                placeholder="Description qui apparaîtra dans les résultats de recherche"
                rows={3}
                maxLength={160}
              />
              <p className="text-xs text-muted-foreground">
                {settings.meta_description.length}/160 caractères
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="meta_keywords">Mots-clés</Label>
              <Input
                id="meta_keywords"
                value={settings.meta_keywords}
                onChange={(e) => updateSetting('meta_keywords', e.target.value)}
                placeholder="mot-clé1, mot-clé2, mot-clé3"
              />
              <p className="text-xs text-muted-foreground">
                Séparez les mots-clés par des virgules
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="og_image">Image de partage</Label>
              <div className="flex items-center gap-4">
                {settings.og_image && (
                  <img
                    src={settings.og_image}
                    alt="OG Image"
                    className="w-24 h-24 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <Input
                    value={settings.og_image}
                    onChange={(e) => updateSetting('og_image', e.target.value)}
                    placeholder="URL de l'image de partage"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Recommandé: 1200x630px, format PNG ou JPG
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && (
        <Card>
          <CardHeader>
            <CardTitle>Analytics et suivi</CardTitle>
            <CardDescription>
              Configurez le suivi des performances de votre boutique
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="google_analytics_id">Google Analytics ID</Label>
              <Input
                id="google_analytics_id"
                value={settings.google_analytics_id}
                onChange={(e) => updateSetting('google_analytics_id', e.target.value)}
                placeholder="G-XXXXXXXXXX"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="facebook_pixel_id">Facebook Pixel ID</Label>
              <Input
                id="facebook_pixel_id"
                value={settings.facebook_pixel_id}
                onChange={(e) => updateSetting('facebook_pixel_id', e.target.value)}
                placeholder="123456789012345"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom_tracking_code">Code de suivi personnalisé</Label>
              <Textarea
                id="custom_tracking_code"
                value={settings.custom_tracking_code}
                onChange={(e) => updateSetting('custom_tracking_code', e.target.value)}
                placeholder="Code JavaScript personnalisé"
                rows={5}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button onClick={saveSettings} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Enregistrer les paramètres
        </Button>
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Annuler
        </Button>
      </div>
    </div>
  );
};