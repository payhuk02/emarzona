import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, ExternalLink, Save, X, BarChart3, Settings, Palette, Globe } from "lucide-react";
import { useStore, Store } from "@/hooks/useStore";
import { useToast } from "@/hooks/use-toast";
import StoreSlugEditor from "./StoreSlugEditor";
import StoreImageUpload from "./StoreImageUpload";
import StoreAnalytics from "./StoreAnalytics";

interface ExtendedStore extends Store {
  about?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  facebook_url?: string | null;
  instagram_url?: string | null;
  twitter_url?: string | null;
  linkedin_url?: string | null;
}

interface StoreDetailsProps {
  store: ExtendedStore;
}

const StoreDetails = ({ store }: StoreDetailsProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(store.name);
  const [description, setDescription] = useState(store.description || "");
  const [logoUrl, setLogoUrl] = useState(store.logo_url || "");
  const [bannerUrl, setBannerUrl] = useState(store.banner_url || "");
  const [about, setAbout] = useState(store.about || "");
  const [contactEmail, setContactEmail] = useState(store.contact_email || "");
  const [contactPhone, setContactPhone] = useState(store.contact_phone || "");
  const [facebookUrl, setFacebookUrl] = useState(store.facebook_url || "");
  const [instagramUrl, setInstagramUrl] = useState(store.instagram_url || "");
  const [twitterUrl, setTwitterUrl] = useState(store.twitter_url || "");
  const [linkedinUrl, setLinkedinUrl] = useState(store.linkedin_url || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateStore, getStoreUrl, checkSlugAvailability } = useStore();
  const { toast } = useToast();

  const handleSlugUpdate = async (newSlug: string): Promise<boolean> => {
    return await updateStore({ slug: newSlug });
  };

  const storeUrl = getStoreUrl();

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(storeUrl);
    toast({
      title: "Lien copié !",
      description: "Le lien de votre boutique a été copié dans le presse-papiers."
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const updates: any = {
      name: name.trim(),
      description: description.trim() || null,
      logo_url: logoUrl || null,
      banner_url: bannerUrl || null,
      about: about.trim() || null,
      contact_email: contactEmail.trim() || null,
      contact_phone: contactPhone.trim() || null,
      facebook_url: facebookUrl.trim() || null,
      instagram_url: instagramUrl.trim() || null,
      twitter_url: twitterUrl.trim() || null,
      linkedin_url: linkedinUrl.trim() || null,
    };

    const success = await updateStore(updates);
    setIsSubmitting(false);

    if (success) {
      setIsEditing(false);
      toast({
        title: "Boutique mise à jour",
        description: "Toutes les modifications ont été enregistrées."
      });
    }
  };

  const handleCancel = () => {
    setName(store.name);
    setDescription(store.description || "");
    setLogoUrl(store.logo_url || "");
    setBannerUrl(store.banner_url || "");
    setAbout(store.about || "");
    setContactEmail(store.contact_email || "");
    setContactPhone(store.contact_phone || "");
    setFacebookUrl(store.facebook_url || "");
    setInstagramUrl(store.instagram_url || "");
    setTwitterUrl(store.twitter_url || "");
    setLinkedinUrl(store.linkedin_url || "");
    setIsEditing(false);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Paramètres</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Apparence</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="url" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">URL</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <Card className="shadow-medium">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-lg sm:text-xl">Paramètres de la boutique</CardTitle>
                  <CardDescription className="text-sm">Gérez tous les détails de votre boutique en ligne</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2 self-end sm:self-auto">
                  {isEditing ? (
                    <>
                      <Button 
                        size="sm" 
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="gradient-primary touch-manipulation text-xs sm:text-sm shrink-0 min-w-[100px] sm:min-w-[120px]"
                      >
                        <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                        {isSubmitting ? "..." : "Enregistrer"}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleCancel}
                        disabled={isSubmitting}
                        className="touch-manipulation text-xs sm:text-sm shrink-0 min-w-[90px] sm:min-w-[100px]"
                      >
                        <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                        Annuler
                      </Button>
                    </>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsEditing(true)}
                      className="touch-manipulation text-xs sm:text-sm shrink-0 min-w-[90px] sm:min-w-[100px]"
                    >
                      Modifier
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Nom de la boutique *</Label>
                    <Input
                      id="edit-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                    {name !== store.name && (
                      <p className="text-xs text-muted-foreground">
                        Nouveau slug : {name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-description">Description courte</Label>
                    <Textarea
                      id="edit-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      placeholder="Une brève description de votre boutique"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contact-email">Email de contact</Label>
                      <Input
                        id="contact-email"
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="contact@votreboutique.com"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-phone">Téléphone de contact</Label>
                      <Input
                        id="contact-phone"
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="+225 XX XX XX XX"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="about">À propos de votre boutique</Label>
                    <Textarea
                      id="about"
                      value={about}
                      onChange={(e) => setAbout(e.target.value)}
                      rows={8}
                      placeholder="Racontez l'histoire de votre boutique, vos valeurs, votre mission..."
                      disabled={isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">
                      Ce texte apparaîtra dans l'onglet "À propos" de votre boutique
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Nom</p>
                    <p className="font-medium">{store.name}</p>
                  </div>

                  {store.description && (
                    <div>
                      <p className="text-sm text-muted-foreground">Description</p>
                      <p className="text-sm">{store.description}</p>
                    </div>
                  )}

                  {(store.contact_email || store.contact_phone) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {store.contact_email && (
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="text-sm">{store.contact_email}</p>
                        </div>
                      )}
                      {store.contact_phone && (
                        <div>
                          <p className="text-sm text-muted-foreground">Téléphone</p>
                          <p className="text-sm">{store.contact_phone}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {store.about && (
                    <div>
                      <p className="text-sm text-muted-foreground">À propos</p>
                      <p className="text-sm whitespace-pre-wrap">{store.about}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Apparence de la boutique</CardTitle>
              <CardDescription className="text-sm">Personnalisez le look de votre boutique</CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              {isEditing ? (
                <div className="space-y-6">
                  <StoreImageUpload
                    label="Logo de la boutique"
                    value={logoUrl}
                    onChange={setLogoUrl}
                    disabled={isSubmitting}
                    aspectRatio="square"
                    description="Format carré recommandé (ex: 500x500px)"
                  />

                  <StoreImageUpload
                    label="Bannière de la boutique"
                    value={bannerUrl}
                    onChange={setBannerUrl}
                    disabled={isSubmitting}
                    aspectRatio="banner"
                    description="Format paysage recommandé (ex: 1920x640px)"
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {store.logo_url && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Logo</p>
                        <img 
                          src={store.logo_url} 
                          alt="Logo" 
                          className="w-32 h-32 object-cover rounded-lg border"
                        />
                      </div>
                    )}
                    {store.banner_url && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-muted-foreground mb-2">Bannière</p>
                        <img 
                          src={store.banner_url} 
                          alt="Bannière" 
                          className="w-full max-h-48 object-cover rounded-lg border"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <StoreAnalytics storeId={store.id} />
        </TabsContent>

        <TabsContent value="url" className="space-y-6">
          <StoreSlugEditor
            currentSlug={store.slug}
            onSlugChange={handleSlugUpdate}
            onCheckAvailability={checkSlugAvailability}
            storeId={store.id}
          />

          <Card className="shadow-medium border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Lien de votre boutique</CardTitle>
              <CardDescription className="text-sm">Partagez ce lien pour que vos clients accèdent à votre boutique</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-4 sm:px-6">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Input
                  value={storeUrl}
                  readOnly
                  className="font-mono text-xs sm:text-sm flex-1 touch-manipulation"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyUrl}
                    title="Copier le lien"
                    className="touch-manipulation flex-1 sm:flex-none"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(storeUrl, '_blank')}
                    title="Ouvrir dans un nouvel onglet"
                    className="touch-manipulation flex-1 sm:flex-none"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="p-3 sm:p-4 bg-muted rounded-lg">
                <p className="text-xs sm:text-sm">
                  <strong>Format du lien :</strong>
                </p>
                <p className="text-xs text-muted-foreground mt-1 break-all">
                  https://{store.slug}.{store.custom_domain || window.location.hostname}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Vos produits seront accessibles à :<br />
                  <code className="text-xs break-all">https://{store.slug}.{store.custom_domain || window.location.hostname}/nom-du-produit</code>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Réseaux sociaux */}
      {(store.facebook_url || store.instagram_url || store.twitter_url || store.linkedin_url) && (
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Réseaux sociaux</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="flex flex-wrap gap-2">
              {store.facebook_url && (
                <a 
                  href={store.facebook_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  Facebook
                </a>
              )}
              {store.instagram_url && (
                <a 
                  href={store.instagram_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  Instagram
                </a>
              )}
              {store.twitter_url && (
                <a 
                  href={store.twitter_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  Twitter
                </a>
              )}
              {store.linkedin_url && (
                <a 
                  href={store.linkedin_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  LinkedIn
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StoreDetails;
