import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Palette, Save } from 'lucide-react';
import { StoreFieldWithValidation } from '../StoreFieldWithValidation';
import { StoreConfigManager } from '../StoreConfigManager';
import type { Store } from '@/hooks/useStores';
import type { ExtendedStore, StoreThemeConfig } from '../types/store-form';
import { useSpaceInputFix } from '@/hooks/useSpaceInputFix';

interface StoreSettingsTabProps {
  store: ExtendedStore;
  formState: {
    name: string;
    description: string;
    contactEmail: string;
    contactPhone: string;
    about: string;
    supportEmail: string;
    salesEmail: string;
    pressEmail: string;
    partnershipEmail: string;
    supportPhone: string;
    salesPhone: string;
    whatsappNumber: string;
    telegramUsername: string;
    facebookUrl: string;
    instagramUrl: string;
    twitterUrl: string;
    linkedinUrl: string;
    youtubeUrl: string;
    tiktokUrl: string;
    pinterestUrl: string;
    snapchatUrl: string;
    discordUrl: string;
    twitchUrl: string;
    infoMessage: string;
    infoMessageColor: string;
    infoMessageFont: string;
  };
  setters: Record<string, (v: any) => void>;
  isEditing: boolean;
  isSubmitting: boolean;
  lastSaved: Date | null;
  fieldTouched: Record<string, boolean>;
  handleFieldBlur: (fieldName: string) => void;
  validateField: (fieldName: string, value: string) => string | null;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  applyConfig: (config: StoreThemeConfig) => void;
  toast: any;
}

export const StoreSettingsTab = ({
  store, formState, setters, isEditing, isSubmitting, lastSaved,
  fieldTouched, handleFieldBlur, validateField, handleSubmit, applyConfig, toast,
}: StoreSettingsTabProps) => {
  const { handleKeyDown: handleSpaceKeyDown } = useSpaceInputFix();
  const {
    name, description, contactEmail, contactPhone, about,
    supportEmail, salesEmail, pressEmail, partnershipEmail,
    supportPhone, salesPhone, whatsappNumber, telegramUsername,
    facebookUrl, instagramUrl, twitterUrl, linkedinUrl,
    youtubeUrl, tiktokUrl, pinterestUrl, snapchatUrl, discordUrl, twitchUrl,
    infoMessage, infoMessageColor, infoMessageFont,
  } = formState;

  return (
    <div className="space-y-4 sm:space-y-6">
      {isEditing && (
        <StoreConfigManager
          store={store as Store}
          onImportConfig={config => {
            applyConfig(config as StoreThemeConfig);
            toast({ title: 'Configuration importée', description: 'La configuration a été importée. Vérifiez les modifications avant de sauvegarder.' });
          }}
        />
      )}

      <Card className="store-card">
        <CardHeader className="store-card-header">
          <div>
            <CardTitle className="text-lg sm:text-xl font-semibold">Paramètres de la boutique</CardTitle>
            <CardDescription className="text-sm sm:text-base mt-1">Gérez tous les détails de votre boutique en ligne</CardDescription>
            {lastSaved && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                Dernière sauvegarde : {lastSaved.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent className="store-card-content">
          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nom de la boutique *</Label>
                <Input id="edit-name" value={name} onChange={e => setters.setName(e.target.value)} onKeyDown={handleSpaceKeyDown} required disabled={isSubmitting} />
                {name !== store.name && (
                  <p className="text-xs text-muted-foreground">
                    Nouveau slug : {name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description courte</Label>
                <Textarea id="edit-description" value={description} onChange={e => setters.setDescription(e.target.value)} onKeyDown={handleSpaceKeyDown} rows={3} placeholder="Une brève description de votre boutique" disabled={isSubmitting} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StoreFieldWithValidation id="contact-email" label="Email de contact" type="email" value={contactEmail} onChange={setters.setContactEmail} onBlur={() => handleFieldBlur('contact_email')} placeholder="contact@votreboutique.com" disabled={isSubmitting} touched={fieldTouched.contact_email} validationFn={val => validateField('contact_email', val)} hint="Email principal pour les contacts clients" />
                <StoreFieldWithValidation id="contact-phone" label="Téléphone de contact" type="tel" value={contactPhone} onChange={setters.setContactPhone} onBlur={() => handleFieldBlur('contact_phone')} placeholder="+225 XX XX XX XX" disabled={isSubmitting} touched={fieldTouched.contact_phone} hint="Format international recommandé" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="about">À propos de votre boutique</Label>
                <Textarea id="about" value={about} onChange={e => setters.setAbout(e.target.value)} onKeyDown={handleSpaceKeyDown} rows={8} placeholder="Racontez l'histoire de votre boutique, vos valeurs, votre mission..." disabled={isSubmitting} />
                <p className="text-xs text-muted-foreground">Ce texte apparaîtra dans l'onglet "À propos" de votre boutique</p>
              </div>

              {/* Contacts supplémentaires */}
              <div className="space-y-4 border-t pt-4">
                <h4 className="text-sm font-semibold">Contacts supplémentaires</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <StoreFieldWithValidation id="support-email" label="Email support" type="email" value={supportEmail} onChange={setters.setSupportEmail} onBlur={() => handleFieldBlur('support_email')} placeholder="support@votreboutique.com" disabled={isSubmitting} touched={fieldTouched.support_email} validationFn={val => validateField('support_email', val)} hint="Email dédié au support client" />
                  <StoreFieldWithValidation id="sales-email" label="Email ventes" type="email" value={salesEmail} onChange={setters.setSalesEmail} onBlur={() => handleFieldBlur('sales_email')} placeholder="ventes@votreboutique.com" disabled={isSubmitting} touched={fieldTouched.sales_email} validationFn={val => validateField('sales_email', val)} hint="Email dédié aux ventes" />
                  <StoreFieldWithValidation id="press-email" label="Email presse" type="email" value={pressEmail} onChange={setters.setPressEmail} onBlur={() => handleFieldBlur('press_email')} placeholder="presse@votreboutique.com" disabled={isSubmitting} touched={fieldTouched.press_email} validationFn={val => validateField('press_email', val)} hint="Email pour les relations presse" />
                  <StoreFieldWithValidation id="partnership-email" label="Email partenariats" type="email" value={partnershipEmail} onChange={setters.setPartnershipEmail} onBlur={() => handleFieldBlur('partnership_email')} placeholder="partenariats@votreboutique.com" disabled={isSubmitting} touched={fieldTouched.partnership_email} validationFn={val => validateField('partnership_email', val)} hint="Email pour les partenariats" />
                  <div className="space-y-2">
                    <Label htmlFor="support-phone">Téléphone support</Label>
                    <Input id="support-phone" type="tel" value={supportPhone} onChange={e => setters.setSupportPhone(e.target.value)} placeholder="+225 XX XX XX XX" disabled={isSubmitting} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sales-phone">Téléphone ventes</Label>
                    <Input id="sales-phone" type="tel" value={salesPhone} onChange={e => setters.setSalesPhone(e.target.value)} placeholder="+225 XX XX XX XX" disabled={isSubmitting} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp-number">WhatsApp</Label>
                    <Input id="whatsapp-number" type="tel" value={whatsappNumber} onChange={e => setters.setWhatsappNumber(e.target.value)} placeholder="+225 XX XX XX XX" disabled={isSubmitting} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telegram-username">Telegram</Label>
                    <Input id="telegram-username" type="text" value={telegramUsername} onChange={e => setters.setTelegramUsername(e.target.value)} placeholder="@username" disabled={isSubmitting} />
                  </div>
                </div>
              </div>

              {/* Réseaux sociaux supplémentaires */}
              <div className="space-y-4 border-t pt-4">
                <h4 className="text-sm font-semibold">Réseaux sociaux supplémentaires</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <StoreFieldWithValidation id="youtube-url" label="YouTube" type="url" value={youtubeUrl} onChange={setters.setYoutubeUrl} onBlur={() => handleFieldBlur('youtube_url')} placeholder="https://youtube.com/@votreboutique" disabled={isSubmitting} touched={fieldTouched.youtube_url} validationFn={val => validateField('youtube_url', val)} />
                  <StoreFieldWithValidation id="tiktok-url" label="TikTok" type="url" value={tiktokUrl} onChange={setters.setTiktokUrl} onBlur={() => handleFieldBlur('tiktok_url')} placeholder="https://tiktok.com/@votreboutique" disabled={isSubmitting} touched={fieldTouched.tiktok_url} validationFn={val => validateField('tiktok_url', val)} />
                  <StoreFieldWithValidation id="pinterest-url" label="Pinterest" type="url" value={pinterestUrl} onChange={setters.setPinterestUrl} onBlur={() => handleFieldBlur('pinterest_url')} placeholder="https://pinterest.com/votreboutique" disabled={isSubmitting} touched={fieldTouched.pinterest_url} validationFn={val => validateField('pinterest_url', val)} />
                  <StoreFieldWithValidation id="snapchat-url" label="Snapchat" type="url" value={snapchatUrl} onChange={setters.setSnapchatUrl} onBlur={() => handleFieldBlur('snapchat_url')} placeholder="https://snapchat.com/add/votreboutique" disabled={isSubmitting} touched={fieldTouched.snapchat_url} validationFn={val => validateField('snapchat_url', val)} />
                  <StoreFieldWithValidation id="discord-url" label="Discord" type="url" value={discordUrl} onChange={setters.setDiscordUrl} onBlur={() => handleFieldBlur('discord_url')} placeholder="https://discord.gg/votreboutique" disabled={isSubmitting} touched={fieldTouched.discord_url} validationFn={val => validateField('discord_url', val)} />
                  <StoreFieldWithValidation id="twitch-url" label="Twitch" type="url" value={twitchUrl} onChange={setters.setTwitchUrl} onBlur={() => handleFieldBlur('twitch_url')} placeholder="https://twitch.tv/votreboutique" disabled={isSubmitting} touched={fieldTouched.twitch_url} validationFn={val => validateField('twitch_url', val)} />
                </div>
              </div>

              {/* Info Message */}
              <div className="space-y-4 border-t pt-4">
                <div className="space-y-2">
                  <Label htmlFor="info_message">Message informatif (optionnel)</Label>
                  <Textarea id="info_message" value={infoMessage} onChange={e => setters.setInfoMessage(e.target.value)} onKeyDown={handleSpaceKeyDown} placeholder="Ex: 🎉 Promotion spéciale : -20% sur tous les produits !" rows={3} maxLength={500} disabled={isSubmitting} />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Message qui s'affichera en haut de votre boutique</p>
                    <span className="text-xs text-muted-foreground">{infoMessage.length}/500</span>
                  </div>
                </div>

                {infoMessage && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="info_message_color" className="flex items-center gap-2">
                        <Palette className="h-4 w-4" />Couleur du message
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input id="info_message_color" type="color" value={infoMessageColor} onChange={e => setters.setInfoMessageColor(e.target.value)} className="h-10 w-20 cursor-pointer" disabled={isSubmitting} />
                        <Input type="text" value={infoMessageColor} onChange={e => setters.setInfoMessageColor(e.target.value)} placeholder="#3b82f6" className="flex-1 font-mono text-sm" disabled={isSubmitting} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="info_message_font">Police du message</Label>
                      <Select value={infoMessageFont} onValueChange={v => setters.setInfoMessageFont(v)} disabled={isSubmitting}>
                        <SelectTrigger id="info_message_font"><SelectValue placeholder="Choisir une police" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Inter">Inter (par défaut)</SelectItem>
                          <SelectItem value="Poppins">Poppins</SelectItem>
                          <SelectItem value="Roboto">Roboto</SelectItem>
                          <SelectItem value="Montserrat">Montserrat</SelectItem>
                          <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t">
                <Button onClick={() => handleSubmit()} disabled={isSubmitting} className="w-full sm:w-auto">
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nom</p>
                <p className="text-base font-semibold">{store.name}</p>
              </div>
              {store.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="text-sm">{store.description}</p>
                </div>
              )}
              {store.contact_email && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email de contact</p>
                  <p className="text-sm">{store.contact_email}</p>
                </div>
              )}
              {store.contact_phone && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Téléphone</p>
                  <p className="text-sm">{store.contact_phone}</p>
                </div>
              )}
              {store.about && (
                <div>
                  <p className="text-sm text-muted-foreground">À propos</p>
                  <p className="text-sm whitespace-pre-wrap">{store.about}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
