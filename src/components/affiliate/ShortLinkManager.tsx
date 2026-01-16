/**
 * Component: ShortLinkManager
 * Description: Gestion des liens courts pour un lien d'affiliation
 * Date: 31/01/2025
 */

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Copy, Link as LinkIcon, Plus, Trash2, Loader2, CheckCircle2, XCircle, BarChart3, TrendingUp, Lightbulb, Target } from '@/components/icons';
import { useAffiliateShortLinks } from '@/hooks/useAffiliateShortLinks';
import { useAffiliateShortLinksInsights } from '@/hooks/useAffiliateShortLinksAnalytics';
import { CreateShortLinkForm, ShortLinkExpirationRule } from '@/types/affiliate';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShortLinkManagerProps {
  affiliateLinkId: string;
  fullUrl: string;
}

export const ShortLinkManager = ({ affiliateLinkId, fullUrl: _fullUrl }: ShortLinkManagerProps) => {
  const { shortLinks, loading, createShortLink, deleteShortLink, toggleShortLink, refetch: _refetch } = useAffiliateShortLinks(affiliateLinkId);
  const { insights, isLoading: insightsLoading } = useAffiliateShortLinksInsights(affiliateLinkId);
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [customAlias, setCustomAlias] = useState('');
  const [codeLength, setCodeLength] = useState(6);
  const [activeTab, setActiveTab] = useState('links');

  // État pour les règles d'expiration flexible
  const [expirationType, setExpirationType] = useState<'none' | 'fixed_date' | 'duration' | 'clicks_limit' | 'combined'>('none');
  const [fixedExpirationDate, setFixedExpirationDate] = useState<Date>();
  const [durationDays, setDurationDays] = useState<number>(7);
  const [durationHours, setDurationHours] = useState<number>(0);
  const [maxClicks, setMaxClicks] = useState<number>(100);
  const [primaryCondition, setPrimaryCondition] = useState<'date' | 'clicks' | 'duration'>('date');
  const [secondaryCondition, setSecondaryCondition] = useState<'date' | 'clicks' | 'duration'>('clicks');

  const handleCreateShortLink = useCallback(async () => {
    setIsCreating(true);
    try {
      // Construire la règle d'expiration
      let expirationRule: ShortLinkExpirationRule | undefined;

      if (expirationType !== 'none') {
        expirationRule = {
          type: expirationType,
          fixed_expiration_date: fixedExpirationDate?.toISOString(),
          duration_days: durationDays > 0 ? durationDays : undefined,
          duration_hours: durationHours > 0 ? durationHours : undefined,
          max_clicks: maxClicks > 0 ? maxClicks : undefined,
          primary_condition: expirationType === 'combined' ? primaryCondition : undefined,
          secondary_condition: expirationType === 'combined' ? secondaryCondition : undefined,
        };
      }

      const formData: CreateShortLinkForm = {
        affiliate_link_id: affiliateLinkId,
        custom_alias: customAlias.trim() || undefined,
        short_code_length: codeLength,
        expiration_rule: expirationRule,
      };

      const result = await createShortLink(formData);
      if (result) {
        // Reset form
        setCustomAlias('');
        setExpirationType('none');
        setFixedExpirationDate(undefined);
        setDurationDays(7);
        setDurationHours(0);
        setMaxClicks(100);
        setIsDialogOpen(false);
      }
    } finally {
      setIsCreating(false);
    }
  }, [
    affiliateLinkId, customAlias, codeLength, createShortLink,
    expirationType, fixedExpirationDate, durationDays, durationHours, maxClicks,
    primaryCondition, secondaryCondition
  ]);

  const handleCopyShortLink = useCallback(async (shortCode: string) => {
    const shortUrl = `${window.location.origin}/aff/${shortCode}`;
    await navigator.clipboard.writeText(shortUrl);
    toast({
      title: 'Lien court copié !',
      description: `Le lien court a été copié dans le presse-papier`,
    });
  }, [toast]);

  const handleDelete = useCallback(async (shortLinkId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce lien court ?')) {
      await deleteShortLink(shortLinkId);
    }
  }, [deleteShortLink]);

  const handleToggle = useCallback(async (shortLinkId: string, isActive: boolean) => {
    await toggleShortLink(shortLinkId, !isActive);
  }, [toggleShortLink]);

  const getShortUrl = (shortCode: string) => `${window.location.origin}/aff/${shortCode}`;

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="links" className="gap-2">
              <LinkIcon className="h-3.5 w-3.5" />
              Liens
              {shortLinks.length > 0 && (
                <Badge variant="secondary" className="text-xs ml-1">
                  {shortLinks.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-3.5 w-3.5" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="insights" className="gap-2">
              <Lightbulb className="h-3.5 w-3.5" />
              Insights
              {insights?.suggestions?.total_suggestions > 0 && (
                <Badge variant="destructive" className="text-xs ml-1">
                  {insights.suggestions.total_suggestions}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-2">
                  <Plus className="h-3.5 w-3.5" />
                  Créer un lien court
                </Button>
              </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Créer un lien court</DialogTitle>
              <DialogDescription>
                Générez un lien court pour partager plus facilement votre lien d'affiliation
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="custom_alias">Alias personnalisé (optionnel)</Label>
                <Input
                  id="custom_alias"
                  placeholder="ex: youtube, facebook"
                  value={customAlias}
                  onChange={(e) => setCustomAlias(e.target.value)}
                  maxLength={20}
                />
                <p className="text-xs text-muted-foreground">
                  Si laissé vide, un code aléatoire sera généré
                </p>
              </div>
              
              {!customAlias.trim() && (
                <div className="space-y-2">
                  <Label htmlFor="code_length">Longueur du code</Label>
                  <Input
                    id="code_length"
                    type="number"
                    min="4"
                    max="10"
                    value={codeLength}
                    onChange={(e) => setCodeLength(Math.max(4, Math.min(10, parseInt(e.target.value) || 6)))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Entre 4 et 10 caractères (défaut: 6)
                  </p>
                </div>
              )}

              {/* Options d'expiration flexible */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Expiration du lien</Label>
                  <RadioGroup value={expirationType} onValueChange={(value) => setExpirationType(value as 'none' | 'fixed_date' | 'duration' | 'clicks_limit' | 'combined')}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="none" id="none" />
                      <Label htmlFor="none" className="text-sm">Pas d'expiration</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="fixed_date" id="fixed_date" />
                      <Label htmlFor="fixed_date" className="text-sm">Date fixe</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="duration" id="duration" />
                      <Label htmlFor="duration" className="text-sm">Durée</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="clicks_limit" id="clicks_limit" />
                      <Label htmlFor="clicks_limit" className="text-sm">Limite de clics</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="combined" id="combined" />
                      <Label htmlFor="combined" className="text-sm">Conditions combinées</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Configuration selon le type d'expiration */}
                {expirationType === 'fixed_date' && (
                  <div className="space-y-2">
                    <Label>Date d'expiration</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !fixedExpirationDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {fixedExpirationDate ? (
                            format(fixedExpirationDate, "PPP", { locale: fr })
                          ) : (
                            <span>Choisir une date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={fixedExpirationDate}
                          onSelect={setFixedExpirationDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}

                {expirationType === 'duration' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="duration_days">Jours</Label>
                      <Input
                        id="duration_days"
                        type="number"
                        min="0"
                        max="365"
                        value={durationDays}
                        onChange={(e) => setDurationDays(Math.max(0, parseInt(e.target.value) || 0))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="duration_hours">Heures</Label>
                      <Input
                        id="duration_hours"
                        type="number"
                        min="0"
                        max="23"
                        value={durationHours}
                        onChange={(e) => setDurationHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                      />
                    </div>
                  </div>
                )}

                {expirationType === 'clicks_limit' && (
                  <div className="space-y-2">
                    <Label htmlFor="max_clicks">Nombre maximum de clics</Label>
                    <Input
                      id="max_clicks"
                      type="number"
                      min="1"
                      max="10000"
                      value={maxClicks}
                      onChange={(e) => setMaxClicks(Math.max(1, parseInt(e.target.value) || 100))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Le lien expirera après ce nombre de clics
                    </p>
                  </div>
                )}

                {expirationType === 'combined' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Condition principale</Label>
                      <RadioGroup value={primaryCondition} onValueChange={(value) => setPrimaryCondition(value as 'date' | 'clicks' | 'duration')}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="date" id="primary_date" />
                          <Label htmlFor="primary_date" className="text-sm">Date fixe</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="duration" id="primary_duration" />
                          <Label htmlFor="primary_duration" className="text-sm">Durée</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="clicks" id="primary_clicks" />
                          <Label htmlFor="primary_clicks" className="text-sm">Clics max</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-2">
                      <Label>Condition secondaire</Label>
                      <RadioGroup value={secondaryCondition} onValueChange={(value) => setSecondaryCondition(value as 'date' | 'clicks' | 'duration')}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="date" id="secondary_date" />
                          <Label htmlFor="secondary_date" className="text-sm">Date fixe</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="duration" id="secondary_duration" />
                          <Label htmlFor="secondary_duration" className="text-sm">Durée</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="clicks" id="secondary_clicks" />
                          <Label htmlFor="secondary_clicks" className="text-sm">Clics max</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Afficher les champs selon les conditions sélectionnées */}
                    {(primaryCondition === 'date' || secondaryCondition === 'date') && (
                      <div className="space-y-2">
                        <Label>Date d'expiration</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !fixedExpirationDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {fixedExpirationDate ? (
                                format(fixedExpirationDate, "PPP", { locale: fr })
                              ) : (
                                <span>Choisir une date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={fixedExpirationDate}
                              onSelect={setFixedExpirationDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    )}

                    {(primaryCondition === 'duration' || secondaryCondition === 'duration') && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="combined_duration_days">Jours</Label>
                          <Input
                            id="combined_duration_days"
                            type="number"
                            min="0"
                            max="365"
                            value={durationDays}
                            onChange={(e) => setDurationDays(Math.max(0, parseInt(e.target.value) || 0))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="combined_duration_hours">Heures</Label>
                          <Input
                            id="combined_duration_hours"
                            type="number"
                            min="0"
                            max="23"
                            value={durationHours}
                            onChange={(e) => setDurationHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                          />
                        </div>
                      </div>
                    )}

                    {(primaryCondition === 'clicks' || secondaryCondition === 'clicks') && (
                      <div className="space-y-2">
                        <Label htmlFor="combined_max_clicks">Nombre maximum de clics</Label>
                        <Input
                          id="combined_max_clicks"
                          type="number"
                          min="1"
                          max="10000"
                          value={maxClicks}
                          onChange={(e) => setMaxClicks(Math.max(1, parseInt(e.target.value) || 100))}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-2">
                <Button
                  onClick={handleCreateShortLink}
                  disabled={isCreating}
                  className="w-full gap-2"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Créer le lien court
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>

        {/* Onglet Liens */}
        <TabsContent value="links" className="space-y-3 mt-0">
          {renderLinksTab()}
        </TabsContent>

        {/* Onglet Analytics */}
        <TabsContent value="analytics" className="space-y-4 mt-0">
          {renderAnalyticsTab()}
        </TabsContent>

        {/* Onglet Insights */}
        <TabsContent value="insights" className="space-y-4 mt-0">
          {renderInsightsTab()}
        </TabsContent>
      </Tabs>
    </div>
  );

  // Fonction pour rendre l'onglet Liens
  function renderLinksTab() {
    return (
      <>
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : shortLinks.length === 0 ? (
          <div className="text-center py-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              Aucun lien court créé. Créez-en un pour partager plus facilement votre lien.
            </p>
            <p className="text-xs text-muted-foreground/70">
              💡 Les liens courts permettent de partager vos liens d'affiliation de manière plus simple et professionnelle.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {shortLinks.map((shortLink) => (
              <div
                key={shortLink.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-card/50 hover:bg-card transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-sm font-mono text-primary">
                      {getShortUrl(shortLink.short_code)}
                    </code>
                    {shortLink.is_active ? (
                      <Badge variant="default" className="text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Actif
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        <XCircle className="h-3 w-3 mr-1" />
                        Inactif
                      </Badge>
                    )}
                    {shortLink.custom_alias && (
                      <Badge variant="outline" className="text-xs">
                        {shortLink.custom_alias}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{shortLink.total_clicks} clics</span>
                    {shortLink.expires_at && (
                      <span>
                        Expire: {new Date(shortLink.expires_at).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopyShortLink(shortLink.short_code)}
                    className="h-8 w-8 p-0"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggle(shortLink.id, shortLink.is_active)}
                    className="h-8 w-8 p-0"
                  >
                    {shortLink.is_active ? (
                      <XCircle className="h-3.5 w-3.5" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(shortLink.id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </>
    );
  }

  // Fonction pour rendre l'onglet Analytics
  function renderAnalyticsTab() {
    if (insightsLoading || !insights?.analytics) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }

    const { analytics } = insights;

    return (
      <div className="space-y-4">
        {/* Métriques principales */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Liens</CardTitle>
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.summary.total_links}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.summary.active_links} actifs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clics</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.summary.total_clicks}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.summary.avg_clicks_per_link} moy/liens
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux Conversion</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.summary.conversion_rate}%</div>
              <p className="text-xs text-muted-foreground">
                Clics convertis
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Performant</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.top_performing_links[0]?.clicks || 0}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {analytics.top_performing_links[0]?.short_code || 'N/A'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Top liens performants */}
        {analytics.top_performing_links.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Liens Performants</CardTitle>
              <CardDescription>
                Vos liens les plus populaires cette période
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.top_performing_links.map((link, index) => (
                  <div key={link.short_code} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{index + 1}</Badge>
                      <div>
                        <code className="text-sm font-mono">{link.short_code}</code>
                        {link.custom_alias && (
                          <p className="text-xs text-muted-foreground">{link.custom_alias}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{link.clicks} clics</div>
                      {link.last_used_at && (
                        <p className="text-xs text-muted-foreground">
                          Dernier: {new Date(link.last_used_at).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Fonction pour rendre l'onglet Insights
  function renderInsightsTab() {
    if (insightsLoading || !insights?.suggestions) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }

    const { suggestions } = insights;

    if (suggestions.total_suggestions === 0) {
      return (
        <div className="text-center py-8 space-y-3">
          <Lightbulb className="h-12 w-12 text-muted-foreground/50 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold">Excellentes performances !</h3>
            <p className="text-sm text-muted-foreground">
              Vos liens courts fonctionnent parfaitement. Aucune optimisation nécessaire pour le moment.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {suggestions.suggestions.map((suggestion, index) => (
          <Card key={index} className={`border-l-4 ${
            suggestion.priority === 'high' ? 'border-l-red-500' :
            suggestion.priority === 'medium' ? 'border-l-yellow-500' : 'border-l-blue-500'
          }`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Lightbulb className={`h-5 w-5 ${
                    suggestion.priority === 'high' ? 'text-red-500' :
                    suggestion.priority === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                  }`} />
                  <CardTitle className="text-base">{suggestion.title}</CardTitle>
                </div>
                <Badge variant={
                  suggestion.priority === 'high' ? 'destructive' :
                  suggestion.priority === 'medium' ? 'default' : 'secondary'
                }>
                  {suggestion.priority === 'high' ? 'Urgent' :
                   suggestion.priority === 'medium' ? 'Important' : 'Info'}
                </Badge>
              </div>
              <CardDescription>{suggestion.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-1">💡 Suggestion :</p>
                  <p className="text-sm text-muted-foreground">{suggestion.action_suggestion}</p>
                </div>

                {suggestion.affected_links && suggestion.affected_links.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Liens concernés :</p>
                    <div className="space-y-1">
                      {suggestion.affected_links.map((link: { short_code: string; clicks: number }, linkIndex: number) => (
                        <div key={linkIndex} className="flex items-center justify-between p-2 bg-card rounded border">
                          <code className="text-xs font-mono">{link.short_code}</code>
                          <span className="text-xs text-muted-foreground">
                            {link.clicks} clics
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
};







