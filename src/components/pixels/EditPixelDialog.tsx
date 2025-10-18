import { useState, useEffect } from "react";
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

export const EditPixelDialog = ({ pixel, open, onOpenChange }: EditPixelDialogProps) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await updatePixel(pixel.id, formData);
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Modifier le Pixel</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit_pixel_type">Type de Pixel *</Label>
            <Select
              value={formData.pixel_type}
              onValueChange={(value) => setFormData({ ...formData, pixel_type: value as any })}
            >
              <SelectTrigger>
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
            <Label htmlFor="edit_pixel_name">Nom du Pixel (optionnel)</Label>
            <Input
              id="edit_pixel_name"
              placeholder="Ex: Campagne Printemps 2024"
              value={formData.pixel_name}
              onChange={(e) => setFormData({ ...formData, pixel_name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_pixel_id">ID ou Code du Pixel *</Label>
            <Input
              id="edit_pixel_id"
              placeholder="Ex: 123456789012345"
              value={formData.pixel_id}
              onChange={(e) => setFormData({ ...formData, pixel_id: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_pixel_code">Code complet (optionnel)</Label>
            <Textarea
              id="edit_pixel_code"
              placeholder="Collez le code complet du Pixel si disponible"
              value={formData.pixel_code}
              onChange={(e) => setFormData({ ...formData, pixel_code: e.target.value })}
              rows={4}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="edit_is_active">Activer le Pixel</Label>
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

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">
              Enregistrer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
