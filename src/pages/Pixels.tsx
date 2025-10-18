import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePixels } from "@/hooks/usePixels";
import { CreatePixelDialog } from "@/components/pixels/CreatePixelDialog";
import { PixelsTable } from "@/components/pixels/PixelsTable";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Eye, ShoppingCart, DollarSign } from "lucide-react";

const Pixels = () => {
  const { pixels, loading } = usePixels();

  const activePixels = pixels.filter(p => p.is_active).length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Mes Pixels</h1>
          <p className="text-muted-foreground">
            Gérez vos Pixels publicitaires et suivez leurs performances
          </p>
        </div>
        <CreatePixelDialog />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pixels</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pixels.length}</div>
            <p className="text-xs text-muted-foreground">
              {activePixels} actif{activePixels > 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Événements PageView</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">7 derniers jours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Add to Cart</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">7 derniers jours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Achats</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">7 derniers jours</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vos Pixels</CardTitle>
          <CardDescription>
            Liste de tous vos Pixels configurés. Activez ou désactivez-les selon vos besoins.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <PixelsTable pixels={pixels} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comment ça fonctionne ?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">1. Ajoutez vos Pixels</h3>
            <p className="text-sm text-muted-foreground">
              Cliquez sur "Ajouter un Pixel" et renseignez les informations de votre Pixel publicitaire (Facebook, Google, TikTok, etc.).
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">2. Injection automatique</h3>
            <p className="text-sm text-muted-foreground">
              Vos Pixels actifs seront automatiquement injectés sur vos pages de produits et de vente.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">3. Suivi des événements</h3>
            <p className="text-sm text-muted-foreground">
              Le système envoie automatiquement les événements importants : visites de pages, ajouts au panier, achats et leads.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">4. Confidentialité</h3>
            <p className="text-sm text-muted-foreground">
              Vos Pixels sont privés et ne s'activent que sur vos propres produits. Conformité RGPD garantie.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Pixels;
