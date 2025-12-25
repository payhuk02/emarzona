import React, { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { usePixels, Pixel } from "@/hooks/usePixels";

interface EditPixelDialogProps {
  pixel: Pixel;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditPixelDialogComponent = ({ pixel, open, onOpenChange }: EditPixelDialogProps) => {
  const { updatePixel } = usePixels();
  const [formData, setFormData] = useState({
    pixel_type: pixel.pixel_type,
    pixel_id: pixel.pixel_id,
    pixel_name: pixel.pixel_name || '',
    pixel_code: pixel.pixel_code || '',
    is_active: pixel.is_active,
  });

  useEffect(() => {
    setFormData({
      pixel_type: pixel.pixel_type,
      pixel_id: pixel.pixel_id,
      pixel_name: pixel.pixel_name || '',
      pixel_code: pixel.pixel_code || '',
      is_active: pixel.is_active,
    });
  }, [pixel]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await updatePixel(pixel.id, formData);
    if (success) {
      onOpenChange(false);
    }
  }, [pixel.id, formData, updatePixel, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">Modifier le Pixel</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit_pixel_type" className="text-xs sm:text-sm">Type de Pixel *</Label>
            <Select
              value={formData.pixel_type}
              onValueChange={(value) => setFormData({ ...formData, pixel_type: value as any })}
            >
              <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="facebook">Facebook / Meta Pixel</SelectItem>
                <SelectItem value="google">Google Ads / Analytics</SelectItem>
                <SelectItem value="tiktok">TikTok Pixel</SelectItem>
                <SelectItem value="pinterest">Pinterest Tag</SelectItem>
                <SelectItem value="custom">Code personnalisé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_pixel_name" className="text-xs sm:text-sm">Nom du Pixel (optionnel)</Label>
            <Input
              id="edit_pixel_name"
              placeholder="Ex: Campagne Printemps 2024"
              value={formData.pixel_name}
              onChange={(e) => setFormData({ ...formData, pixel_name: e.target.value })}
              className="h-9 sm:h-10 text-xs sm:text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_pixel_id" className="text-xs sm:text-sm">ID ou Code du Pixel *</Label>
            <Input
              id="edit_pixel_id"
              placeholder="Ex: 123456789012345"
              value={formData.pixel_id}
              onChange={(e) => setFormData({ ...formData, pixel_id: e.target.value })}
              required
              className="h-9 sm:h-10 text-xs sm:text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_pixel_code" className="text-xs sm:text-sm">Code complet (optionnel)</Label>
            <Textarea
              id="edit_pixel_code"
              placeholder="Collez le code complet du Pixel si disponible"
              value={formData.pixel_code}
              onChange={(e) => setFormData({ ...formData, pixel_code: e.target.value })}
              rows={4}
              className="text-xs sm:text-sm"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="edit_is_active" className="text-xs sm:text-sm">Activer le Pixel</Label>
              <p className="text-xs text-muted-foreground">
                Le Pixel sera injecté sur vos pages de vente
              </p>
            </div>
            <Switch
              id="edit_is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 sm:pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-9 sm:h-10 text-xs sm:text-sm">
              Annuler
            </Button>
            <Button type="submit" className="h-9 sm:h-10 text-xs sm:text-sm bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              Enregistrer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

EditPixelDialogComponent.displayName = 'EditPixelDialogComponent';

// Optimisation avec React.memo pour éviter les re-renders inutiles
export const EditPixelDialog = React.memo(EditPixelDialogComponent, (prevProps, nextProps) => {
  return (
    prevProps.open === nextProps.open &&
    prevProps.onOpenChange === nextProps.onOpenChange &&
    prevProps.pixel?.id === nextProps.pixel?.id &&
    prevProps.pixel?.pixel_type === nextProps.pixel?.pixel_type &&
    prevProps.pixel?.is_active === nextProps.pixel?.is_active
  );
});

EditPixelDialog.displayName = 'EditPixelDialog';
