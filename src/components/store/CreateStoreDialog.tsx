import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Store, Plus, Globe, Palette, Settings, Zap, Shield, BarChart3 } from "lucide-react";
import { useStore } from "@/hooks/useStore";
import { useToast } from "@/hooks/use-toast";

interface CreateStoreDialogProps {
  children?: React.ReactNode;
}

const CreateStoreDialog = ({ children }: CreateStoreDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    defaultCurrency: "XOF",
    category: "general"
  });
  const { createStore } = useStore();
  const { toast } = useToast();

  const categories = [
    { value: "general", label: "Général", description: "Boutique polyvalente" },
    { value: "digital", label: "Produits Digitaux", description: "Formations, logiciels, ebooks" },
    { value: "services", label: "Services", description: "Consulting, coaching, freelancing" },
    { value: "education", label: "Éducation", description: "Cours, formations, tutoriels" },
    { value: "health", label: "Santé & Bien-être", description: "Services médicaux, fitness" },
    { value: "business", label: "Business", description: "Outils professionnels, B2B" },
    { value: "creative", label: "Créatif", description: "Design, art, musique" },
    { value: "tech", label: "Technologie", description: "Apps, outils tech, gadgets" }
  ];

  const currencies = [
    { value: "XOF", label: "FCFA (XOF)", description: "Franc CFA Ouest Africain" },
    { value: "EUR", label: "Euro (EUR)", description: "Euro" },
    { value: "USD", label: "Dollar US (USD)", description: "Dollar Américain" },
    { value: "XAF", label: "FCFA (XAF)", description: "Franc CFA Centre Africain" }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setLoading(true);
    try {
      const success = await createStore(formData.name.trim(), formData.description.trim());
      if (success) {
        setOpen(false);
        setFormData({ name: "", description: "", defaultCurrency: "XOF", category: "general" });
      }
    } catch (error) {
      console.error("Error creating store:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = categories.find(cat => cat.value === formData.category);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="gradient-primary touch-manipulation text-xs sm:text-sm shrink-0 min-w-[120px] sm:min-w-[140px]">
            <Store className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            Créer ma boutique
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            Créer votre boutique en ligne
          </DialogTitle>
          <DialogDescription>
            Configurez votre boutique pour commencer à vendre vos produits et services en Afrique
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations de base */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-4 w-4 text-primary" />
                Informations de base
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="store-name">Nom de la boutique *</Label>
                <Input
                  id="store-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Ma Boutique Digitale"
                  required
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Ce nom apparaîtra sur votre boutique publique
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="store-description">Description</Label>
                <Textarea
                  id="store-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Décrivez votre boutique en quelques mots..."
                  rows={3}
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Catégorie</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{category.label}</span>
                            <span className="text-xs text-muted-foreground">{category.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Devise par défaut</Label>
                  <Select
                    value={formData.defaultCurrency}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, defaultCurrency: value }))}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une devise" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.value} value={currency.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{currency.label}</span>
                            <span className="text-xs text-muted-foreground">{currency.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fonctionnalités incluses */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Fonctionnalités incluses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                  <Globe className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-900 dark:text-green-100">Lien unique</h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Votre boutique aura son propre lien personnalisé
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                  <Palette className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">Personnalisation</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Logo, bannière et couleurs personnalisables
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
                  <Shield className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-purple-900 dark:text-purple-100">Paiements sécurisés</h4>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      Acceptez les paiements en FCFA et autres devises
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
                  <BarChart3 className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-orange-900 dark:text-orange-100">Analytics</h4>
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      Suivez vos ventes et performances
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Aperçu */}
          {formData.name && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Aperçu de votre boutique</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 border rounded-lg bg-muted/20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                      <Store className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{formData.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedCategory?.label} • {formData.defaultCurrency}
                      </p>
                    </div>
                  </div>
                  {formData.description && (
                    <p className="text-sm text-muted-foreground mb-2">{formData.description}</p>
                  )}
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {formData.category}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {formData.defaultCurrency}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="gradient-primary flex-1"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Création...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer ma boutique
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="flex-1 sm:flex-none"
            >
              Annuler
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export { CreateStoreDialog };