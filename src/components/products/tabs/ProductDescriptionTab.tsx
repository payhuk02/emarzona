import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { 
  FileText, 
  Eye, 
  Copy, 
  CheckCircle2, 
  AlertCircle,
  Target,
  Share2,
  Search,
  Hash,
  Image as ImageIcon,
  Link as LinkIcon,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";

interface ProductDescriptionTabProps {
  formData: any;
  updateFormData: (field: string, value: any) => void;
}

export const ProductDescriptionTab = ({ formData, updateFormData }: ProductDescriptionTabProps) => {
  const [previewMode, setPreviewMode] = useState(false);
  const [seoScore, setSeoScore] = useState(0);

  // Calculer le score SEO
  const calculateSeoScore = () => {
    let score = 0;
    const maxScore = 100;

    // Titre SEO (20 points)
    if (formData.meta_title && formData.meta_title.length > 0) {
      score += 10;
      if (formData.meta_title.length >= 30 && formData.meta_title.length <= 60) {
        score += 10;
      }
    }

    // Description SEO (20 points)
    if (formData.meta_description && formData.meta_description.length > 0) {
      score += 10;
      if (formData.meta_description.length >= 120 && formData.meta_description.length <= 160) {
        score += 10;
      }
    }

    // Mots-clés (15 points)
    if (formData.meta_keywords && formData.meta_keywords.length > 0) {
      score += 15;
    }

    // Description du produit (25 points)
    if (formData.description && formData.description.length > 0) {
      score += 10;
      if (formData.description.length >= 200) {
        score += 15;
      }
    }

    // Image Open Graph (10 points)
    if (formData.og_image && formData.og_image.length > 0) {
      score += 10;
    }

    // Titre Open Graph (10 points)
    if (formData.og_title && formData.og_title.length > 0) {
      score += 10;
    }

    setSeoScore(Math.min(score, maxScore));
  };

  // Mettre à jour le score SEO quand les données changent
  React.useEffect(() => {
    calculateSeoScore();
  }, [formData.meta_title, formData.meta_description, formData.meta_keywords, formData.description, formData.og_image, formData.og_title]);

  const getSeoScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100";
    if (score >= 60) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getSeoScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Bon";
    if (score >= 40) return "Moyen";
    return "À améliorer";
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec score SEO */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Description et SEO</h2>
          <p className="text-gray-600">Créez une description attrayante et optimisez votre référencement</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className={cn("px-3 py-1 rounded-full text-sm font-medium", getSeoScoreColor(seoScore))}>
              Score SEO: {seoScore}/100
            </div>
            <p className="text-xs text-gray-500 mt-1">{getSeoScoreLabel(seoScore)}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            {previewMode ? "Éditer" : "Aperçu"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contenu principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description courte */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Description courte
              </CardTitle>
              <CardDescription>
                Résumé en une phrase pour les aperçus et listes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.short_description || ""}
                onChange={(e) => updateFormData("short_description", e.target.value)}
                placeholder="Décrivez brièvement votre produit en une phrase..."
                rows={3}
                maxLength={160}
                className="resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                {(formData.short_description || "").length}/160 caractères
              </p>
            </CardContent>
          </Card>

          {/* Description complète */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Description complète
              </CardTitle>
              <CardDescription>
                Description détaillée avec mise en forme riche
              </CardDescription>
            </CardHeader>
            <CardContent>
              {previewMode ? (
                <div 
                  className="prose max-w-none p-4 border rounded-lg bg-gray-50"
                  dangerouslySetInnerHTML={{ __html: formData.description || "" }}
                />
              ) : (
                <RichTextEditor
                  content={formData.description || ""}
                  onChange={(content) => updateFormData("description", content)}
                  placeholder="Décrivez votre produit en détail..."
                />
              )}
            </CardContent>
          </Card>

          {/* Caractéristiques du produit */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Caractéristiques principales
              </CardTitle>
              <CardDescription>
                Liste des points forts et fonctionnalités
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(formData.features || []).map((feature: any, index: number) => (
                  <div key={index} className="flex items-center gap-3">
                    <Input
                      value={feature}
                      onChange={(e) => {
                        const newFeatures = [...(formData.features || [])];
                        newFeatures[index] = e.target.value;
                        updateFormData("features", newFeatures);
                      }}
                      placeholder="Caractéristique..."
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newFeatures = (formData.features || []).filter((_: any, i: number) => i !== index);
                        updateFormData("features", newFeatures);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={() => {
                    const newFeatures = [...(formData.features || []), ""];
                    updateFormData("features", newFeatures);
                  }}
                  className="w-full"
                >
                  + Ajouter une caractéristique
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panneau SEO */}
        <div className="space-y-6">
          {/* Score SEO */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Optimisation SEO
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className={cn("w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold mx-auto", getSeoScoreColor(seoScore))}>
                    {seoScore}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{getSeoScoreLabel(seoScore)}</p>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    {formData.meta_title ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-red-500" />}
                    <span>Titre SEO</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {formData.meta_description ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-red-500" />}
                    <span>Description SEO</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {formData.meta_keywords ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-red-500" />}
                    <span>Mots-clés</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {formData.description && formData.description.length >= 200 ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-red-500" />}
                    <span>Description détaillée</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Métadonnées SEO */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Métadonnées SEO
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="meta_title">Titre SEO</Label>
                <Input
                  id="meta_title"
                  value={formData.meta_title || ""}
                  onChange={(e) => updateFormData("meta_title", e.target.value)}
                  placeholder={formData.name || "Titre pour les moteurs de recherche"}
                  maxLength={60}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {(formData.meta_title || "").length}/60 caractères
                </p>
              </div>

              <div>
                <Label htmlFor="meta_description">Description SEO</Label>
                <Textarea
                  id="meta_description"
                  value={formData.meta_description || ""}
                  onChange={(e) => updateFormData("meta_description", e.target.value)}
                  placeholder="Description pour les moteurs de recherche..."
                  rows={3}
                  maxLength={160}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {(formData.meta_description || "").length}/160 caractères
                </p>
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
            </CardContent>
          </Card>

          {/* Partage sur les réseaux sociaux */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Partage social
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="og_title">Titre Open Graph</Label>
                <Input
                  id="og_title"
                  value={formData.og_title || ""}
                  onChange={(e) => updateFormData("og_title", e.target.value)}
                  placeholder="Titre pour Facebook, Twitter..."
                />
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};