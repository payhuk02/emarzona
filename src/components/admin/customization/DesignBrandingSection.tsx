/**
 * Section Design & Branding
 * Permet de personnaliser les couleurs, logos, typographie
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Upload,
  RefreshCw,
  Loader2,
  X,
  Settings,
  Box,
  Palette,
  Image as ImageIcon,
  Type,
  Save,
} from 'lucide-react';
import { usePlatformCustomization } from '@/hooks/admin/usePlatformCustomization';
import { designTokens } from '@/lib/design-system';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DesignBrandingSectionProps {
  onChange?: () => void;
}

export const DesignBrandingSection = ({ onChange }: DesignBrandingSectionProps) => {
  const { customizationData, setCustomizationData, save } = usePlatformCustomization();
  const { toast } = useToast();
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [localColors, setLocalColors] = useState({
    primary: customizationData?.design?.colors?.primary || 'hsl(210, 100%, 60%)',
    secondary: customizationData?.design?.colors?.secondary || 'hsl(220, 20%, 50%)',
    accent: customizationData?.design?.colors?.accent || 'hsl(45, 100%, 60%)',
    success: customizationData?.design?.colors?.success || 'hsl(142, 71%, 45%)',
    warning: customizationData?.design?.colors?.warning || 'hsl(38, 92%, 50%)',
    error: customizationData?.design?.colors?.error || 'hsl(0, 84%, 60%)',
  });

  const [localTheme, setLocalTheme] = useState<'light' | 'dark' | 'auto'>(
    customizationData?.design?.theme || 'auto'
  );

  const [localTypography, setLocalTypography] = useState({
    fontFamily:
      customizationData?.design?.typography?.fontFamily ||
      designTokens.typography.fontFamily.sans.join(', '),
    fontSize: customizationData?.design?.typography?.fontSize || designTokens.typography.fontSize,
  });

  const [localDesignTokens, setLocalDesignTokens] = useState({
    borderRadius: customizationData?.design?.tokens?.borderRadius || designTokens.borderRadius.md,
    shadow: customizationData?.design?.tokens?.shadow || 'md',
    spacing: customizationData?.design?.tokens?.spacing || '4',
  });

  const [uploadingLogo, setUploadingLogo] = useState<{ [key: string]: boolean }>({});
  const logoInputRefs = {
    light: useRef<HTMLInputElement>(null),
    dark: useRef<HTMLInputElement>(null),
    favicon: useRef<HTMLInputElement>(null),
  };

  // Synchroniser avec les données chargées
  useEffect(() => {
    if (customizationData?.design) {
      if (customizationData.design.colors) {
        setLocalColors(prev => ({
          ...prev,
          ...customizationData.design?.colors,
        }));
      }
      if (customizationData.design.theme) {
        setLocalTheme(customizationData.design.theme);
      }
      if (customizationData.design.typography) {
        setLocalTypography({
          fontFamily:
            customizationData.design.typography.fontFamily ||
            designTokens.typography.fontFamily.sans.join(', '),
          fontSize:
            customizationData.design.typography.fontSize || designTokens.typography.fontSize,
        });
      }
      if (customizationData.design.tokens) {
        setLocalDesignTokens({
          borderRadius:
            customizationData.design.tokens.borderRadius || designTokens.borderRadius.md,
          shadow: customizationData.design.tokens.shadow || 'md',
          spacing: customizationData.design.tokens.spacing || '4',
        });
      }
    }
  }, [customizationData]);

  // Debounce pour éviter trop de notifications
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onChange) onChange();
    }, 300);
    return () => clearTimeout(timer);
  }, [localColors, localTheme, localTypography, localDesignTokens, onChange]);

  const handleColorChange = (colorKey: keyof typeof localColors, value: string) => {
    setLocalColors(prev => ({ ...prev, [colorKey]: value }));

    // Mettre à jour l'état local pour l'application en temps réel
    setCustomizationData(prev => ({
      ...prev,
      design: {
        ...prev?.design,
        colors: {
          ...prev?.design?.colors,
          [colorKey]: value,
        },
      },
    }));

    // Application en temps réel
    applyColorInRealTime(colorKey, value);

    // Sauvegarder dans Supabase
    save('design', {
      ...customizationData?.design,
      colors: {
        ...localColors,
        [colorKey]: value,
      },
    }).catch(error => {
      logger.error('Error saving color customization', { error, colorKey, value });
    });
  };

  const applyColorInRealTime = (colorKey: string, value: string) => {
    const root = document.documentElement;
    let hslValue = value;

    // Convertir HSL si nécessaire
    if (value.startsWith('hsl(')) {
      hslValue = value.replace('hsl(', '').replace(')', '');
    }

    // Mapper les clés aux variables CSS
    const cssVarMap: Record<string, string> = {
      primary: '--primary',
      secondary: '--secondary',
      accent: '--accent',
      success: '--success',
      warning: '--warning',
      error: '--destructive',
    };

    const cssVar = cssVarMap[colorKey];
    if (cssVar) {
      root.style.setProperty(cssVar, hslValue);

      // Appliquer aussi les variantes
      if (colorKey === 'primary') {
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--ring', hslValue);
      } else if (colorKey === 'secondary') {
        root.style.setProperty('--secondary-foreground', '0 0% 98%');
      } else if (colorKey === 'accent') {
        root.style.setProperty('--accent-foreground', '220 30% 12%');
      }
    }
  };

  const handleTypographyChange = (key: string, value: string) => {
    if (key === 'fontFamily') {
      setLocalTypography(prev => ({ ...prev, fontFamily: value }));
    } else {
      setLocalTypography(prev => ({
        ...prev,
        fontSize: { ...prev.fontSize, [key]: value },
      }));
    }

    // Mettre à jour l'état local
    setCustomizationData(prev => ({
      ...prev,
      design: {
        ...prev?.design,
        typography: {
          ...prev?.design?.typography,
          [key === 'fontFamily' ? 'fontFamily' : 'fontSize']:
            key === 'fontFamily'
              ? value
              : {
                  ...prev?.design?.typography?.fontSize,
                  [key]: value,
                },
        },
      },
    }));

    // Sauvegarder dans Supabase
    const updatedTypography =
      key === 'fontFamily'
        ? { ...localTypography, fontFamily: value }
        : { ...localTypography, fontSize: { ...localTypography.fontSize, [key]: value } };

    save('design', {
      ...customizationData?.design,
      typography: updatedTypography,
    }).catch(error => {
      logger.error('Error saving typography customization', { error, key, value });
    });
  };

  const handleLogoUpload = async (type: 'light' | 'dark' | 'favicon', file: File) => {
    // Validation
    const allowedTypes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/svg+xml',
      'image/webp',
      'image/x-icon',
    ];
    const maxSize = type === 'favicon' ? 1024 * 100 : 1024 * 1024 * 2; // 100KB pour favicon, 2MB pour logos

    // Vérifier le type MIME du fichier
    if (!file.type || !allowedTypes.includes(file.type)) {
      // Si le type MIME n'est pas détecté, essayer de le déterminer depuis l'extension
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const extToMime: Record<string, string> = {
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        svg: 'image/svg+xml',
        webp: 'image/webp',
        ico: 'image/x-icon',
      };

      if (!fileExt || !extToMime[fileExt]) {
        toast({
          title: 'Format non supporté',
          description: 'Veuillez utiliser PNG, JPG, SVG, WebP ou ICO',
          variant: 'destructive',
        });
        return;
      }
    }

    if (file.size > maxSize) {
      toast({
        title: 'Fichier trop volumineux',
        description: `Taille maximale : ${type === 'favicon' ? '100KB' : '2MB'}`,
        variant: 'destructive',
      });
      return;
    }

    setUploadingLogo(prev => ({ ...prev, [type]: true }));

    try {
      // Générer un nom de fichier unique
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
      // S'assurer que le chemin ne contient pas de duplication
      const fileName = `logos/${type}-${Date.now()}.${fileExt}`;

      // Vérifier que le fichier est bien un File
      if (!(file instanceof File)) {
        throw new Error("Le fichier n'est pas valide. Type: " + typeof file);
      }

      // Vérifier que le fichier a bien un contenu
      if (file.size === 0) {
        throw new Error('Le fichier est vide');
      }

      // Vérifier que le type MIME est valide ou le déterminer depuis l'extension
      const allowedMimeTypes = [
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/svg+xml',
        'image/webp',
        'image/x-icon',
        'image/vnd.microsoft.icon',
      ];
      let fileType = file.type;

      // Si le type MIME n'est pas valide, le déterminer depuis l'extension
      if (!fileType || !allowedMimeTypes.includes(fileType)) {
        const extToMime: Record<string, string> = {
          png: 'image/png',
          jpg: 'image/jpeg',
          jpeg: 'image/jpeg',
          svg: 'image/svg+xml',
          webp: 'image/webp',
          ico: 'image/x-icon',
        };
        fileType = fileExt ? extToMime[fileExt] || 'image/png' : 'image/png';
      }

      // Vérifier les permissions de l'utilisateur avant l'upload
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }

      // Vérifier que l'utilisateur est admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_super_admin, role')
        .eq('user_id', user.id)
        .single();

      const isAdmin =
        profile?.is_super_admin ||
        profile?.role === 'admin' ||
        user.email === 'contact@edigit-agence.com';

      if (!isAdmin) {
        throw new Error(
          'Permissions insuffisantes. Seuls les administrateurs peuvent uploader des logos.'
        );
      }

      logger.debug('Uploading logo', {
        fileName,
        originalFileType: file.type,
        correctedFileType: fileType,
        fileSize: file.size,
        bucket: 'platform-assets',
        fileExt,
        fileOriginalName: file.name,
        isFile: file instanceof File,
        constructor: file.constructor.name,
        userId: user.id,
        isAdmin,
      });

      // Obtenir la session pour l'authentification
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }

      // Utiliser XMLHttpRequest directement pour avoir plus de contrôle
      // Cette approche est utilisée dans uploadToSupabase.ts et fonctionne bien
      const projectUrl = supabase.supabaseUrl;
      const uploadUrl = `${projectUrl}/storage/v1/object/platform-assets/${fileName}`;

      const uploadData = await new Promise<{ path: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', e => {
          if (e.lengthComputable) {
            const progress = (e.loaded / e.total) * 100;
            logger.debug('Upload progress', { progress, loaded: e.loaded, total: e.total });
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve({ path: response.path || fileName });
            } catch {
              resolve({ path: fileName });
            }
          } else {
            try {
              const error = JSON.parse(xhr.responseText);
              reject(
                new Error(
                  error.message || error.error || `Erreur upload: ${xhr.statusText} (${xhr.status})`
                )
              );
            } catch {
              reject(new Error(`Erreur upload: ${xhr.statusText} (${xhr.status})`));
            }
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error("Erreur réseau lors de l'upload"));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload annulé'));
        });

        xhr.open('POST', uploadUrl);
        xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
        xhr.setRequestHeader('Content-Type', fileType); // CRITIQUE : Forcer le Content-Type
        xhr.setRequestHeader('x-upsert', 'true'); // Permettre le remplacement
        xhr.setRequestHeader('cache-control', '3600');

        xhr.send(file);
      });

      // Si on arrive ici, l'upload a réussi
      logger.info('Logo uploaded successfully', {
        fileName,
        path: uploadData.path,
        fileType: fileType,
        fileSize: file.size,
      });

      // Récupérer l'URL publique
      const {
        data: { publicUrl },
      } = supabase.storage.from('platform-assets').getPublicUrl(fileName);

      logger.debug('Public URL generated', {
        publicUrl,
        fileName,
        type,
      });

      // Sauvegarder l'URL dans la configuration
      const logoData = {
        ...customizationData?.design,
        logo: {
          ...customizationData?.design?.logo,
          [type]: publicUrl,
        },
      };

      logger.debug('Saving logo URL to configuration', {
        type,
        publicUrl: publicUrl.substring(0, 80) + '...',
        hasExistingLogo: !!customizationData?.design?.logo,
        existingLogos: {
          light: !!customizationData?.design?.logo?.light,
          dark: !!customizationData?.design?.logo?.dark,
          favicon: !!customizationData?.design?.logo?.favicon,
        },
      });

      const saveResult = await save('design', logoData);

      if (saveResult) {
        logger.info('Logo URL saved successfully', {
          type,
          publicUrl: publicUrl.substring(0, 80) + '...',
          saved: true,
        });
        toast({
          title: '✅ Logo téléchargé',
          description: `Le logo ${type} a été téléchargé et sauvegardé avec succès`,
        });
      } else {
        logger.warn('Logo uploaded but save may have failed', {
          type,
          publicUrl: publicUrl.substring(0, 80) + '...',
          saveResult,
        });
        toast({
          title: '⚠️ Logo téléchargé',
          description: `Le logo ${type} a été téléchargé. Vérifiez que la sauvegarde s'est bien effectuée.`,
          variant: 'default',
        });
      }

      if (onChange) onChange();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Impossible de télécharger le logo';
      logger.error('Error uploading logo', { error, type, fileName: file.name });
      toast({
        title: '❌ Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setUploadingLogo(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleLogoFileSelect = (
    type: 'light' | 'dark' | 'favicon',
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    // Vérifier que c'est bien un File object
    if (!(file instanceof File)) {
      toast({
        title: '❌ Erreur',
        description: "Le fichier sélectionné n'est pas valide",
        variant: 'destructive',
      });
      return;
    }

    // Appeler handleLogoUpload avec le fichier
    handleLogoUpload(type, file);

    // Reset input pour permettre de sélectionner le même fichier à nouveau
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleRemoveLogo = async (type: 'light' | 'dark' | 'favicon') => {
    await save('design', {
      ...customizationData?.design,
      logo: {
        ...customizationData?.design?.logo,
        [type]: undefined,
      },
    });
    toast({
      title: 'Logo supprimé',
      description: `Le logo ${type} a été supprimé`,
    });
    if (onChange) onChange();
  };

  const handleSave = async () => {
    await save('design', {
      colors: localColors,
      theme: localTheme,
      typography: localTypography,
      logo: customizationData?.design?.logo,
    });
  };

  const resetToDefault = useCallback(() => {
    const defaultColors = {
      primary: designTokens.colors.primary[500],
      secondary: designTokens.colors.secondary[500],
      accent: designTokens.colors.accent[500],
      success: designTokens.colors.success[500],
      warning: designTokens.colors.warning[500],
      error: designTokens.colors.error[500],
    };

    setLocalColors(defaultColors);

    // Mettre à jour l'état global
    setCustomizationData(prev => ({
      ...prev,
      design: {
        ...prev?.design,
        colors: defaultColors,
      },
    }));

    // Sauvegarder
    save('design', {
      ...customizationData?.design,
      colors: defaultColors,
    }).catch(_error => {
      toast({
        title: 'Erreur',
        description: 'Impossible de réinitialiser les couleurs',
        variant: 'destructive',
      });
    });

    if (onChange) onChange();

    toast({
      title: '✅ Réinitialisation réussie',
      description: 'Les couleurs ont été réinitialisées aux valeurs par défaut.',
    });
  }, [customizationData, setCustomizationData, save, toast, onChange]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <Tabs defaultValue="colors" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2">
          <TabsTrigger value="colors" className="text-xs sm:text-sm">
            <Palette className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Couleurs</span>
            <span className="sm:hidden">Couleurs</span>
          </TabsTrigger>
          <TabsTrigger value="logos" className="text-xs sm:text-sm">
            <ImageIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Logos</span>
            <span className="sm:hidden">Logos</span>
          </TabsTrigger>
          <TabsTrigger value="typography" className="text-xs sm:text-sm">
            <Type className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Typographie</span>
            <span className="sm:hidden">Typo</span>
          </TabsTrigger>
          <TabsTrigger value="tokens" className="text-xs sm:text-sm">
            <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Tokens</span>
            <span className="sm:hidden">Tokens</span>
          </TabsTrigger>
        </TabsList>

        {/* Couleurs */}
        <TabsContent value="colors" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Palette de couleurs</CardTitle>
                  <CardDescription>
                    Personnalisez les couleurs principales de la plateforme
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowResetDialog(true)}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Réinitialiser
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(localColors).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <Label className="capitalize">{key}</Label>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-lg border-2 border-border"
                      style={{ backgroundColor: value }}
                    />
                    <Input
                      type="text"
                      value={value}
                      onChange={e =>
                        handleColorChange(key as keyof typeof localColors, e.target.value)
                      }
                      className="flex-1"
                      placeholder="hsl(210, 100%, 60%)"
                    />
                    <Input
                      type="color"
                      value={value}
                      onChange={e =>
                        handleColorChange(key as keyof typeof localColors, e.target.value)
                      }
                      className="w-20"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thème</CardTitle>
              <CardDescription>Choisissez le thème par défaut de la plateforme</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {(['light', 'dark', 'auto'] as const).map(theme => (
                  <button
                    key={theme}
                    onClick={() => {
                      setLocalTheme(theme);
                      // Sauvegarder le thème dans Supabase
                      save('design', {
                        ...customizationData?.design,
                        theme: theme,
                      }).catch(error => {
                        logger.error('Error saving theme customization', { error, theme });
                      });
                      if (onChange) onChange();
                    }}
                    className={`
                      flex-1 p-3 sm:p-4 rounded-lg border-2 transition-all text-left
                      ${
                        localTheme === theme
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }
                    `}
                  >
                    <div className="text-sm font-medium capitalize mb-1">{theme}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">
                      {theme === 'auto' ? 'Suivre les préférences système' : `Thème ${theme}`}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logos */}
        <TabsContent value="logos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Logos et images</CardTitle>
              <CardDescription>
                Téléchargez les logos pour les thèmes clair et sombre
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Logo (Thème clair)</Label>
                  <div className="flex items-center gap-4">
                    <div className="w-32 h-16 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/50 relative">
                      {customizationData?.design?.logo?.light ? (
                        <>
                          <img
                            src={customizationData.design.logo.light}
                            alt="Logo clair"
                            className="max-w-full max-h-full object-contain"
                          />
                          <button
                            onClick={() => handleRemoveLogo('light')}
                            className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                            type="button"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </>
                      ) : (
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <input
                      ref={logoInputRefs.light}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                      onChange={e => handleLogoFileSelect('light', e)}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => logoInputRefs.light.current?.click()}
                      disabled={uploadingLogo.light}
                    >
                      {uploadingLogo.light ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Téléchargement...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Télécharger
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Formats acceptés : PNG, JPG, SVG, WebP (max 2MB)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Logo (Thème sombre)</Label>
                  <div className="flex items-center gap-4">
                    <div className="w-32 h-16 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/50 relative">
                      {customizationData?.design?.logo?.dark ? (
                        <>
                          <img
                            src={customizationData.design.logo.dark}
                            alt="Logo sombre"
                            className="max-w-full max-h-full object-contain"
                          />
                          <button
                            onClick={() => handleRemoveLogo('dark')}
                            className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                            type="button"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </>
                      ) : (
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <input
                      ref={logoInputRefs.dark}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                      onChange={e => handleLogoFileSelect('dark', e)}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => logoInputRefs.dark.current?.click()}
                      disabled={uploadingLogo.dark}
                    >
                      {uploadingLogo.dark ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Téléchargement...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Télécharger
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Formats acceptés : PNG, JPG, SVG, WebP (max 2MB)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Favicon</Label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/50 relative">
                      {customizationData?.design?.logo?.favicon ? (
                        <>
                          <img
                            src={customizationData.design.logo.favicon}
                            alt="Favicon"
                            className="max-w-full max-h-full object-contain"
                          />
                          <button
                            onClick={() => handleRemoveLogo('favicon')}
                            className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                            type="button"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </>
                      ) : (
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <input
                      ref={logoInputRefs.favicon}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/x-icon,image/svg+xml"
                      onChange={e => handleLogoFileSelect('favicon', e)}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => logoInputRefs.favicon.current?.click()}
                      disabled={uploadingLogo.favicon}
                    >
                      {uploadingLogo.favicon ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Téléchargement...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Télécharger
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Formats acceptés : PNG, JPG, ICO, SVG (max 100KB)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Typographie */}
        <TabsContent value="typography" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Typographie</CardTitle>
              <CardDescription>Configurez les polices et tailles de texte</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Famille de police principale</Label>
                <Input
                  value={localTypography.fontFamily}
                  onChange={e => handleTypographyChange('fontFamily', e.target.value)}
                  placeholder="Poppins, system-ui, sans-serif"
                />
                <p className="text-xs text-muted-foreground">
                  Séparez les polices par des virgules (ex: Poppins, Inter, sans-serif)
                </p>
              </div>
              <Separator />
              <div className="space-y-4">
                <Label>Tailles de police</Label>
                {Object.entries(localTypography.fontSize).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label className="text-sm capitalize">{key}</Label>
                    <Input
                      value={value}
                      onChange={e => handleTypographyChange(key, e.target.value)}
                      className="w-32"
                      placeholder="1rem"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Design Tokens */}
        <TabsContent value="tokens" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Box className="h-5 w-5" />
                Design Tokens
              </CardTitle>
              <CardDescription>
                Personnalisez les ombres, bordures et espacements de la plateforme
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Border Radius */}
              <div className="space-y-4">
                <Label>Rayon de bordure (Border Radius)</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
                  {Object.entries(designTokens.borderRadius).map(([key, value]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setLocalDesignTokens(prev => ({ ...prev, borderRadius: value }));
                        const updated = {
                          ...customizationData,
                          design: {
                            ...customizationData?.design,
                            tokens: {
                              ...customizationData?.design?.tokens,
                              borderRadius: value,
                            },
                          },
                        };
                        setCustomizationData(updated);
                        // Application en temps réel
                        document.documentElement.style.setProperty('--radius', value);
                        // Sauvegarder automatiquement
                        save('design', updated.design).catch(error => {
                          logger.error('Error saving border radius customization', {
                            error,
                            value,
                          });
                        });
                        if (onChange) onChange();
                      }}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        localDesignTokens.borderRadius === value
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div
                        className="w-full h-16 bg-primary/20 rounded"
                        style={{ borderRadius: value }}
                      />
                      <div className="mt-2 text-sm font-medium capitalize">{key}</div>
                      <div className="text-xs text-muted-foreground">{value}</div>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Shadows */}
              <div className="space-y-4">
                <Label>Ombres (Shadows)</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {Object.entries(designTokens.shadows).map(([key, value]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setLocalDesignTokens(prev => ({ ...prev, shadow: key }));
                        const shadows = {
                          sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                          base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                          md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                          lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                          xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                          soft: '0 4px 16px -2px hsl(220 100% 10% / 0.3)',
                          medium: '0 8px 32px -4px hsl(220 100% 10% / 0.4)',
                          large: '0 16px 64px -8px hsl(220 100% 10% / 0.5)',
                          glow: '0 0 40px hsl(210 100% 60% / 0.3)',
                        };
                        const shadowValue = shadows[key as keyof typeof shadows] || shadows.md;
                        const updated = {
                          ...customizationData,
                          design: {
                            ...customizationData?.design,
                            tokens: {
                              ...customizationData?.design?.tokens,
                              shadow: key,
                            },
                          },
                        };
                        setCustomizationData(updated);
                        // Application en temps réel
                        document.documentElement.style.setProperty('--shadow-default', shadowValue);
                        // Sauvegarder automatiquement
                        save('design', updated.design).catch(error => {
                          logger.error('Error saving shadow customization', {
                            error,
                            shadowKey: key,
                          });
                        });
                        if (onChange) onChange();
                      }}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        localDesignTokens.shadow === key
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-16 h-16 bg-card rounded-lg"
                          style={{ boxShadow: value }}
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium capitalize">{key}</div>
                          <div className="text-xs text-muted-foreground font-mono mt-1">
                            {value.substring(0, 50)}...
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Spacing */}
              <div className="space-y-4">
                <Label>Espacement de base (Base Spacing)</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                  {Object.entries(designTokens.spacing)
                    .slice(0, 8)
                    .map(([key, value]) => (
                      <button
                        key={key}
                        onClick={() => {
                          setLocalDesignTokens(prev => ({ ...prev, spacing: key }));
                          const spacingMap: Record<string, string> = {
                            '0': '0',
                            '1': '0.25rem',
                            '2': '0.5rem',
                            '3': '0.75rem',
                            '4': '1rem',
                            '5': '1.25rem',
                            '6': '1.5rem',
                            '8': '2rem',
                          };
                          const spacingValue = spacingMap[key] || '1rem';
                          const updated = {
                            ...customizationData,
                            design: {
                              ...customizationData?.design,
                              tokens: {
                                ...customizationData?.design?.tokens,
                                spacing: key,
                              },
                            },
                          };
                          setCustomizationData(updated);
                          // Application en temps réel
                          document.documentElement.style.setProperty(
                            '--spacing-base',
                            spacingValue
                          );
                          // Sauvegarder automatiquement
                          save('design', updated.design).catch(error => {
                            logger.error('Error saving spacing customization', {
                              error,
                              spacingKey: key,
                            });
                          });
                          if (onChange) onChange();
                        }}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          localDesignTokens.spacing === key
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="bg-primary rounded"
                            style={{ width: value, height: '20px' }}
                          />
                          <div>
                            <div className="text-sm font-medium">{key}</div>
                            <div className="text-xs text-muted-foreground">{value}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
        <Button
          variant="outline"
          onClick={() => setShowResetDialog(true)}
          className="w-full sm:w-auto"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Réinitialiser
        </Button>
        <Button onClick={handleSave} className="w-full sm:w-auto">
          <Save className="h-4 w-4 mr-2" />
          Sauvegarder les modifications
        </Button>
      </div>

      {/* Dialog de confirmation pour réinitialisation */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Réinitialiser les couleurs</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir réinitialiser toutes les couleurs aux valeurs par défaut ?
              <br />
              <br />
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                ⚠️ Cette action remplacera toutes vos couleurs personnalisées.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                resetToDefault();
                setShowResetDialog(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Réinitialiser
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
