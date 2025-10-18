import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Edit, Trash2, Facebook, Globe, Music, Image } from "lucide-react";
import { usePixels, Pixel } from "@/hooks/usePixels";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { EditPixelDialog } from "./EditPixelDialog";

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

export const PixelsTable = ({ pixels }: { pixels: Pixel[] }) => {
  const { deletePixel, togglePixel } = usePixels();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPixel, setSelectedPixel] = useState<Pixel | null>(null);

  const handleDelete = async () => {
    if (selectedPixel) {
      await deletePixel(selectedPixel.id);
      setDeleteDialogOpen(false);
      setSelectedPixel(null);
    }
  };

  const handleToggle = async (pixel: Pixel, checked: boolean) => {
    await togglePixel(pixel.id, checked);
  };

  if (pixels.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <p className="text-muted-foreground">Aucun Pixel ajouté pour le moment</p>
        <p className="text-sm text-muted-foreground mt-2">
          Cliquez sur "Ajouter un Pixel" pour commencer
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>ID Pixel</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Créé le</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pixels.map((pixel) => {
              const Icon = pixelIcons[pixel.pixel_type];
              return (
                <TableRow key={pixel.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{pixelLabels[pixel.pixel_type]}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {pixel.pixel_name || <span className="text-muted-foreground">Sans nom</span>}
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
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
                      <Badge variant={pixel.is_active ? "default" : "secondary"}>
                        {pixel.is_active ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(pixel.created_at).toLocaleDateString('fr-FR')}
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
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedPixel(pixel);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce Pixel ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le Pixel sera supprimé et ne sera plus injecté sur vos pages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
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
