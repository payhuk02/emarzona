/**
 * Panneau admin — gestion sécurisée des clés API IA
 */
import { useCallback, useEffect, useState } from 'react';
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

const PROVIDERS = [
  { id: 'lovable', label: 'Lovable AI Gateway' },
  { id: 'openai', label: 'OpenAI' },
  { id: 'anthropic', label: 'Anthropic' },
  { id: 'google', label: 'Google AI' },
  { id: 'custom', label: 'Autre / Custom' },
] as const;

export function PlatformAiApiKeysPanel() {
  const { toast } = useToast();
  const [keys, setKeys] = useState<PlatformAiApiKeyMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [provider, setProvider] = useState<string>('lovable');
  const [label, setLabel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isDefault, setIsDefault] = useState(false);

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
        description: e instanceof Error ? e.message : undefined,
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
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <Shield className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <p className="font-medium">Lovable AI Gateway (serveur)</p>
            <p className="text-xs text-muted-foreground">
              LOVABLE_API_KEY — variable Supabase Edge (fallback)
            </p>
          </div>
        </div>
        <Badge>Actif si configuré</Badge>
      </div>

      <Alert>
        <KeyRound className="h-4 w-4" />
        <AlertTitle>Stockage sécurisé</AlertTitle>
        <AlertDescription>
          Les clés ajoutées ici sont chiffrées AES-GCM côté edge functions. Elles ne sont jamais
          renvoyées au navigateur — seul un hint (4 derniers caractères) est affiché.
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
          Aucune clé personnalisée — LOVABLE_API_KEY utilisée.
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
                <SelectValue />
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
              placeholder="Ex. OpenAI production"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Clé API (jamais affichée après enregistrement)</Label>
          <Input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="sk-… ou clé provider"
            autoComplete="off"
          />
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
