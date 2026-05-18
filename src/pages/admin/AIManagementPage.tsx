/**
 * Page Admin — Centre de gestion AI
 * Configure tous les systèmes IA: chatbot, génération de contenu, amélioration image,
 * recommandations + clés API / providers.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bot,
  Sparkles,
  Image as ImageIcon,
  Brain,
  KeyRound,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Activity,
  Loader2,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { DEFAULT_STUDIO_PRESETS, type StudioPreset } from '@/lib/images/studio-presets';
import { invokeEnhanceImage } from '@/lib/images/enhance-image-client';

// =============================================================================
// Types & defaults
// =============================================================================

export interface AIManagementSettings {
  chatbot: {
    enabled: boolean;
    useLovableAIFallback: boolean;
    model: string;
    systemPrompt: string;
    temperature: number;
    maxTokens: number;
    language: string;
  };
  contentGenerator: {
    enabled: boolean;
    provider: 'lovable' | 'templates';
    model: string;
    systemPrompt: string;
    temperature: number;
    maxTokens: number;
  };
  imageEnhancer: {
    enabled: boolean;
    model: string;
    defaultInstruction: string;
    presets?: StudioPreset[];
    inferenceMaxPx?: number;
  };
  recommendations: {
    enabled: boolean;
    configRef: string;
  };
}

const DEFAULTS: AIManagementSettings = {
  chatbot: {
    enabled: true,
    useLovableAIFallback: false,
    model: 'google/gemini-3-flash-preview',
    systemPrompt:
      "Tu es l'assistant IA d'Emarzona, plateforme e-commerce multi-boutiques en Afrique de l'Ouest. Réponds en français de façon concise et professionnelle.",
    temperature: 0.7,
    maxTokens: 800,
    language: 'fr',
  },
  contentGenerator: {
    enabled: true,
    provider: 'lovable',
    model: 'google/gemini-3-flash-preview',
    systemPrompt: 'Tu es un expert en rédaction e-commerce SEO. Tu réponds avec du JSON valide.',
    temperature: 0.7,
    maxTokens: 2000,
  },
  imageEnhancer: {
    enabled: true,
    model: 'google/gemini-3.1-flash-image-preview',
    defaultInstruction:
      'Improve this image for a premium e-commerce listing: enhance lighting, contrast, sharpness, balance colors. Keep the subject identical.',
    presets: DEFAULT_STUDIO_PRESETS,
    inferenceMaxPx: 2048,
  },
  recommendations: { enabled: true, configRef: 'ai_recommendation_settings' },
};

// Modèles disponibles via Lovable AI Gateway
const TEXT_MODELS = [
  { id: 'google/gemini-3-flash-preview', label: 'Gemini 3 Flash (rapide, recommandé)' },
  { id: 'google/gemini-3.1-flash-lite-preview', label: 'Gemini 3.1 Flash Lite (économique)' },
  { id: 'google/gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro (raisonnement)' },
  { id: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { id: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  { id: 'openai/gpt-5-mini', label: 'GPT-5 Mini' },
  { id: 'openai/gpt-5', label: 'GPT-5' },
  { id: 'openai/gpt-5.2', label: 'GPT-5.2 (raisonnement)' },
];

const IMAGE_MODELS = [
  { id: 'google/gemini-3.1-flash-image-preview', label: 'Gemini 3.1 Flash Image (Nano Banana 2)' },
  { id: 'google/gemini-2.5-flash-image', label: 'Gemini 2.5 Flash Image (Nano Banana)' },
  { id: 'google/gemini-3-pro-image-preview', label: 'Gemini 3 Pro Image' },
];

// =============================================================================
// Sub-components
// =============================================================================

function ModelSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map(o => (
          <SelectItem key={o.id} value={o.id}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function NumberSlider({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label className="text-sm">{label}</Label>
        <Badge variant="outline">{value}</Badge>
      </div>
      <Slider value={[value]} onValueChange={v => onChange(v[0])} min={min} max={max} step={step} />
    </div>
  );
}

// =============================================================================
// Main page
// =============================================================================

const AIManagementPage: React.FC = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AIManagementSettings>(DEFAULTS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [pingResult, setPingResult] = useState<{
    ok: boolean;
    message: string;
    latencyMs?: number;
  } | null>(null);
  const [pinging, setPinging] = useState(false);
  const [imagePing, setImagePing] = useState<{ ok: boolean; message: string } | null>(null);
  const [imagePinging, setImagePinging] = useState(false);

  const _lovableKeyConfigured = true; // Géré côté serveur, toujours présent dans Lovable Cloud

  // Load settings
  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase.rpc('get_ai_management_settings');
        if (error) throw error;
        if (data) {
          const partial = data as Partial<AIManagementSettings>;
          setSettings({
            ...DEFAULTS,
            ...partial,
            imageEnhancer: {
              ...DEFAULTS.imageEnhancer,
              ...partial.imageEnhancer,
              presets: partial.imageEnhancer?.presets?.length
                ? partial.imageEnhancer.presets
                : DEFAULT_STUDIO_PRESETS,
            },
          });
        }
      } catch (e) {
        logger.error('Load AI settings failed', { error: e });
        toast({
          title: 'Erreur',
          description: 'Impossible de charger la configuration IA. Valeurs par défaut utilisées.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    })();
  }, [toast]);

  const update = useCallback(
    <K extends keyof AIManagementSettings>(section: K, patch: Partial<AIManagementSettings[K]>) => {
      setSettings(prev => ({ ...prev, [section]: { ...prev[section], ...patch } }));
      setHasChanges(true);
    },
    []
  );

  const save = useCallback(async () => {
    try {
      setIsSaving(true);
      const { error } = await supabase.rpc('update_ai_management_settings', {
        _settings: settings as unknown as Record<string, unknown>,
      });
      if (error) throw error;
      setHasChanges(false);
      toast({ title: 'Sauvegardé', description: 'Configuration IA mise à jour.' });
    } catch (e: unknown) {
      logger.error('Save AI settings failed', { error: e });
      const message = e instanceof Error ? e.message : 'Sauvegarde impossible.';
      toast({ title: 'Erreur', description: message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  }, [settings, toast]);

  const reset = useCallback(() => {
    setSettings(DEFAULTS);
    setHasChanges(true);
    toast({
      title: 'Réinitialisé',
      description: 'Valeurs par défaut restaurées (non sauvegardées).',
    });
  }, [toast]);

  const ping = useCallback(async () => {
    try {
      setPinging(true);
      setPingResult(null);
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          messages: [
            { role: 'user', content: 'Réponds simplement "OK" pour test de connectivité.' },
          ],
        },
      });
      if (error) throw error;
      setPingResult({ ok: true, message: data?.content || 'OK', latencyMs: data?.latencyMs });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erreur inconnue';
      setPingResult({ ok: false, message });
    } finally {
      setPinging(false);
    }
  }, []);

  const pingImageEnhancer = useCallback(async () => {
    const testPixel =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    try {
      setImagePinging(true);
      setImagePing(null);
      await invokeEnhanceImage(
        testPixel,
        settings.imageEnhancer.defaultInstruction || 'Slightly enhance for connectivity test.'
      );
      setImagePing({ ok: true, message: 'enhance-image répond correctement.' });
    } catch (e) {
      setImagePing({
        ok: false,
        message: e instanceof Error ? e.message : 'Échec du test',
      });
    } finally {
      setImagePinging(false);
    }
  }, [settings.imageEnhancer.defaultInstruction]);

  const systems = useMemo(
    () => [
      {
        key: 'chatbot',
        icon: Bot,
        label: 'Chatbot IA',
        enabled: settings.chatbot.enabled,
        model: settings.chatbot.model,
        color: 'text-blue-500',
      },
      {
        key: 'contentGenerator',
        icon: Sparkles,
        label: 'Génération de contenu',
        enabled: settings.contentGenerator.enabled,
        model:
          settings.contentGenerator.provider === 'lovable'
            ? settings.contentGenerator.model
            : 'Templates',
        color: 'text-purple-500',
      },
      {
        key: 'imageEnhancer',
        icon: ImageIcon,
        label: "Amélioration d'image",
        enabled: settings.imageEnhancer.enabled,
        model: settings.imageEnhancer.model,
        color: 'text-pink-500',
      },
      {
        key: 'recommendations',
        icon: Brain,
        label: 'Recommandations',
        enabled: settings.recommendations.enabled,
        model: 'Algorithmes pondérés',
        color: 'text-emerald-500',
      },
    ],
    [settings]
  );

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="container mx-auto p-4 lg:p-6 space-y-4">
          <Skeleton className="h-12 w-96" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Helmet>
        <title>Centre de gestion AI — Admin Emarzona</title>
      </Helmet>
      <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-3">
              <Bot className="h-7 w-7 text-primary" />
              Centre de gestion AI
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configurez tous les systèmes d'intelligence artificielle de la plateforme.
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={reset}
              disabled={isSaving}
              className="flex-1 sm:flex-initial"
            >
              <RotateCcw className="mr-2 h-4 w-4" /> Reset
            </Button>
            <Button
              onClick={save}
              disabled={!hasChanges || isSaving}
              className="flex-1 sm:flex-initial"
            >
              <Save className="mr-2 h-4 w-4" /> {isSaving ? 'Sauvegarde…' : 'Sauvegarder'}
            </Button>
          </div>
        </div>

        {hasChanges && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Modifications non sauvegardées</AlertTitle>
            <AlertDescription>Cliquez sur "Sauvegarder" pour appliquer.</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid grid-cols-3 lg:grid-cols-6 gap-1 h-auto">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="chatbot">Chatbot</TabsTrigger>
            <TabsTrigger value="content">Contenu</TabsTrigger>
            <TabsTrigger value="image">Image</TabsTrigger>
            <TabsTrigger value="recommendations">Reco.</TabsTrigger>
            <TabsTrigger value="keys">Clés & API</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {systems.map(s => {
                const Icon = s.icon;
                return (
                  <Card key={s.key}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-muted">
                            <Icon className={`h-5 w-5 ${s.color}`} />
                          </div>
                          <div>
                            <CardTitle className="text-base">{s.label}</CardTitle>
                            <CardDescription className="text-xs mt-1">{s.model}</CardDescription>
                          </div>
                        </div>
                        <Badge variant={s.enabled ? 'default' : 'secondary'}>
                          {s.enabled ? 'Activé' : 'Désactivé'}
                        </Badge>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" /> Test de connectivité Lovable AI
                </CardTitle>
                <CardDescription>Vérifie l'accès à la passerelle IA et la latence.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={ping} disabled={pinging}>
                  {pinging ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Activity className="mr-2 h-4 w-4" />
                  )}
                  Tester la connexion
                </Button>
                {pingResult && (
                  <Alert variant={pingResult.ok ? 'default' : 'destructive'}>
                    {pingResult.ok ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                    <AlertTitle>{pingResult.ok ? 'Connexion OK' : 'Échec'}</AlertTitle>
                    <AlertDescription>
                      {pingResult.message}
                      {pingResult.latencyMs ? ` — ${pingResult.latencyMs}ms` : ''}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chatbot */}
          <TabsContent value="chatbot" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" /> Chatbot IA
                </CardTitle>
                <CardDescription>
                  Assistant client (page Assistant IA + widget). Utilise des intentions règles +
                  fallback LLM optionnel.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Label className="font-medium">Chatbot activé</Label>
                    <p className="text-xs text-muted-foreground">
                      Affiche/masque le chatbot pour tous les utilisateurs.
                    </p>
                  </div>
                  <Switch
                    checked={settings.chatbot.enabled}
                    onCheckedChange={v => update('chatbot', { enabled: v })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Label className="font-medium">Fallback LLM (Lovable AI)</Label>
                    <p className="text-xs text-muted-foreground">
                      Si activé, utilise un modèle IA pour les questions non couvertes par les
                      intentions.
                    </p>
                  </div>
                  <Switch
                    checked={settings.chatbot.useLovableAIFallback}
                    onCheckedChange={v => update('chatbot', { useLovableAIFallback: v })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Modèle IA</Label>
                  <ModelSelect
                    value={settings.chatbot.model}
                    onChange={v => update('chatbot', { model: v })}
                    options={TEXT_MODELS}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Prompt système</Label>
                  <Textarea
                    rows={5}
                    value={settings.chatbot.systemPrompt}
                    onChange={e => update('chatbot', { systemPrompt: e.target.value })}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <NumberSlider
                    label="Température"
                    value={settings.chatbot.temperature}
                    onChange={v => update('chatbot', { temperature: v })}
                    min={0}
                    max={2}
                    step={0.1}
                  />
                  <NumberSlider
                    label="Max tokens"
                    value={settings.chatbot.maxTokens}
                    onChange={v => update('chatbot', { maxTokens: v })}
                    min={100}
                    max={4000}
                    step={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Langue par défaut</Label>
                  <Select
                    value={settings.chatbot.language}
                    onValueChange={v => update('chatbot', { language: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content generator */}
          <TabsContent value="content" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" /> Génération de contenu produit
                </CardTitle>
                <CardDescription>
                  Descriptions, meta SEO, mots-clés générés automatiquement lors de la création de
                  produits.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label className="font-medium">Activé</Label>
                  <Switch
                    checked={settings.contentGenerator.enabled}
                    onCheckedChange={v => update('contentGenerator', { enabled: v })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Provider</Label>
                  <Select
                    value={settings.contentGenerator.provider}
                    onValueChange={(v: 'lovable' | 'templates') =>
                      update('contentGenerator', { provider: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lovable">Lovable AI (recommandé)</SelectItem>
                      <SelectItem value="templates">Templates statiques (sans IA)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {settings.contentGenerator.provider === 'lovable' && (
                  <>
                    <div className="space-y-2">
                      <Label>Modèle IA</Label>
                      <ModelSelect
                        value={settings.contentGenerator.model}
                        onChange={v => update('contentGenerator', { model: v })}
                        options={TEXT_MODELS}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Prompt système</Label>
                      <Textarea
                        rows={4}
                        value={settings.contentGenerator.systemPrompt}
                        onChange={e => update('contentGenerator', { systemPrompt: e.target.value })}
                      />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <NumberSlider
                        label="Température"
                        value={settings.contentGenerator.temperature}
                        onChange={v => update('contentGenerator', { temperature: v })}
                        min={0}
                        max={2}
                        step={0.1}
                      />
                      <NumberSlider
                        label="Max tokens"
                        value={settings.contentGenerator.maxTokens}
                        onChange={v => update('contentGenerator', { maxTokens: v })}
                        min={500}
                        max={4000}
                        step={100}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Image */}
          <TabsContent value="image" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" /> Amélioration d'image
                </CardTitle>
                <CardDescription>
                  Edge function `enhance-image` — améliore les visuels produits.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label className="font-medium">Activé</Label>
                  <Switch
                    checked={settings.imageEnhancer.enabled}
                    onCheckedChange={v => update('imageEnhancer', { enabled: v })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Modèle d'image</Label>
                  <ModelSelect
                    value={settings.imageEnhancer.model}
                    onChange={v => update('imageEnhancer', { model: v })}
                    options={IMAGE_MODELS}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Instruction par défaut</Label>
                  <Textarea
                    rows={4}
                    value={settings.imageEnhancer.defaultInstruction}
                    onChange={e => update('imageEnhancer', { defaultInstruction: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    En anglais pour de meilleurs résultats.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Résolution max avant envoi IA (px)</Label>
                  <Input
                    type="number"
                    min={1024}
                    max={4096}
                    step={256}
                    value={settings.imageEnhancer.inferenceMaxPx ?? 2048}
                    onChange={e =>
                      update('imageEnhancer', {
                        inferenceMaxPx: Number(e.target.value) || 2048,
                      })
                    }
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Presets du Studio</p>
                    <p className="text-xs text-muted-foreground">
                      {(settings.imageEnhancer.presets ?? DEFAULT_STUDIO_PRESETS).length} styles
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => update('imageEnhancer', { presets: DEFAULT_STUDIO_PRESETS })}
                  >
                    Restaurer les presets
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={pingImageEnhancer}
                    disabled={imagePinging || !settings.imageEnhancer.enabled}
                  >
                    {imagePinging ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Activity className="h-4 w-4 mr-2" />
                    )}
                    Tester enhance-image
                  </Button>
                  {imagePing && (
                    <Badge variant={imagePing.ok ? 'default' : 'destructive'}>
                      {imagePing.message}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recommendations */}
          <TabsContent value="recommendations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" /> Système de recommandations
                </CardTitle>
                <CardDescription>
                  Algorithmes pondérés (collaboratif, contenu, tendances, comportemental,
                  cross-type).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label className="font-medium">Activé</Label>
                  <Switch
                    checked={settings.recommendations.enabled}
                    onCheckedChange={v => update('recommendations', { enabled: v })}
                  />
                </div>
                <Alert>
                  <Brain className="h-4 w-4" />
                  <AlertTitle>Configuration détaillée</AlertTitle>
                  <AlertDescription>
                    Les paramètres d'algorithmes, poids et seuils se gèrent dans la page dédiée.
                  </AlertDescription>
                </Alert>
                <Button asChild variant="outline">
                  <Link to="/admin/ai-settings">
                    Ouvrir la configuration des recommandations{' '}
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Keys */}
          <TabsContent value="keys" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5" /> Clés API & Providers
                </CardTitle>
                <CardDescription>Gestion centralisée des accès aux services IA.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="font-medium">Lovable AI Gateway</p>
                      <p className="text-xs text-muted-foreground">
                        LOVABLE_API_KEY (managée par Lovable Cloud)
                      </p>
                    </div>
                  </div>
                  <Badge>Configurée</Badge>
                </div>

                <Alert>
                  <KeyRound className="h-4 w-4" />
                  <AlertTitle>Modèles disponibles</AlertTitle>
                  <AlertDescription>
                    Lovable AI Gateway donne accès à Google Gemini (2.5, 3.x) et OpenAI GPT-5.x sans
                    clé séparée. Aucune clé OpenAI ou Anthropic personnelle n'est requise.
                  </AlertDescription>
                </Alert>

                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Sécurité</AlertTitle>
                  <AlertDescription>
                    Les anciennes clés <code>VITE_OPENAI_API_KEY</code> et{' '}
                    <code>VITE_ANTHROPIC_API_KEY</code> exposées côté navigateur ont été retirées du
                    générateur de contenu. Tous les appels IA passent désormais par des edge
                    functions sécurisées.
                  </AlertDescription>
                </Alert>

                <div className="text-sm text-muted-foreground space-y-1">
                  <p>
                    <strong>Quotas & crédits :</strong> gérés dans Settings → Workspace → Usage.
                  </p>
                  <p>
                    <strong>Rate limits :</strong> 429 = trop de requêtes ; 402 = crédits épuisés.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AIManagementPage;
