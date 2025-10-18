import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Eye, 
  Link as LinkIcon, 
  Image as ImageIcon,
  Globe,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Info,
  Copy,
  ExternalLink,
  BarChart3,
  Hash,
  Share2,
  Zap,
  Settings,
  FileText,
  Tag,
  Calendar,
  Users,
  Monitor,
  Smartphone,
  Tablet
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductSeoTabProps {
  formData: any;
  updateFormData: (field: string, value: any) => void;
}

interface SEOAnalysis {
  score: number;
  issues: string[];
  suggestions: string[];
  keywords: string[];
  readability: 'excellent' | 'good' | 'fair' | 'poor';
}

export const ProductSeoTab = ({ formData, updateFormData }: ProductSeoTabProps) => {
  const [seoAnalysis, setSeoAnalysis] = useState<SEOAnalysis>({
    score: 0,
    issues: [],
    suggestions: [],
    keywords: [],
    readability: 'fair'
  });
  const [activePreview, setActivePreview] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Analyser le SEO
  const analyzeSEO = () => {
    let score = 0;
    const issues: string[] = [];
    const suggestions: string[] = [];
    const keywords: string[] = [];

    // Titre SEO (20 points)
    if (formData.meta_title && formData.meta_title.length > 0) {
      score += 10;
      if (formData.meta_title.length >= 30 && formData.meta_title.length <= 60) {
        score += 10;
      } else {
        issues.push("Le titre SEO doit faire entre 30 et 60 caractères");
      }
    } else {
      issues.push("Le titre SEO est manquant");
    }

    // Description SEO (20 points)
    if (formData.meta_description && formData.meta_description.length > 0) {
      score += 10;
      if (formData.meta_description.length >= 120 && formData.meta_description.length <= 160) {
        score += 10;
      } else {
        issues.push("La description SEO doit faire entre 120 et 160 caractères");
      }
    } else {
      issues.push("La description SEO est manquante");
    }

    // Mots-clés (15 points)
    if (formData.meta_keywords && formData.meta_keywords.length > 0) {
      score += 15;
      keywords.push(...formData.meta_keywords.split(',').map((k: string) => k.trim()));
    } else {
      issues.push("Les mots-clés sont manquants");
    }

    // Description du produit (25 points)
    if (formData.description && formData.description.length > 0) {
      score += 10;
      if (formData.description.length >= 200) {
        score += 15;
      } else {
        issues.push("La description du produit doit faire au moins 200 caractères");
      }
    } else {
      issues.push("La description du produit est manquante");
    }

    // Image Open Graph (10 points)
    if (formData.og_image && formData.og_image.length > 0) {
      score += 10;
    } else {
      issues.push("L'image Open Graph est manquante");
    }

    // Titre Open Graph (10 points)
    if (formData.og_title && formData.og_title.length > 0) {
      score += 10;
    } else {
      suggestions.push("Ajoutez un titre Open Graph pour améliorer le partage social");
    }

    // Suggestions automatiques
    if (formData.name && !formData.meta_title?.includes(formData.name)) {
      suggestions.push("Incluez le nom du produit dans le titre SEO");
    }

    if (formData.description && formData.description.length < 300) {
      suggestions.push("Enrichissez la description du produit avec plus de détails");
    }

    if (!formData.structured_data || Object.keys(formData.structured_data).length === 0) {
      suggestions.push("Ajoutez des données structurées pour améliorer le référencement");
    }

    setSeoAnalysis({
      score: Math.min(score, 100),
      issues,
      suggestions,
      keywords,
      readability: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'poor'
    });
  };

  useEffect(() => {
    analyzeSEO();
  }, [formData.meta_title, formData.meta_description, formData.meta_keywords, formData.description, formData.og_image, formData.og_title]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100";
    if (score >= 60) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Bon";
    if (score >= 40) return "Moyen";
    return "À améliorer";
  };

  const getReadabilityColor = (readability: string) => {
    switch (readability) {
      case 'excellent': return "text-green-600";
      case 'good': return "text-blue-600";
      case 'fair': return "text-yellow-600";
      case 'poor': return "text-red-600";
      default: return "text-gray-600";
    }
  };

  const generateStructuredData = () => {
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": formData.name || "",
      "description": formData.description || "",
      "image": formData.image_url || "",
      "offers": {
        "@type": "Offer",
        "price": formData.price || 0,
        "priceCurrency": formData.currency || "XOF",
        "availability": formData.is_active ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
      }
    };

    updateFormData("structured_data", structuredData);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec score SEO */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Optimisation SEO</h2>
          <p className="text-gray-600">Optimisez votre produit pour les moteurs de recherche</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className={cn("px-3 py-1 rounded-full text-sm font-medium", getScoreColor(seoAnalysis.score))}>
              Score SEO: {seoAnalysis.score}/100
            </div>
            <p className="text-xs text-gray-500 mt-1">{getScoreLabel(seoAnalysis.score)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={activePreview === 'desktop' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActivePreview('desktop')}
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button
              variant={activePreview === 'tablet' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActivePreview('tablet')}
            >
              <Tablet className="h-4 w-4" />
            </Button>
            <Button
              variant={activePreview === 'mobile' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActivePreview('mobile')}
            >
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration SEO */}
        <div className="lg:col-span-2 space-y-6">
          {/* Métadonnées de base */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Métadonnées SEO
              </CardTitle>
              <CardDescription>
                Informations essentielles pour les moteurs de recherche
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="meta_title">Titre SEO *</Label>
                <Input
                  id="meta_title"
                  value={formData.meta_title || ""}
                  onChange={(e) => updateFormData("meta_title", e.target.value)}
                  placeholder={formData.name || "Titre pour les moteurs de recherche"}
                  maxLength={60}
                />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-500">
                    {(formData.meta_title || "").length}/60 caractères
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(formData.meta_title || "")}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="meta_description">Description SEO *</Label>
                <Textarea
                  id="meta_description"
                  value={formData.meta_description || ""}
                  onChange={(e) => updateFormData("meta_description", e.target.value)}
                  placeholder="Description pour les moteurs de recherche..."
                  rows={3}
                  maxLength={160}
                />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-500">
                    {(formData.meta_description || "").length}/160 caractères
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(formData.meta_description || "")}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="meta_keywords">Mots-clés</Label>
                <Input
                  id="meta_keywords"
                  value={formData.meta_keywords || ""}
                  onChange={(e) => updateFormData("meta_keywords", e.target.value)}
                  placeholder="mot-clé1, mot-clé2, mot-clé3"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Séparez les mots-clés par des virgules
                </p>
              </div>

              <div>
                <Label htmlFor="canonical_url">URL canonique</Label>
                <Input
                  id="canonical_url"
                  value={formData.canonical_url || ""}
                  onChange={(e) => updateFormData("canonical_url", e.target.value)}
                  placeholder="https://example.com/product"
                />
                <p className="text-xs text-gray-500 mt-1">
                  URL principale de ce produit (optionnel)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Partage sur les réseaux sociaux */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Partage social (Open Graph)
              </CardTitle>
              <CardDescription>
                Optimisation pour Facebook, Twitter, LinkedIn, etc.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="og_title">Titre Open Graph</Label>
                <Input
                  id="og_title"
                  value={formData.og_title || ""}
                  onChange={(e) => updateFormData("og_title", e.target.value)}
                  placeholder="Titre pour les réseaux sociaux..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Titre affiché lors du partage sur les réseaux sociaux
                </p>
              </div>

              <div>
                <Label htmlFor="og_description">Description Open Graph</Label>
                <Textarea
                  id="og_description"
                  value={formData.og_description || ""}
                  onChange={(e) => updateFormData("og_description", e.target.value)}
                  placeholder="Description pour les réseaux sociaux..."
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Description affichée lors du partage
                </p>
              </div>

              <div>
                <Label htmlFor="og_image">Image Open Graph</Label>
                <Input
                  id="og_image"
                  value={formData.og_image || ""}
                  onChange={(e) => updateFormData("og_image", e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Image recommandée: 1200x630px
                </p>
              </div>

              <div>
                <Label htmlFor="og_type">Type Open Graph</Label>
                <Select 
                  value={formData.og_type || "product"} 
                  onValueChange={(value) => updateFormData("og_type", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="product">Produit</SelectItem>
                    <SelectItem value="article">Article</SelectItem>
                    <SelectItem value="website">Site web</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Données structurées */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Données structurées
              </CardTitle>
              <CardDescription>
                Améliorez la compréhension de votre produit par les moteurs de recherche
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Données structurées automatiques</Label>
                  <p className="text-sm text-gray-600">Générer automatiquement les données Schema.org</p>
                </div>
                <Button
                  variant="outline"
                  onClick={generateStructuredData}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Générer
                </Button>
              </div>

              {formData.structured_data && Object.keys(formData.structured_data).length > 0 && (
                <div>
                  <Label>Données structurées JSON-LD</Label>
                  <div className="relative">
                    <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                      {JSON.stringify(formData.structured_data, null, 2)}
                    </pre>
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(JSON.stringify(formData.structured_data, null, 2))}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configuration avancée */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuration avancée
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Indexation par les moteurs de recherche</Label>
                  <p className="text-sm text-gray-600">Permettre l'indexation de cette page</p>
                </div>
                <Switch
                  checked={formData.seo_indexable !== false}
                  onCheckedChange={(checked) => updateFormData("seo_indexable", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Suivi des liens</Label>
                  <p className="text-sm text-gray-600">Permettre aux moteurs de suivre les liens</p>
                </div>
                <Switch
                  checked={formData.seo_follow !== false}
                  onCheckedChange={(checked) => updateFormData("seo_follow", checked)}
                />
              </div>

              <div>
                <Label htmlFor="robots_meta">Meta robots</Label>
                <Input
                  id="robots_meta"
                  value={formData.robots_meta || ""}
                  onChange={(e) => updateFormData("robots_meta", e.target.value)}
                  placeholder="index, follow"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Instructions pour les robots des moteurs de recherche
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panneau latéral */}
        <div className="space-y-6">
          {/* Score SEO */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analyse SEO
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className={cn("w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold mx-auto", getScoreColor(seoAnalysis.score))}>
                    {seoAnalysis.score}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{getScoreLabel(seoAnalysis.score)}</p>
                  <p className={cn("text-xs mt-1", getReadabilityColor(seoAnalysis.readability))}>
                    Lisibilité: {seoAnalysis.readability}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Problèmes détectés</h4>
                  {seoAnalysis.issues.length === 0 ? (
                    <p className="text-xs text-green-600">Aucun problème détecté</p>
                  ) : (
                    <div className="space-y-1">
                      {seoAnalysis.issues.map((issue, index) => (
                        <div key={index} className="flex items-start gap-2 text-xs text-red-600">
                          <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span>{issue}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Suggestions</h4>
                  {seoAnalysis.suggestions.length === 0 ? (
                    <p className="text-xs text-gray-600">Aucune suggestion</p>
                  ) : (
                    <div className="space-y-1">
                      {seoAnalysis.suggestions.map((suggestion, index) => (
                        <div key={index} className="flex items-start gap-2 text-xs text-blue-600">
                          <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span>{suggestion}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Aperçu des résultats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Aperçu des résultats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-sm mb-2">Google Search</h4>
                  <div className="border rounded p-3 bg-white">
                    <div className="text-blue-600 text-sm font-medium mb-1">
                      {formData.meta_title || "Titre SEO"}
                    </div>
                    <div className="text-green-600 text-xs mb-1">
                      {formData.canonical_url || "https://example.com/product"}
                    </div>
                    <div className="text-gray-600 text-xs">
                      {formData.meta_description || "Description SEO"}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-sm mb-2">Réseaux sociaux</h4>
                  <div className="border rounded p-3 bg-gray-50">
                    <div className="font-medium text-sm mb-1">
                      {formData.og_title || formData.meta_title || "Titre"}
                    </div>
                    <div className="text-gray-600 text-xs mb-2">
                      {formData.og_description || formData.meta_description || "Description"}
                    </div>
                    {formData.og_image && (
                      <div className="w-full h-20 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                        Image Open Graph
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistiques */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Statistiques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Mots-clés</span>
                  <Badge variant="secondary">
                    {seoAnalysis.keywords.length}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Problèmes</span>
                  <Badge variant={seoAnalysis.issues.length > 0 ? "destructive" : "secondary"}>
                    {seoAnalysis.issues.length}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Suggestions</span>
                  <Badge variant="secondary">
                    {seoAnalysis.suggestions.length}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Données structurées</span>
                  <Badge variant={formData.structured_data ? "default" : "secondary"}>
                    {formData.structured_data ? "Configurées" : "Manquantes"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conseils SEO */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Conseils SEO
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Utilisez des mots-clés pertinents</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Optimisez les images avec des alt-text</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Créez du contenu de qualité</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span>Évitez le contenu dupliqué</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};