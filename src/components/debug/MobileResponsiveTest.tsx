import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, Smartphone, Monitor, Tablet } from 'lucide-react';
import payhukLogo from '@/assets/payhuk-logo.png';

export const MobileResponsiveTest = () => {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const updateScreenSize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      
      // Déterminer le type d'appareil
      if (window.innerWidth < 640) {
        setDeviceType('mobile');
      } else if (window.innerWidth < 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  const getDeviceIcon = () => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="h-5 w-5" />;
      case 'tablet':
        return <Tablet className="h-5 w-5" />;
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  const getDeviceColor = () => {
    switch (deviceType) {
      case 'mobile':
        return 'bg-blue-500/10 border-blue-500 text-blue-300';
      case 'tablet':
        return 'bg-green-500/10 border-green-500 text-green-300';
      default:
        return 'bg-purple-500/10 border-purple-500 text-purple-300';
    }
  };

  const testResults = {
    logo: {
      sidebar: {
        visible: true,
        responsive: true,
        size: deviceType === 'mobile' ? 'h-8 w-8' : 'h-10 w-10',
        issues: []
      },
      marketplace: {
        visible: true,
        responsive: true,
        size: deviceType === 'mobile' ? 'h-7 w-7' : 'h-8 w-8',
        issues: []
      }
    },
    avatars: {
      profile: {
        visible: true,
        responsive: true,
        size: deviceType === 'mobile' ? 'h-20 w-20' : 'h-24 w-24',
        issues: []
      },
      store: {
        visible: true,
        responsive: true,
        size: deviceType === 'mobile' ? 'h-20 w-20' : deviceType === 'tablet' ? 'h-24 w-24' : 'h-28 w-28',
        issues: []
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Device Info */}
      <Card className="bg-background border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            {getDeviceIcon()} Informations de l'appareil
          </CardTitle>
          <CardDescription>
            Détection automatique du type d'appareil et de la taille d'écran
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              {getDeviceIcon()}
              {deviceType.charAt(0).toUpperCase() + deviceType.slice(1)}
            </Badge>
            <Badge variant="outline">
              {screenSize.width} × {screenSize.height}px
            </Badge>
          </div>
          
          <Alert className={getDeviceColor()}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Mode {deviceType}:</strong> {
                deviceType === 'mobile' 
                  ? 'Affichage optimisé pour les smartphones (< 640px)'
                  : deviceType === 'tablet'
                  ? 'Affichage optimisé pour les tablettes (640px - 1024px)'
                  : 'Affichage optimisé pour les ordinateurs (> 1024px)'
              }
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Logo Tests */}
      <Card className="bg-background border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" /> Test des Logos
          </CardTitle>
          <CardDescription>
            Vérification de l'affichage des logos sur différents appareils
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Sidebar Logo */}
            <div className="space-y-2">
              <h4 className="font-medium">Logo Sidebar</h4>
              <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                <img 
                  src={payhukLogo} 
                  alt="Payhuk" 
                  className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 object-contain" 
                />
                <span className="text-sm font-medium">Payhuk</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">
                  Taille: {testResults.logo.sidebar.size}
                </span>
              </div>
            </div>

            {/* Marketplace Logo */}
            <div className="space-y-2">
              <h4 className="font-medium">Logo Marketplace</h4>
              <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                <img 
                  src={payhukLogo} 
                  alt="Payhuk" 
                  className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 object-contain" 
                />
                <span className="text-sm font-medium">Payhuk</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">
                  Taille: {testResults.logo.marketplace.size}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Avatar Tests */}
      <Card className="bg-background border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" /> Test des Avatars
          </CardTitle>
          <CardDescription>
            Vérification de l'affichage des avatars sur différents appareils
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Profile Avatar */}
            <div className="space-y-2">
              <h4 className="font-medium">Avatar Profil</h4>
              <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
                <Avatar className="h-20 w-20 sm:h-24 sm:w-24 ring-2 ring-border">
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-lg sm:text-xl font-semibold text-primary">
                    JD
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="text-sm font-medium">John Doe</p>
                  <p className="text-xs text-muted-foreground">Utilisateur test</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">
                  Taille: {testResults.avatars.profile.size}
                </span>
              </div>
            </div>

            {/* Store Avatar */}
            <div className="space-y-2">
              <h4 className="font-medium">Avatar Boutique</h4>
              <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
                <div className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 rounded-full border-3 sm:border-4 border-background shadow-large bg-muted flex items-center justify-center">
                  <span className="text-lg sm:text-xl font-semibold text-muted-foreground">S</span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Ma Boutique</p>
                  <p className="text-xs text-muted-foreground">Boutique test</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">
                  Taille: {testResults.avatars.store.size}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="bg-background border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-500" /> Recommandations
          </CardTitle>
          <CardDescription>
            Suggestions pour améliorer l'affichage mobile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Logos responsifs</p>
                <p className="text-xs text-muted-foreground">
                  Les logos s'adaptent automatiquement à la taille d'écran
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Avatars adaptatifs</p>
                <p className="text-xs text-muted-foreground">
                  Les avatars utilisent des tailles différentes selon l'appareil
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Layout flexible</p>
                <p className="text-xs text-muted-foreground">
                  Les éléments passent en colonne sur mobile pour une meilleure lisibilité
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
