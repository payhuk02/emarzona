/**
 * SEOMetaInspector - Dashboard d'inspection des balises SEO de toutes les pages publiques.
 *
 * Récupère le HTML rendu (mode bot) via la edge function `seo-inspect` et affiche pour
 * chaque URL : title, description, canonical, hreflang, OG tags, Twitter, JSON-LD, H1.
 * Permet de vérifier rapidement l'indexabilité côté crawlers.
 */
import { useMemo, useState } from 'react';
import { AppPageShell } from '@/components/layout/AppPageShell';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Search,
  RefreshCw,
  Plus,
  X,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SeoResult {
  url: string;
  status: number;
  title: string | null;
  description: string | null;
  canonical: string | null;
  robots: string | null;
  hreflang: Array<{ lang: string; href: string }>;
  og: Record<string, string>;
  twitter: Record<string, string>;
  jsonLd: unknown[];
  h1: string[];
  error?: string;
}

const DEFAULT_BASE = 'https://www.emarzona.com';
const STORES_BASE = 'https://myemarzona.shop';
const DEFAULT_STORE_PATHS = ['/', '/products', '/about', '/contact'];
const DEFAULT_PATHS = [
  '/',
  '/marketplace',
  '/discover',
  '/trending',
  '/collections',
  '/auctions',
  '/community',
  '/products/compare',
  '/legal/terms',
  '/legal/privacy',
  '/legal/cookies',
  '/legal/refund',
  '/auth',
];

interface Issue {
  level: 'ok' | 'warn' | 'error';
  label: string;
}

function analyze(r: SeoResult): Issue[] {
  const issues: Issue[] = [];
  if (r.error || r.status === 0) {
    issues.push({ level: 'error', label: `Erreur: ${r.error || 'inaccessible'}` });
    return issues;
  }
  if (r.status >= 400) issues.push({ level: 'error', label: `HTTP ${r.status}` });
  if (!r.title) issues.push({ level: 'error', label: 'Title manquant' });
  else if (r.title.length > 60)
    issues.push({ level: 'warn', label: `Title trop long (${r.title.length})` });
  else issues.push({ level: 'ok', label: `Title (${r.title.length} car.)` });

  if (!r.description) issues.push({ level: 'error', label: 'Description manquante' });
  else if (r.description.length > 160)
    issues.push({ level: 'warn', label: `Description trop longue (${r.description.length})` });
  else if (r.description.length < 50)
    issues.push({ level: 'warn', label: `Description trop courte (${r.description.length})` });
  else issues.push({ level: 'ok', label: `Description (${r.description.length} car.)` });

  if (!r.canonical) issues.push({ level: 'warn', label: 'Canonical manquant' });
  else issues.push({ level: 'ok', label: 'Canonical présent' });

  if (!r.og['title'] || !r.og['image'])
    issues.push({ level: 'warn', label: 'Open Graph incomplet' });
  else issues.push({ level: 'ok', label: 'Open Graph OK' });

  if (!r.twitter['card']) issues.push({ level: 'warn', label: 'Twitter Card manquant' });

  if (r.hreflang.length === 0) issues.push({ level: 'warn', label: 'hreflang absent' });
  else issues.push({ level: 'ok', label: `${r.hreflang.length} hreflang` });

  if (r.h1.length === 0) issues.push({ level: 'warn', label: 'H1 manquant' });
  else if (r.h1.length > 1)
    issues.push({ level: 'warn', label: `${r.h1.length} H1 (1 recommandé)` });

  if (r.robots && /noindex/i.test(r.robots)) issues.push({ level: 'warn', label: 'noindex actif' });

  return issues;
}

function levelIcon(level: Issue['level']) {
  if (level === 'ok') return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
  if (level === 'warn') return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />;
  return <XCircle className="h-3.5 w-3.5 text-red-500" />;
}

const SEOMetaInspector = () => {
  const { toast } = useToast();
  const [base, setBase] = useState(DEFAULT_BASE);
  const [pathsText, setPathsText] = useState(DEFAULT_PATHS.join('\n'));
  const [storeSlug, setStoreSlug] = useState('');
  const [storePathsText, setStorePathsText] = useState(DEFAULT_STORE_PATHS.join('\n'));
  const [results, setResults] = useState<SeoResult[]>([]);
  const [extraPath, setExtraPath] = useState('');

  const urls = useMemo(() => {
    const main = pathsText
      .split('\n')
      .map(p => p.trim())
      .filter(Boolean)
      .map(p =>
        p.startsWith('http') ? p : `${base.replace(/\/$/, '')}${p.startsWith('/') ? p : `/${p}`}`
      );
    const slug = storeSlug.trim().replace(/^\/+|\/+$/g, '');
    const storeOrigin = slug ? `https://${slug}.${STORES_BASE.replace(/^https?:\/\//, '')}` : '';
    const stores = slug
      ? storePathsText
          .split('\n')
          .map(p => p.trim())
          .filter(Boolean)
          .map(p => (p.startsWith('http') ? p : `${storeOrigin}${p.startsWith('/') ? p : `/${p}`}`))
      : [];
    return [...main, ...stores];
  }, [pathsText, base, storeSlug, storePathsText]);

  const inspect = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('seo-inspect', {
        body: { urls },
      });
      if (error) throw error;
      return data.results as SeoResult[];
    },
    onSuccess: data => {
      setResults(data);
      toast({ title: 'Analyse terminée', description: `${data.length} pages inspectées.` });
    },
    onError: (e: Error) => {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    },
  });

  const summary = useMemo(() => {
    let ok = 0,
      warn = 0,
      err = 0;
    for (const r of results) {
      for (const i of analyze(r)) {
        if (i.level === 'ok') ok++;
        else if (i.level === 'warn') warn++;
        else err++;
      }
    }
    return { ok, warn, err };
  }, [results]);

  const addPath = () => {
    if (!extraPath.trim()) return;
    setPathsText(prev => `${prev}\n${extraPath.trim()}`);
    setExtraPath('');
  };

  return (
    <AppPageShell>
      <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Search className="h-6 w-6 text-primary" aria-hidden="true" />
              Inspecteur de balises SEO
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Vérifiez title, description, canonical, hreflang et balises OG/Twitter pour chaque
              page publique.
            </p>
          </div>
          <Button
            onClick={() => inspect.mutate()}
            disabled={inspect.isPending || urls.length === 0}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${inspect.isPending ? 'animate-spin' : ''}`} />
            {inspect.isPending ? 'Analyse…' : `Analyser ${urls.length} pages`}
          </Button>
        </div>

        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pages à analyser</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-1">
                <label className="text-xs font-medium text-muted-foreground">Domaine de base</label>
                <Input
                  value={base}
                  onChange={e => setBase(e.target.value)}
                  placeholder="https://www.emarzona.com"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Ajouter une page
                </label>
                <div className="flex gap-2">
                  <Input
                    value={extraPath}
                    onChange={e => setExtraPath(e.target.value)}
                    placeholder="/store/ma-boutique ou URL complète"
                    onKeyDown={e => e.key === 'Enter' && addPath()}
                  />
                  <Button type="button" variant="outline" onClick={addPath} className="gap-1">
                    <Plus className="h-4 w-4" /> Ajouter
                  </Button>
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Liste des chemins (une URL par ligne)
              </label>
              <Textarea
                value={pathsText}
                onChange={e => setPathsText(e.target.value)}
                rows={6}
                className="font-mono text-xs"
              />
            </div>

            {/* Inspection des sous-domaines de boutiques (myemarzona.shop) */}
            <div className="rounded-lg border border-dashed p-3 space-y-3 bg-muted/20">
              <div>
                <div className="text-sm font-medium">Boutique utilisateur (sous-domaine)</div>
                <p className="text-xs text-muted-foreground">
                  Inspecte les pages d'une boutique sur <code>myemarzona.shop</code>. Renseignez le
                  slug pour générer les URLs.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="sm:col-span-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Slug de la boutique
                  </label>
                  <Input
                    value={storeSlug}
                    onChange={e => setStoreSlug(e.target.value)}
                    placeholder="ma-boutique"
                  />
                  {storeSlug.trim() && (
                    <p className="text-[11px] text-muted-foreground mt-1 truncate">
                      → https://{storeSlug.trim()}.myemarzona.shop
                    </p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Chemins boutique (une URL par ligne)
                  </label>
                  <Textarea
                    value={storePathsText}
                    onChange={e => setStorePathsText(e.target.value)}
                    rows={4}
                    className="font-mono text-xs"
                    disabled={!storeSlug.trim()}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Résumé */}
        {results.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Vérifications OK</div>
                <div className="text-2xl font-bold text-green-600">{summary.ok}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Avertissements</div>
                <div className="text-2xl font-bold text-amber-600">{summary.warn}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Erreurs</div>
                <div className="text-2xl font-bold text-red-600">{summary.err}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Résultats */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Résultats détaillés</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                {results.map(r => {
                  const issues = analyze(r);
                  const errors = issues.filter(i => i.level === 'error').length;
                  const warns = issues.filter(i => i.level === 'warn').length;
                  return (
                    <AccordionItem key={r.url} value={r.url}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3 flex-1 min-w-0 text-left">
                          <Badge
                            variant={r.status >= 200 && r.status < 300 ? 'default' : 'destructive'}
                          >
                            {r.status || 'ERR'}
                          </Badge>
                          <span className="font-mono text-xs truncate flex-1">{r.url}</span>
                          {errors > 0 && (
                            <Badge variant="destructive" className="gap-1">
                              <XCircle className="h-3 w-3" /> {errors}
                            </Badge>
                          )}
                          {warns > 0 && (
                            <Badge
                              variant="secondary"
                              className="gap-1 bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200"
                            >
                              <AlertTriangle className="h-3 w-3" /> {warns}
                            </Badge>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pt-2">
                          <div className="flex flex-wrap gap-1.5">
                            {issues.map((i, idx) => (
                              <Badge key={idx} variant="outline" className="gap-1 font-normal">
                                {levelIcon(i.level)}
                                {i.label}
                              </Badge>
                            ))}
                          </div>

                          <Tabs defaultValue="basics">
                            <TabsList className="grid grid-cols-5 w-full">
                              <TabsTrigger value="basics">Basiques</TabsTrigger>
                              <TabsTrigger value="og">Open Graph</TabsTrigger>
                              <TabsTrigger value="twitter">Twitter</TabsTrigger>
                              <TabsTrigger value="hreflang">hreflang</TabsTrigger>
                              <TabsTrigger value="schema">Schema.org</TabsTrigger>
                            </TabsList>

                            <TabsContent value="basics" className="space-y-2 text-sm">
                              <KV label="Title" value={r.title} />
                              <KV label="Description" value={r.description} />
                              <KV label="Canonical" value={r.canonical} link />
                              <KV label="Robots" value={r.robots} />
                              <KV label="H1" value={r.h1.join(' | ') || null} />
                            </TabsContent>

                            <TabsContent value="og">
                              <MetaTable data={r.og} prefix="og:" />
                            </TabsContent>
                            <TabsContent value="twitter">
                              <MetaTable data={r.twitter} prefix="twitter:" />
                            </TabsContent>
                            <TabsContent value="hreflang">
                              {r.hreflang.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                  Aucun hreflang trouvé.
                                </p>
                              ) : (
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="text-left border-b">
                                      <th className="py-2 pr-4 font-medium">Lang</th>
                                      <th className="py-2 font-medium">URL</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {r.hreflang.map((h, i) => (
                                      <tr key={i} className="border-b last:border-0">
                                        <td className="py-2 pr-4 font-mono text-xs">{h.lang}</td>
                                        <td className="py-2 font-mono text-xs truncate max-w-md">
                                          {h.href}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </TabsContent>
                            <TabsContent value="schema">
                              {r.jsonLd.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                  Aucune donnée structurée détectée.
                                </p>
                              ) : (
                                <ScrollArea className="h-64 w-full rounded border bg-muted/30">
                                  <pre className="p-3 text-xs">
                                    {JSON.stringify(r.jsonLd, null, 2)}
                                  </pre>
                                </ScrollArea>
                              )}
                            </TabsContent>
                          </Tabs>

                          <div className="pt-1">
                            <a
                              href={r.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              Ouvrir la page <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>
        )}

        {results.length === 0 && !inspect.isPending && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground text-sm">
              Cliquez sur « Analyser » pour démarrer l'inspection des pages publiques.
            </CardContent>
          </Card>
        )}
      </div>
    </AppPageShell>
  );
};

function KV({
  label,
  value,
  link = false,
}: {
  label: string;
  value: string | null;
  link?: boolean;
}) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 items-start">
      <div className="text-xs font-medium text-muted-foreground uppercase pt-0.5">{label}</div>
      {value ? (
        link ? (
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="text-sm break-all hover:underline text-primary"
          >
            {value}
          </a>
        ) : (
          <div className="text-sm break-words">{value}</div>
        )
      ) : (
        <div className="text-sm text-muted-foreground italic">— absent —</div>
      )}
    </div>
  );
}

function MetaTable({ data, prefix }: { data: Record<string, string>; prefix: string }) {
  const entries = Object.entries(data);
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucune balise {prefix}* trouvée.</p>;
  }
  return (
    <table className="w-full text-sm">
      <tbody>
        {entries.map(([k, v]) => (
          <tr key={k} className="border-b last:border-0">
            <td className="py-2 pr-4 font-mono text-xs whitespace-nowrap align-top">
              {prefix}
              {k}
            </td>
            <td className="py-2 break-all">{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default SEOMetaInspector;
