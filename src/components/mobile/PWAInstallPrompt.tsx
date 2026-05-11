import React, { useState, useEffect } from 'react';
import { usePWA } from '@/hooks/usePWA';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, X, Smartphone, Zap, Bell, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

interface PWAInstallPromptProps {
  className?: string;
  showAsBanner?: boolean;
  autoShow?: boolean;
  dismissible?: boolean;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  className,
  showAsBanner = false,
  autoShow = true,
  dismissible = true,
}) => {
  const {
    canInstall,
    isInstallable,
    supportsNotifications,
    supportsWebShare,
    install,
    requestNotificationPermission,
    sendNotification,
  } = usePWA();

  const { toast } = useToast();
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    if (autoShow && canInstall && !localStorage.getItem('pwa-install-dismissed')) {
      // Small delay to avoid showing immediately on page load
      const timer = setTimeout(() => setIsVisible(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [canInstall, autoShow]);

  useEffect(() => {
    if (supportsNotifications && Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    }
  }, [supportsNotifications]);

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      await install();
      setIsVisible(false);
      toast({
        title: 'Application installée !',
        description: 'Emarzona est maintenant disponible hors ligne.',
      });
    } catch (error) {
      logger.error('Installation failed', { error });
      toast({
        title: 'Erreur d\'installation',
        description: 'Impossible d\'installer l\'application.',
        variant: 'destructive',
      });
    } finally {
      setIsInstalling(false);
    }
  };

  const handleEnableNotifications = async () => {
    try {
      const permission = await requestNotificationPermission();
      setNotificationsEnabled(permission === 'granted');

      if (permission === 'granted') {
        toast({
          title: 'Notifications activées',
          description: 'Vous recevrez maintenant des notifications importantes.',
        });

        // Send a test notification
        sendNotification('Notifications activées !', {
          body: 'Vous recevrez maintenant des mises à jour importantes d\'Emarzona.',
          icon: '/favicon.ico',
        });
      } else {
        toast({
          title: 'Notifications refusées',
          description: 'Vous pouvez les activer plus tard dans les paramètres.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      logger.error('Error requesting notification permission', { error });
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    if (dismissible) {
      localStorage.setItem('pwa-install-dismissed', 'true');
    }
  };

  if (!isVisible || !canInstall) return null;

  if (showAsBanner) {
    return (
      <div
        data-pwa-install
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-lg",
          className
        )}
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Smartphone className="h-6 w-6" />
            <div>
              <p className="font-semibold">Installez Emarzona</p>
              <p className="text-sm opacity-90">Accès rapide et hors ligne</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleInstall}
              disabled={isInstalling}
            >
              {isInstalling ? 'Installation...' : 'Installer'}
            </Button>
            {dismissible && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card data-pwa-install className={cn("w-full max-w-md mx-auto", className)}>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full w-fit">
          <Download className="h-8 w-8 text-white" />
        </div>
        <CardTitle className="text-xl">Installez Emarzona</CardTitle>
        <p className="text-muted-foreground">
          Profitez d'une expérience mobile optimale avec accès hors ligne
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4 text-green-500" />
            <span>Rapide</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Smartphone className="h-4 w-4 text-blue-500" />
            <span>Hors ligne</span>
          </div>
          {supportsNotifications && (
            <div className="flex items-center gap-2 text-sm">
              <Bell className="h-4 w-4 text-orange-500" />
              <span>Notifications</span>
            </div>
          )}
          {supportsWebShare && (
            <div className="flex items-center gap-2 text-sm">
              <Share2 className="h-4 w-4 text-purple-500" />
              <span>Partage</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleInstall}
            disabled={isInstalling}
            className="w-full"
            size="lg"
          >
            {isInstalling ? 'Installation en cours...' : 'Installer l\'application'}
          </Button>

          {supportsNotifications && !notificationsEnabled && (
            <Button
              variant="outline"
              onClick={handleEnableNotifications}
              className="w-full"
              size="sm"
            >
              <Bell className="h-4 w-4 mr-2" />
              Activer les notifications
            </Button>
          )}

          {notificationsEnabled && (
            <Badge variant="secondary" className="w-full justify-center py-2">
              <Bell className="h-4 w-4 mr-2" />
              Notifications activées
            </Badge>
          )}
        </div>

        {dismissible && (
          <Button
            variant="ghost"
            onClick={handleDismiss}
            className="w-full text-muted-foreground"
            size="sm"
          >
            Plus tard
          </Button>
        )}
      </CardContent>
    </Card>
  );
};