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
  useStoreGiftCardTransactions
} from '@/hooks/giftCards/useGiftCards';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
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
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Search,
  Gift,
  Copy,
  Edit,
  TrendingUp,
  DollarSign,
  Users
} from 'lucide-react';
import { GiftCardStatus } from '@/types/giftCards';
import { formatCurrency } from '@/lib/utils';

export default function AdminGiftCardManagement() {
  const { store } = useStore();
  
  // Alias pour compatibilité
  const currentStore = store;
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: giftCards = [], isLoading } = useGiftCards(currentStore?.id, {
    status: statusFilter !== 'all' ? statusFilter : undefined,
    search: searchTerm || undefined
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
    totalRedeemed: giftCards.reduce((sum, gc) => sum + (gc.initial_amount - gc.current_balance), 0)
  };

  const getStatusBadge = (status: GiftCardStatus) => {
    const variants: Record<GiftCardStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      redeemed: 'secondary',
      expired: 'destructive',
      cancelled: 'outline',
      pending: 'outline'
    };

    const labels: Record<GiftCardStatus, string> = {
      active: 'Active',
      redeemed: 'Utilisée',
      expired: 'Expirée',
      cancelled: 'Annulée',
      pending: 'En attente'
    };

    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Code copié',
      description: 'Le code de la carte cadeau a été copié dans le presse-papiers.',
    });
  };

  if (!currentStore) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Veuillez sélectionner un store.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Cartes Cadeaux</h1>
          <p className="text-muted-foreground mt-2">
            Créez et gérez les cartes cadeaux de votre store
          </p>
        </div>
        <CreateGiftCardDialog
          storeId={currentStore.id}
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cartes</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active} actives
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur Totale</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.remainingBalance)} restant
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisées</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.redeemed}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.totalRedeemed)} rédimées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expirées</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.expired}</div>
            <p className="text-xs text-muted-foreground">
              Cartes expirées
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des cartes cadeaux */}
      <Tabs defaultValue="cards" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cards">Cartes Cadeaux</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="cards" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Cartes Cadeaux</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
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
                <div className="text-center py-8 text-muted-foreground">
                  Chargement...
                </div>
              ) : giftCards.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune carte cadeau trouvée
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Montant Initial</TableHead>
                      <TableHead>Solde Restant</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Bénéficiaire</TableHead>
                      <TableHead>Date d'émission</TableHead>
                      <TableHead>Expiration</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {giftCards.map((card) => (
                      <TableRow key={card.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                              {card.code}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyCode(card.code)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(card.initial_amount)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(card.current_balance)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(card.status)}
                        </TableCell>
                        <TableCell>
                          {card.recipient_email ? (
                            <div>
                              <div className="font-medium">{card.recipient_name || 'N/A'}</div>
                              <div className="text-sm text-muted-foreground">
                                {card.recipient_email}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(card.issued_at).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell>
                          {card.expires_at
                            ? new Date(card.expires_at).toLocaleDateString('fr-FR')
                            : 'Jamais'}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transactions</CardTitle>
              <CardDescription>
                Historique de toutes les transactions sur les cartes cadeaux
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune transaction
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Code Carte</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Solde Avant</TableHead>
                      <TableHead>Solde Après</TableHead>
                      <TableHead>Commande</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {new Date(transaction.created_at).toLocaleString('fr-FR')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {transaction.transaction_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <code className="text-sm font-mono">
                            {transaction.gift_card?.code}
                          </code>
                        </TableCell>
                        <TableCell className={transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                          {transaction.amount > 0 ? '+' : ''}
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(transaction.balance_before)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(transaction.balance_after)}
                        </TableCell>
                        <TableCell>
                          {transaction.order?.order_number || '-'}
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
    </div>
  );
}

/**
 * Dialog de création de carte cadeau
 */
function CreateGiftCardDialog({
  storeId,
  open,
  onOpenChange
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
    notes: ''
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
        notes: formData.notes || undefined
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
        notes: ''
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer la carte cadeau',
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Créer une carte cadeau
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer une carte cadeau</DialogTitle>
          <DialogDescription>
            Générez une nouvelle carte cadeau avec un code unique
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="initial_amount">Montant Initial *</Label>
              <Input
                id="initial_amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={formData.initial_amount}
                onChange={(e) => setFormData({ ...formData, initial_amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expires_at">Date d'expiration</Label>
              <Input
                id="expires_at"
                type="datetime-local"
                value={formData.expires_at}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="recipient_email">Email du bénéficiaire</Label>
              <Input
                id="recipient_email"
                type="email"
                value={formData.recipient_email}
                onChange={(e) => setFormData({ ...formData, recipient_email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipient_name">Nom du bénéficiaire</Label>
              <Input
                id="recipient_name"
                value={formData.recipient_name}
                onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipient_message">Message personnalisé</Label>
            <Textarea
              id="recipient_message"
              value={formData.recipient_message}
              onChange={(e) => setFormData({ ...formData, recipient_message: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="min_purchase_amount">Montant minimum d'achat</Label>
            <Input
              id="min_purchase_amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.min_purchase_amount}
              onChange={(e) => setFormData({ ...formData, min_purchase_amount: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes internes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Création...' : 'Créer la carte cadeau'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

