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
import { sanitizeString } from "@/lib/validation";
import React from "react";

interface ProductDescriptionTabProps {
  formData: any;
  updateFormData: (field: string, value: any) => void;
}

export const ProductDescriptionTab = ({ formData, updateFormData }: ProductDescriptionTabProps) => {
  const [previewMode, setPreviewMode] = useState(false);
  const [seoScore, setSeoScore] = useState(0);
  const [readability, setReadability] = useState<number | null>(null);
  const [missingAltCount, setMissingAltCount] = useState<number>(0);

  // Helpers for short description UX
  const sanitizeShortDescription = (text: string) => {
    // Remove HTML and dangerous chars, collapse spaces, and hard-limit
    const cleaned = sanitizeString(
      text
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, " ")
    );
    return cleaned.slice(0, 160);
  };

  const handleShortDescriptionChange = (value: string) => {
    updateFormData("short_description", sanitizeShortDescription(value));
  };

  const getCounterColorClass = (length: number) => {
    if (length >= 90) return "text-green-600";
    if (length >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  // --- Readability (Flesch FR) ---
  const htmlToPlainText = (html: string) => {
    const container = document.createElement("div");
    container.innerHTML = html;
    return (container.textContent || container.innerText || "").replace(/\s+/g, " ").trim();
  };

  const countSyllablesFr = (word: string) => {
    const cleaned = word.toLowerCase().normalize("NFD").replace(/[^a-zàâçéèêëîïôûùüÿñæœ]/g, "");
    if (!cleaned) return 0;
    const groups = cleaned.match(/[aeiouyàâäéèêëîïôöûüùœ]+/g);
    let syllables = groups ? groups.length : 1;
    // Silent 'e' at end of word (rough approximation)
    if (/e$/.test(cleaned) && syllables > 1) syllables -= 1;
    return Math.max(1, syllables);
  };

  const computeReadability = (text: string) => {
    if (!text) return null;
    const sentences = Math.max(1, (text.match(/[\.\!\?]+/g) || []).length);
    const wordsArr = text.split(/\s+/).filter(Boolean);
    const words = Math.max(1, wordsArr.length);
    const syllables = wordsArr.reduce((acc, w) => acc + countSyllablesFr(w), 0);
    const score = 207 - 1.015 * (words / sentences) - 73.6 * (syllables / words);
    return Math.max(0, Math.min(100, Math.round(score)));
  };

  const getReadabilityLabel = (score: number | null) => {
    if (score === null) return "—";
    if (score >= 80) return "Très facile";
    if (score >= 60) return "Facile";
    if (score >= 50) return "Standard";
    if (score >= 30) return "Difficile";
    return "Très difficile";
  };

  const getReadabilityColor = (score: number | null) => {
    if (score === null) return "text-gray-600 bg-gray-100";
    if (score >= 60) return "text-green-600 bg-green-100";
    if (score >= 40) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const checkMissingAlt = (html: string) => {
    if (!html) return 0;
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const imgs = Array.from(doc.querySelectorAll("img"));
    return imgs.filter(img => !img.getAttribute("alt") || img.getAttribute("alt") === "").length;
  };

  // SERP preview helpers
  const truncate = (text: string, max: number) => {
    if (!text) return "";
    const trimmed = text.trim();
    if (trimmed.length <= max) return trimmed;
    return trimmed.slice(0, Math.max(0, max - 1)).trimEnd() + "…";
  };

  const serpTitle = truncate(formData.meta_title || formData.name || "Titre du produit", 60);
  const serpDescription = truncate(formData.meta_description || formData.short_description || "", 160);
  const serpUrl = (() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://example.com";
    const storeSlug = formData.store_slug || "store";
    const productSlug = formData.slug || "produit";
    return `${origin}/stores/${storeSlug}/products/${productSlug}`;
  })();

  // Scroll to field from checklist
  const scrollToField = (elementId: string) => {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    // Temporary highlight
    el.classList.add("ring-2", "ring-primary", "rounded");
    window.setTimeout(() => {
      el.classList.remove("ring-2", "ring-primary", "rounded");
    }, 1600);
  };

  const generateFromLongDescription = () => {
    const html = formData.description || "";
    const container = document.createElement("div");
    container.innerHTML = html;
    const rawText = (container.textContent || container.innerText || "").trim();
    handleShortDescriptionChange(rawText);
  };

  const paraphraseShortDescription = () => {
    const base = (formData.short_description || "").trim();
    if (!base) return;
    // Very light paraphrase heuristics (no external API)
    const replacements: Array<[RegExp, string]> = [
      [/\bproduit\b/gi, "article"],
      [/\bsuper\b/gi, "excellent"],
      [/\bpas cher\b/gi, "abordable"],
      [/\bmeilleur\b/gi, "idéal"],
    ];
    let text = base;
    for (const [pattern, repl] of replacements) {
      text = text.replace(pattern, repl);
    }
    text = text.replace(/\s+/g, " ").replace(/([\.!?])+/g, "$1").trim();
    handleShortDescriptionChange(text);
  };

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
    const plain = htmlToPlainText(formData.description || "");
    setReadability(computeReadability(plain));
    setMissingAltCount(checkMissingAlt(formData.description || ""));
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
          <Card id="short_description_section">
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
                id="short_description"
                value={formData.short_description || ""}
                onChange={(e) => handleShortDescriptionChange(e.target.value)}
                placeholder="Décrivez brièvement votre produit en une phrase..."
                rows={3}
                maxLength={160}
                className="resize-none"
              />
              <div className="mt-2 flex items-center justify-between">
                <p className={cn("text-xs", getCounterColorClass((formData.short_description || "").length))}>
                  {(formData.short_description || "").length}/160 caractères
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={generateFromLongDescription}>
                    Générer depuis la description
                  </Button>
                  <Button variant="secondary" size="sm" onClick={paraphraseShortDescription}>
                    Paraphraser
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description complète */}
          <Card id="description_section">
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
              <div className="text-center">
                <div className={cn("px-2 py-1 inline-block rounded text-sm font-medium", getReadabilityColor(readability))}>
                  Lisibilité: {readability ?? "—"}
                </div>
                <p className="text-xs text-gray-600 mt-1">{getReadabilityLabel(readability)}</p>
              </div>
                
                <div className="space-y-2 text-sm">
                  <button type="button" onClick={() => scrollToField("meta_title")} className="w-full flex items-center gap-2 text-left px-2 py-1 rounded hover:bg-muted">
                    {formData.meta_title ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-red-500" />}
                    <span>Titre SEO</span>
                  </button>
                  <button type="button" onClick={() => scrollToField("meta_description")} className="w-full flex items-center gap-2 text-left px-2 py-1 rounded hover:bg-muted">
                    {formData.meta_description ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-red-500" />}
                    <span>Description SEO</span>
                  </button>
                  <button type="button" onClick={() => scrollToField("meta_keywords")} className="w-full flex items-center gap-2 text-left px-2 py-1 rounded hover:bg-muted">
                    {formData.meta_keywords ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-red-500" />}
                    <span>Mots-clés</span>
                  </button>
                  <button type="button" onClick={() => scrollToField("description_section")} className="w-full flex items-center gap-2 text-left px-2 py-1 rounded hover:bg-muted">
                    {formData.description && formData.description.length >= 200 ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-red-500" />}
                    <span>Description détaillée</span>
                  </button>
                <div className="flex items-center gap-2 px-2 py-1">
                  {missingAltCount === 0 ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-red-500" />}
                  <span>Images avec alt {missingAltCount > 0 ? `(manquants: ${missingAltCount})` : ''}</span>
                </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Aperçu SERP */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Aperçu SERP (Google)
              </CardTitle>
              <CardDescription>Aspect probable dans les résultats de recherche</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border p-4 bg-white">
                <div className="text-[#1a0dab] text-lg leading-snug hover:underline cursor-default">
                  {serpTitle}
                </div>
                <div className="text-[#006621] text-sm mt-1 truncate">{serpUrl}</div>
                <div className="text-[#4d5156] text-sm mt-1">{serpDescription}</div>
              </div>
              <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                <span>Titre: {serpTitle.length}/60</span>
                <span>Description: {serpDescription.length}/160</span>
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