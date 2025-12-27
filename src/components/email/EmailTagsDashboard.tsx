/**
 * Email Tags Dashboard
 * Dashboard complet pour la gestion et le monitoring des tags email
 * Date: 2 Février 2025
 */

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { emailTagService, type TagCategory } from '@/lib/email/email-tag-service';
import { emailAnalyticsService } from '@/lib/email/email-analytics-service';
import { Loader2, Trash2, RefreshCw, TrendingUp, Users, Tag, AlertTriangle, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

interface TagStats {
  tag: string;
  category: TagCategory;
  user_count: number;
  last_used_at: string;
}

interface ExpiringTag {
  user_id: string;
  store_id: string;
  tag: string;
  category: string;
  expires_at: string;
  days_until_expiry: number;
}

interface CronJobStatus {
  job_name: string;
  schedule: string;
  command: string;
  active: boolean;
  last_run: string | null;
  next_run: string | null;
}

export function EmailTagsDashboard({ storeId }: { storeId: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState<TagStats[]>([]);
  const [expiringTags, setExpiringTags] = useState<ExpiringTag[]>([]);
  const [cronJobs, setCronJobs] = useState<CronJobStatus[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<TagCategory | 'all'>('all');
  const [cleanupDays, setCleanupDays] = useState(90);

  // Animations au scroll
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const tabsRef = useScrollAnimation<HTMLDivElement>();

  // Charger les données
  const loadData = async () => {
    setLoading(true);
    try {
      // Charger les tags
      const tagStats = await emailTagService.getStoreTags(
        storeId,
        selectedCategory === 'all' ? undefined : selectedCategory
      );
      setTags(tagStats as TagStats[]);

      // Charger les tags expirant
      const expiring = await emailTagService.getExpiringTags(storeId, 7);
      setExpiringTags(expiring);

      // Charger l'état des cron jobs via fonction SQL safe
      try {
        const { data: cronData, error: cronError } = await supabase.rpc(
          'get_email_tags_cron_jobs_status_safe'
        );
        if (cronError) {
          logger.error('Error fetching cron jobs status', { error: cronError });
        } else if (cronData) {
          setCronJobs(cronData as CronJobStatus[]);
        }
      } catch ( _error: any) {
        logger.error('Error fetching cron jobs status', { error });
      }
    } catch ( _error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors du chargement des données',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [storeId, selectedCategory]);

  // Nettoyer les tags expirés
  const handleCleanupExpired = async () => {
    setLoading(true);
    try {
      const result = await emailTagService.cleanupExpiredTags();
      toast({
        title: 'Nettoyage terminé',
        description: `${result.deleted_count} tags expirés ont été supprimés`,
      });
      await loadData();
    } catch ( _error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors du nettoyage',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Nettoyer les tags non utilisés
  const handleCleanupUnused = async () => {
    setLoading(true);
    try {
      const result = await emailTagService.cleanupUnusedTags(storeId, cleanupDays);
      toast({
        title: 'Nettoyage terminé',
        description: `${result.deleted_count} tags non utilisés ont été supprimés`,
      });
      await loadData();
    } catch ( _error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors du nettoyage',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Toggle cron job via fonction SQL safe
  const handleToggleCronJob = async (jobName: string, active: boolean) => {
    try {
      const { error } = await supabase.rpc('toggle_email_tags_cron_job_safe', {
        p_job_name: jobName,
        p_active: !active,
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Cron job mis à jour',
        description: `Le cron job "${jobName}" a été ${!active ? 'activé' : 'désactivé'}`,
      });

      await loadData();
    } catch ( _error: any) {
      logger.error('Error toggling cron job', { error, jobName });
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la mise à jour du cron job',
        variant: 'destructive',
      });
    }
  };

  const  categoryColors: Record<TagCategory, string> = {
    behavior: 'bg-blue-100 text-blue-800',
    segment: 'bg-purple-100 text-purple-800',
    custom: 'bg-gray-100 text-gray-800',
    system: 'bg-orange-100 text-orange-800',
  };

  // Calculer les statistiques
  const stats = useMemo(() => {
    const totalTags = tags.length;
    const totalUsers = tags.reduce((sum, t) => sum + t.user_count, 0);
    const expiringCount = expiringTags.length;
    const activeCronJobs = cronJobs.filter((j) => j.active).length;
    const totalCronJobs = cronJobs.length;

    return {
      totalTags,
      totalUsers,
      expiringCount,
      activeCronJobs,
      totalCronJobs,
    };
  }, [tags, expiringTags, cronJobs]);

  return (
    <>
      {/* Header avec animation - Style Inventaire */}
      <div ref={headerRef} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
        <div>
          <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
            <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
              <Mail className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400" aria-hidden="true" />
            </div>
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Gestion des Tags Email
            </span>
          </h1>
          <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
            Gérez et surveillez les tags utilisateurs pour la segmentation
          </p>
        </div>
        <Button 
          onClick={loadData} 
          disabled={loading} 
          size="sm"
          className="min-h-[44px] h-9 sm:h-10 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-xs sm:text-sm"
        >
          <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Rafraîchir</span>
          <span className="sm:hidden">Raf.</span>
        </Button>
      </div>

      {/* Stats Cards - Style Inventaire (Purple-Pink Gradient) */}
      <div 
        ref={statsRef}
        className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
      >
        {[
          { label: 'Total Tags', value: stats.totalTags, icon: Tag, color: "from-purple-600 to-pink-600" },
          { label: 'Utilisateurs Taggués', value: stats.totalUsers, icon: Users, color: "from-blue-600 to-cyan-600" },
          { label: 'Tags Expirant', value: stats.expiringCount, icon: AlertTriangle, color: "from-yellow-600 to-orange-600" },
          { label: 'Cron Jobs Actifs', value: `${stats.activeCronJobs}/${stats.totalCronJobs}`, icon: TrendingUp, color: "from-green-600 to-emerald-600" },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="pb-1.5 sm:pb-2 md:pb-3 p-2.5 sm:p-3 md:p-4">
                <CardTitle className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium text-muted-foreground flex items-center gap-1 sm:gap-1.5 md:gap-2">
                  <Icon className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4" />
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2.5 sm:p-3 md:p-4 pt-0">
                <div className={`text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent break-words`}>
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Contenu principal */}
      <div ref={tabsRef} className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
        <Tabs defaultValue="tags" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tags">Tags</TabsTrigger>
          <TabsTrigger value="expiring">Tags Expirant</TabsTrigger>
          <TabsTrigger value="cleanup">Nettoyage</TabsTrigger>
          <TabsTrigger value="cron">Cron Jobs</TabsTrigger>
        </TabsList>

        {/* Onglet Tags */}
        <TabsContent value="tags" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Liste des Tags</CardTitle>
                  <CardDescription>Tous les tags utilisés dans votre store</CardDescription>
                </div>
                <Select
                  value={selectedCategory}
                  onValueChange={(value) => setSelectedCategory(value as TagCategory | 'all')}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrer par catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les catégories</SelectItem>
                    <SelectItem value="behavior">Comportement</SelectItem>
                    <SelectItem value="segment">Segmentation</SelectItem>
                    <SelectItem value="custom">Personnalisé</SelectItem>
                    <SelectItem value="system">Système</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : tags.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucun tag trouvé</p>
              ) : (
                <div className="space-y-2">
                  {tags.map((tag) => (
                    <div
                      key={`${tag.tag}-${tag.category}`}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Badge className={categoryColors[tag.category]}>{tag.category}</Badge>
                        <span className="font-medium">{tag.tag}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{tag.user_count} utilisateurs</span>
                        <span>
                          Dernière utilisation:{' '}
                          {new Date(tag.last_used_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Tags Expirant */}
        <TabsContent value="expiring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tags Expirant Bientôt</CardTitle>
              <CardDescription>
                Tags qui vont expirer dans les 7 prochains jours
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : expiringTags.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucun tag n'expire dans les 7 prochains jours
                </p>
              ) : (
                <div className="space-y-2">
                  {expiringTags.map((tag, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Badge className={categoryColors[tag.category as TagCategory]}>
                          {tag.category}
                        </Badge>
                        <span className="font-medium">{tag.tag}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <Badge variant={tag.days_until_expiry <= 3 ? 'destructive' : 'secondary'}>
                          {tag.days_until_expiry} jour{tag.days_until_expiry > 1 ? 's' : ''}
                        </Badge>
                        <span className="text-muted-foreground">
                          Expire le {new Date(tag.expires_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Nettoyage */}
        <TabsContent value="cleanup" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Nettoyer les Tags Expirés</CardTitle>
                <CardDescription>
                  Supprime tous les tags dont la date d'expiration est passée
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleCleanupExpired}
                  disabled={loading}
                  variant="destructive"
                  className="w-full"
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Nettoyer les Tags Expirés
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Nettoyer les Tags Non Utilisés</CardTitle>
                <CardDescription>
                  Supprime les tags qui n'ont pas été utilisés depuis X jours
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cleanup-days">Jours d'inactivité</Label>
                  <Input
                    id="cleanup-days"
                    type="number"
                    min="1"
                    value={cleanupDays}
                    onChange={(e) => setCleanupDays(parseInt(e.target.value) || 90)}
                  />
                </div>
                <Button
                  onClick={handleCleanupUnused}
                  disabled={loading}
                  variant="destructive"
                  className="w-full"
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Nettoyer les Tags Non Utilisés
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Onglet Cron Jobs */}
        <TabsContent value="cron" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tâches Automatiques (Cron Jobs)</CardTitle>
              <CardDescription>
                Gérer les tâches de nettoyage automatique programmées
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : cronJobs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucun cron job configuré
                </p>
              ) : (
                <div className="space-y-4">
                  {cronJobs.map((job) => (
                    <div
                      key={job.job_name}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{job.job_name}</span>
                          <Badge variant={job.active ? 'default' : 'secondary'}>
                            {job.active ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Planification: {job.schedule}
                        </p>
                        {job.last_run && (
                          <p className="text-xs text-muted-foreground">
                            Dernière exécution:{' '}
                            {new Date(job.last_run).toLocaleString('fr-FR')}
                          </p>
                        )}
                        {job.next_run && (
                          <p className="text-xs text-muted-foreground">
                            Prochaine exécution:{' '}
                            {new Date(job.next_run).toLocaleString('fr-FR')}
                          </p>
                        )}
                      </div>
                      <Button
                        variant={job.active ? 'outline' : 'default'}
                        size="sm"
                        onClick={() => handleToggleCronJob(job.job_name, job.active)}
                      >
                        {job.active ? 'Désactiver' : 'Activer'}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </>
  );
}







