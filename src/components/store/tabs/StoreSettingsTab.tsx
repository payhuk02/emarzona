import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Palette } from 'lucide-react';
import { StoreFieldWithValidation } from '../StoreFieldWithValidation';
import { StoreConfigManager } from '../StoreConfigManager';
import type { Store } from '@/hooks/useStores';
import type { ExtendedStore, StoreThemeConfig } from '../types/store-form';
import { useSpaceInputFix } from '@/hooks/useSpaceInputFix';
import type { useToast } from '@/hooks/use-toast';

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
  setters: Record<string, (v: string | null) => void>;
  isEditing: boolean;
  isSubmitting: boolean;
  lastSaved: Date | null;
  fieldTouched: Record<string, boolean>;
  handleFieldBlur: (fieldName: string) => void;
  validateField: (fieldName: string, value: string) => string | null;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  applyConfig: (config: StoreThemeConfig) => void;
  toast: ReturnType<typeof useToast>['toast'];
}

export const StoreSettingsTab = ({
  store,
  formState,
  setters,
  isEditing,
  isSubmitting,
  lastSaved,
  fieldTouched,
  handleFieldBlur,
  validateField,
  applyConfig,
  toast,
}: StoreSettingsTabProps) => {
  const { t, i18n } = useTranslation();
  const { handleKeyDown: handleSpaceKeyDown } = useSpaceInputFix();
  const {
    name,
    description,
    contactEmail,
    contactPhone,
    about,
    supportEmail,
    salesEmail,
    pressEmail,
    partnershipEmail,
    supportPhone,
    salesPhone,
    whatsappNumber,
    telegramUsername,
    youtubeUrl,
    tiktokUrl,
    pinterestUrl,
    snapchatUrl,
    discordUrl,
    twitchUrl,
    infoMessage,
    infoMessageColor,
    infoMessageFont,
  } = formState;

  return (
    <div className="space-y-4 sm:space-y-6">
      {isEditing && (
        <StoreConfigManager
          store={store as Store}
          onImportConfig={config => {
            applyConfig(config as StoreThemeConfig);
            toast({
              title: t('store.form.settings.configImportedTitle'),
              description: t('store.form.settings.configImportedDescription'),
            });
          }}
        />
      )}

      <Card className="store-card">
        <CardHeader className="store-card-header">
          <div>
            <CardTitle className="text-lg sm:text-xl font-semibold">
              {t('store.form.settings.title')}
            </CardTitle>
            <CardDescription className="text-sm sm:text-base mt-1">
              {t('store.form.settings.description')}
            </CardDescription>
            {lastSaved && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                {t('store.form.settings.lastSaved', {
                  time: lastSaved.toLocaleTimeString(i18n.language, {
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                })}
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent className="store-card-content">
          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">{t('store.form.basicInfo.storeName')} *</Label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={e => setters.setName(e.target.value)}
                  onKeyDown={handleSpaceKeyDown}
                  required
                  disabled={isSubmitting}
                />
                {name !== store.name && (
                  <p className="text-xs text-muted-foreground">
                    {t('store.form.basicInfo.newSlug', {
                      slug: name
                        .toLowerCase()
                        .trim()
                        .replace(/[^a-z0-9\s-]/g, '')
                        .replace(/\s+/g, '-'),
                    })}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">
                  {t('store.form.basicInfo.shortDescription')}
                </Label>
                <Textarea
                  id="edit-description"
                  value={description}
                  onChange={e => setters.setDescription(e.target.value)}
                  onKeyDown={handleSpaceKeyDown}
                  rows={3}
                  placeholder={t('store.form.basicInfo.shortDescriptionPlaceholder')}
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StoreFieldWithValidation
                  id="contact-email"
                  label={t('store.form.contact.email')}
                  type="email"
                  value={contactEmail}
                  onChange={setters.setContactEmail}
                  onBlur={() => handleFieldBlur('contact_email')}
                  placeholder={t('store.form.contact.emailPlaceholder')}
                  disabled={isSubmitting}
                  touched={fieldTouched.contact_email}
                  validationFn={val => validateField('contact_email', val)}
                  hint={t('store.form.contact.emailHintShort')}
                />
                <StoreFieldWithValidation
                  id="contact-phone"
                  label={t('store.form.contact.phone')}
                  type="tel"
                  value={contactPhone}
                  onChange={setters.setContactPhone}
                  onBlur={() => handleFieldBlur('contact_phone')}
                  placeholder={t('store.form.contact.phonePlaceholder')}
                  disabled={isSubmitting}
                  touched={fieldTouched.contact_phone}
                  hint={t('store.form.contact.phoneHintShort')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="about">{t('store.form.basicInfo.about')}</Label>
                <Textarea
                  id="about"
                  value={about}
                  onChange={e => setters.setAbout(e.target.value)}
                  onKeyDown={handleSpaceKeyDown}
                  rows={8}
                  placeholder={t('store.form.basicInfo.aboutPlaceholder')}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  {t('store.form.settings.aboutHint')}
                </p>
              </div>

              {/* Contacts supplémentaires */}
              <div className="space-y-4 border-t pt-4">
                <h4 className="text-sm font-semibold">{t('store.form.contact.extraSection')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <StoreFieldWithValidation
                    id="support-email"
                    label={t('store.form.contact.supportEmailShort')}
                    type="email"
                    value={supportEmail}
                    onChange={setters.setSupportEmail}
                    onBlur={() => handleFieldBlur('support_email')}
                    placeholder={t('store.form.contact.supportEmailPlaceholder')}
                    disabled={isSubmitting}
                    touched={fieldTouched.support_email}
                    validationFn={val => validateField('support_email', val)}
                    hint={t('store.form.contact.supportEmailHint')}
                  />
                  <StoreFieldWithValidation
                    id="sales-email"
                    label={t('store.form.contact.salesEmailShort')}
                    type="email"
                    value={salesEmail}
                    onChange={setters.setSalesEmail}
                    onBlur={() => handleFieldBlur('sales_email')}
                    placeholder={t('store.form.contact.salesEmailPlaceholder')}
                    disabled={isSubmitting}
                    touched={fieldTouched.sales_email}
                    validationFn={val => validateField('sales_email', val)}
                    hint={t('store.form.contact.salesEmailHint')}
                  />
                  <StoreFieldWithValidation
                    id="press-email"
                    label={t('store.form.contact.pressEmailShort')}
                    type="email"
                    value={pressEmail}
                    onChange={setters.setPressEmail}
                    onBlur={() => handleFieldBlur('press_email')}
                    placeholder={t('store.form.contact.pressEmailPlaceholder')}
                    disabled={isSubmitting}
                    touched={fieldTouched.press_email}
                    validationFn={val => validateField('press_email', val)}
                    hint={t('store.form.contact.pressEmailHint')}
                  />
                  <StoreFieldWithValidation
                    id="partnership-email"
                    label={t('store.form.contact.partnershipEmailShort')}
                    type="email"
                    value={partnershipEmail}
                    onChange={setters.setPartnershipEmail}
                    onBlur={() => handleFieldBlur('partnership_email')}
                    placeholder={t('store.form.contact.partnershipEmailPlaceholder')}
                    disabled={isSubmitting}
                    touched={fieldTouched.partnership_email}
                    validationFn={val => validateField('partnership_email', val)}
                    hint={t('store.form.contact.partnershipEmailHint')}
                  />
                  <div className="space-y-2">
                    <Label htmlFor="support-phone">
                      {t('store.form.contact.supportPhoneShort')}
                    </Label>
                    <Input
                      id="support-phone"
                      type="tel"
                      value={supportPhone}
                      onChange={e => setters.setSupportPhone(e.target.value)}
                      placeholder={t('store.form.contact.phonePlaceholder')}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sales-phone">{t('store.form.contact.salesPhoneShort')}</Label>
                    <Input
                      id="sales-phone"
                      type="tel"
                      value={salesPhone}
                      onChange={e => setters.setSalesPhone(e.target.value)}
                      placeholder={t('store.form.contact.phonePlaceholder')}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp-number">{t('store.form.contact.whatsapp')}</Label>
                    <Input
                      id="whatsapp-number"
                      type="tel"
                      value={whatsappNumber}
                      onChange={e => setters.setWhatsappNumber(e.target.value)}
                      placeholder={t('store.form.contact.phonePlaceholder')}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telegram-username">{t('store.form.contact.telegram')}</Label>
                    <Input
                      id="telegram-username"
                      type="text"
                      value={telegramUsername}
                      onChange={e => setters.setTelegramUsername(e.target.value)}
                      placeholder={t('store.form.contact.telegramPlaceholderShort')}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Réseaux sociaux supplémentaires */}
              <div className="space-y-4 border-t pt-4">
                <h4 className="text-sm font-semibold">{t('store.form.social.extraSection')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <StoreFieldWithValidation
                    id="youtube-url"
                    label={t('store.form.social.youtube')}
                    type="url"
                    value={youtubeUrl}
                    onChange={setters.setYoutubeUrl}
                    onBlur={() => handleFieldBlur('youtube_url')}
                    placeholder={t('store.form.social.youtubePlaceholder')}
                    disabled={isSubmitting}
                    touched={fieldTouched.youtube_url}
                    validationFn={val => validateField('youtube_url', val)}
                  />
                  <StoreFieldWithValidation
                    id="tiktok-url"
                    label={t('store.form.social.tiktok')}
                    type="url"
                    value={tiktokUrl}
                    onChange={setters.setTiktokUrl}
                    onBlur={() => handleFieldBlur('tiktok_url')}
                    placeholder={t('store.form.social.tiktokPlaceholder')}
                    disabled={isSubmitting}
                    touched={fieldTouched.tiktok_url}
                    validationFn={val => validateField('tiktok_url', val)}
                  />
                  <StoreFieldWithValidation
                    id="pinterest-url"
                    label={t('store.form.social.pinterest')}
                    type="url"
                    value={pinterestUrl}
                    onChange={setters.setPinterestUrl}
                    onBlur={() => handleFieldBlur('pinterest_url')}
                    placeholder={t('store.form.social.pinterestPlaceholder')}
                    disabled={isSubmitting}
                    touched={fieldTouched.pinterest_url}
                    validationFn={val => validateField('pinterest_url', val)}
                  />
                  <StoreFieldWithValidation
                    id="snapchat-url"
                    label={t('store.form.social.snapchat')}
                    type="url"
                    value={snapchatUrl}
                    onChange={setters.setSnapchatUrl}
                    onBlur={() => handleFieldBlur('snapchat_url')}
                    placeholder={t('store.form.social.snapchatPlaceholder')}
                    disabled={isSubmitting}
                    touched={fieldTouched.snapchat_url}
                    validationFn={val => validateField('snapchat_url', val)}
                  />
                  <StoreFieldWithValidation
                    id="discord-url"
                    label={t('store.form.social.discord')}
                    type="url"
                    value={discordUrl}
                    onChange={setters.setDiscordUrl}
                    onBlur={() => handleFieldBlur('discord_url')}
                    placeholder={t('store.form.social.discordPlaceholder')}
                    disabled={isSubmitting}
                    touched={fieldTouched.discord_url}
                    validationFn={val => validateField('discord_url', val)}
                  />
                  <StoreFieldWithValidation
                    id="twitch-url"
                    label={t('store.form.social.twitch')}
                    type="url"
                    value={twitchUrl}
                    onChange={setters.setTwitchUrl}
                    onBlur={() => handleFieldBlur('twitch_url')}
                    placeholder={t('store.form.social.twitchPlaceholder')}
                    disabled={isSubmitting}
                    touched={fieldTouched.twitch_url}
                    validationFn={val => validateField('twitch_url', val)}
                  />
                </div>
              </div>

              {/* Info Message */}
              <div className="space-y-4 border-t pt-4">
                <div className="space-y-2">
                  <Label htmlFor="info_message">{t('store.form.infoMessage.label')}</Label>
                  <Textarea
                    id="info_message"
                    value={infoMessage}
                    onChange={e => setters.setInfoMessage(e.target.value)}
                    onKeyDown={handleSpaceKeyDown}
                    placeholder={t('store.form.infoMessage.placeholderShort')}
                    rows={3}
                    maxLength={500}
                    disabled={isSubmitting}
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {t('store.form.infoMessage.hintShort')}
                    </p>
                    <span className="text-xs text-muted-foreground">{infoMessage.length}/500</span>
                  </div>
                </div>

                {infoMessage && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="info_message_color" className="flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        {t('store.form.infoMessage.color')}
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="info_message_color"
                          type="color"
                          value={infoMessageColor}
                          onChange={e => setters.setInfoMessageColor(e.target.value)}
                          className="h-10 w-20 cursor-pointer"
                          disabled={isSubmitting}
                        />
                        <Input
                          type="text"
                          value={infoMessageColor}
                          onChange={e => setters.setInfoMessageColor(e.target.value)}
                          placeholder="#3b82f6"
                          className="flex-1 font-mono text-sm"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="info_message_font">{t('store.form.infoMessage.font')}</Label>
                      <Select
                        value={infoMessageFont}
                        onValueChange={v => setters.setInfoMessageFont(v)}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger id="info_message_font">
                          <SelectValue placeholder={t('store.form.common.chooseFont')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Inter">
                            {t('store.form.common.fontDefaultInter')}
                          </SelectItem>
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
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('store.form.settings.viewName')}
                </p>
                <p className="text-base font-semibold">{store.name}</p>
              </div>
              {store.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('store.form.settings.viewDescription')}
                  </p>
                  <p className="text-sm">{store.description}</p>
                </div>
              )}
              {store.contact_email && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('store.form.settings.viewEmail')}
                  </p>
                  <p className="text-sm">{store.contact_email}</p>
                </div>
              )}
              {store.contact_phone && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('store.form.settings.viewPhone')}
                  </p>
                  <p className="text-sm">{store.contact_phone}</p>
                </div>
              )}
              {store.about && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t('store.form.settings.viewAbout')}
                  </p>
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
