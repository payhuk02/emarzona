import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Moon, Sun } from "lucide-react";
import { useDarkMode } from "@/hooks/useDarkMode";

export const NotificationSettings = () => {
  const { toast } = useToast();
  const { isDark, toggle } = useDarkMode();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    emailOrders: true,
    emailProducts: true,
    emailPromotions: false,
    emailNewsletter: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulation de sauvegarde
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Succès",
        description: "Préférences de notifications mises à jour",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* Theme Toggle */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
          <div className="space-y-0.5">
            <Label htmlFor="darkMode" className="flex items-center gap-2">
              {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              Mode {isDark ? "sombre" : "clair"}
            </Label>
            <p className="text-sm text-muted-foreground">
              Basculer entre le thème clair et sombre
            </p>
          </div>
          <Switch
            id="darkMode"
            checked={isDark}
            onCheckedChange={toggle}
          />
        </div>

        <div className="border-t pt-4"></div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="emailOrders">Notifications de commandes</Label>
            <p className="text-sm text-muted-foreground">
              Recevoir un email lors de nouvelles commandes
            </p>
          </div>
          <Switch
            id="emailOrders"
            checked={settings.emailOrders}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, emailOrders: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="emailProducts">Notifications de produits</Label>
            <p className="text-sm text-muted-foreground">
              Recevoir un email lors de nouveaux produits
            </p>
          </div>
          <Switch
            id="emailProducts"
            checked={settings.emailProducts}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, emailProducts: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="emailPromotions">Notifications de promotions</Label>
            <p className="text-sm text-muted-foreground">
              Recevoir un email lors de nouvelles promotions
            </p>
          </div>
          <Switch
            id="emailPromotions"
            checked={settings.emailPromotions}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, emailPromotions: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="emailNewsletter">Newsletter</Label>
            <p className="text-sm text-muted-foreground">
              Recevoir notre newsletter hebdomadaire
            </p>
          </div>
          <Switch
            id="emailNewsletter"
            checked={settings.emailNewsletter}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, emailNewsletter: checked })
            }
          />
        </div>
      </div>

      <Button type="submit" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Enregistrer les préférences
      </Button>
    </form>
  );
};
