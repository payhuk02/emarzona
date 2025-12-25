/**
 * StoreThemeSettings Component
 * Composant pour la personnalisation du thème et des couleurs de la boutique
 * Phase 1 - Fonctionnalités avancées
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Palette, Type, Layout } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface StoreThemeSettingsProps {
  // Couleurs
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  textSecondaryColor: string;
  buttonPrimaryColor: string;
  buttonPrimaryText: string;
  buttonSecondaryColor: string;
  buttonSecondaryText: string;
  linkColor: string;
  linkHoverColor: string;
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  shadowIntensity: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  // Typographie
  headingFont: string;
  bodyFont: string;
  fontSizeBase: string;
  headingSizeH1: string;
  headingSizeH2: string;
  headingSizeH3: string;
  lineHeight: string;
  letterSpacing: string;
  // Layout
  headerStyle: 'minimal' | 'standard' | 'extended';
  footerStyle: 'minimal' | 'standard' | 'extended';
  sidebarEnabled: boolean;
  sidebarPosition: 'left' | 'right';
  productGridColumns: number;
  productCardStyle: 'minimal' | 'standard' | 'detailed';
  navigationStyle: 'horizontal' | 'vertical' | 'mega';
  // Callbacks
  onColorChange: (field: string, value: string) => void;
  onTypographyChange: (field: string, value: string) => void;
  onLayoutChange: (field: string, value: any) => void;
}

const AVAILABLE_FONTS = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Raleway', label: 'Raleway' },
  { value: 'Ubuntu', label: 'Ubuntu' },
  { value: 'Nunito', label: 'Nunito' },
  { value: 'Playfair Display', label: 'Playfair Display' },
];

export const StoreThemeSettings: React.FC<StoreThemeSettingsProps> = ({
  primaryColor,
  secondaryColor,
  accentColor,
  backgroundColor,
  textColor,
  textSecondaryColor,
  buttonPrimaryColor,
  buttonPrimaryText,
  buttonSecondaryColor,
  buttonSecondaryText,
  linkColor,
  linkHoverColor,
  borderRadius,
  shadowIntensity,
  headingFont,
  bodyFont,
  fontSizeBase,
  headingSizeH1,
  headingSizeH2,
  headingSizeH3,
  lineHeight,
  letterSpacing,
  headerStyle,
  footerStyle,
  sidebarEnabled,
  sidebarPosition,
  productGridColumns,
  productCardStyle,
  navigationStyle,
  onColorChange,
  onTypographyChange,
  onLayoutChange,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Personnalisation du thème
        </CardTitle>
        <CardDescription>
          Personnalisez les couleurs, la typographie et la mise en page de votre boutique
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="colors" className="w-full">
          <TabsList className="grid w-full grid-cols-3 gap-1 sm:gap-2">
            <TabsTrigger value="colors" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Palette className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Couleurs</span>
              <span className="sm:hidden">Couleurs</span>
            </TabsTrigger>
            <TabsTrigger value="typography" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Type className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Typographie</span>
              <span className="sm:hidden">Typo</span>
            </TabsTrigger>
            <TabsTrigger value="layout" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Layout className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Layout</span>
              <span className="sm:hidden">Layout</span>
            </TabsTrigger>
          </TabsList>

          {/* Onglet Couleurs */}
          <TabsContent value="colors" className="space-y-6 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary_color">Couleur principale</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="primary_color"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => onColorChange('primary_color', e.target.value)}
                    className="h-10 w-20 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => onColorChange('primary_color', e.target.value)}
                    placeholder="#3b82f6"
                    className="flex-1 font-mono text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondary_color">Couleur secondaire</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="secondary_color"
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => onColorChange('secondary_color', e.target.value)}
                    className="h-10 w-20 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => onColorChange('secondary_color', e.target.value)}
                    placeholder="#8b5cf6"
                    className="flex-1 font-mono text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accent_color">Couleur d'accentuation</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="accent_color"
                    type="color"
                    value={accentColor}
                    onChange={(e) => onColorChange('accent_color', e.target.value)}
                    className="h-10 w-20 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={accentColor}
                    onChange={(e) => onColorChange('accent_color', e.target.value)}
                    placeholder="#f59e0b"
                    className="flex-1 font-mono text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="background_color">Couleur de fond</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="background_color"
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => onColorChange('background_color', e.target.value)}
                    className="h-10 w-20 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => onColorChange('background_color', e.target.value)}
                    placeholder="#ffffff"
                    className="flex-1 font-mono text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="text_color">Couleur du texte</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="text_color"
                    type="color"
                    value={textColor}
                    onChange={(e) => onColorChange('text_color', e.target.value)}
                    className="h-10 w-20 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={textColor}
                    onChange={(e) => onColorChange('text_color', e.target.value)}
                    placeholder="#1f2937"
                    className="flex-1 font-mono text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="text_secondary_color">Couleur texte secondaire</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="text_secondary_color"
                    type="color"
                    value={textSecondaryColor}
                    onChange={(e) => onColorChange('text_secondary_color', e.target.value)}
                    className="h-10 w-20 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={textSecondaryColor}
                    onChange={(e) => onColorChange('text_secondary_color', e.target.value)}
                    placeholder="#6b7280"
                    className="flex-1 font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-4">Boutons</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="button_primary_color">Couleur bouton principal</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="button_primary_color"
                      type="color"
                      value={buttonPrimaryColor}
                      onChange={(e) => onColorChange('button_primary_color', e.target.value)}
                      className="h-10 w-20 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={buttonPrimaryColor}
                      onChange={(e) => onColorChange('button_primary_color', e.target.value)}
                      className="flex-1 font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="button_primary_text">Texte bouton principal</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="button_primary_text"
                      type="color"
                      value={buttonPrimaryText}
                      onChange={(e) => onColorChange('button_primary_text', e.target.value)}
                      className="h-10 w-20 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={buttonPrimaryText}
                      onChange={(e) => onColorChange('button_primary_text', e.target.value)}
                      className="flex-1 font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="button_secondary_color">Couleur bouton secondaire</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="button_secondary_color"
                      type="color"
                      value={buttonSecondaryColor}
                      onChange={(e) => onColorChange('button_secondary_color', e.target.value)}
                      className="h-10 w-20 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={buttonSecondaryColor}
                      onChange={(e) => onColorChange('button_secondary_color', e.target.value)}
                      className="flex-1 font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="button_secondary_text">Texte bouton secondaire</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="button_secondary_text"
                      type="color"
                      value={buttonSecondaryText}
                      onChange={(e) => onColorChange('button_secondary_text', e.target.value)}
                      className="h-10 w-20 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={buttonSecondaryText}
                      onChange={(e) => onColorChange('button_secondary_text', e.target.value)}
                      className="flex-1 font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-4">Liens et style</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="link_color">Couleur des liens</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="link_color"
                      type="color"
                      value={linkColor}
                      onChange={(e) => onColorChange('link_color', e.target.value)}
                      className="h-10 w-20 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={linkColor}
                      onChange={(e) => onColorChange('link_color', e.target.value)}
                      className="flex-1 font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="link_hover_color">Couleur liens au survol</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="link_hover_color"
                      type="color"
                      value={linkHoverColor}
                      onChange={(e) => onColorChange('link_hover_color', e.target.value)}
                      className="h-10 w-20 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={linkHoverColor}
                      onChange={(e) => onColorChange('link_hover_color', e.target.value)}
                      className="flex-1 font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="border_radius">Rayon des bordures</Label>
                  <Select value={borderRadius} onValueChange={(v) => onColorChange('border_radius', v)}>
                    <SelectTrigger id="border_radius">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun</SelectItem>
                      <SelectItem value="sm">Petit</SelectItem>
                      <SelectItem value="md">Moyen</SelectItem>
                      <SelectItem value="lg">Grand</SelectItem>
                      <SelectItem value="xl">Très grand</SelectItem>
                      <SelectItem value="full">Complet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shadow_intensity">Intensité des ombres</Label>
                  <Select value={shadowIntensity} onValueChange={(v) => onColorChange('shadow_intensity', v)}>
                    <SelectTrigger id="shadow_intensity">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucune</SelectItem>
                      <SelectItem value="sm">Petite</SelectItem>
                      <SelectItem value="md">Moyenne</SelectItem>
                      <SelectItem value="lg">Grande</SelectItem>
                      <SelectItem value="xl">Très grande</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Aperçu */}
            <div className="border-t pt-4">
              <Label>Aperçu du thème</Label>
              <div 
                className="p-6 rounded-lg mt-2"
                style={{
                  backgroundColor: backgroundColor,
                  color: textColor,
                  borderRadius: borderRadius === 'none' ? '0' : borderRadius === 'sm' ? '0.125rem' : borderRadius === 'md' ? '0.375rem' : borderRadius === 'lg' ? '0.5rem' : borderRadius === 'xl' ? '0.75rem' : '9999px',
                }}
              >
                <h3 style={{ color: primaryColor, fontFamily: headingFont }}>Titre de la boutique</h3>
                <p style={{ color: textSecondaryColor, fontFamily: bodyFont }} className="mt-2">
                  Description de votre boutique avec un texte secondaire.
                </p>
                <div className="flex gap-2 mt-4">
                  <button
                    style={{
                      backgroundColor: buttonPrimaryColor,
                      color: buttonPrimaryText,
                      borderRadius: borderRadius === 'none' ? '0' : borderRadius === 'sm' ? '0.125rem' : borderRadius === 'md' ? '0.375rem' : borderRadius === 'lg' ? '0.5rem' : borderRadius === 'xl' ? '0.75rem' : '9999px',
                    }}
                    className="px-4 py-2"
                  >
                    Bouton principal
                  </button>
                  <button
                    style={{
                      backgroundColor: buttonSecondaryColor,
                      color: buttonSecondaryText,
                      borderRadius: borderRadius === 'none' ? '0' : borderRadius === 'sm' ? '0.125rem' : borderRadius === 'md' ? '0.375rem' : borderRadius === 'lg' ? '0.5rem' : borderRadius === 'xl' ? '0.75rem' : '9999px',
                    }}
                    className="px-4 py-2"
                  >
                    Bouton secondaire
                  </button>
                </div>
                <a href="#" style={{ color: linkColor }} className="mt-4 inline-block hover:underline">
                  Lien exemple
                </a>
              </div>
            </div>
          </TabsContent>

          {/* Onglet Typographie */}
          <TabsContent value="typography" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="heading_font">Police des titres</Label>
                <Select value={headingFont} onValueChange={(v) => onTypographyChange('heading_font', v)}>
                  <SelectTrigger id="heading_font">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_FONTS.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        {font.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="body_font">Police du corps</Label>
                <Select value={bodyFont} onValueChange={(v) => onTypographyChange('body_font', v)}>
                  <SelectTrigger id="body_font">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_FONTS.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        {font.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="font_size_base">Taille de base</Label>
                <Input
                  id="font_size_base"
                  value={fontSizeBase}
                  onChange={(e) => onTypographyChange('font_size_base', e.target.value)}
                  placeholder="16px"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="line_height">Hauteur de ligne</Label>
                <Input
                  id="line_height"
                  value={lineHeight}
                  onChange={(e) => onTypographyChange('line_height', e.target.value)}
                  placeholder="1.6"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="heading_size_h1">Taille H1</Label>
                <Input
                  id="heading_size_h1"
                  value={headingSizeH1}
                  onChange={(e) => onTypographyChange('heading_size_h1', e.target.value)}
                  placeholder="2.5rem"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="heading_size_h2">Taille H2</Label>
                <Input
                  id="heading_size_h2"
                  value={headingSizeH2}
                  onChange={(e) => onTypographyChange('heading_size_h2', e.target.value)}
                  placeholder="2rem"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="heading_size_h3">Taille H3</Label>
                <Input
                  id="heading_size_h3"
                  value={headingSizeH3}
                  onChange={(e) => onTypographyChange('heading_size_h3', e.target.value)}
                  placeholder="1.5rem"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="letter_spacing">Espacement des lettres</Label>
                <Input
                  id="letter_spacing"
                  value={letterSpacing}
                  onChange={(e) => onTypographyChange('letter_spacing', e.target.value)}
                  placeholder="normal"
                />
              </div>
            </div>

            {/* Aperçu typographie */}
            <div className="border-t pt-4">
              <Label>Aperçu typographique</Label>
              <div className="mt-2 p-4 border rounded-lg">
                <h1 style={{ fontFamily: headingFont, fontSize: headingSizeH1, lineHeight, letterSpacing }}>
                  Titre H1 - {headingFont}
                </h1>
                <h2 style={{ fontFamily: headingFont, fontSize: headingSizeH2, lineHeight, letterSpacing }} className="mt-2">
                  Titre H2 - {headingFont}
                </h2>
                <h3 style={{ fontFamily: headingFont, fontSize: headingSizeH3, lineHeight, letterSpacing }} className="mt-2">
                  Titre H3 - {headingFont}
                </h3>
                <p style={{ fontFamily: bodyFont, fontSize: fontSizeBase, lineHeight, letterSpacing }} className="mt-4">
                  Ceci est un paragraphe de texte avec la police {bodyFont} et une taille de {fontSizeBase}. 
                  La hauteur de ligne est de {lineHeight} et l'espacement des lettres est {letterSpacing}.
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Onglet Layout */}
          <TabsContent value="layout" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="header_style">Style du header</Label>
                <Select value={headerStyle} onValueChange={(v) => onLayoutChange('header_style', v)}>
                  <SelectTrigger id="header_style">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="extended">Étendu</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="footer_style">Style du footer</Label>
                <Select value={footerStyle} onValueChange={(v) => onLayoutChange('footer_style', v)}>
                  <SelectTrigger id="footer_style">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="extended">Étendu</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="product_grid_columns">Colonnes grille produits</Label>
                <Select value={productGridColumns.toString()} onValueChange={(v) => onLayoutChange('product_grid_columns', parseInt(v))}>
                  <SelectTrigger id="product_grid_columns">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 colonnes</SelectItem>
                    <SelectItem value="3">3 colonnes</SelectItem>
                    <SelectItem value="4">4 colonnes</SelectItem>
                    <SelectItem value="5">5 colonnes</SelectItem>
                    <SelectItem value="6">6 colonnes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="product_card_style">Style des cartes produits</Label>
                <Select value={productCardStyle} onValueChange={(v) => onLayoutChange('product_card_style', v)}>
                  <SelectTrigger id="product_card_style">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="detailed">Détaillé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="navigation_style">Style de navigation</Label>
                <Select value={navigationStyle} onValueChange={(v) => onLayoutChange('navigation_style', v)}>
                  <SelectTrigger id="navigation_style">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="horizontal">Horizontal</SelectItem>
                    <SelectItem value="vertical">Vertical</SelectItem>
                    <SelectItem value="mega">Mega menu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

