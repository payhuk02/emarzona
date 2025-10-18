import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";
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

  const handleSubmit = async (e: React.FormEvent) => {
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
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Ajouter un Pixel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ajouter un nouveau Pixel</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pixel_type">Type de Pixel *</Label>
            <Select
              value={formData.pixel_type}
              onValueChange={(value) => setFormData({ ...formData, pixel_type: value })}
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
            <Label htmlFor="pixel_name">Nom du Pixel (optionnel)</Label>
            <Input
              id="pixel_name"
              placeholder="Ex: Campagne Printemps 2024"
              value={formData.pixel_name}
              onChange={(e) => setFormData({ ...formData, pixel_name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pixel_id">ID ou Code du Pixel *</Label>
            <Input
              id="pixel_id"
              placeholder="Ex: 123456789012345"
              value={formData.pixel_id}
              onChange={(e) => setFormData({ ...formData, pixel_id: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pixel_code">Code complet (optionnel)</Label>
            <Textarea
              id="pixel_code"
              placeholder="Collez le code complet du Pixel si disponible"
              value={formData.pixel_code}
              onChange={(e) => setFormData({ ...formData, pixel_code: e.target.value })}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Pour les codes personnalisés ou si vous souhaitez coller le script complet
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="is_active">Activer le Pixel</Label>
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

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit">
              Créer le Pixel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
