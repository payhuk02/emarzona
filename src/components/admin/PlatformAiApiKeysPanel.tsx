/**
 * Panneau admin — gestion sécurisée des clés API IA (multi-providers)
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { KeyRound, Loader2, Plus, Star, Trash2, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  addPlatformAiApiKey,
  deletePlatformAiApiKey,
  listPlatformAiApiKeys,
  setDefaultPlatformAiApiKey,
  type PlatformAiApiKeyMeta,
} from '@/lib/ai-blog-generator';
import { PROVIDER_KEY_HINTS } from '@/lib/ai/ai-provider-models';

const PROVIDERS = [
  { id: 'openrouter', label: 'OpenRouter' },
  { id: 'google', label: 'Google AI Studio (Gemini)' },
  { id: 'openai', label: 'OpenAI' },
  { id: 'anthropic', label: 'Anthropic' },
  { id: 'custom', label: 'Autre / Custom' },
] as const;

export function PlatformAiApiKeysPanel() {
  const { toast } = useToast();
  const [keys, setKeys] = useState<PlatformAiApiKeyMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [provider, setProvider] = useState<string>('google');
  const [label, setLabel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isDefault, setIsDefault] = useState(true);

  const providerHint = useMemo(
    () =>
      PROVIDER_KEY_HINTS[provider as keyof typeof PROVIDER_KEY_HINTS] ?? PROVIDER_KEY_HINTS.custom,
    [provider]
  );

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const list = await listPlatformAiApiKeys();
      setKeys(list);
    } catch (e) {
      toast({
        title: 'Impossible de charger les clés',
        description: e instanceof Error ? e.message : undefined,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAdd = async () => {
    if (!provider) {
      toast({ title: 'Sélectionnez un provider', variant: 'destructive' });
      return;
    }
    if (!label.trim() || apiKey.trim().length < 8) {
      toast({ title: 'Label et clé requis (min 8 car.)', variant: 'destructive' });
      return;
    }
    try {
      setSaving(true);
      await addPlatformAiApiKey({
        provider,
        label: label.trim(),
        apiKey: apiKey.trim(),
        isDefault,
      });
      setLabel('');
      setApiKey('');
      setIsDefault(false);
      toast({ title: 'Clé enregistrée', description: 'Chiffrée côté serveur (AES-GCM).' });
      await load();
    } catch (e) {
      toast({
        title: 'Erreur',
        description: e instanceof Error ? e.message : 'Erreur inconnue',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer cette clé API ?')) return;
    try {
      await deletePlatformAiApiKey(id);
      toast({ title: 'Clé supprimée' });
      await load();
    } catch (e) {
      toast({
        title: 'Erreur',
        description: e instanceof Error ? e.message : undefined,
        variant: 'destructive',
      });
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultPlatformAiApiKey(id);
      toast({ title: 'Clé par défaut mise à jour' });
      await load();
    } catch (e) {
      toast({
        title: 'Erreur',
        description: e instanceof Error ? e.message : undefined,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-500/10">
              <Shield className="h-5 w-5 text-violet-500" />
            </div>
            <div>
              <p className="font-medium">OpenRouter (serveur)</p>
              <p className="text-xs text-muted-foreground">OPENROUTER_API_KEY — fallback edge</p>
            </div>
          </div>
          <Badge variant="outline">Si configuré</Badge>
        </div>
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Shield className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="font-medium">Google Gemini (serveur)</p>
              <p className="text-xs text-muted-foreground">
                GEMINI_API_KEY / GOOGLE_API_KEY — fallback edge
              </p>
            </div>
          </div>
          <Badge variant="outline">Si configuré</Badge>
        </div>
      </div>

      <Alert>
        <KeyRound className="h-4 w-4" />
        <AlertTitle>Multi-providers professionnel</AlertTitle>
        <AlertDescription>
          Chaque service IA (blog, produits, chatbot) utilise le provider configuré dans son onglet.
          Les clés sont chiffrées AES-GCM côté edge — seul un hint (4 derniers caractères) est
          affiché. Ajoutez une clé par provider :{' '}
          <a
            href="https://openrouter.ai/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            OpenRouter
          </a>{' '}
          et/ou{' '}
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Google AI Studio (Gemini gratuit)
          </a>
          .
        </AlertDescription>
      </Alert>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : keys.length > 0 ? (
        <ul className="space-y-2">
          {keys.map(k => (
            <li
              key={k.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
            >
              <div>
                <p className="font-medium text-sm">{k.label}</p>
                <p className="text-xs text-muted-foreground">
                  {k.provider} · {k.key_hint}
                  {k.is_default ? ' · par défaut' : ''}
                </p>
              </div>
              <div className="flex gap-1">
                {!k.is_default ? (
                  <Button size="icon" variant="ghost" onClick={() => void handleSetDefault(k.id)}>
                    <Star className="h-4 w-4" />
                  </Button>
                ) : (
                  <Badge variant="secondary" className="text-[10px]">
                    défaut
                  </Badge>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => void handleDelete(k.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          Aucune clé personnalisée — les secrets Supabase Edge (OPENROUTER_API_KEY, GEMINI_API_KEY)
          sont utilisés si configurés.
        </p>
      )}

      <div className="rounded-lg border p-4 space-y-4">
        <p className="font-medium text-sm flex items-center gap-2">
          <Plus className="h-4 w-4" /> Ajouter une clé API
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Provider</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un provider" />
              </SelectTrigger>
              <SelectContent>
                {PROVIDERS.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Libellé</Label>
            <Input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder={
                provider === 'google' ? 'Ex. Gemini production' : 'Ex. OpenRouter production'
              }
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Clé API (jamais affichée après enregistrement)</Label>
          <Input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder={providerHint.placeholder}
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground">
            Secret edge : {providerHint.env}
            {providerHint.url ? (
              <>
                {' '}
                —{' '}
                <a
                  href={providerHint.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Obtenir une clé
                </a>
              </>
            ) : null}
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={e => setIsDefault(e.target.checked)}
          />
          Définir comme clé par défaut pour ce provider
        </label>
        <Button onClick={handleAdd} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Enregistrer la clé
        </Button>
      </div>
    </div>
  );
}
