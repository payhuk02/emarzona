import React, { useState, useCallback } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Edit, Trash2, Facebook, Globe, Music, Image } from "lucide-react";
import { usePixels, Pixel } from "@/hooks/usePixels";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { EditPixelDialog } from "./EditPixelDialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const pixelIcons = {
  facebook: Facebook,
  google: Globe,
  tiktok: Music,
  pinterest: Image,
  custom: Globe,
};

const pixelLabels = {
  facebook: 'Facebook Pixel',
  google: 'Google Ads',
  tiktok: 'TikTok Pixel',
  pinterest: 'Pinterest Tag',
  custom: 'Code personnalisé',
};

const PixelsTableComponent = ({ pixels }: { pixels: Pixel[] }) => {
  const { deletePixel, togglePixel } = usePixels();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPixel, setSelectedPixel] = useState<Pixel | null>(null);

  const handleDelete = useCallback(async () => {
    if (selectedPixel) {
      await deletePixel(selectedPixel.id);
      setDeleteDialogOpen(false);
      setSelectedPixel(null);
    }
  }, [selectedPixel, deletePixel]);

  const handleToggle = useCallback(async (pixel: Pixel, checked: boolean) => {
    await togglePixel(pixel.id, checked);
  }, [togglePixel]);

  if (pixels.length === 0) {
    return (
      <div className="text-center py-12 sm:py-16 border-border/50 rounded-lg">
        <div className="p-4 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/5 mb-4 animate-in zoom-in duration-500 inline-block">
          <Globe className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground opacity-20" />
        </div>
        <p className="text-sm sm:text-base text-foreground font-medium">Aucun Pixel ajouté pour le moment</p>
        <p className="text-xs sm:text-sm text-muted-foreground mt-2">
          Cliquez sur "Ajouter un Pixel" pour commencer
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <div className="border border-border/50 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs sm:text-sm font-semibold">Type</TableHead>
                <TableHead className="text-xs sm:text-sm font-semibold">Nom</TableHead>
                <TableHead className="text-xs sm:text-sm font-semibold">ID Pixel</TableHead>
                <TableHead className="text-xs sm:text-sm font-semibold">Statut</TableHead>
                <TableHead className="text-xs sm:text-sm font-semibold">Créé le</TableHead>
                <TableHead className="text-right text-xs sm:text-sm font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pixels.map((pixel) => {
              const Icon = pixelIcons[pixel.pixel_type];
              return (
                  <TableRow key={pixel.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                        <span>{pixelLabels[pixel.pixel_type]}</span>
                    </div>
                  </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                    {pixel.pixel_name || <span className="text-muted-foreground">Sans nom</span>}
                  </TableCell>
                  <TableCell>
                      <code className="text-xs bg-muted/50 px-2 py-1 rounded font-mono">
                      {pixel.pixel_id.substring(0, 20)}
                      {pixel.pixel_id.length > 20 && '...'}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={pixel.is_active}
                        onCheckedChange={(checked) => handleToggle(pixel, checked)}
                      />
                        <Badge variant={pixel.is_active ? "default" : "secondary"} className="text-xs">
                        {pixel.is_active ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                  </TableCell>
                    <TableCell className="text-xs sm:text-sm text-muted-foreground">
                      {format(new Date(pixel.created_at), "dd MMM yyyy", { locale: fr })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedPixel(pixel);
                          setEditDialogOpen(true);
                        }}
                          className="h-8 w-8 p-0"
                          aria-label={`Modifier le pixel ${pixel.pixel_name || pixel.pixel_id}`}
                      >
                          <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedPixel(pixel);
                          setDeleteDialogOpen(true);
                        }}
                          className="h-8 w-8 p-0"
                          aria-label={`Supprimer le pixel ${pixel.pixel_name || pixel.pixel_id}`}
                      >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3 sm:space-y-4">
        {pixels.map((pixel) => {
          const Icon = pixelIcons[pixel.pixel_type];
          return (
            <Card
              key={pixel.id}
              className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
            >
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5">
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base truncate">
                        {pixel.pixel_name || pixelLabels[pixel.pixel_type]}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {pixelLabels[pixel.pixel_type]}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Actions pour le pixel ${pixel.name || pixel.id}`}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedPixel(pixel);
                          setEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedPixel(pixel);
                          setDeleteDialogOpen(true);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-2 pt-3 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">ID Pixel</p>
                    <code className="text-xs bg-muted/50 px-2 py-1 rounded font-mono">
                      {pixel.pixel_id.substring(0, 15)}
                      {pixel.pixel_id.length > 15 && '...'}
                    </code>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Statut</p>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={pixel.is_active}
                        onCheckedChange={(checked) => handleToggle(pixel, checked)}
                      />
                      <Badge variant={pixel.is_active ? "default" : "secondary"} className="text-xs">
                        {pixel.is_active ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Créé le</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(pixel.created_at), "dd MMM yyyy", { locale: fr })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">Supprimer ce Pixel ?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Cette action est irréversible. Le Pixel sera supprimé et ne sera plus injecté sur vos pages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedPixel && (
        <EditPixelDialog
          pixel={selectedPixel}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
        />
      )}
    </>
  );
};

PixelsTableComponent.displayName = 'PixelsTableComponent';

// Optimisation avec React.memo pour éviter les re-renders inutiles
export const PixelsTable = React.memo(PixelsTableComponent, (prevProps, nextProps) => {
  return (
    prevProps.pixels.length === nextProps.pixels.length &&
    // Comparaison superficielle des pixels (comparer les IDs et statuts)
    prevProps.pixels.every((pixel, index) => 
      pixel.id === nextProps.pixels[index]?.id &&
      pixel.is_active === nextProps.pixels[index]?.is_active &&
      pixel.pixel_name === nextProps.pixels[index]?.pixel_name
    )
  );
});

PixelsTable.displayName = 'PixelsTable';






