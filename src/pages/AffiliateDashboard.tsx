/**
 * Page: AffiliateDashboard
 * Description: Dashboard principal pour les affiliés
 * Date: 25/10/2025
 */

import { useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useCurrentAffiliate, useAffiliates } from '@/hooks/useAffiliates';
import { useAffiliateLinks } from '@/hooks/useAffiliateLinks';
import { useAffiliateCommissions } from '@/hooks/useAffiliateCommissions';
import { useAffiliateBalance, useAffiliateWithdrawals } from '@/hooks/useAffiliateWithdrawals';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  TrendingUp, 
  DollarSign, 
  MousePointerClick,
  ShoppingCart,
  Link as LinkIcon,
  Plus,
  Copy,
  ExternalLink,
  Wallet,
  CheckCircle2,
  Clock,
  UserPlus,
  BarChart3,
  AlertCircle
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const AffiliateDashboard = () => {
  const { affiliate, loading: affiliateLoading, isAffiliate } = useCurrentAffiliate();
  const { links, loading: linksLoading } = useAffiliateLinks(affiliate?.id);
  const { commissions, stats, loading: commissionsLoading } = useAffiliateCommissions({ 
    affiliate_id: affiliate?.id 
  });
  const { balance, loading: balanceLoading } = useAffiliateBalance(affiliate?.id);
  const { withdrawals, loading: withdrawalsLoading } = useAffiliateWithdrawals({ 
    affiliate_id: affiliate?.id 
  });
  const { registerAffiliate } = useAffiliates();

  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [registrationData, setRegistrationData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    display_name: '',
  });

  const handleRegister = async () => {
    const result = await registerAffiliate(registrationData);
    if (result) {
      setShowRegisterDialog(false);
    }
  };

  // Registration Dialog Component
  const RegistrationDialog = () => (
    <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <UserPlus className="h-5 w-5" />
          Devenir affilié
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Inscription au programme d'affiliation</DialogTitle>
          <DialogDescription>
            Rejoignez notre programme et commencez à gagner des commissions dès aujourd'hui
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="votre@email.com"
              value={registrationData.email}
              onChange={(e) => setRegistrationData({ ...registrationData, email: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Prénom</Label>
              <Input
                id="first_name"
                placeholder="Jean"
                value={registrationData.first_name}
                onChange={(e) => setRegistrationData({ ...registrationData, first_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Nom</Label>
              <Input
                id="last_name"
                placeholder="Dupont"
                value={registrationData.last_name}
                onChange={(e) => setRegistrationData({ ...registrationData, last_name: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="display_name">Nom d'affichage (optionnel)</Label>
            <Input
              id="display_name"
              placeholder="JeanD"
              value={registrationData.display_name}
              onChange={(e) => setRegistrationData({ ...registrationData, display_name: e.target.value })}
            />
          </div>
          <Button onClick={handleRegister} className="w-full gap-2">
            <UserPlus className="h-4 w-4" />
            S'inscrire
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Loading state
  if (affiliateLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 p-6">
            <Skeleton className="h-12 w-64 mb-6" />
            <div className="grid gap-6 md:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  // Not registered state
  if (!isAffiliate) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 p-6">
            <div className="max-w-3xl mx-auto space-y-6">
              <Card className="border-2 border-primary/20">
                <CardHeader className="text-center">
                  <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <TrendingUp className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Programme d'affiliation Payhuk</CardTitle>
                  <CardDescription className="text-base mt-2">
                    Gagnez des commissions en promouvant des produits de qualité
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Avantages */}
                    <div className="grid gap-4 md:grid-cols-3">
                      <Card>
                        <CardContent className="pt-6 text-center">
                          <DollarSign className="h-10 w-10 text-emerald-600 mx-auto mb-3" />
                          <h3 className="font-semibold mb-2">Commissions attractives</h3>
                          <p className="text-sm text-muted-foreground">
                            Jusqu'à 30% de commission sur chaque vente
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6 text-center">
                          <BarChart3 className="h-10 w-10 text-blue-600 mx-auto mb-3" />
                          <h3 className="font-semibold mb-2">Tracking avancé</h3>
                          <p className="text-sm text-muted-foreground">
                            Suivez vos clics, conversions et gains en temps réel
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6 text-center">
                          <Wallet className="h-10 w-10 text-orange-600 mx-auto mb-3" />
                          <h3 className="font-semibold mb-2">Paiements rapides</h3>
                          <p className="text-sm text-muted-foreground">
                            Retraits dès 10 000 XOF via Mobile Money
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Comment ça marche */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Comment ça marche ?</h3>
                      <div className="space-y-3">
                        {[
                          {
                            step: '1',
                            title: 'Inscription gratuite',
                            description: 'Créez votre compte affilié en quelques clics'
                          },
                          {
                            step: '2',
                            title: 'Choisissez vos produits',
                            description: 'Parcourez les produits et créez vos liens personnalisés'
                          },
                          {
                            step: '3',
                            title: 'Partagez vos liens',
                            description: 'Promouvez sur vos réseaux, blog, YouTube, etc.'
                          },
                          {
                            step: '4',
                            title: 'Gagnez des commissions',
                            description: 'Recevez une commission sur chaque vente générée'
                          }
                        ].map((item) => (
                          <div key={item.step} className="flex gap-4 p-4 border rounded-lg">
                            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold flex-shrink-0">
                              {item.step}
                            </div>
                            <div>
                              <h4 className="font-semibold">{item.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="text-center pt-4">
                      <RegistrationDialog />
                      <p className="text-sm text-muted-foreground mt-4">
                        Aucun frais • Aucun engagement • Commencez immédiatement
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  // Registered - Main Dashboard
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Tableau de bord affilié</h1>
              <p className="text-muted-foreground mt-2">
                Bienvenue, {affiliate.display_name || affiliate.email} • Code : <Badge variant="outline" className="ml-2">{affiliate.affiliate_code}</Badge>
              </p>
            </div>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nouveau lien
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-5">
            <Card className="hover-scale">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Clics totaux
                </CardTitle>
                <MousePointerClick className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {affiliate.total_clicks}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Sur tous vos liens
                </p>
              </CardContent>
            </Card>

            <Card className="hover-scale">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Ventes générées
                </CardTitle>
                <ShoppingCart className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  {affiliate.total_sales}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.conversion_rate.toFixed(1)}% de conversion
                </p>
              </CardContent>
            </Card>

            <Card className="hover-scale">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  CA généré
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(affiliate.total_revenue)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Chiffre d'affaires total
                </p>
              </CardContent>
            </Card>

            <Card className="hover-scale">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Gains totaux
                </CardTitle>
                <DollarSign className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(affiliate.total_commission_earned)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Commissions gagnées
                </p>
              </CardContent>
            </Card>

            <Card className="hover-scale border-2 border-primary">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Solde disponible
                </CardTitle>
                <Wallet className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {balanceLoading ? '...' : formatCurrency(balance.available)}
                </div>
                <Button size="sm" className="w-full mt-2" variant="outline">
                  <Wallet className="h-3 w-3 mr-2" />
                  Retirer
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Progression vers le prochain retrait */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Progression vers le retrait minimum</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Minimum : 10 000 XOF</span>
                  <span className="font-semibold">
                    {balanceLoading ? '...' : `${formatCurrency(balance.available)} / 10 000 XOF`}
                  </span>
                </div>
                <Progress value={balanceLoading ? 0 : Math.min((balance.available / 10000) * 100, 100)} />
                {!balanceLoading && balance.available >= 10000 && (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Vous pouvez retirer !</AlertTitle>
                    <AlertDescription>
                      Vous avez atteint le montant minimum de retrait
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tabs Content */}
          <Tabs defaultValue="links" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="links">
                Mes liens ({links.length})
              </TabsTrigger>
              <TabsTrigger value="commissions">
                Commissions
                {commissions.filter(c => c.status === 'pending').length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {commissions.filter(c => c.status === 'pending').length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="withdrawals">
                Retraits ({withdrawals.length})
              </TabsTrigger>
            </TabsList>

            {/* Mes liens */}
            <TabsContent value="links" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Mes liens d'affiliation</CardTitle>
                      <CardDescription>
                        Gérez vos liens et suivez leurs performances
                      </CardDescription>
                    </div>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Créer un lien
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {linksLoading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-20" />
                      ))}
                    </div>
                  ) : links.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <LinkIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>Aucun lien créé</p>
                      <p className="text-sm mt-2">
                        Créez votre premier lien pour commencer à gagner des commissions
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {links.map((link) => {
                        const conversionRate = link.total_clicks > 0 
                          ? ((link.total_sales / link.total_clicks) * 100).toFixed(1) 
                          : '0';
                        
                        return (
                          <Card key={link.id} className="overflow-hidden">
                            <CardContent className="p-4">
                              <div className="space-y-4">
                                {/* Product info */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    {link.product?.image_url && (
                                      <img
                                        src={link.product.image_url}
                                        alt={link.product.name}
                                        className="w-16 h-16 object-cover rounded"
                                      />
                                    )}
                                    <div>
                                      <h4 className="font-semibold">{link.product?.name}</h4>
                                      <p className="text-sm text-muted-foreground">
                                        {link.product?.store?.name}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={async () => {
                                        await navigator.clipboard.writeText(link.full_url);
                                      }}
                                      className="gap-2"
                                    >
                                      <Copy className="h-3 w-3" />
                                      Copier
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => window.open(link.full_url, '_blank')}
                                      className="gap-2"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                      Ouvrir
                                    </Button>
                                  </div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-5 gap-4 pt-4 border-t">
                                  <div>
                                    <p className="text-xs text-muted-foreground">Clics</p>
                                    <p className="text-lg font-semibold">{link.total_clicks}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Ventes</p>
                                    <p className="text-lg font-semibold">{link.total_sales}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">CA généré</p>
                                    <p className="text-lg font-semibold">{formatCurrency(link.total_revenue)}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Commission</p>
                                    <p className="text-lg font-semibold text-orange-600">
                                      {formatCurrency(link.total_commission)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Conversion</p>
                                    <Badge variant={parseFloat(conversionRate) > 2 ? 'default' : 'outline'}>
                                      {conversionRate}%
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Commissions */}
            <TabsContent value="commissions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Historique des commissions</CardTitle>
                  <CardDescription>
                    Suivez l'état de vos commissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {commissionsLoading ? (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-16" />
                      ))}
                    </div>
                  ) : commissions.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>Aucune commission pour le moment</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Produit</TableHead>
                          <TableHead className="text-right">Vente</TableHead>
                          <TableHead className="text-right">Commission</TableHead>
                          <TableHead>Statut</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {commissions.map((commission) => (
                          <TableRow key={commission.id}>
                            <TableCell className="text-sm">
                              {new Date(commission.created_at).toLocaleDateString('fr-FR')}
                            </TableCell>
                            <TableCell>{commission.product?.name}</TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatCurrency(commission.order_total)}
                            </TableCell>
                            <TableCell className="text-right font-bold text-orange-600">
                              {formatCurrency(commission.commission_amount)}
                            </TableCell>
                            <TableCell>
                              {commission.status === 'pending' && (
                                <Badge variant="outline" className="gap-1">
                                  <Clock className="h-3 w-3" />
                                  En attente
                                </Badge>
                              )}
                              {commission.status === 'approved' && (
                                <Badge variant="secondary" className="gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Approuvé
                                </Badge>
                              )}
                              {commission.status === 'paid' && (
                                <Badge className="gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Payé
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Retraits */}
            <TabsContent value="withdrawals" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Demandes de retrait</CardTitle>
                  <CardDescription>
                    Historique de vos retraits
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {withdrawalsLoading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-16" />
                      ))}
                    </div>
                  ) : withdrawals.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Wallet className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>Aucun retrait demandé</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Montant</TableHead>
                          <TableHead>Méthode</TableHead>
                          <TableHead>Statut</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {withdrawals.map((withdrawal) => (
                          <TableRow key={withdrawal.id}>
                            <TableCell className="text-sm">
                              {new Date(withdrawal.created_at).toLocaleDateString('fr-FR')}
                            </TableCell>
                            <TableCell className="text-right font-bold">
                              {formatCurrency(withdrawal.amount)}
                            </TableCell>
                            <TableCell className="capitalize">
                              {withdrawal.payment_method.replace('_', ' ')}
                            </TableCell>
                            <TableCell>
                              {withdrawal.status === 'pending' && (
                                <Badge variant="outline">En attente</Badge>
                              )}
                              {withdrawal.status === 'processing' && (
                                <Badge variant="secondary">En cours</Badge>
                              )}
                              {withdrawal.status === 'completed' && (
                                <Badge className="gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Complété
                                </Badge>
                              )}
                              {withdrawal.status === 'failed' && (
                                <Badge variant="destructive">Échoué</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AffiliateDashboard;

