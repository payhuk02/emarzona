import { useState, useEffect, useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useStores } from '@/hooks/useStores';
import { useStoreContext } from '@/contexts/StoreContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DeleteStoreDialog } from '@/components/store/DeleteStoreDialog';
import { deleteStoreWithDependencies, archiveStore } from '@/lib/store-delete-protection';
import { logger } from '@/lib/logger';
import {
  Store,
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
  ExternalLink,
  Copy,
  Palette,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { generateStoreUrl } from '@/lib/store-utils';
import {
  STORE_COMMERCE_TYPE_LABELS,
  type StoreCommerceType,
} from '@/constants/store-commerce-types';
import type { StoreCommerceTypeChangeStatus } from '@/hooks/useStoreCommerceTypeGuard';
import { supabase } from '@/integrations/supabase/client';
import { parseStoreCommerceType } from '@/lib/billing/store-commerce-access';
import { getStoreOnboardingPath } from '@/lib/commerce/store-vertical-config';
import { StoreCreateForm, type StoreCreateFormValues } from '@/components/store/StoreCreateForm';

export const StoreSettings = ({ action }: { action?: string | null }) => {
  const {
    stores,
    loading: storesLoading,
    createStore,
    updateStore,
    deleteStore: _deleteStore,
    refetch,
    canCreateStore,
    getRemainingStores,
  } = useStores();
  const { refreshStores } = useStoreContext();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [_isCreating, setIsCreating] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<{ id: string; name: string } | null>(null);
  const [commerceTypeDraft, setCommerceTypeDraft] = useState<Record<string, StoreCommerceType>>({});
  const [pendingCommerceChange, setPendingCommerceChange] = useState<{
    storeId: string;
    storeName: string;
    from: StoreCommerceType;
    to: StoreCommerceType;
  } | null>(null);

  const commerceTypeGuardQueries = useQueries({
    queries: stores.map(store => ({
      queryKey: ['store-commerce-type-guard', store.id],
      queryFn: async (): Promise<StoreCommerceTypeChangeStatus> => {
        const { data, error } = await supabase.rpc('store_commerce_type_change_status', {
          p_store_id: store.id,
        });
        if (error) throw error;
        const row = data as Record<string, unknown> | null;
        return {
          can_change: row?.can_change === true,
          product_count:
            typeof row?.product_count === 'number'
              ? row.product_count
              : Number(row?.product_count ?? 0),
          current_type: parseStoreCommerceType(row?.current_type),
        };
      },
      staleTime: 30_000,
    })),
  });

  const commerceTypeGuardByStoreId = useMemo(() => {
    const map: Record<string, StoreCommerceTypeChangeStatus> = {};
    stores.forEach((store, index) => {
      const status = commerceTypeGuardQueries[index]?.data;
      if (status) {
        map[store.id] = status;
      }
    });
    return map;
  }, [stores, commerceTypeGuardQueries]);

  // Sélectionner la première boutique par défaut
  useEffect(() => {
    if (stores.length > 0 && !selectedStore) {
      setSelectedStore(stores[0].id);
    }
  }, [stores, selectedStore]);

  // Gérer l'action "create" depuis l'URL
  useEffect(() => {
    if (action === 'create') {
      setActiveTab('create');
    }
  }, [action]);

  const handleCommerceTypeDraftChange = (storeId: string, value: StoreCommerceType) => {
    setCommerceTypeDraft(prev => ({ ...prev, [storeId]: value }));
  };

  const handleRequestCommerceTypeChange = (
    storeId: string,
    storeName: string,
    from: StoreCommerceType,
    to: StoreCommerceType
  ) => {
    if (from === to) return;

    const guard = commerceTypeGuardByStoreId[storeId];
    if (guard && !guard.can_change) {
      toast({
        title: 'Changement impossible',
        description: `Cette boutique contient ${guard.product_count} produit(s). Le type ne peut plus être modifié.`,
        variant: 'destructive',
      });
      return;
    }

    setPendingCommerceChange({ storeId, storeName, from, to });
  };

  const handleConfirmCommerceTypeChange = async () => {
    if (!pendingCommerceChange) return;

    const { storeId, to } = pendingCommerceChange;
    try {
      setSaving(true);
      await updateStore({
        storeId,
        updates: {
          commerce_type: to,
          metadata: {
            ...((stores.find(s => s.id === storeId)?.metadata as Record<string, unknown>) ?? {}),
            commerce_type: to,
          },
        },
      });
      await refreshStores();
      setCommerceTypeDraft(prev => {
        const next = { ...prev };
        delete next[storeId];
        return next;
      });
      toast({
        title: 'Type de boutique mis à jour',
        description: `Votre boutique est maintenant de type « ${STORE_COMMERCE_TYPE_LABELS[to]} ». Le menu vendeur a été adapté.`,
      });
      if (to === 'physical') {
        navigate(getStoreOnboardingPath(storeId, 'physical'));
      }
    } catch (error) {
      logger.error('Erreur lors du changement de type de boutique', { error });
    } finally {
      setSaving(false);
      setPendingCommerceChange(null);
    }
  };

  const handleCreateStore = async (values: StoreCreateFormValues) => {
    try {
      setSaving(true);

      const createdStore = await createStore({
        name: values.name.trim(),
        description: values.description.trim() || null,
        slug: values.slug,
        commerce_type: values.commerceType,
        metadata: {
          commerce_type: values.commerceType,
        },
      });

      await refreshStores();

      const targetPath = getStoreOnboardingPath(createdStore.id, values.commerceType);

      setIsCreating(false);
      setActiveTab('list');
      navigate(targetPath);
    } catch (error) {
      logger.error('Erreur lors de la création', { error });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStore = (storeId: string, storeName: string) => {
    setStoreToDelete({ id: storeId, name: storeName });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!storeToDelete) return;

    try {
      const result = await deleteStoreWithDependencies(storeToDelete.id);

      if (result.success) {
        toast({
          title: 'Boutique supprimée',
          description: `La boutique "${storeToDelete.name}" a été supprimée avec succès.`,
        });

        // Rafraîchir la liste
        await refetch();

        // Sélectionner une autre boutique si nécessaire
        if (selectedStore === storeToDelete.id) {
          const remainingStores = stores.filter(s => s.id !== storeToDelete.id);
          setSelectedStore(remainingStores.length > 0 ? remainingStores[0].id : null);
        }
      } else {
        toast({
          title: 'Erreur',
          description: result.error || 'Impossible de supprimer la boutique',
          variant: 'destructive',
        });
      }
    } catch (_error: unknown) {
      const errorMessage = _error instanceof Error ? _error.message : String(_error);
      logger.error('Erreur lors de la suppression', {
        error: errorMessage,
        storeId: storeToDelete.id,
      });
      toast({
        title: 'Erreur',
        description: errorMessage || 'Une erreur est survenue',
        variant: 'destructive',
      });
    }
  };

  const handleConfirmArchive = async () => {
    if (!storeToDelete) return;

    try {
      const result = await archiveStore(storeToDelete.id);

      if (result.success) {
        toast({
          title: 'Boutique archivée',
          description: `La boutique "${storeToDelete.name}" a été archivée avec succès.`,
        });

        // Rafraîchir la liste
        await refetch();
      } else {
        toast({
          title: 'Erreur',
          description: result.error || "Impossible d'archiver la boutique",
          variant: 'destructive',
        });
      }
    } catch (_error: unknown) {
      const errorMessage = _error instanceof Error ? _error.message : String(_error);
      logger.error("Erreur lors de l'archivage", {
        error: errorMessage,
        storeId: storeToDelete?.id,
      });
      toast({
        title: 'Erreur',
        description: errorMessage || 'Une erreur est survenue',
        variant: 'destructive',
      });
    }
  };

  const copyStoreUrl = (slug: string) => {
    const url = generateStoreUrl(slug);
    navigator.clipboard.writeText(url);
    toast({
      title: 'Lien copié !',
      description: 'Le lien de votre boutique a été copié dans le presse-papiers.',
    });
  };

  if (storesLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement de vos boutiques...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Gestion de la boutique</h2>
          <p className="text-sm text-muted-foreground">
            {stores.length > 0 ? 'Votre boutique' : 'Créez votre boutique pour commencer'}
          </p>
        </div>
      </div>

      {/* Onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList
          className={canCreateStore() ? 'grid w-full grid-cols-2' : 'grid w-full grid-cols-1'}
        >
          <TabsTrigger value="list">
            {stores.length === 1
              ? 'Ma boutique'
              : stores.length > 1
                ? `Mes boutiques (${stores.length})`
                : 'Liste'}
          </TabsTrigger>
          {canCreateStore() && (
            <TabsTrigger value="create">
              Créer{' '}
              {getRemainingStores() > 0 &&
                `(${getRemainingStores()} restante${getRemainingStores() > 1 ? 's' : ''})`}
            </TabsTrigger>
          )}
        </TabsList>

        {/* Liste des boutiques */}
        <TabsContent value="list" className="space-y-4">
          {stores.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune boutique</h3>
                <p className="text-muted-foreground mb-4">
                  Vous n'avez pas encore créé de boutique. Créez votre boutique pour commencer à
                  vendre.
                </p>
                <Button onClick={() => setActiveTab('create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer ma boutique
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {stores.map(store => (
                <Card key={store.id} className="relative">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {store.logo_url ? (
                          <img
                            src={store.logo_url}
                            alt={`Logo ${store.name}`}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
                            <Store className="h-6 w-6 text-primary" />
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-lg">{store.name}</CardTitle>
                          <CardDescription>
                            {store.description || 'Aucune description'}
                          </CardDescription>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <Badge variant={store.is_active ? 'default' : 'secondary'}>
                              {store.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            <Badge variant="outline">
                              {STORE_COMMERCE_TYPE_LABELS[store.commerce_type ?? 'physical']}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{store.slug}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => navigate('/dashboard/store')}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                          title="Personnalisation avancée"
                        >
                          <Palette className="h-4 w-4 mr-1.5" />
                          <span className="hidden sm:inline">Personnalisation</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open(generateStoreUrl(store.slug, store.subdomain), '_blank')
                          }
                          title="Voir la boutique"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyStoreUrl(store.slug)}
                          title="Copier le lien"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteStore(store.id, store.name)}
                          disabled={saving}
                          title="Supprimer la boutique"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 border-t">
                    {(() => {
                      const guard = commerceTypeGuardByStoreId[store.id];
                      const typeLocked = guard?.can_change === false;
                      const productCount = guard?.product_count ?? 0;
                      return (
                        <div className="flex flex-col sm:flex-row sm:items-end gap-3 pt-4">
                          <div className="flex-1 space-y-2">
                            <Label htmlFor={`commerce_type_${store.id}`}>Type de boutique</Label>
                            <Select
                              value={
                                commerceTypeDraft[store.id] ?? store.commerce_type ?? 'physical'
                              }
                              onValueChange={value =>
                                handleCommerceTypeDraftChange(store.id, value as StoreCommerceType)
                              }
                              disabled={typeLocked}
                            >
                              <SelectTrigger id={`commerce_type_${store.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(STORE_COMMERCE_TYPE_LABELS).map(
                                  ([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                      {label}
                                    </SelectItem>
                                  )
                                )}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                              {typeLocked
                                ? `Type verrouillé : ${productCount} produit(s) en catalogue. Créez une nouvelle boutique pour changer de vertical.`
                                : 'Le type adapte les menus vendeur. Il sera verrouillé après publication du premier produit.'}
                            </p>
                          </div>
                          <Button
                            variant="secondary"
                            disabled={
                              saving ||
                              typeLocked ||
                              (commerceTypeDraft[store.id] ?? store.commerce_type ?? 'physical') ===
                                (store.commerce_type ?? 'physical')
                            }
                            onClick={() =>
                              handleRequestCommerceTypeChange(
                                store.id,
                                store.name,
                                store.commerce_type ?? 'physical',
                                commerceTypeDraft[store.id] ?? store.commerce_type ?? 'physical'
                              )
                            }
                          >
                            {saving ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Appliquer le type'
                            )}
                          </Button>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Création de boutique */}
        <TabsContent value="create" className="space-y-4">
          {!canCreateStore() ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Limite de 3 boutiques par utilisateur atteinte. Vous devez supprimer une boutique
                existante avant d'en créer une nouvelle.
              </AlertDescription>
            </Alert>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Créer votre boutique</CardTitle>
                <CardDescription>
                  {stores.length > 0
                    ? `Vous avez ${stores.length} boutique${stores.length > 1 ? 's' : ''}. Vous pouvez créer jusqu'à ${getRemainingStores()} boutique${getRemainingStores() > 1 ? 's' : ''} supplémentaire${getRemainingStores() > 1 ? 's' : ''}.`
                    : 'Configurez votre boutique pour commencer à vendre vos produits'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StoreCreateForm
                  saving={saving}
                  onSubmit={handleCreateStore}
                  onCancel={() => setActiveTab('list')}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={pendingCommerceChange != null}
        onOpenChange={open => {
          if (!open) setPendingCommerceChange(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Changer le type de boutique ?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingCommerceChange ? (
                <>
                  La boutique « {pendingCommerceChange.storeName} » passera de{' '}
                  <strong>{STORE_COMMERCE_TYPE_LABELS[pendingCommerceChange.from]}</strong> à{' '}
                  <strong>{STORE_COMMERCE_TYPE_LABELS[pendingCommerceChange.to]}</strong>. Les menus
                  vendeur seront adaptés au nouveau type. Cette action n&apos;est possible que tant
                  qu&apos;aucun produit n&apos;est publié dans la boutique.
                  {pendingCommerceChange.to === 'physical' ? (
                    <>
                      {' '}
                      Un abonnement produits physiques peut être requis pour activer la logistique.
                    </>
                  ) : null}
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleConfirmCommerceTypeChange()}
              disabled={saving}
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de suppression avec protection */}
      {storeToDelete && (
        <DeleteStoreDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          storeId={storeToDelete.id}
          storeName={storeToDelete.name}
          onConfirmDelete={handleConfirmDelete}
          onConfirmArchive={handleConfirmArchive}
        />
      )}
    </div>
  );
};
