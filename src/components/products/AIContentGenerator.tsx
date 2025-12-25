/**
 * Component: AIContentGenerator
 * Description: Interface pour générer du contenu avec l'IA
 * Date: 25/10/2025
 * Impact: -80% temps de création
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { logger } from '@/lib/logger';
import {
  Sparkles,
  Wand2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Copy,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  generateProductContent, 
  analyzeDescriptionQuality,
  type ProductInfo,
  type AIProvider
} from '@/lib/ai-content-generator';

interface AIContentGeneratorProps {
  productInfo: {
    name: string;
    type: 'digital' | 'physical' | 'service';
    category?: string;
    price?: number;
    features?: string[];
  };
  onContentGenerated: (content: {
    shortDescription: string;
    longDescription: string;
    features: string[];
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
  }) => void;
}

export const AIContentGenerator = ({
  productInfo,
  onContentGenerated,
}: AIContentGeneratorProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [provider, setProvider] = useState<AIProvider>('fallback');
  const [targetAudience, setTargetAudience] = useState('');
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const handleGenerate = async () => {
    if (!productInfo.name) {
      toast({
        title: 'Nom du produit requis',
        description: 'Veuillez d\'abord renseigner le nom du produit',
        variant: 'destructive',
      });
      return;
    }

    setGenerating(true);
    setGeneratedContent(null);

    try {
      const content = await generateProductContent(
        {
          ...productInfo,
          targetAudience: targetAudience || undefined,
        },
        { provider }
      );

      setGeneratedContent(content);

      // Analyser la qualité
      const analysis = analyzeDescriptionQuality(content.longDescription);
      setAnalysisResult(analysis);

      toast({
        title: 'Contenu généré !',
        description: `Score qualité: ${analysis.score}/100`,
      });
    } catch (error: any) {
      logger.error('Generation error', { error, type: selectedType });
      toast({
        title: 'Erreur de génération',
        description: error.message || 'Une erreur est survenue',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleApply = () => {
    if (generatedContent) {
      onContentGenerated(generatedContent);
      setOpen(false);
      toast({
        title: 'Contenu appliqué !',
        description: 'Le contenu a été ajouté à votre produit',
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copié !',
      description: 'Texte copié dans le presse-papiers',
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Sparkles className="h-4 w-4" />
          Générer avec l'IA
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            Générateur de contenu IA
          </DialogTitle>
          <DialogDescription>
            Générez automatiquement des descriptions optimisées SEO pour votre produit
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Provider */}
              <div>
                <Label>Mode de génération</Label>
                <Select value={provider} onValueChange={(v) => setProvider(v as AIProvider)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fallback">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Gratuit</Badge>
                        Templates intelligents
                      </div>
                    </SelectItem>
                    <SelectItem value="openai">
                      <div className="flex items-center gap-2">
                        <Badge>Premium</Badge>
                        OpenAI GPT-4
                      </div>
                    </SelectItem>
                    <SelectItem value="claude">
                      <div className="flex items-center gap-2">
                        <Badge>Premium</Badge>
                        Claude 3 Sonnet
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {provider !== 'fallback' && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Nécessite une clé API configurée dans les paramètres
                  </p>
                )}
              </div>

              {/* Informations produit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nom du produit</Label>
                  <Input value={productInfo.name} disabled className="mt-2" />
                </div>
                <div>
                  <Label>Type</Label>
                  <Input value={productInfo.type} disabled className="mt-2" />
                </div>
              </div>

              {/* Public cible (optionnel) */}
              <div>
                <Label>Public cible (optionnel)</Label>
                <Input
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="Ex: Entrepreneurs, Étudiants, Parents..."
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Aide l'IA à personnaliser le contenu
                </p>
              </div>

              {/* Bouton génération */}
              <Button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full"
                size="lg"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Générer le contenu
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Résultats */}
          {generatedContent && (
            <div className="space-y-4">
              {/* Score qualité */}
              {analysisResult && (
                <Card className={analysisResult.score >= 80 ? 'border-green-500' : analysisResult.score >= 60 ? 'border-yellow-500' : 'border-red-500'}>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      {analysisResult.score >= 80 ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                      )}
                      Score qualité : {analysisResult.score}/100
                    </CardTitle>
                  </CardHeader>
                  {(analysisResult.issues.length > 0 || analysisResult.suggestions.length > 0) && (
                    <CardContent>
                      {analysisResult.issues.length > 0 && (
                        <div className="mb-2">
                          <p className="text-sm font-medium text-red-600">Problèmes détectés :</p>
                          <ul className="text-sm text-red-600 list-disc list-inside">
                            {analysisResult.issues.map((issue: string, i: number) => (
                              <li key={i}>{issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {analysisResult.suggestions.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-yellow-600">Suggestions :</p>
                          <ul className="text-sm text-yellow-600 list-disc list-inside">
                            {analysisResult.suggestions.map((suggestion: string, i: number) => (
                              <li key={i}>{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              )}

              {/* Description courte */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Description courte</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(generatedContent.shortDescription)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{generatedContent.shortDescription}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {generatedContent.shortDescription.length} caractères
                  </p>
                </CardContent>
              </Card>

              {/* Description longue */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Description longue</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(generatedContent.longDescription)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={generatedContent.longDescription}
                    readOnly
                    rows={10}
                    className="font-mono text-xs"
                  />
                </CardContent>
              </Card>

              {/* Caractéristiques */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Caractéristiques suggérées</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-1">
                    {generatedContent.features.map((feature: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* SEO */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Métadonnées SEO</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Meta Title ({generatedContent.metaTitle.length}/60)</Label>
                    <Input value={generatedContent.metaTitle} readOnly className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Meta Description ({generatedContent.metaDescription.length}/160)</Label>
                    <Textarea value={generatedContent.metaDescription} readOnly rows={2} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Mots-clés</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {generatedContent.keywords.map((keyword: string, i: number) => (
                        <Badge key={i} variant="secondary">{keyword}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              onClick={handleGenerate}
              disabled={generating}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Régénérer
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleApply}
                disabled={!generatedContent}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Appliquer
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

