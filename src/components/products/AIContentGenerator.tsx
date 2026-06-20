/**
 * Générateur de contenu IA — 5 verticales e-commerce Emarzona
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Image as ImageIcon,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  generateProductContent,
  analyzeDescriptionQuality,
  PRODUCT_TYPE_LABELS,
  type ProductInfo,
  type ProductType,
  type GeneratedContent,
  type AIProvider,
} from '@/lib/ai-content-generator';

export interface AIContentGeneratorProps {
  productInfo: ProductInfo;
  onContentGenerated: (content: GeneratedContent) => void;
  /** Libellé bouton */
  triggerLabel?: string;
}

export const AIContentGenerator = ({
  productInfo,
  onContentGenerated,
  triggerLabel = "Générer avec l'IA",
}: AIContentGeneratorProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [provider, setProvider] = useState<AIProvider>('openrouter');
  const [targetAudience, setTargetAudience] = useState('');
  const [generateImage, setGenerateImage] = useState(true);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ReturnType<
    typeof analyzeDescriptionQuality
  > | null>(null);

  const handleGenerate = async () => {
    if (!productInfo.name?.trim()) {
      toast({
        title: 'Nom requis',
        description: "Renseignez d'abord le nom du produit",
        variant: 'destructive',
      });
      return;
    }

    setGenerating(true);
    setGeneratedContent(null);

    try {
      const content = await generateProductContent(
        { ...productInfo, targetAudience: targetAudience || undefined },
        { provider, generateImage }
      );

      setGeneratedContent(content);
      setAnalysisResult(analyzeDescriptionQuality(content.longDescription));

      toast({
        title: 'Contenu généré',
        description: `Score qualité : ${analyzeDescriptionQuality(content.longDescription).score}/100`,
      });
    } catch (error: unknown) {
      logger.error('Generation error', { error, type: productInfo.type });
      toast({
        title: 'Erreur de génération',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
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
      toast({ title: 'Contenu appliqué', description: 'Description, SEO et image intégrés' });
    }
  };

  const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text);
    toast({ title: 'Copié' });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="gap-2">
          <Sparkles className="h-4 w-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            IA Emarzona — {PRODUCT_TYPE_LABELS[productInfo.type]}
          </DialogTitle>
          <DialogDescription>
            Description premium, SEO optimisé et image produit via le contexte plateforme (RAG)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configuration</CardTitle>
              <CardDescription>
                L&apos;IA connaît les 5 systèmes Emarzona : digital, physique, service, cours,
                artiste
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Mode</Label>
                <Select value={provider} onValueChange={v => setProvider(v as AIProvider)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openrouter">AI Emarzona (OpenRouter)</SelectItem>
                    <SelectItem value="fallback">Templates intelligents (gratuit)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nom</Label>
                  <Input value={productInfo.name} disabled className="mt-2" />
                </div>
                <div>
                  <Label>Type</Label>
                  <Input value={PRODUCT_TYPE_LABELS[productInfo.type]} disabled className="mt-2" />
                </div>
              </div>

              <div>
                <Label>Public cible (optionnel)</Label>
                <Input
                  value={targetAudience}
                  onChange={e => setTargetAudience(e.target.value)}
                  placeholder="Entrepreneurs, collectionneurs, étudiants…"
                  className="mt-2"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Générer image produit premium
                </Label>
                <Switch checked={generateImage} onCheckedChange={setGenerateImage} />
              </div>

              <Button
                type="button"
                onClick={handleGenerate}
                disabled={generating}
                className="w-full"
                size="lg"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Génération (30–90 s)…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Générer description + SEO{generateImage ? ' + image' : ''}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {generatedContent ? (
            <div className="space-y-4">
              {analysisResult ? (
                <Card
                  className={analysisResult.score >= 80 ? 'border-green-500' : 'border-yellow-500'}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      {analysisResult.score >= 80 ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                      )}
                      Score : {analysisResult.score}/100
                    </CardTitle>
                  </CardHeader>
                </Card>
              ) : null}

              {generatedContent.imageUrl ? (
                <img
                  src={generatedContent.imageUrl}
                  alt="Aperçu IA"
                  className="w-full max-h-48 rounded-lg object-cover border"
                />
              ) : null}

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between">
                    <CardTitle className="text-base">Description courte</CardTitle>
                    <Button
                      type="button"
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Description longue</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={generatedContent.longDescription}
                    readOnly
                    rows={8}
                    className="text-xs"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">SEO</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>
                    <strong>Title:</strong> {generatedContent.metaTitle}
                  </p>
                  <p>
                    <strong>Description:</strong> {generatedContent.metaDescription}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {generatedContent.keywords.map(k => (
                      <Badge key={k} variant="secondary">
                        {k}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <div className="flex w-full justify-between gap-2">
            <Button type="button" variant="outline" onClick={handleGenerate} disabled={generating}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Régénérer
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button type="button" onClick={handleApply} disabled={!generatedContent}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Appliquer tout
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export type { ProductType, GeneratedContent, ProductInfo };
