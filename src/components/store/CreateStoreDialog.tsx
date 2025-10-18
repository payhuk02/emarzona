import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Store } from "lucide-react";
import { useStore } from "@/hooks/useStore";

export const CreateStoreDialog = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createStore } = useStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    const success = await createStore(name.trim(), description.trim() || undefined);
    setIsSubmitting(false);

    if (success) {
      setOpen(false);
      setName("");
      setDescription("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-primary">
          <Store className="h-4 w-4" />
          Créer ma boutique
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer votre boutique</DialogTitle>
          <DialogDescription>
            Choisissez un nom unique pour votre boutique. Un lien sera généré automatiquement.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="store-name">Nom de la boutique *</Label>
            <Input
              id="store-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ma Boutique Pro"
              required
            />
            {name && (
              <p className="text-xs text-muted-foreground">
                Slug généré : {name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="store-description">Description (optionnel)</Label>
            <Textarea
              id="store-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez votre boutique..."
              rows={3}
            />
          </div>
          <Button
            type="submit"
            className="w-full gradient-primary"
            disabled={isSubmitting || !name.trim()}
          >
            {isSubmitting ? "Création..." : "Créer la boutique"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
