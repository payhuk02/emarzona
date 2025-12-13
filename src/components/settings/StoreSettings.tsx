import { useState, useEffect } from "react";
import { useStores } from "@/hooks/useStores";
import { useStoreContext } from "@/contexts/StoreContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { DeleteStoreDialog } from "@/components/store/DeleteStoreDialog";
import { deleteStoreWithDependencies, archiveStore } from "@/lib/store-delete-protection";
import { logger } from "@/lib/logger";
import { useSpaceInputFix } from "@/hooks/useSpaceInputFix";
import { 
  Store, 
  Settings, 
  Save, 
  Loader2, 
  AlertCircle,
  Plus,
  Trash2,
  ExternalLink,
  Copy,
  CheckCircle2,
  Palette
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export const StoreSettings = ({ action }: { action?: string | null }) => {
  const { stores, loading: storesLoading, createStore, updateStore, deleteStore, refetch, canCreateStore, getRemainingStores } = useStores();
  const { refreshStores } = useStoreContext();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("list");
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<{ id: string; name: string } | null>(null);
  const [newStoreData, setNewStoreData] = useState({
    name: "",
    description: "",
    slug: ""
  });
  const { handleKeyDown: handleSpaceKeyDown } = useSpaceInputFix();

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

  const handleCreateStore = async () => {
    if (!newStoreData.name.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom de la boutique est requis",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);
      const slug = newStoreData.slug.trim() || generateSlug(newStoreData.name);
      
      await createStore({
        name: newStoreData.name.trim(),
        description: newStoreData.description.trim() || null,
        slug: slug
      });

      // Rafraîchir le contexte pour mettre à jour la liste
      await refreshStores();

      setNewStoreData({ name: "", description: "", slug: "" });
      setIsCreating(false);
      setActiveTab("list");
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
          title: "Boutique supprimée",
          description: `La boutique "${storeToDelete.name}" a été supprimée avec succès.`
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
          title: "Erreur",
          description: result.error || "Impossible de supprimer la boutique",
          variant: "destructive"
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Erreur lors de la suppression', { error: errorMessage, storeId: storeToDelete.id });
      toast({
        title: "Erreur",
        description: errorMessage || "Une erreur est survenue",
        variant: "destructive"
      });
    }
  };

  const handleConfirmArchive = async () => {
    if (!storeToDelete) return;

    try {
      const result = await archiveStore(storeToDelete.id);
      
      if (result.success) {
        toast({
          title: "Boutique archivée",
          description: `La boutique "${storeToDelete.name}" a été archivée avec succès.`
        });
        
        // Rafraîchir la liste
        await refetch();
      } else {
        toast({
          title: "Erreur",
          description: result.error || "Impossible d'archiver la boutique",
          variant: "destructive"
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Erreur lors de l\'archivage', { error: errorMessage, storeId });
      toast({
        title: "Erreur",
        description: errorMessage || "Une erreur est survenue",
        variant: "destructive"
      });
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const copyStoreUrl = (slug: string) => {
    const url = `${window.location.origin}/stores/${slug}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Lien copié !",
      description: "Le lien de votre boutique a été copié dans le presse-papiers."
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
            {stores.length > 0 ? "Votre boutique" : "Créez votre boutique pour commencer"}
          </p>
        </div>
      </div>

      {/* Onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={canCreateStore() ? "grid w-full grid-cols-2" : "grid w-full grid-cols-1"}>
          <TabsTrigger value="list">
            {stores.length === 1 ? "Ma boutique" : stores.length > 1 ? `Mes boutiques (${stores.length})` : "Liste"}
          </TabsTrigger>
          {canCreateStore() && (
            <TabsTrigger value="create">
              Créer {getRemainingStores() > 0 && `(${getRemainingStores()} restante${getRemainingStores() > 1 ? 's' : ''})`}
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
                  Vous n'avez pas encore créé de boutique. Créez votre boutique pour commencer à vendre.
                </p>
                <Button onClick={() => setActiveTab("create")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer ma boutique
                </Button>
          </CardContent>
        </Card>
          ) : (
            <div className="grid gap-4">
              {stores.map((store) => (
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
                            {store.description || "Aucune description"}
                          </CardDescription>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant={store.is_active ? "default" : "secondary"}>
                              {store.is_active ? "Active" : "Inactive"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {store.slug}
                            </span>
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
                          onClick={() => window.open(`/stores/${store.slug}`, '_blank')}
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
                Limite de 3 boutiques par utilisateur atteinte. Vous devez supprimer une boutique existante avant d'en créer une nouvelle.
              </AlertDescription>
            </Alert>
          ) : (
        <Card>
          <CardHeader>
                <CardTitle>Créer votre boutique</CardTitle>
            <CardDescription>
                  {stores.length > 0 
                    ? `Vous avez ${stores.length} boutique${stores.length > 1 ? 's' : ''}. Vous pouvez créer jusqu'à ${getRemainingStores()} boutique${getRemainingStores() > 1 ? 's' : ''} supplémentaire${getRemainingStores() > 1 ? 's' : ''}.`
                    : "Configurez votre boutique pour commencer à vendre vos produits"
                  }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom de la boutique *</Label>
                  <Input
                    id="name"
                    value={newStoreData.name}
                    onChange={(e) => {
                      setNewStoreData(prev => ({
                        ...prev,
                        name: e.target.value,
                        slug: prev.slug || generateSlug(e.target.value)
                      }));
                    }}
                    onKeyDown={handleSpaceKeyDown}
                    placeholder="Ex: Ma Boutique Digitale"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">URL de la boutique</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">emarzona.com/stores/</span>
                  <Input
                      id="slug"
                      value={newStoreData.slug}
                      onChange={(e) => setNewStoreData(prev => ({ ...prev, slug: e.target.value }))}
                      placeholder="ma-boutique-digitale"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newStoreData.description}
                    onChange={(e) => setNewStoreData(prev => ({ ...prev, description: e.target.value }))}
                    onKeyDown={handleSpaceKeyDown}
                    placeholder="Décrivez votre boutique..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateStore}
                    disabled={saving || !newStoreData.name.trim()}
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    )}
                    Créer la boutique
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setActiveTab("list");
                      setNewStoreData({ name: "", description: "", slug: "" });
                    }}
                  >
                    Annuler
                  </Button>
            </div>
          </CardContent>
        </Card>
      )}
        </TabsContent>
      </Tabs>

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