import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  Eye, 
  Globe, 
  Link, 
  Image, 
  TrendingUp, 
  Target, 
  Zap,
  CheckCircle2,
  AlertCircle,
  Info
} from "lucide-react";

interface ProductSeoTabProps {
  formData: any;
  updateFormData: (field: string, value: any) => void;
}

export const ProductSeoTab = ({ formData, updateFormData }: ProductSeoTabProps) => {
  const [seoScore, setSeoScore] = useState(0);
  const [seoIssues, setSeoIssues] = useState<string[]>([]);

  // Calculer le score SEO en temps réel
  useEffect(() => {
    let score = 0;
    const issues: string[] = [];

    // Vérifications SEO
    if (formData.seo_title && formData.seo_title.length >= 30 && formData.seo_title.length <= 60) {
      score += 20;
    } else if (formData.seo_title) {
      issues.push("Le titre SEO doit faire entre 30 et 60 caractères");
    }

    if (formData.seo_description && formData.seo_description.length >= 120 && formData.seo_description.length <= 160) {
      score += 20;
    } else if (formData.seo_description) {
      issues.push("La description SEO doit faire entre 120 et 160 caractères");
    }

    if (formData.seo_keywords && formData.seo_keywords.length > 0) {
      score += 15;
    } else {
      issues.push("Ajoutez des mots-clés SEO");
    }

    if (formData.slug && formData.slug.length > 0) {
      score += 15;
    } else {
      issues.push("Le slug est requis pour le SEO");
    }

    if (formData.image_url && formData.image_url.length > 0) {
      score += 10;
    } else {
      issues.push("Une image produit améliore le SEO");
    }

    if (formData.description && formData.description.length >= 200) {
      score += 10;
    } else if (formData.description) {
      issues.push("Une description détaillée (200+ caractères) améliore le SEO");
    }

    if (formData.structured_data) {
      score += 10;
    }

    setSeoScore(score);
    setSeoIssues(issues);
  }, [formData]);

  const getSeoScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getSeoScoreBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Bon</Badge>;
    return <Badge className="bg-red-100 text-red-800">À améliorer</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Score SEO en temps réel */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Score SEO en temps réel
          </CardTitle>
          <CardDescription>
            Optimisez votre produit pour les moteurs de recherche
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`text-3xl font-bold ${getSeoScoreColor(seoScore)}`}>
                {seoScore}/100
              </div>
              {getSeoScoreBadge(seoScore)}
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Optimisation</div>
              <div className="text-lg font-semibold">
                {seoScore >= 80 ? "✅ Optimisé" : seoScore >= 60 ? "⚠️ Partiel" : "❌ À améliorer"}
              </div>
            </div>
          </div>

          {seoIssues.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Points à améliorer :</div>
              <div className="space-y-1">
                {seoIssues.map((issue, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    {issue}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration SEO de base */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" />
          Configuration SEO
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="space-y-2">
            <Label htmlFor="seo_title">Titre SEO</Label>
            <Input
              id="seo_title"
              value={formData.seo_title || ""}
              onChange={(e) => updateFormData("seo_title", e.target.value)}
              placeholder="Titre optimisé pour les moteurs de recherche"
              maxLength={60}
            />
            <div className="text-xs text-muted-foreground">
              {formData.seo_title?.length || 0}/60 caractères
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug URL</Label>
            <Input
              id="slug"
              value={formData.slug || ""}
              onChange={(e) => updateFormData("slug", e.target.value)}
              placeholder="url-du-produit"
            />
            <div className="text-xs text-muted-foreground">
              URL: /produit/{formData.slug || "url-du-produit"}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="seo_description">Description SEO</Label>
          <Textarea
            id="seo_description"
            value={formData.seo_description || ""}
            onChange={(e) => updateFormData("seo_description", e.target.value)}
            placeholder="Description optimisée pour les moteurs de recherche (120-160 caractères)"
            rows={3}
            maxLength={160}
          />
          <div className="text-xs text-muted-foreground">
            {formData.seo_description?.length || 0}/160 caractères
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="seo_keywords">Mots-clés SEO</Label>
          <Input
            id="seo_keywords"
            value={formData.seo_keywords || ""}
            onChange={(e) => updateFormData("seo_keywords", e.target.value)}
            placeholder="mot-clé1, mot-clé2, mot-clé3"
          />
          <div className="text-xs text-muted-foreground">
            Séparez les mots-clés par des virgules
          </div>
        </div>
      </div>

      <Separator />

      {/* Données structurées */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Données structurées
        </h3>

        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-600" />
              Schema.org Product
            </CardTitle>
            <CardDescription>
              Améliorez l'affichage dans les résultats de recherche
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Activer les données structurées</Label>
                <p className="text-sm text-muted-foreground">Rich snippets dans Google</p>
              </div>
              <Switch
                checked={formData.structured_data || false}
                onCheckedChange={(checked) => updateFormData("structured_data", checked)}
              />
            </div>

            {formData.structured_data && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="brand">Marque</Label>
                    <Input
                      id="brand"
                      value={formData.brand || ""}
                      onChange={(e) => updateFormData("brand", e.target.value)}
                      placeholder="Nom de la marque"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sku">SKU/Code produit</Label>
                    <Input
                      id="sku"
                      value={formData.sku || ""}
                      onChange={(e) => updateFormData("sku", e.target.value)}
                      placeholder="PROD-001"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gtin">GTIN/EAN</Label>
                    <Input
                      id="gtin"
                      value={formData.gtin || ""}
                      onChange={(e) => updateFormData("gtin", e.target.value)}
                      placeholder="1234567890123"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mpn">MPN (Fabricant)</Label>
                    <Input
                      id="mpn"
                      value={formData.mpn || ""}
                      onChange={(e) => updateFormData("mpn", e.target.value)}
                      placeholder="MFG-001"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="availability">Disponibilité</Label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={formData.availability || "InStock"}
                    onChange={(e) => updateFormData("availability", e.target.value)}
                  >
                    <option value="InStock">En stock</option>
                    <option value="OutOfStock">Rupture de stock</option>
                    <option value="PreOrder">Précommande</option>
                    <option value="LimitedAvailability">Stock limité</option>
                  </select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Optimisations avancées */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          Optimisations avancées
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Image className="h-4 w-4 text-green-600" />
                Images optimisées
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Alt text automatique</Label>
                  <p className="text-sm text-muted-foreground">Génération automatique des alt text</p>
                </div>
                <Switch
                  checked={formData.auto_alt_text || false}
                  onCheckedChange={(checked) => updateFormData("auto_alt_text", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Images WebP</Label>
                  <p className="text-sm text-muted-foreground">Conversion automatique en WebP</p>
                </div>
                <Switch
                  checked={formData.webp_conversion || false}
                  onCheckedChange={(checked) => updateFormData("webp_conversion", checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Link className="h-4 w-4 text-orange-600" />
                Liens internes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Liens automatiques</Label>
                  <p className="text-sm text-muted-foreground">Lien vers produits similaires</p>
                </div>
                <Switch
                  checked={formData.auto_internal_links || false}
                  onCheckedChange={(checked) => updateFormData("auto_internal_links", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Breadcrumbs</Label>
                  <p className="text-sm text-muted-foreground">Fil d'Ariane automatique</p>
                </div>
                <Switch
                  checked={formData.breadcrumbs || false}
                  onCheckedChange={(checked) => updateFormData("breadcrumbs", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Aperçu des résultats de recherche */}
      <Card className="border-gray-200 bg-gray-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="h-4 w-4 text-gray-600" />
            Aperçu des résultats de recherche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4 bg-white">
            <div className="text-blue-600 text-lg hover:underline cursor-pointer">
              {formData.seo_title || formData.name || "Titre du produit"}
            </div>
            <div className="text-green-600 text-sm mt-1">
              https://votre-site.com/produit/{formData.slug || "url-du-produit"}
            </div>
            <div className="text-gray-600 text-sm mt-1">
              {formData.seo_description || formData.description || "Description du produit..."}
            </div>
            {formData.seo_keywords && (
              <div className="flex gap-1 mt-2">
                {formData.seo_keywords.split(',').slice(0, 3).map((keyword: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {keyword.trim()}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
