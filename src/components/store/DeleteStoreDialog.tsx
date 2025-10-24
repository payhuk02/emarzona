import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  AlertTriangle, 
  Package, 
  ShoppingCart, 
  Users, 
  DollarSign,
  Loader2,
  XCircle,
  Archive
} from "lucide-react";
import { checkStoreDeleteProtection, StoreDependencies } from "@/lib/store-delete-protection";
import { Button } from "@/components/ui/button";

interface DeleteStoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  storeName: string;
  onConfirmDelete: () => Promise<void>;
  onConfirmArchive?: () => Promise<void>;
}

export const DeleteStoreDialog = ({
  open,
  onOpenChange,
  storeId,
  storeName,
  onConfirmDelete,
  onConfirmArchive
}: DeleteStoreDialogProps) => {
  const [checking, setChecking] = useState(true);
  const [canDelete, setCanDelete] = useState(false);
  const [dependencies, setDependencies] = useState<StoreDependencies | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    if (open) {
      checkProtection();
    } else {
      // Reset state when dialog closes
      setConfirmChecked(false);
      setDeleting(false);
      setArchiving(false);
    }
  }, [open, storeId]);

  const checkProtection = async () => {
    setChecking(true);
    try {
      const result = await checkStoreDeleteProtection(storeId);
      setCanDelete(result.canDelete);
      setDependencies(result.dependencies);
      setWarnings(result.warnings);
      setErrors(result.errors || []);
    } catch (error) {
      console.error('Error checking protection:', error);
      setCanDelete(false);
      setErrors(['Impossible de vérifier les dépendances. Veuillez réessayer.']);
    } finally {
      setChecking(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onConfirmDelete();
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting store:', error);
    } finally {
      setDeleting(false);
    }
  };

  const handleArchive = async () => {
    if (!onConfirmArchive) return;
    
    setArchiving(true);
    try {
      await onConfirmArchive();
      onOpenChange(false);
    } catch (error) {
      console.error('Error archiving store:', error);
    } finally {
      setArchiving(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-xl">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            Supprimer la boutique "{storeName}" ?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            {checking ? (
              <div className="flex items-center gap-2 py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Vérification des dépendances...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Erreurs bloquantes */}
                {errors.length > 0 && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p className="font-semibold">Suppression impossible :</p>
                        {errors.map((error, index) => (
                          <p key={index} className="text-sm">• {error}</p>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Statistiques de la boutique */}
                {dependencies && (
                  <div className="grid grid-cols-2 gap-3 py-4">
                    <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                      <Package className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium">{dependencies.productsCount} Produits</p>
                        <p className="text-xs text-muted-foreground">
                          {dependencies.activeProductsCount} actifs
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                      <ShoppingCart className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-sm font-medium">{dependencies.ordersCount} Commandes</p>
                        <p className="text-xs text-muted-foreground">
                          {dependencies.pendingOrdersCount} en cours
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                      <Users className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="text-sm font-medium">{dependencies.customersCount} Clients</p>
                        <p className="text-xs text-muted-foreground">enregistrés</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                      <DollarSign className="h-5 w-5 text-yellow-500" />
                      <div>
                        <p className="text-sm font-medium">
                          {dependencies.totalRevenue.toLocaleString('fr-FR')} FCFA
                        </p>
                        <p className="text-xs text-muted-foreground">revenus totaux</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Avertissements */}
                {warnings.length > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p className="font-semibold">Attention :</p>
                        {warnings.map((warning, index) => (
                          <p key={index} className="text-sm">• {warning}</p>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Confirmation si suppression possible */}
                {canDelete && (
                  <div className="space-y-4 pt-4">
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <p className="font-semibold mb-2">⚠️ Cette action est IRRÉVERSIBLE</p>
                        <p className="text-sm">
                          Toutes les données de cette boutique seront définitivement supprimées :
                        </p>
                        <ul className="text-sm mt-2 space-y-1 list-disc list-inside">
                          <li>Tous les produits et leurs images</li>
                          <li>L'historique des commandes</li>
                          <li>Les informations clients</li>
                          <li>Les statistiques et analytics</li>
                        </ul>
                      </AlertDescription>
                    </Alert>

                    <div className="flex items-start gap-2 p-4 border-2 border-destructive/50 rounded-lg bg-destructive/5">
                      <Checkbox
                        id="confirm-delete"
                        checked={confirmChecked}
                        onCheckedChange={(checked) => setConfirmChecked(checked as boolean)}
                      />
                      <Label
                        htmlFor="confirm-delete"
                        className="text-sm font-medium cursor-pointer"
                      >
                        Je comprends que cette action est irréversible et je souhaite supprimer définitivement la boutique "{storeName}"
                      </Label>
                    </div>
                  </div>
                )}

                {/* Alternative : Archivage */}
                {!canDelete && onConfirmArchive && (
                  <div className="space-y-3 pt-4">
                    <p className="text-sm font-medium">Alternative recommandée :</p>
                    <Alert>
                      <Archive className="h-4 w-4" />
                      <AlertDescription>
                        <p className="font-semibold mb-1">Archiver la boutique</p>
                        <p className="text-sm">
                          Au lieu de supprimer, vous pouvez archiver cette boutique. Elle sera désactivée 
                          mais toutes les données seront conservées.
                        </p>
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          {!checking && (
            <>
              <AlertDialogCancel disabled={deleting || archiving}>
                Annuler
              </AlertDialogCancel>

              {!canDelete && onConfirmArchive && (
                <Button
                  onClick={handleArchive}
                  disabled={archiving || deleting}
                  variant="secondary"
                >
                  {archiving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Archivage...
                    </>
                  ) : (
                    <>
                      <Archive className="h-4 w-4 mr-2" />
                      Archiver
                    </>
                  )}
                </Button>
              )}

              {canDelete && (
                <Button
                  onClick={handleDelete}
                  disabled={!confirmChecked || deleting || archiving}
                  variant="destructive"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Suppression...
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Supprimer définitivement
                    </>
                  )}
                </Button>
              )}
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

