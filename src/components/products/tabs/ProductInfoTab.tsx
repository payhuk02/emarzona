import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CurrencySelect } from "@/components/ui/currency-select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, CheckCircle2, XCircle, Package, Smartphone, Wrench, Info, Zap, Shield, Clock, Users, Target, Globe } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { generateSlug } from "@/lib/store-utils";

interface ProductInfoTabProps {
  formData: any;
  updateFormData: (field: string, value: any) => void;
  storeId: string;
  storeSlug: string;
  checkSlugAvailability: (slug: string) => Promise<boolean>;
}

export const ProductInfoTab = ({ formData, updateFormData, storeSlug, checkSlugAvailability }: ProductInfoTabProps) => {
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);

  useEffect(() => {
    const checkSlug = async () => {
      if (formData.slug) {
        setCheckingSlug(true);
        const available = await checkSlugAvailability(formData.slug);
        setSlugAvailable(available);
        setCheckingSlug(false);
      }
    };
    const timeout = setTimeout(checkSlug, 500);
    return () => clearTimeout(timeout);
  }, [formData.slug]);

  const productUrl = `${window.location.origin}/${storeSlug}/${formData.slug}`;

  return (
    <div className="space-y-6">
      {/* Sélecteur de type de produit */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Type de produit
          </CardTitle>
          <CardDescription>
            Choisissez le type de produit que vous souhaitez vendre
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div
              className={cn(
                "p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md",
                formData.product_type === "digital" 
                  ? "border-primary bg-primary/10" 
                  : "border-border hover:border-primary/50"
              )}
              onClick={() => updateFormData("product_type", "digital")}
            >
              <div className="flex items-center gap-3 mb-2">
                <Smartphone className="h-6 w-6 text-primary" />
                <h3 className="font-semibold">Produit Digital</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Ebooks, formations, logiciels, templates, fichiers téléchargeables
              </p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-xs">Téléchargement instantané</Badge>
                <Badge variant="secondary" className="text-xs">Pas de stock</Badge>
                <Badge variant="secondary" className="text-xs">Livraison automatique</Badge>
              </div>
            </div>

            <div
              className={cn(
                "p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md",
                formData.product_type === "physical" 
                  ? "border-primary bg-primary/10" 
                  : "border-border hover:border-primary/50"
              )}
              onClick={() => updateFormData("product_type", "physical")}
            >
              <div className="flex items-center gap-3 mb-2">
                <Package className="h-6 w-6 text-primary" />
                <h3 className="font-semibold">Produit Physique</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Vêtements, accessoires, objets artisanaux, produits manufacturés
              </p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-xs">Livraison requise</Badge>
                <Badge variant="secondary" className="text-xs">Gestion stock</Badge>
                <Badge variant="secondary" className="text-xs">Adresse client</Badge>
              </div>
            </div>

            <div
              className={cn(
                "p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md",
                formData.product_type === "service" 
                  ? "border-primary bg-primary/10" 
                  : "border-border hover:border-primary/50"
              )}
              onClick={() => updateFormData("product_type", "service")}
            >
              <div className="flex items-center gap-3 mb-2">
                <Wrench className="h-6 w-6 text-primary" />
                <h3 className="font-semibold">Service</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Consultations, coaching, design, développement, maintenance
              </p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-xs">Rendez-vous</Badge>
                <Badge variant="secondary" className="text-xs">Prestation</Badge>
                <Badge variant="secondary" className="text-xs">Sur mesure</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Champs obligatoires */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Nom du produit *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => updateFormData("name", e.target.value)}
            placeholder="Ex: Guide complet Facebook Ads 2025"
            className="touch-target"
          />
        </div>

        <div>
          <Label htmlFor="slug">URL du produit *</Label>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => updateFormData("slug", generateSlug(e.target.value))}
                placeholder="guide-facebook-ads-2025"
              />
              {checkingSlug ? (
                <div className="flex items-center text-muted-foreground">
                  <span className="text-sm">Vérification...</span>
                </div>
              ) : slugAvailable === true ? (
                <div className="flex items-center text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              ) : slugAvailable === false ? (
                <div className="flex items-center text-destructive">
                  <XCircle className="h-5 w-5" />
                </div>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground break-all">{productUrl}</p>
          </div>
        </div>

        <div>
          <Label htmlFor="category">Catégorie *</Label>
          <Select value={formData.category} onValueChange={(value) => updateFormData("category", value)}>
            <SelectTrigger className="touch-target">
              <SelectValue placeholder="Sélectionnez une catégorie" />
            </SelectTrigger>
            <SelectContent>
              {formData.product_type === "digital" && (
                <>
                  <SelectItem value="Formation">Formation</SelectItem>
                  <SelectItem value="Ebook">Ebook</SelectItem>
                  <SelectItem value="Template">Template</SelectItem>
                  <SelectItem value="Logiciel">Logiciel</SelectItem>
                  <SelectItem value="Cours en ligne">Cours en ligne</SelectItem>
                  <SelectItem value="Guide">Guide</SelectItem>
                  <SelectItem value="Checklist">Checklist</SelectItem>
                  <SelectItem value="Fichier audio">Fichier audio</SelectItem>
                  <SelectItem value="Vidéo">Vidéo</SelectItem>
                </>
              )}
              {formData.product_type === "physical" && (
                <>
                  <SelectItem value="Vêtements">Vêtements</SelectItem>
                  <SelectItem value="Accessoires">Accessoires</SelectItem>
                  <SelectItem value="Artisanat">Artisanat</SelectItem>
                  <SelectItem value="Électronique">Électronique</SelectItem>
                  <SelectItem value="Maison & Jardin">Maison & Jardin</SelectItem>
                  <SelectItem value="Sport">Sport</SelectItem>
                  <SelectItem value="Beauté">Beauté</SelectItem>
                  <SelectItem value="Livres">Livres</SelectItem>
                  <SelectItem value="Jouets">Jouets</SelectItem>
                </>
              )}
              {formData.product_type === "service" && (
                <>
                  <SelectItem value="Consultation">Consultation</SelectItem>
                  <SelectItem value="Coaching">Coaching</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="Développement">Développement</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Rédaction">Rédaction</SelectItem>
                  <SelectItem value="Traduction">Traduction</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Formation">Formation</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="pricing_model">Modèle de tarification *</Label>
          <Select value={formData.pricing_model} onValueChange={(value) => updateFormData("pricing_model", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="one-time">Paiement unique</SelectItem>
              <SelectItem value="subscription">Abonnement</SelectItem>
              <SelectItem value="pay-what-you-want">Prix libre</SelectItem>
              <SelectItem value="free">Gratuit</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <Label htmlFor="price">Prix *</Label>
            <Input
              id="price"
              type="number"
              value={formData.price}
              onChange={(e) => updateFormData("price", parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="touch-target"
            />
          </div>
          <div>
            <Label htmlFor="currency">Devise *</Label>
            <CurrencySelect
              value={formData.currency}
              onValueChange={(value) => updateFormData("currency", value)}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="promotional_price">Prix promotionnel</Label>
          <Input
            id="promotional_price"
            type="number"
            value={formData.promotional_price || ""}
            onChange={(e) => updateFormData("promotional_price", e.target.value ? parseFloat(e.target.value) : null)}
            placeholder="0"
          />
        </div>
      </div>

      <Separator />

      {/* Options avancées */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Options avancées</h3>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Réduction automatique</Label>
            <p className="text-sm text-muted-foreground">Offres automatiques aux clients lors du 3ème rappel d'abandon</p>
          </div>
          <Switch
            checked={formData.automatic_discount_enabled}
            onCheckedChange={(checked) => updateFormData("automatic_discount_enabled", checked)}
          />
        </div>

        {formData.automatic_discount_enabled && (
          <div>
            <Label htmlFor="discount_trigger">Déclencheur de réduction</Label>
            <Input
              id="discount_trigger"
              value={formData.discount_trigger}
              onChange={(e) => updateFormData("discount_trigger", e.target.value)}
              placeholder="Ex: 3ème rappel d'abandon"
            />
          </div>
        )}

        <div>
          <Label>Période de validité du prix de vente</Label>
          <p className="text-sm text-muted-foreground mb-2">Créez l'urgence avec des offres limitées dans le temps</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("justify-start text-left font-normal w-full", !formData.sale_start_date && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <span className="truncate">{formData.sale_start_date ? format(new Date(formData.sale_start_date), "PPP") : "Date de début"}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.sale_start_date ? new Date(formData.sale_start_date) : undefined}
                  onSelect={(date) => updateFormData("sale_start_date", date?.toISOString())}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("justify-start text-left font-normal w-full", !formData.sale_end_date && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <span className="truncate">{formData.sale_end_date ? format(new Date(formData.sale_end_date), "PPP") : "Date de fin"}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.sale_end_date ? new Date(formData.sale_end_date) : undefined}
                  onSelect={(date) => updateFormData("sale_end_date", date?.toISOString())}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div>
          <Label htmlFor="post_purchase_guide_url">Guide après-achat</Label>
          <p className="text-sm text-muted-foreground mb-2">Guidez vos nouveaux clients pour maximiser leur satisfaction</p>
          <Input
            id="post_purchase_guide_url"
            value={formData.post_purchase_guide_url}
            onChange={(e) => updateFormData("post_purchase_guide_url", e.target.value)}
            placeholder="URL du guide"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Protégez vos fichiers avec un mot de passe</Label>
            <p className="text-sm text-muted-foreground">Sécurisez votre contenu premium avec protection par mot de passe</p>
          </div>
          <Switch
            checked={formData.password_protected}
            onCheckedChange={(checked) => updateFormData("password_protected", checked)}
          />
        </div>

        {formData.password_protected && (
          <div>
            <Label htmlFor="product_password">Mot de passe</Label>
            <Input
              id="product_password"
              type="password"
              value={formData.product_password}
              onChange={(e) => updateFormData("product_password", e.target.value)}
              placeholder="Entrez le mot de passe"
            />
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Ajoutez des filigranes à vos fichiers</Label>
            <p className="text-sm text-muted-foreground">Protection automatique contre le partage non autorisé</p>
          </div>
          <Switch
            checked={formData.watermark_enabled}
            onCheckedChange={(checked) => updateFormData("watermark_enabled", checked)}
          />
        </div>

        <div>
          <Label htmlFor="purchase_limit">Définir une limite d'achat</Label>
          <p className="text-sm text-muted-foreground mb-2">Créez la rareté en limitant le nombre de ventes</p>
          <Input
            id="purchase_limit"
            type="number"
            value={formData.purchase_limit || ""}
            onChange={(e) => updateFormData("purchase_limit", e.target.value ? parseInt(e.target.value) : null)}
            placeholder="Nombre maximum de ventes"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Masquer sur la boutique</Label>
            <p className="text-sm text-muted-foreground">Gardez ce produit privé : uniquement accessible avec un lien direct</p>
          </div>
          <Switch
            checked={formData.hide_from_store}
            onCheckedChange={(checked) => updateFormData("hide_from_store", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Masquer le nombre d'achats</Label>
            <p className="text-sm text-muted-foreground">Gardez vos statistiques de vente confidentielles</p>
          </div>
          <Switch
            checked={formData.hide_purchase_count}
            onCheckedChange={(checked) => updateFormData("hide_purchase_count", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Collecter les adresses de livraison</Label>
            <p className="text-sm text-muted-foreground">Récupérez les adresses clients pour vos produits physiques</p>
          </div>
          <Switch
            checked={formData.collect_shipping_address}
            onCheckedChange={(checked) => updateFormData("collect_shipping_address", checked)}
          />
        </div>
      </div>

      {/* Fonctionnalités avancées spécifiques au type de produit */}
      {formData.product_type && (
        <>
          <Separator />
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Fonctionnalités avancées
            </h3>

            {/* Fonctionnalités pour produits digitaux */}
            {formData.product_type === "digital" && (
              <div className="space-y-4">
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-blue-600" />
                      Options Digitales
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Livraison automatique</Label>
                        <p className="text-sm text-muted-foreground">Envoi automatique après paiement</p>
                      </div>
                      <Switch
                        checked={formData.auto_delivery || false}
                        onCheckedChange={(checked) => updateFormData("auto_delivery", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Accès limité dans le temps</Label>
                        <p className="text-sm text-muted-foreground">Expiration automatique après X jours</p>
                      </div>
                      <Switch
                        checked={formData.time_limited_access || false}
                        onCheckedChange={(checked) => updateFormData("time_limited_access", checked)}
                      />
                    </div>

                    {formData.time_limited_access && (
                      <div>
                        <Label htmlFor="access_duration">Durée d'accès (jours)</Label>
                        <Input
                          id="access_duration"
                          type="number"
                          value={formData.access_duration || ""}
                          onChange={(e) => updateFormData("access_duration", parseInt(e.target.value) || null)}
                          placeholder="30"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Support multi-plateforme</Label>
                        <p className="text-sm text-muted-foreground">Compatible mobile, tablette, desktop</p>
                      </div>
                      <Switch
                        checked={formData.multi_platform || false}
                        onCheckedChange={(checked) => updateFormData("multi_platform", checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Fonctionnalités pour produits physiques */}
            {formData.product_type === "physical" && (
              <div className="space-y-4">
                <Card className="border-green-200 bg-green-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Package className="h-4 w-4 text-green-600" />
                      Gestion Physique
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="stock_quantity">Quantité en stock</Label>
                        <Input
                          id="stock_quantity"
                          type="number"
                          value={formData.stock_quantity || ""}
                          onChange={(e) => updateFormData("stock_quantity", parseInt(e.target.value) || null)}
                          placeholder="100"
                        />
                      </div>
                      <div>
                        <Label htmlFor="weight">Poids (kg)</Label>
                        <Input
                          id="weight"
                          type="number"
                          step="0.1"
                          value={formData.weight || ""}
                          onChange={(e) => updateFormData("weight", parseFloat(e.target.value) || null)}
                          placeholder="0.5"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="dimensions_length">Longueur (cm)</Label>
                        <Input
                          id="dimensions_length"
                          type="number"
                          value={formData.dimensions_length || ""}
                          onChange={(e) => updateFormData("dimensions_length", parseFloat(e.target.value) || null)}
                          placeholder="20"
                        />
                      </div>
                      <div>
                        <Label htmlFor="dimensions_width">Largeur (cm)</Label>
                        <Input
                          id="dimensions_width"
                          type="number"
                          value={formData.dimensions_width || ""}
                          onChange={(e) => updateFormData("dimensions_width", parseFloat(e.target.value) || null)}
                          placeholder="15"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Alertes de stock bas</Label>
                        <p className="text-sm text-muted-foreground">Notification automatique quand le stock est faible</p>
                      </div>
                      <Switch
                        checked={formData.low_stock_alerts || false}
                        onCheckedChange={(checked) => updateFormData("low_stock_alerts", checked)}
                      />
                    </div>

                    {formData.low_stock_alerts && (
                      <div>
                        <Label htmlFor="low_stock_threshold">Seuil d'alerte</Label>
                        <Input
                          id="low_stock_threshold"
                          type="number"
                          value={formData.low_stock_threshold || ""}
                          onChange={(e) => updateFormData("low_stock_threshold", parseInt(e.target.value) || null)}
                          placeholder="10"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Fonctionnalités pour services */}
            {formData.product_type === "service" && (
              <div className="space-y-4">
                <Card className="border-purple-200 bg-purple-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-purple-600" />
                      Configuration Service
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="service_duration">Durée du service</Label>
                      <Select value={formData.service_duration || ""} onValueChange={(value) => updateFormData("service_duration", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez la durée" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30min">30 minutes</SelectItem>
                          <SelectItem value="1h">1 heure</SelectItem>
                          <SelectItem value="2h">2 heures</SelectItem>
                          <SelectItem value="4h">4 heures</SelectItem>
                          <SelectItem value="8h">8 heures (1 jour)</SelectItem>
                          <SelectItem value="1week">1 semaine</SelectItem>
                          <SelectItem value="2weeks">2 semaines</SelectItem>
                          <SelectItem value="1month">1 mois</SelectItem>
                          <SelectItem value="custom">Personnalisé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Réservation en ligne</Label>
                        <p className="text-sm text-muted-foreground">Permettre aux clients de réserver un créneau</p>
                      </div>
                      <Switch
                        checked={formData.online_booking || false}
                        onCheckedChange={(checked) => updateFormData("online_booking", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Consultation à distance</Label>
                        <p className="text-sm text-muted-foreground">Service disponible en visioconférence</p>
                      </div>
                      <Switch
                        checked={formData.remote_consultation || false}
                        onCheckedChange={(checked) => updateFormData("remote_consultation", checked)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="service_requirements">Prérequis du service</Label>
                      <Textarea
                        id="service_requirements"
                        value={formData.service_requirements || ""}
                        onChange={(e) => updateFormData("service_requirements", e.target.value)}
                        placeholder="Décrivez ce que le client doit préparer ou fournir..."
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Fonctionnalités communes avancées */}
            <Card className="border-orange-200 bg-orange-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4 text-orange-600" />
                  Marketing & Conversion
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Urgence artificielle</Label>
                    <p className="text-sm text-muted-foreground">Compteur de temps limité sur la page produit</p>
                  </div>
                  <Switch
                    checked={formData.urgency_timer || false}
                    onCheckedChange={(checked) => updateFormData("urgency_timer", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Preuves sociales</Label>
                    <p className="text-sm text-muted-foreground">Afficher les témoignages et avis clients</p>
                  </div>
                  <Switch
                    checked={formData.social_proof || false}
                    onCheckedChange={(checked) => updateFormData("social_proof", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Garantie satisfait ou remboursé</Label>
                    <p className="text-sm text-muted-foreground">Offrir une garantie pour rassurer les clients</p>
                  </div>
                  <Switch
                    checked={formData.money_back_guarantee || false}
                    onCheckedChange={(checked) => updateFormData("money_back_guarantee", checked)}
                  />
                </div>

                {formData.money_back_guarantee && (
                  <div>
                    <Label htmlFor="guarantee_days">Durée de la garantie (jours)</Label>
                    <Input
                      id="guarantee_days"
                      type="number"
                      value={formData.guarantee_days || ""}
                      onChange={(e) => updateFormData("guarantee_days", parseInt(e.target.value) || null)}
                      placeholder="30"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
