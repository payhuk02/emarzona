import { useState, useEffect } from "react";
import { useStores } from "@/hooks/useStores";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
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
  CheckCircle2
} from "lucide-react";

export const StoreSettings = ({ action }: { action?: string | null }) => {
  const { stores, loading: storesLoading, canCreateStore, getRemainingStores, createStore, updateStore, deleteStore } = useStores();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("list");
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newStoreData, setNewStoreData] = useState({
    name: "",
    description: "",
    slug: ""
  });

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

      setNewStoreData({ name: "", description: "", slug: "" });
      setIsCreating(false);
      setActiveTab("list");
    } catch (error) {
      console.error('Erreur lors de la création:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStore = async (storeId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette boutique ? Cette action est irréversible.")) {
      return;
    }

    try {
      setSaving(true);
      await deleteStore(storeId);
      
      // Sélectionner une autre boutique si nécessaire
      if (selectedStore === storeId) {
        const remainingStores = stores.filter(s => s.id !== storeId);
        setSelectedStore(remainingStores.length > 0 ? remainingStores[0].id : null);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    } finally {
      setSaving(false);
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
          <h2 className="text-xl sm:text-2xl font-bold">Gestion des boutiques</h2>
          <p className="text-sm text-muted-foreground">
            Vous avez {stores.length} boutique(s) sur {3} maximum
          </p>
        </div>
      </div>

      {/* Onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">Mes boutiques</TabsTrigger>
          <TabsTrigger value="create">Créer</TabsTrigger>
        </TabsList>

        {/* Liste des boutiques */}
        <TabsContent value="list" className="space-y-4">
          {stores.length === 0 ? (
        <Card>
              <CardContent className="py-12 text-center">
                <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune boutique</h3>
                <p className="text-muted-foreground mb-4">
                  Vous n'avez pas encore créé de boutique. Créez votre première boutique pour commencer à vendre.
                </p>
                {canCreateStore() && (
                  <Button onClick={() => setActiveTab("create")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer ma première boutique
                  </Button>
                )}
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
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/stores/${store.slug}`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyStoreUrl(store.slug)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteStore(store.id)}
                          disabled={saving}
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
                Vous avez atteint la limite de 3 boutiques. Supprimez une boutique existante pour en créer une nouvelle.
              </AlertDescription>
            </Alert>
          ) : (
        <Card>
          <CardHeader>
                <CardTitle>Créer une nouvelle boutique</CardTitle>
            <CardDescription>
                  Vous pouvez créer {getRemainingStores()} boutique(s) supplémentaire(s)
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
                    placeholder="Ex: Ma Boutique Digitale"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">URL de la boutique</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">payhula.com/stores/</span>
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
    </div>
  );
};