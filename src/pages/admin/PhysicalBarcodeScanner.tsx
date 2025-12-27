/**
 * Page de gestion du Scanner de Codes-barres
 * Date: 28 Janvier 2025
 * Design responsive avec le même style que Mes Templates
 */

import { useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BarcodeScanner } from '@/components/physical/barcode/BarcodeScanner';
import { BarcodeGenerator } from '@/components/physical/barcode/BarcodeGenerator';
import {
  useBarcodeScanner,
  useProductByBarcode,
  useUpdateStockByBarcode,
  BarcodeScanResult,
} from '@/hooks/physical/useBarcodeScanner';
import { Camera, Search, Package, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function PhysicalBarcodeScanner() {
  const [showScanner, setShowScanner] = useState(false);
  const [searchBarcode, setSearchBarcode] = useState('');
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [showStockUpdate, setShowStockUpdate] = useState(false);
  const [stockQuantity, setStockQuantity] = useState(1);
  const [stockMovementType, setStockMovementType] = useState<'adjustment' | 'receipt' | 'sale'>(
    'adjustment'
  );
  const { toast } = useToast();

  const { data: productData, isLoading: isLoadingProduct } = useProductByBarcode(scannedBarcode);
  const updateStockMutation = useUpdateStockByBarcode();

  const handleScanSuccess = (result: BarcodeScanResult) => {
    setScannedBarcode(result.code);
    setShowScanner(false);
    toast({
      title: 'Code-barres scanné',
      description: `Code: ${result.code} (${result.format})`,
    });
  };

  const handleSearch = () => {
    if (searchBarcode.trim()) {
      setScannedBarcode(searchBarcode.trim());
    }
  };

  const handleClearSearch = () => {
    setSearchBarcode('');
    setScannedBarcode(null);
  };

  const handleUpdateStock = async () => {
    if (!scannedBarcode) return;

    try {
      await updateStockMutation.mutateAsync({
        barcode: scannedBarcode,
        quantity: stockQuantity,
        movementType: stockMovementType,
        notes: `Mise à jour via scanner: ${scannedBarcode}`,
      });
      setShowStockUpdate(false);
      setStockQuantity(1);
      toast({
        title: 'Stock mis à jour',
        description: 'Le stock a été mis à jour avec succès',
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-x-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-auto pb-16 md:pb-0">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Header - Responsive & Animated */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold flex items-center gap-2 mb-1 sm:mb-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
                    <Camera
                      className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400"
                      aria-hidden="true"
                    />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Scanner de Codes-barres
                  </span>
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                  Scannez, recherchez et gérez les codes-barres de vos produits physiques
                </p>
              </div>
            </div>

            <Tabs defaultValue="scanner" className="space-y-4 sm:space-y-6">
              <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-muted/50 backdrop-blur-sm">
                <TabsTrigger
                  value="scanner"
                  className="text-xs sm:text-sm px-2 sm:px-4 py-2 min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
                >
                  <Camera className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Scanner</span>
                  <span className="xs:hidden">Scan</span>
                </TabsTrigger>
                <TabsTrigger
                  value="search"
                  className="text-xs sm:text-sm px-2 sm:px-4 py-2 min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
                >
                  <Search className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Recherche
                </TabsTrigger>
                <TabsTrigger
                  value="generator"
                  className="text-xs sm:text-sm px-2 sm:px-4 py-2 min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
                >
                  <span className="hidden xs:inline">Générateur</span>
                  <span className="xs:hidden">Générer</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="scanner" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
                {/* Scanner Mobile Card */}
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <Camera className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                      Scanner Mobile
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Utilisez la caméra de votre appareil pour scanner un code-barres
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => setShowScanner(true)}
                      className="w-full min-h-[44px] bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                      size="lg"
                    >
                      <Camera className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="text-sm sm:text-base">Ouvrir le Scanner</span>
                    </Button>
                  </CardContent>
                </Card>

                {/* Scan Result */}
                {scannedBarcode && (
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base sm:text-lg">Résultat du Scan</CardTitle>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleClearSearch}
                          className="min-h-[44px] min-w-[44px] h-11 w-11"
                          aria-label="Effacer le résultat du scan"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs sm:text-sm">Code-barres scanné</Label>
                        <Badge
                          variant="outline"
                          className="font-mono text-base sm:text-lg p-2 sm:p-3 w-full justify-center"
                        >
                          {scannedBarcode}
                        </Badge>
                      </div>

                      {isLoadingProduct ? (
                        <div className="flex items-center justify-center p-8">
                          <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-purple-500" />
                        </div>
                      ) : productData ? (
                        <div className="space-y-4">
                          <Alert className="border-green-500/50 bg-green-500/10">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <AlertDescription>
                              <div className="space-y-2 text-xs sm:text-sm">
                                <p className="font-semibold text-green-600 dark:text-green-400">
                                  Produit trouvé
                                </p>
                                <p>
                                  {productData.type === 'serial'
                                    ? `Numéro de série: ${productData.data.serial_number}`
                                    : `Item d'inventaire trouvé`}
                                </p>
                                {productData.data.physical_product?.product && (
                                  <p className="font-medium">
                                    Produit: {productData.data.physical_product.product.name}
                                  </p>
                                )}
                              </div>
                            </AlertDescription>
                          </Alert>

                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button
                              onClick={() => setShowStockUpdate(true)}
                              variant="outline"
                              className="flex-1"
                            >
                              <Package className="mr-2 h-4 w-4" />
                              <span className="text-xs sm:text-sm">Mettre à jour le stock</span>
                            </Button>
                            <Button
                              onClick={handleClearSearch}
                              variant="ghost"
                              className="flex-1 sm:flex-initial"
                            >
                              <span className="text-xs sm:text-sm">Effacer</span>
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-xs sm:text-sm">
                            Aucun produit trouvé avec ce code-barres
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="search" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <Search className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                      Recherche par Code-barres
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Entrez manuellement un code-barres pour rechercher un produit
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                        <Input
                          placeholder="Entrez un code-barres"
                          value={searchBarcode}
                          onChange={e => setSearchBarcode(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              handleSearch();
                            }
                          }}
                          className="pl-8 sm:pl-10 h-9 sm:h-10 text-xs sm:text-sm"
                        />
                        {searchBarcode && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 sm:h-8 sm:w-8"
                            onClick={() => setSearchBarcode('')}
                            aria-label="Effacer le code-barres"
                          >
                            <X className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        )}
                      </div>
                      <Button
                        onClick={handleSearch}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        size="default"
                      >
                        <Search className="h-4 w-4" />
                        <span className="hidden sm:inline ml-2">Rechercher</span>
                      </Button>
                    </div>

                    {scannedBarcode && (
                      <div className="space-y-4">
                        {isLoadingProduct ? (
                          <div className="flex items-center justify-center p-8">
                            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-purple-500" />
                          </div>
                        ) : productData ? (
                          <Alert className="border-green-500/50 bg-green-500/10">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <AlertDescription>
                              <div className="space-y-2 text-xs sm:text-sm">
                                <p className="font-semibold text-green-600 dark:text-green-400">
                                  Produit trouvé
                                </p>
                                {productData.data.physical_product?.product && (
                                  <p className="font-medium">
                                    {productData.data.physical_product.product.name}
                                  </p>
                                )}
                              </div>
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-xs sm:text-sm">
                              Aucun produit trouvé avec ce code-barres
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="generator" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
                <BarcodeGenerator />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* Dialog Scanner */}
      <Dialog open={showScanner} onOpenChange={setShowScanner}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Scanner de Code-barres</DialogTitle>
            <DialogDescription>
              Positionnez le code-barres dans le cadre de la caméra
            </DialogDescription>
          </DialogHeader>
          <BarcodeScanner
            onScanSuccess={handleScanSuccess}
            onClose={() => setShowScanner(false)}
            autoStop={true}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog Mise à jour Stock */}
      <Dialog open={showStockUpdate} onOpenChange={setShowStockUpdate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mettre à jour le Stock</DialogTitle>
            <DialogDescription>
              Modifier la quantité de stock pour le code-barres: {scannedBarcode}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type de mouvement</Label>
              <Select
                value={stockMovementType}
                onValueChange={value =>
                  setStockMovementType(value as 'adjustment' | 'receipt' | 'sale')
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="adjustment">Ajustement</SelectItem>
                  <SelectItem value="receipt">Réception</SelectItem>
                  <SelectItem value="sale">Vente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantité</Label>
              <Input
                type="number"
                value={stockQuantity}
                onChange={e => setStockQuantity(Number(e.target.value))}
                min="1"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowStockUpdate(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleUpdateStock}
                disabled={updateStockMutation.isPending}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {updateStockMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mise à jour...
                  </>
                ) : (
                  'Mettre à jour'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}






