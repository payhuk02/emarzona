import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { RichTextEditorPro } from "@/components/ui/rich-text-editor-pro";
import { AIContentGenerator } from "@/components/products/AIContentGenerator";
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
import { sanitizeHTML } from "@/lib/html-sanitizer";
import React from "react";

/**
 * Form data interface pour ProductDescriptionTab
 */
interface ProductFormData {
  name?: string;
  slug?: string;
  store_slug?: string;
  short_description?: string;
  description?: string;
  features?: string[];
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
}

interface ProductDescriptionTabProps {
  formData: ProductFormData;
  updateFormData: (field: string, value: any) => void;
}

export const ProductDescriptionTab = ({ formData, updateFormData }: ProductDescriptionTabProps) => {
  const [previewMode, setPreviewMode] = useState(false);
  const [seoScore, setSeoScore] = useState(0);
  const [readability, setReadability] = useState<number | null>(null);
  const [missingAltCount, setMissingAltCount] = useState<number>(0);
  const [keywordAnalysis, setKeywordAnalysis] = useState<{
    primaryKeywords: string[];
    density: Record<string, number>;
    suggestions: string[];
  }>({ primaryKeywords: [], density: {}, suggestions: [] });
  const [contentStructure, setContentStructure] = useState<{
    headings: { level: number; text: string }[];
    hasTableOfContents: boolean;
    suggestions: string[];
  }>({ headings: [], hasTableOfContents: false, suggestions: [] });
  const [duplicateWarnings, setDuplicateWarnings] = useState<string[]>([]);
  const [ctaAnalysis, setCtaAnalysis] = useState<{
    hasCta: boolean;
    ctaCount: number;
    suggestions: string[];
  }>({ hasCta: false, ctaCount: 0, suggestions: [] });

  /**
   * Nettoie et limite la description courte
   * Supprime le HTML, normalise les espaces et limite à 160 caractères
   */
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

  /**
   * Convertit du HTML en texte brut
   */
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

  /**
   * Calcule le score de lisibilité Flesch (adapté FR)
   * @returns Score entre 0-100, null si pas de texte
   */
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

  // --- Keyword Analysis ---
  const extractKeywords = (text: string) => {
    if (!text) return [];
    const words = text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[^a-zàâäéèêëîïôöûüùœç\s]/g, " ")
      .split(/\s+/)
      .filter(word => word.length > 3 && !["avec", "pour", "dans", "sur", "sous", "avec", "sans", "plus", "tout", "tous", "toute", "toutes"].includes(word));
    
    const wordCount: Record<string, number> = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));
  };

  const analyzeKeywordDensity = (text: string, metaKeywords: string) => {
    const totalWords = text.split(/\s+/).length;
    const keywords = metaKeywords ? metaKeywords.split(",").map(k => k.trim().toLowerCase()) : [];
    const density: Record<string, number> = {};
    const suggestions: string[] = [];
    
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = (text.match(regex) || []).length;
      const percentage = totalWords > 0 ? (matches / totalWords) * 100 : 0;
      density[keyword] = Math.round(percentage * 100) / 100;
      
      if (percentage < 0.5) {
        suggestions.push(`Augmenter l'utilisation de "${keyword}" (actuellement ${percentage.toFixed(1)}%)`);
      } else if (percentage > 3) {
        suggestions.push(`Réduire l'utilisation de "${keyword}" (actuellement ${percentage.toFixed(1)}%)`);
      }
    });
    
    return { density, suggestions };
  };

  // --- Content Structure Analysis ---
  const analyzeContentStructure = (html: string) => {
    if (!html) return { headings: [], hasTableOfContents: false, suggestions: [] };
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const headings = Array.from(doc.querySelectorAll("h1, h2, h3, h4, h5, h6"))
      .map(h => ({
        level: parseInt(h.tagName.charAt(1)),
        text: h.textContent?.trim() || ""
      }))
      .filter(h => h.text.length > 0);
    
    const suggestions: string[] = [];
    
    // Check for proper heading hierarchy
    if (headings.length > 0) {
      const hasH1 = headings.some(h => h.level === 1);
      const hasH2 = headings.some(h => h.level === 2);
      
      if (!hasH1) suggestions.push("Ajouter un titre H1 principal");
      if (!hasH2 && headings.length > 1) suggestions.push("Utiliser des titres H2 pour structurer le contenu");
      
      // Check for heading order
      for (let i = 1; i < headings.length; i++) {
        if (headings[i].level > headings[i-1].level + 1) {
          suggestions.push("Éviter de sauter des niveaux de titres (ex: H1 → H3)");
          break;
        }
      }
    } else {
      suggestions.push("Ajouter des titres pour structurer le contenu");
    }
    
    return {
      headings,
      hasTableOfContents: headings.length >= 3,
      suggestions
    };
  };

  // --- Duplicate Content Detection ---
  const detectDuplicateContent = (text: string, metaTitle: string, metaDescription: string) => {
    const warnings: string[] = [];
    
    if (!text) return warnings;
    
    // Check for repeated sentences
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const sentenceCount: Record<string, number> = {};
    
    sentences.forEach(sentence => {
      const normalized = sentence.trim().toLowerCase();
      sentenceCount[normalized] = (sentenceCount[normalized] || 0) + 1;
    });
    
    Object.entries(sentenceCount).forEach(([sentence, count]) => {
      if (count > 2) {
        warnings.push(`Phrase répétée ${count} fois: "${sentence.slice(0, 50)}..."`);
      }
    });
    
    // Check for meta duplication
    if (metaTitle && text.toLowerCase().includes(metaTitle.toLowerCase())) {
      warnings.push("Le titre SEO est répété dans le contenu");
    }
    
    if (metaDescription && text.toLowerCase().includes(metaDescription.toLowerCase())) {
      warnings.push("La description SEO est répétée dans le contenu");
    }
    
    return warnings;
  };

  // --- CTA Analysis ---
  const analyzeCTA = (html: string) => {
    if (!html) return { hasCta: false, ctaCount: 0, suggestions: [] };
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    
    // Common CTA patterns
    const ctaPatterns = [
      /acheter|commander|réserver|télécharger|obtenir|découvrir|essayer|tester|démarrer|commencer/gi,
      /cliquez ici|en savoir plus|découvrir|voir plus|lire la suite/gi,
      /gratuit|sans engagement|essai gratuit|démo/gi
    ];
    
    const text = doc.textContent || "";
    let ctaCount = 0;
    const suggestions: string[] = [];
    
    ctaPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) ctaCount += matches.length;
    });
    
    // Check for buttons and links
    const buttons = doc.querySelectorAll("button, a[href], input[type='button'], input[type='submit']");
    ctaCount += buttons.length;
    
    if (ctaCount === 0) {
      suggestions.push("Ajouter un call-to-action pour encourager l'achat");
    } else if (ctaCount === 1) {
      suggestions.push("Considérer ajouter un CTA secondaire (ex: 'En savoir plus')");
    } else if (ctaCount > 3) {
      suggestions.push("Réduire le nombre de CTA pour éviter la confusion");
    }
    
    // Check CTA placement
    const textLength = text.length;
    const firstCtaIndex = text.search(/acheter|commander|télécharger|obtenir/gi);
    
    if (firstCtaIndex > textLength * 0.7) {
      suggestions.push("Placer le premier CTA plus tôt dans le contenu");
    }
    
    return {
      hasCta: ctaCount > 0,
      ctaCount,
      suggestions
    };
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

  /**
   * Scroll vers un champ et le met en surbrillance temporairement
   */
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
    
    // Keyword analysis
    const keywords = extractKeywords(plain);
    const analysis = analyzeKeywordDensity(plain, formData.meta_keywords || "");
    setKeywordAnalysis({
      primaryKeywords: keywords.slice(0, 5).map(k => k.word),
      density: analysis.density,
      suggestions: analysis.suggestions
    });
    
    // Content structure analysis
    const structure = analyzeContentStructure(formData.description || "");
    setContentStructure(structure);
    
    // Duplicate content detection
    const duplicates = detectDuplicateContent(plain, formData.meta_title || "", formData.meta_description || "");
    setDuplicateWarnings(duplicates);
    
    // CTA analysis
    const cta = analyzeCTA(formData.description || "");
    setCtaAnalysis(cta);
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Description et SEO</h2>
          <p className="text-sm sm:text-base text-gray-600">Créez une description attrayante et optimisez votre référencement</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto flex-wrap">
          <div className="text-right">
            <div className={cn("px-3 py-1 rounded-full text-sm font-medium", getSeoScoreColor(seoScore))}>
              Score SEO: {seoScore}/100
            </div>
            <p className="text-xs text-gray-500 mt-1">{getSeoScoreLabel(seoScore)}</p>
          </div>
          
          {/* Générateur IA */}
          <AIContentGenerator
            productInfo={{
              name: formData.name || "",
              type: (formData as any).product_type || "digital",
              category: (formData as any).category,
              price: (formData as any).price,
              features: formData.features || [],
            }}
            onContentGenerated={(content) => {
              updateFormData("short_description", content.shortDescription);
              updateFormData("description", content.longDescription);
              updateFormData("features", content.features);
              updateFormData("meta_title", content.metaTitle);
              updateFormData("meta_description", content.metaDescription);
              updateFormData("meta_keywords", content.keywords.join(", "));
            }}
          />
          
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center gap-2 touch-manipulation min-h-[44px]"
            aria-label={previewMode ? "Passer en mode édition" : "Afficher l'aperçu"}
          >
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">{previewMode ? "Éditer" : "Aperçu"}</span>
            <span className="sm:hidden">{previewMode ? "Édit" : "Prev"}</span>
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
                aria-label="Description courte du produit"
                aria-describedby="short-desc-counter"
              />
              <div className="mt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <p 
                  id="short-desc-counter"
                  className={cn("text-xs", getCounterColorClass((formData.short_description || "").length))}
                  aria-live="polite"
                >
                  {(formData.short_description || "").length}/160 caractères
                </p>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={generateFromLongDescription}
                    className="touch-manipulation min-h-[44px] flex-1 sm:flex-initial"
                    aria-label="Générer la description courte depuis la description complète"
                  >
                    <span className="hidden sm:inline">Générer depuis la description</span>
                    <span className="sm:hidden">Générer</span>
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={paraphraseShortDescription}
                    className="touch-manipulation min-h-[44px]"
                    aria-label="Paraphraser la description courte"
                  >
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
                  dangerouslySetInnerHTML={{ __html: sanitizeHTML(formData.description || "", 'productDescription') }}
                />
              ) : (
                <RichTextEditorPro
                  content={formData.description || ""}
                  onChange={(content) => updateFormData("description", content)}
                  placeholder="Décrivez votre produit en détail avec toutes les fonctionnalités professionnelles..."
                  showWordCount={true}
                  maxHeight="600px"
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
                  <button 
                    type="button" 
                    onClick={() => scrollToField("meta_title")} 
                    className="w-full flex items-center gap-2 text-left px-2 py-1 rounded hover:bg-muted touch-manipulation min-h-[44px]"
                    aria-label="Aller au champ Titre SEO"
                  >
                    {formData.meta_title ? <CheckCircle2 className="h-4 w-4 text-green-500" aria-hidden="true" /> : <AlertCircle className="h-4 w-4 text-red-500" aria-hidden="true" />}
                    <span>Titre SEO</span>
                  </button>
                  <button 
                    type="button" 
                    onClick={() => scrollToField("meta_description")} 
                    className="w-full flex items-center gap-2 text-left px-2 py-1 rounded hover:bg-muted touch-manipulation min-h-[44px]"
                    aria-label="Aller au champ Description SEO"
                  >
                    {formData.meta_description ? <CheckCircle2 className="h-4 w-4 text-green-500" aria-hidden="true" /> : <AlertCircle className="h-4 w-4 text-red-500" aria-hidden="true" />}
                    <span>Description SEO</span>
                  </button>
                  <button 
                    type="button" 
                    onClick={() => scrollToField("meta_keywords")} 
                    className="w-full flex items-center gap-2 text-left px-2 py-1 rounded hover:bg-muted touch-manipulation min-h-[44px]"
                    aria-label="Aller au champ Mots-clés"
                  >
                    {formData.meta_keywords ? <CheckCircle2 className="h-4 w-4 text-green-500" aria-hidden="true" /> : <AlertCircle className="h-4 w-4 text-red-500" aria-hidden="true" />}
                    <span>Mots-clés</span>
                  </button>
                  <button 
                    type="button" 
                    onClick={() => scrollToField("description_section")} 
                    className="w-full flex items-center gap-2 text-left px-2 py-1 rounded hover:bg-muted touch-manipulation min-h-[44px]"
                    aria-label="Aller au champ Description détaillée"
                  >
                    {formData.description && formData.description.length >= 200 ? <CheckCircle2 className="h-4 w-4 text-green-500" aria-hidden="true" /> : <AlertCircle className="h-4 w-4 text-red-500" aria-hidden="true" />}
                    <span>Description détaillée</span>
                  </button>
                <div className="flex items-center gap-2 px-2 py-1 min-h-[44px]">
                  {missingAltCount === 0 ? <CheckCircle2 className="h-4 w-4 text-green-500" aria-hidden="true" /> : <AlertCircle className="h-4 w-4 text-red-500" aria-hidden="true" />}
                  <span>Images avec alt {missingAltCount > 0 ? `(manquants: ${missingAltCount})` : ''}</span>
                </div>
                
                {/* Keyword Analysis */}
                {keywordAnalysis.primaryKeywords.length > 0 && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium mb-2">Mots-clés principaux</h4>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {keywordAnalysis.primaryKeywords.map((keyword, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {keyword}
                        </span>
                      ))}
                    </div>
                    {keywordAnalysis.suggestions.length > 0 && (
                      <div className="text-xs text-orange-600">
                        <strong>Suggestions:</strong>
                        <ul className="mt-1 space-y-1">
                          {keywordAnalysis.suggestions.map((suggestion, index) => (
                            <li key={index}>• {suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Content Structure */}
                {contentStructure.headings.length > 0 && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium mb-2">Structure du contenu</h4>
                    <div className="space-y-1 mb-2">
                      {contentStructure.headings.map((heading, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                          <span className="px-1 py-0.5 bg-gray-200 rounded text-xs">
                            H{heading.level}
                          </span>
                          <span className="truncate">{heading.text}</span>
                        </div>
                      ))}
                    </div>
                    {contentStructure.suggestions.length > 0 && (
                      <div className="text-xs text-orange-600">
                        <strong>Améliorations:</strong>
                        <ul className="mt-1 space-y-1">
                          {contentStructure.suggestions.map((suggestion, index) => (
                            <li key={index}>• {suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Duplicate Content Warnings */}
                {duplicateWarnings.length > 0 && (
                  <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                    <h4 className="text-sm font-medium mb-2 text-red-800">⚠️ Contenu dupliqué détecté</h4>
                    <ul className="text-xs text-red-700 space-y-1">
                      {duplicateWarnings.map((warning, index) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* CTA Analysis */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium mb-2">Call-to-Action</h4>
                  <div className="flex items-center gap-2 mb-2">
                    {ctaAnalysis.hasCta ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-xs">
                      {ctaAnalysis.ctaCount} CTA détecté{ctaAnalysis.ctaCount > 1 ? 's' : ''}
                    </span>
                  </div>
                  {ctaAnalysis.suggestions.length > 0 && (
                    <div className="text-xs text-orange-600">
                      <strong>Optimisations:</strong>
                      <ul className="mt-1 space-y-1">
                        {ctaAnalysis.suggestions.map((suggestion, index) => (
                          <li key={index}>• {suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
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
                  aria-label="Titre SEO"
                  aria-describedby="meta-title-counter"
                />
                <p id="meta-title-counter" className="text-xs text-gray-500 mt-1" aria-live="polite">
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
                  aria-label="Description SEO"
                  aria-describedby="meta-desc-counter"
                />
                <p id="meta-desc-counter" className="text-xs text-gray-500 mt-1" aria-live="polite">
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
                  aria-label="Mots-clés SEO"
                  aria-describedby="meta-keywords-hint"
                />
                <p id="meta-keywords-hint" className="text-xs text-gray-500 mt-1">
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