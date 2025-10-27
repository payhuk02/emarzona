/**
 * Page de gestion d'affiliation pour un cours
 * Permet de créer et gérer les liens affiliés
 * Date : 27 octobre 2025
 */

import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Copy,
  ExternalLink,
  TrendingUp,
  Users,
  MousePointerClick,
  DollarSign,
  Plus,
  Check,
  AlertCircle,
  ArrowLeft,
  Clock,
  BarChart3,
} from 'lucide-react';
import { useCourseDetail } from '@/hooks/courses/useCourseDetail';
import { useIsAffiliateEnabled, useCalculateCommission } from '@/hooks/courses/useCourseAffiliates';
import {
  useMyAffiliateLinks,
  useCreateAffiliateLink,
  useMyAffiliateCourseStats,
  generateAffiliateUrl,
} from '@/hooks/courses/useAffiliateLinks';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const CourseAffiliate = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: courseData, isLoading: courseLoading } = useCourseDetail(slug || '');
  const { isEnabled: affiliateEnabled, settings: affiliateSettings } = useIsAffiliateEnabled(
    courseData?.product?.id || ''
  );
  const { commission: affiliateCommission } = useCalculateCommission(
    courseData?.product?.id || '',
    courseData?.product?.price || 0
  );

  const { data: myLinks, isLoading: linksLoading } = useMyAffiliateLinks(
    courseData?.product?.id || ''
  );
  const { data: stats } = useMyAffiliateCourseStats(courseData?.product?.id || '');
  const createLink = useCreateAffiliateLink();

  const [customName, setCustomName] = useState('');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Connexion requise</AlertTitle>
          <AlertDescription>
            Vous devez être connecté pour devenir affilié.
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/auth/login')} className="mt-4">
          Se connecter
        </Button>
      </div>
    );
  }

  if (courseLoading || linksLoading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!courseData || !courseData.product) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Cours introuvable</AlertTitle>
          <AlertDescription>
            Le cours que vous recherchez n'existe pas.
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/courses')} className="mt-4">
          Retour aux cours
        </Button>
      </div>
    );
  }

  if (!affiliateEnabled || !affiliateSettings) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Programme non disponible</AlertTitle>
          <AlertDescription>
            Le programme d'affiliation n'est pas activé pour ce cours.
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate(`/courses/${slug}`)} className="mt-4">
          Retour au cours
        </Button>
      </div>
    );
  }

  const { product, course } = courseData;

  const handleCreateLink = () => {
    createLink.mutate({
      productId: product.id,
      customName: customName || undefined,
    });
    setCustomName('');
  };

  const handleCopyLink = (linkCode: string) => {
    const url = generateAffiliateUrl(product.slug, linkCode);
    navigator.clipboard.writeText(url);
    setCopiedLink(linkCode);
    toast({
      title: '✅ Lien copié !',
      description: 'Le lien a été copié dans votre presse-papier',
    });
    setTimeout(() => setCopiedLink(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="container mx-auto py-12 px-4">
          <Button
            variant="ghost"
            onClick={() => navigate(`/courses/${slug}`)}
            className="mb-4 text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au cours
          </Button>

          <h1 className="text-4xl font-bold mb-2">Programme d'Affiliation</h1>
          <p className="text-xl text-green-100 mb-4">{product.name}</p>

          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              <span>
                Commission : {affiliateSettings.commission_type === 'percentage'
                  ? `${affiliateSettings.commission_rate}% (≈ ${affiliateCommission.toFixed(0)} XOF)`
                  : `${affiliateSettings.fixed_commission_amount} XOF`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>Cookie : {affiliateSettings.cookie_duration_days} jours</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto py-8 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stats Cards */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Clics
                </CardTitle>
                <MousePointerClick className="w-4 h-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.total_clicks || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Conversions
                </CardTitle>
                <Users className="w-4 h-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.total_conversions || 0}</div>
                {stats && stats.total_clicks > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Taux : {stats.conversion_rate}%
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Commission Totale
                </CardTitle>
                <DollarSign className="w-4 h-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(stats?.total_commission || 0).toLocaleString()} XOF
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  En attente
                </CardTitle>
                <BarChart3 className="w-4 h-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(stats?.pending_commission || 0).toLocaleString()} XOF
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Create Link */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Créer un nouveau lien
                </CardTitle>
                <CardDescription>
                  Générez un lien unique pour promouvoir ce cours
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customName">Nom personnalisé (optionnel)</Label>
                  <Input
                    id="customName"
                    placeholder="Ex: Blog, YouTube, Instagram..."
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Donnez un nom pour identifier la source de vos clics
                  </p>
                </div>

                <Button
                  onClick={handleCreateLink}
                  disabled={createLink.isPending}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {createLink.isPending ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                      Création...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Créer le lien
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
              <CardHeader>
                <CardTitle className="text-lg">💡 Conseils de promotion</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>✅ <strong>Blog/Articles :</strong> Créez un lien "blog" pour vos articles</p>
                <p>✅ <strong>Réseaux sociaux :</strong> Un lien par plateforme (YouTube, Instagram, Twitter)</p>
                <p>✅ <strong>Email :</strong> Utilisez un lien dédié pour vos newsletters</p>
                <p>✅ <strong>Analyse :</strong> Comparez les performances de chaque source</p>
              </CardContent>
            </Card>
          </div>

          {/* My Links */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Mes liens ({myLinks?.length || 0})</CardTitle>
                <CardDescription>
                  Gérez vos liens d'affiliation
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!myLinks || myLinks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Aucun lien créé</p>
                    <p className="text-xs mt-1">Créez votre premier lien pour commencer</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myLinks.map((link) => {
                      const url = generateAffiliateUrl(product.slug, link.affiliate_code);
                      const isCopied = copiedLink === link.affiliate_code;

                      return (
                        <Card key={link.id} className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-semibold text-sm">
                                  {link.custom_name || `Lien ${link.affiliate_code.substring(0, 8)}`}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Code : {link.affiliate_code}
                                </p>
                              </div>
                              <Badge variant={link.status === 'active' ? 'default' : 'secondary'}>
                                {link.status === 'active' ? 'Actif' : 'En attente'}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-muted-foreground">Clics :</span>
                                <span className="font-semibold ml-1">{link.clicks_count}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Conversions :</span>
                                <span className="font-semibold ml-1">{link.conversions_count}</span>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCopyLink(link.affiliate_code)}
                                className="flex-1"
                              >
                                {isCopied ? (
                                  <>
                                    <Check className="w-3 h-3 mr-1" />
                                    Copié !
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3 mr-1" />
                                    Copier
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(url, '_blank')}
                              >
                                <ExternalLink className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseAffiliate;

