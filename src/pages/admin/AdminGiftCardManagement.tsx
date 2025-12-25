/**
 * Interface Admin - Gestion des Cartes Cadeaux
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useStore } from '@/hooks/useStore';
import {
  useGiftCards,
  useCreateGiftCard,
  useUpdateGiftCard,
  useStoreGiftCardTransactions,
} from '@/hooks/giftCards/useGiftCards';
import type { GiftCard } from '@/types/giftCards';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Gift, Copy, Edit, TrendingUp, DollarSign, Users, X } from 'lucide-react';
import { GiftCardStatus } from '@/types/giftCards';
import { formatCurrency } from '@/lib/utils';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminGiftCardManagement() {
  const isMobile = useIsMobile();
  const { store } = useStore();

  // Alias pour compatibilité
  const currentStore = store;
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: giftCards = [], isLoading } = useGiftCards(currentStore?.id, {
    status: statusFilter !== 'all' ? statusFilter : undefined,
    search: searchTerm || undefined,
  });

  const { data: transactions = [] } = useStoreGiftCardTransactions(currentStore?.id);

  // Stats calculées
  const stats = {
    total: giftCards.length,
    active: giftCards.filter(gc => gc.status === 'active').length,
    redeemed: giftCards.filter(gc => gc.status === 'redeemed').length,
    expired: giftCards.filter(gc => gc.status === 'expired').length,
    totalValue: giftCards.reduce((sum, gc) => sum + gc.initial_amount, 0),
    remainingBalance: giftCards.reduce((sum, gc) => sum + gc.current_balance, 0),
    totalRedeemed: giftCards.reduce((sum, gc) => sum + (gc.initial_amount - gc.current_balance), 0),
  };

  const getStatusBadge = (status: GiftCardStatus) => {
    const variants: Record<GiftCardStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      redeemed: 'secondary',
      expired: 'destructive',
      cancelled: 'outline',
      pending: 'outline',
    };

    const labels: Record<GiftCardStatus, string> = {
      active: 'Active',
      redeemed: 'Utilisée',
      expired: 'Expirée',
      cancelled: 'Annulée',
      pending: 'En attente',
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Code copié',
      description: 'Le code de la carte cadeau a été copié dans le presse-papiers.',
    });
  };

  // Refs for animations
  const headerRef = useScrollAnimation<HTMLDivElement>();

  if (!currentStore) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full overflow-x-hidden">
          <AppSidebar />
          <main className="flex-1 overflow-auto pb-16 md:pb-0">
            <div className="container mx-auto p-3 sm:p-4 lg:p-6">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Veuillez sélectionner un store.
                  </p>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-x-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-auto pb-16 md:pb-0">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Header - Responsive & Animated */}
            <div
              ref={headerRef}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
            >
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold flex items-center gap-2 mb-1 sm:mb-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
                    <Gift
                      className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400"
                      aria-hidden="true"
                    />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Cartes Cadeaux
                  </span>
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                  Créez et gérez les cartes cadeaux de votre store
                </p>
              </div>
              <CreateGiftCardDialog
                storeId={currentStore.id}
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
              />
            </div>

            {/* Stats - Responsive */}
            <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Cartes</p>
                      <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {stats.total}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{stats.active} actives</p>
                    </div>
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5">
                      <Gift className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Valeur Totale</p>
                      <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                        {formatCurrency(stats.totalValue)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatCurrency(stats.remainingBalance)} restant
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/5">
                      <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Utilisées</p>
                      <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        {stats.redeemed}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatCurrency(stats.totalRedeemed)} rédimées
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/5">
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Expirées</p>
                      <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                        {stats.expired}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Cartes expirées</p>
                    </div>
                    <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/10 to-red-500/5">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Liste des cartes cadeaux */}
            <Tabs defaultValue="cards" className="space-y-4 sm:space-y-6">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="cards" className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">Cartes Cadeaux</span>
                  <span className="sm:hidden">Cartes</span>
                </TabsTrigger>
                <TabsTrigger value="transactions" className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">Transactions</span>
                  <span className="sm:hidden">Trans.</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="cards" className="space-y-4 sm:space-y-6">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                      <CardTitle className="text-lg sm:text-xl">Cartes Cadeaux</CardTitle>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-initial">
                          <Search className="absolute left-2.5 sm:left-3 top-2.5 sm:top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Rechercher..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-8 sm:pl-10 pr-8 sm:pr-10 min-h-[44px] h-11 sm:h-12 text-xs sm:text-sm w-full sm:w-64"
                          />
                          {searchTerm && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1 min-h-[44px] min-w-[44px] h-11 w-11 sm:h-12 sm:w-12"
                              onClick={() => setSearchTerm('')}
                              aria-label="Effacer la recherche"
                            >
                              <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Button>
                          )}
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="min-h-[44px] h-11 sm:h-12 text-xs sm:text-sm w-full sm:w-40">
                            <SelectValue placeholder="Statut" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tous</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="redeemed">Utilisée</SelectItem>
                            <SelectItem value="expired">Expirée</SelectItem>
                            <SelectItem value="pending">En attente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="space-y-3 sm:space-y-4">
                        {[1, 2, 3].map(i => (
                          <Skeleton key={i} className="h-16 sm:h-20 w-full" />
                        ))}
                      </div>
                    ) : giftCards.length === 0 ? (
                      <div className="text-center py-8">
                        <Gift className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-muted-foreground/50" />
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Aucune carte cadeau trouvée
                        </p>
                      </div>
                    ) : isMobile ? (
                      <MobileTableCard
                        data={giftCards.map(c => ({ ...c, id: c.id }))}
                        columns={[
                          {
                            key: 'code',
                            label: 'Code',
                            priority: 'high',
                            render: (row: GiftCard) => (
                              <div className="flex items-center gap-2">
                                <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                                  {row.code}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCopyCode(row.code)}
                                  className="h-7 w-7 min-h-[44px] min-w-[44px]"
                                  aria-label={`Copier le code ${row.code}`}
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ),
                          },
                          {
                            key: 'amount',
                            label: 'Montant Initial',
                            priority: 'high',
                            render: (row: GiftCard) => (
                              <span className="font-medium text-sm">
                                {formatCurrency(row.initial_amount)}
                              </span>
                            ),
                          },
                          {
                            key: 'balance',
                            label: 'Solde Restant',
                            priority: 'high',
                            render: (row: GiftCard) => (
                              <span className="text-sm">{formatCurrency(row.current_balance)}</span>
                            ),
                          },
                          {
                            key: 'status',
                            label: 'Statut',
                            priority: 'high',
                            render: (row: GiftCard) => getStatusBadge(row.status),
                          },
                          {
                            key: 'recipient',
                            label: 'Bénéficiaire',
                            priority: 'medium',
                            render: (row: GiftCard) =>
                              row.recipient_email ? (
                                <div>
                                  <div className="font-medium text-xs">
                                    {row.recipient_name || 'N/A'}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {row.recipient_email}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-xs">-</span>
                              ),
                          },
                          {
                            key: 'issued',
                            label: "Date d'émission",
                            priority: 'low',
                            render: (row: GiftCard) => (
                              <span className="text-xs">
                                {new Date(row.issued_at).toLocaleDateString('fr-FR')}
                              </span>
                            ),
                          },
                          {
                            key: 'expires',
                            label: 'Expiration',
                            priority: 'low',
                            render: (row: GiftCard) => (
                              <span className="text-xs">
                                {row.expires_at
                                  ? new Date(row.expires_at).toLocaleDateString('fr-FR')
                                  : 'Jamais'}
                              </span>
                            ),
                          },
                        ]}
                        actions={(row: GiftCard) => (
                          <Button variant="ghost" size="sm" className="min-h-[44px] w-full">
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </Button>
                        )}
                      />
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs sm:text-sm">Code</TableHead>
                              <TableHead className="text-xs sm:text-sm">Montant Initial</TableHead>
                              <TableHead className="text-xs sm:text-sm">Solde Restant</TableHead>
                              <TableHead className="text-xs sm:text-sm">Statut</TableHead>
                              <TableHead className="text-xs sm:text-sm">Bénéficiaire</TableHead>
                              <TableHead className="text-xs sm:text-sm">Date d'émission</TableHead>
                              <TableHead className="text-xs sm:text-sm">Expiration</TableHead>
                              <TableHead className="text-xs sm:text-sm">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {giftCards.map(card => (
                              <TableRow key={card.id} className="hover:bg-muted/50">
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <code className="text-xs sm:text-sm font-mono bg-muted px-2 py-1 rounded">
                                      {card.code}
                                    </code>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleCopyCode(card.code)}
                                      className="h-7 w-7 sm:h-8 sm:w-8"
                                    >
                                      <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                                <TableCell className="font-medium text-xs sm:text-sm">
                                  {formatCurrency(card.initial_amount)}
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm">
                                  {formatCurrency(card.current_balance)}
                                </TableCell>
                                <TableCell>{getStatusBadge(card.status)}</TableCell>
                                <TableCell className="text-xs sm:text-sm">
                                  {card.recipient_email ? (
                                    <div>
                                      <div className="font-medium">
                                        {card.recipient_name || 'N/A'}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {card.recipient_email}
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm">
                                  {new Date(card.issued_at).toLocaleDateString('fr-FR')}
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm">
                                  {card.expires_at
                                    ? new Date(card.expires_at).toLocaleDateString('fr-FR')
                                    : 'Jamais'}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="min-h-[44px] min-w-[44px] h-11 w-11 sm:h-12 sm:w-12"
                                    aria-label={`Modifier la carte cadeau ${card.code || card.id}`}
                                  >
                                    <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="transactions">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <CardHeader>
                    <CardTitle className="text-lg sm:text-xl">Transactions</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Historique de toutes les transactions sur les cartes cadeaux
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {transactions.length === 0 ? (
                      <div className="text-center py-8">
                        <TrendingUp className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-muted-foreground/50" />
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Aucune transaction
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Desktop Table */}
                        <div className="hidden lg:block overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-xs sm:text-sm">Date</TableHead>
                                <TableHead className="text-xs sm:text-sm">Type</TableHead>
                                <TableHead className="text-xs sm:text-sm">Code Carte</TableHead>
                                <TableHead className="text-xs sm:text-sm">Montant</TableHead>
                                <TableHead className="text-xs sm:text-sm">Solde Avant</TableHead>
                                <TableHead className="text-xs sm:text-sm">Solde Après</TableHead>
                                <TableHead className="text-xs sm:text-sm">Commande</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {transactions.map(transaction => (
                                <TableRow key={transaction.id} className="hover:bg-muted/50">
                                  <TableCell className="text-xs sm:text-sm">
                                    {new Date(transaction.created_at).toLocaleString('fr-FR')}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="text-xs">
                                      {transaction.transaction_type}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <code className="text-xs sm:text-sm font-mono">
                                      {transaction.gift_card?.code}
                                    </code>
                                  </TableCell>
                                  <TableCell
                                    className={`text-xs sm:text-sm font-medium ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}
                                  >
                                    {transaction.amount > 0 ? '+' : ''}
                                    {formatCurrency(transaction.amount)}
                                  </TableCell>
                                  <TableCell className="text-xs sm:text-sm">
                                    {formatCurrency(transaction.balance_before)}
                                  </TableCell>
                                  <TableCell className="text-xs sm:text-sm">
                                    {formatCurrency(transaction.balance_after)}
                                  </TableCell>
                                  <TableCell className="text-xs sm:text-sm">
                                    {transaction.order?.order_number || '-'}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="lg:hidden space-y-3 sm:space-y-4">
                          {transactions.map(transaction => (
                            <Card
                              key={transaction.id}
                              className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
                            >
                              <CardContent className="p-3 sm:p-4">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Badge variant="outline" className="text-xs">
                                      {transaction.transaction_type}
                                    </Badge>
                                    <span
                                      className={`text-xs sm:text-sm font-medium ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}
                                    >
                                      {transaction.amount > 0 ? '+' : ''}
                                      {formatCurrency(transaction.amount)}
                                    </span>
                                  </div>
                                  <div className="text-xs sm:text-sm">
                                    <p className="text-muted-foreground">Date</p>
                                    <p>
                                      {new Date(transaction.created_at).toLocaleString('fr-FR')}
                                    </p>
                                  </div>
                                  <div className="text-xs sm:text-sm">
                                    <p className="text-muted-foreground">Code Carte</p>
                                    <code className="font-mono">{transaction.gift_card?.code}</code>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                                    <div>
                                      <p className="text-muted-foreground">Solde Avant</p>
                                      <p className="font-medium">
                                        {formatCurrency(transaction.balance_before)}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Solde Après</p>
                                      <p className="font-medium">
                                        {formatCurrency(transaction.balance_after)}
                                      </p>
                                    </div>
                                  </div>
                                  {transaction.order?.order_number && (
                                    <div className="text-xs sm:text-sm">
                                      <p className="text-muted-foreground">Commande</p>
                                      <p className="font-medium">
                                        {transaction.order.order_number}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

/**
 * Dialog de création de carte cadeau
 */
function CreateGiftCardDialog({
  storeId,
  open,
  onOpenChange,
}: {
  storeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const createMutation = useCreateGiftCard();

  const [formData, setFormData] = useState({
    initial_amount: '',
    expires_at: '',
    recipient_email: '',
    recipient_name: '',
    recipient_message: '',
    min_purchase_amount: '0',
    can_be_partially_used: true,
    auto_activate: true,
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createMutation.mutateAsync({
        store_id: storeId,
        initial_amount: parseFloat(formData.initial_amount),
        expires_at: formData.expires_at || null,
        recipient_email: formData.recipient_email || undefined,
        recipient_name: formData.recipient_name || undefined,
        recipient_message: formData.recipient_message || undefined,
        min_purchase_amount: parseFloat(formData.min_purchase_amount) || 0,
        can_be_partially_used: formData.can_be_partially_used,
        auto_activate: formData.auto_activate,
        notes: formData.notes || undefined,
      });

      toast({
        title: 'Carte cadeau créée',
        description: 'La carte cadeau a été créée avec succès.',
      });

      onOpenChange(false);
      setFormData({
        initial_amount: '',
        expires_at: '',
        recipient_email: '',
        recipient_name: '',
        recipient_message: '',
        min_purchase_amount: '0',
        can_be_partially_used: true,
        auto_activate: true,
        notes: '',
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: 'Erreur',
        description: errorMessage || 'Impossible de créer la carte cadeau',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          size="sm"
        >
          <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
          <span className="hidden sm:inline">Créer une carte cadeau</span>
          <span className="sm:hidden">Créer</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[90vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Créer une carte cadeau</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Générez une nouvelle carte cadeau avec un code unique
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="initial_amount" className="text-xs sm:text-sm">
                Montant Initial *
              </Label>
              <Input
                id="initial_amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={formData.initial_amount}
                onChange={e => setFormData({ ...formData, initial_amount: e.target.value })}
                className="min-h-[44px] h-11 sm:h-12 text-xs sm:text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expires_at" className="text-xs sm:text-sm">
                Date d'expiration
              </Label>
              <Input
                id="expires_at"
                type="datetime-local"
                value={formData.expires_at}
                onChange={e => setFormData({ ...formData, expires_at: e.target.value })}
                className="min-h-[44px] h-11 sm:h-12 text-xs sm:text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="recipient_email" className="text-xs sm:text-sm">
                Email du bénéficiaire
              </Label>
              <Input
                id="recipient_email"
                type="email"
                value={formData.recipient_email}
                onChange={e => setFormData({ ...formData, recipient_email: e.target.value })}
                className="min-h-[44px] h-11 sm:h-12 text-xs sm:text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipient_name" className="text-xs sm:text-sm">
                Nom du bénéficiaire
              </Label>
              <Input
                id="recipient_name"
                value={formData.recipient_name}
                onChange={e => setFormData({ ...formData, recipient_name: e.target.value })}
                className="min-h-[44px] h-11 sm:h-12 text-xs sm:text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipient_message" className="text-xs sm:text-sm">
              Message personnalisé
            </Label>
            <Textarea
              id="recipient_message"
              value={formData.recipient_message}
              onChange={e => setFormData({ ...formData, recipient_message: e.target.value })}
              rows={3}
              className="text-xs sm:text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="min_purchase_amount" className="text-xs sm:text-sm">
              Montant minimum d'achat
            </Label>
            <Input
              id="min_purchase_amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.min_purchase_amount}
              onChange={e => setFormData({ ...formData, min_purchase_amount: e.target.value })}
              className="h-9 sm:h-10 text-xs sm:text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-xs sm:text-sm">
              Notes internes
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="text-xs sm:text-sm"
            />
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 w-full sm:w-auto"
            >
              {createMutation.isPending ? 'Création...' : 'Créer la carte cadeau'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
