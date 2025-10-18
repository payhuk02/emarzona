import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useDarkMode } from "@/hooks/useDarkMode";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Loader2, 
  Moon, 
  Sun, 
  Bell, 
  Mail, 
  Smartphone, 
  Settings, 
  CheckCircle2, 
  AlertCircle,
  Save,
  RotateCcw,
  Volume2,
  VolumeX,
  Clock,
  Calendar,
  MessageSquare,
  ShoppingCart,
  CreditCard,
  Users,
  TrendingUp,
  Shield,
  Globe
} from "lucide-react";

interface NotificationSettings {
  // Email notifications
  emailOrders: boolean;
  emailProducts: boolean;
  emailPromotions: boolean;
  emailNewsletter: boolean;
  emailSecurity: boolean;
  emailMarketing: boolean;
  
  // Push notifications
  pushOrders: boolean;
  pushProducts: boolean;
  pushPromotions: boolean;
  pushSecurity: boolean;
  
  // SMS notifications
  smsOrders: boolean;
  smsSecurity: boolean;
  
  // Frequency settings
  emailFrequency: 'immediate' | 'daily' | 'weekly';
  pushFrequency: 'immediate' | 'batched';
  
  // Quiet hours
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  
  // Theme
  darkMode: boolean;
}

export const NotificationSettings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { isDark, toggle } = useDarkMode();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    emailOrders: true,
    emailProducts: true,
    emailPromotions: false,
    emailNewsletter: false,
    emailSecurity: true,
    emailMarketing: false,
    pushOrders: true,
    pushProducts: false,
    pushPromotions: false,
    pushSecurity: true,
    smsOrders: false,
    smsSecurity: true,
    emailFrequency: 'immediate',
    pushFrequency: 'immediate',
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    darkMode: isDark,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        setSettings(prev => ({ ...prev, ...data.settings }));
      }
    } catch (error: any) {
      console.error('Error loading notification settings:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les paramètres de notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_notification_settings')
        .upsert({
          user_id: user.id,
          settings: settings,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Paramètres de notifications sauvegardés",
      });
    } catch (error: any) {
      console.error('Error saving notification settings:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    setSettings({
      emailOrders: true,
      emailProducts: true,
      emailPromotions: false,
      emailNewsletter: false,
      emailSecurity: true,
      emailMarketing: false,
      pushOrders: true,
      pushProducts: false,
      pushPromotions: false,
      pushSecurity: true,
      smsOrders: false,
      smsSecurity: true,
      emailFrequency: 'immediate',
      pushFrequency: 'immediate',
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
      darkMode: isDark,
    });
  };

  const updateSetting = (key: keyof NotificationSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const getNotificationCount = () => {
    const enabledSettings = Object.values(settings).filter(value => value === true).length;
    return enabledSettings;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement des paramètres...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Préférences de notifications
          </h3>
          <p className="text-sm text-muted-foreground">
            Configurez comment vous souhaitez être notifié
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Bell className="h-3 w-3" />
          {getNotificationCount()} activées
        </Badge>
      </div>

      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Apparence
          </CardTitle>
          <CardDescription>
            Personnalisez l'apparence de votre interface
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Notifications par email
          </CardTitle>
          <CardDescription>
            Recevez des emails pour les événements importants
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
                <Label htmlFor="emailOrders" className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Commandes
                </Label>
            <p className="text-sm text-muted-foreground">
              Recevoir un email lors de nouvelles commandes
            </p>
          </div>
          <Switch
            id="emailOrders"
            checked={settings.emailOrders}
                onCheckedChange={(checked) => updateSetting('emailOrders', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
                <Label htmlFor="emailProducts" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Produits
                </Label>
            <p className="text-sm text-muted-foreground">
              Recevoir un email lors de nouveaux produits
            </p>
          </div>
          <Switch
            id="emailProducts"
            checked={settings.emailProducts}
                onCheckedChange={(checked) => updateSetting('emailProducts', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
                <Label htmlFor="emailPromotions" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Promotions
                </Label>
            <p className="text-sm text-muted-foreground">
              Recevoir un email lors de nouvelles promotions
            </p>
          </div>
          <Switch
            id="emailPromotions"
            checked={settings.emailPromotions}
                onCheckedChange={(checked) => updateSetting('emailPromotions', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="emailSecurity" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Sécurité
                </Label>
                <p className="text-sm text-muted-foreground">
                  Recevoir un email pour les événements de sécurité
                </p>
              </div>
              <Switch
                id="emailSecurity"
                checked={settings.emailSecurity}
                onCheckedChange={(checked) => updateSetting('emailSecurity', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
                <Label htmlFor="emailNewsletter" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Newsletter
                </Label>
            <p className="text-sm text-muted-foreground">
              Recevoir notre newsletter hebdomadaire
            </p>
          </div>
          <Switch
            id="emailNewsletter"
            checked={settings.emailNewsletter}
                onCheckedChange={(checked) => updateSetting('emailNewsletter', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="emailMarketing" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Marketing
                </Label>
                <p className="text-sm text-muted-foreground">
                  Recevoir des emails marketing et publicitaires
                </p>
              </div>
              <Switch
                id="emailMarketing"
                checked={settings.emailMarketing}
                onCheckedChange={(checked) => updateSetting('emailMarketing', checked)}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="emailFrequency">Fréquence des emails</Label>
            <Select
              value={settings.emailFrequency}
              onValueChange={(value: 'immediate' | 'daily' | 'weekly') => 
                updateSetting('emailFrequency', value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner la fréquence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immédiat</SelectItem>
                <SelectItem value="daily">Quotidien</SelectItem>
                <SelectItem value="weekly">Hebdomadaire</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Notifications push
          </CardTitle>
          <CardDescription>
            Recevez des notifications sur votre appareil
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="pushOrders" className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Commandes
                </Label>
                <p className="text-sm text-muted-foreground">
                  Notifications push pour les commandes
                </p>
              </div>
              <Switch
                id="pushOrders"
                checked={settings.pushOrders}
                onCheckedChange={(checked) => updateSetting('pushOrders', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="pushProducts" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Produits
                </Label>
                <p className="text-sm text-muted-foreground">
                  Notifications push pour les produits
                </p>
              </div>
              <Switch
                id="pushProducts"
                checked={settings.pushProducts}
                onCheckedChange={(checked) => updateSetting('pushProducts', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="pushPromotions" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Promotions
                </Label>
                <p className="text-sm text-muted-foreground">
                  Notifications push pour les promotions
                </p>
              </div>
              <Switch
                id="pushPromotions"
                checked={settings.pushPromotions}
                onCheckedChange={(checked) => updateSetting('pushPromotions', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="pushSecurity" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Sécurité
                </Label>
                <p className="text-sm text-muted-foreground">
                  Notifications push pour la sécurité
                </p>
              </div>
              <Switch
                id="pushSecurity"
                checked={settings.pushSecurity}
                onCheckedChange={(checked) => updateSetting('pushSecurity', checked)}
          />
        </div>
      </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="pushFrequency">Fréquence des notifications push</Label>
            <Select
              value={settings.pushFrequency}
              onValueChange={(value: 'immediate' | 'batched') => 
                updateSetting('pushFrequency', value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner la fréquence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immédiat</SelectItem>
                <SelectItem value="batched">Regroupées</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* SMS Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Notifications SMS
          </CardTitle>
          <CardDescription>
            Recevez des SMS pour les événements critiques
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="smsOrders" className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Commandes importantes
                </Label>
                <p className="text-sm text-muted-foreground">
                  SMS pour les commandes importantes uniquement
                </p>
              </div>
              <Switch
                id="smsOrders"
                checked={settings.smsOrders}
                onCheckedChange={(checked) => updateSetting('smsOrders', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="smsSecurity" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Sécurité
                </Label>
                <p className="text-sm text-muted-foreground">
                  SMS pour les événements de sécurité critiques
                </p>
              </div>
              <Switch
                id="smsSecurity"
                checked={settings.smsSecurity}
                onCheckedChange={(checked) => updateSetting('smsSecurity', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Heures silencieuses
          </CardTitle>
          <CardDescription>
            Désactivez les notifications pendant certaines heures
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="quietHoursEnabled">
                Activer les heures silencieuses
              </Label>
              <p className="text-sm text-muted-foreground">
                Désactiver les notifications pendant les heures de repos
              </p>
            </div>
            <Switch
              id="quietHoursEnabled"
              checked={settings.quietHoursEnabled}
              onCheckedChange={(checked) => updateSetting('quietHoursEnabled', checked)}
            />
          </div>

          {settings.quietHoursEnabled && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quietHoursStart">Début</Label>
                <input
                  id="quietHoursStart"
                  type="time"
                  value={settings.quietHoursStart}
                  onChange={(e) => updateSetting('quietHoursStart', e.target.value)}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quietHoursEnd">Fin</Label>
                <input
                  id="quietHoursEnd"
                  type="time"
                  value={settings.quietHoursEnd}
                  onChange={(e) => updateSetting('quietHoursEnd', e.target.value)}
                  className="w-full p-2 border rounded-md"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button onClick={saveSettings} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
        Enregistrer les préférences
      </Button>
        <Button variant="outline" onClick={resetToDefaults}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Réinitialiser
        </Button>
      </div>
    </div>
  );
};