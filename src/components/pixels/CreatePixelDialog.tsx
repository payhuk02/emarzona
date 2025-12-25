import React, { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus } from '@/components/icons';
import { usePixels } from "@/hooks/usePixels";

export const CreatePixelDialog = () => {
  const [open, setOpen] = useState(false);
  const { createPixel } = usePixels();
  const [formData, setFormData] = useState({
    pixel_type: 'facebook',
    pixel_id: '',
    pixel_name: '',
    pixel_code: '',
    is_active: true,
  });

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await createPixel(formData);
    if (success) {
      setOpen(false);
      setFormData({
        pixel_type: 'facebook',
        pixel_id: '',
        pixel_name: '',
        pixel_code: '',
        is_active: true,
      });
    }
  }, [formData, createPixel]);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 h-9 sm:h-10 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline text-xs sm:text-sm">Ajouter un Pixel</span>
          <span className="sm:hidden text-xs">Ajouter</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[90vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">Ajouter un nouveau Pixel</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pixel_type" className="text-xs sm:text-sm">Type de Pixel *</Label>
            <Select
              value={formData.pixel_type}
              onValueChange={(value) => setFormData({ ...formData, pixel_type: value })}
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
            <Label htmlFor="pixel_name" className="text-xs sm:text-sm">Nom du Pixel (optionnel)</Label>
            <Input
              id="pixel_name"
              placeholder="Ex: Campagne Printemps 2024"
              value={formData.pixel_name}
              onChange={(e) => setFormData({ ...formData, pixel_name: e.target.value })}
              className="h-9 sm:h-10 text-xs sm:text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pixel_id" className="text-xs sm:text-sm">ID ou Code du Pixel *</Label>
            <Input
              id="pixel_id"
              placeholder="Ex: 123456789012345"
              value={formData.pixel_id}
              onChange={(e) => setFormData({ ...formData, pixel_id: e.target.value })}
              required
              className="h-9 sm:h-10 text-xs sm:text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pixel_code" className="text-xs sm:text-sm">Code complet (optionnel)</Label>
            <Textarea
              id="pixel_code"
              placeholder="Collez le code complet du Pixel si disponible"
              value={formData.pixel_code}
              onChange={(e) => setFormData({ ...formData, pixel_code: e.target.value })}
              rows={4}
              className="text-xs sm:text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Pour les codes personnalisés ou si vous souhaitez coller le script complet
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="is_active" className="text-xs sm:text-sm">Activer le Pixel</Label>
              <p className="text-xs text-muted-foreground">
                Le Pixel sera injecté sur vos pages de vente
              </p>
            </div>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 sm:pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="h-9 sm:h-10 text-xs sm:text-sm">
              Annuler
            </Button>
            <Button type="submit" className="h-9 sm:h-10 text-xs sm:text-sm bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              Créer le Pixel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
