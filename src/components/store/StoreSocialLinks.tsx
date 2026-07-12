/**
 * StoreSocialLinks Component
 * Extracted from StoreForm.tsx to reduce complexity
 * Handles social media links
 */

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { StoreFieldWithValidation } from './StoreFieldWithValidation';

interface StoreSocialLinksProps {
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
  setFacebookUrl: (value: string) => void;
  setInstagramUrl: (value: string) => void;
  setTwitterUrl: (value: string) => void;
  setLinkedinUrl: (value: string) => void;
  setYoutubeUrl: (value: string) => void;
  setTiktokUrl: (value: string) => void;
  setPinterestUrl: (value: string) => void;
  setSnapchatUrl: (value: string) => void;
  setDiscordUrl: (value: string) => void;
  setTwitchUrl: (value: string) => void;
  isSubmitting?: boolean;
  fieldTouched?: Record<string, boolean>;
  handleFieldBlur?: (fieldName: string) => void;
  validateField?: (fieldName: string, value: string) => string | null;
}

export const StoreSocialLinks = ({
  facebookUrl,
  instagramUrl,
  twitterUrl,
  linkedinUrl,
  youtubeUrl,
  tiktokUrl,
  pinterestUrl,
  snapchatUrl,
  discordUrl,
  twitchUrl,
  setFacebookUrl,
  setInstagramUrl,
  setTwitterUrl,
  setLinkedinUrl,
  setYoutubeUrl,
  setTiktokUrl,
  setPinterestUrl,
  setSnapchatUrl,
  setDiscordUrl,
  setTwitchUrl,
  isSubmitting = false,
  fieldTouched = {},
  handleFieldBlur,
  validateField,
}: StoreSocialLinksProps) => {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold">Réseaux sociaux</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StoreFieldWithValidation
          id="facebook-url"
          label="Facebook"
          type="url"
          value={facebookUrl}
          onChange={setFacebookUrl}
          onBlur={() => handleFieldBlur?.('facebook_url')}
          placeholder="https://facebook.com/votre-page"
          disabled={isSubmitting}
          touched={fieldTouched.facebook_url}
          validationFn={(val) => validateField?.('facebook_url', val)}
        />
        <StoreFieldWithValidation
          id="instagram-url"
          label="Instagram"
          type="url"
          value={instagramUrl}
          onChange={setInstagramUrl}
          onBlur={() => handleFieldBlur?.('instagram_url')}
          placeholder="https://instagram.com/votre-compte"
          disabled={isSubmitting}
          touched={fieldTouched.instagram_url}
          validationFn={(val) => validateField?.('instagram_url', val)}
        />
        <StoreFieldWithValidation
          id="twitter-url"
          label="Twitter/X"
          type="url"
          value={twitterUrl}
          onChange={setTwitterUrl}
          onBlur={() => handleFieldBlur?.('twitter_url')}
          placeholder="https://twitter.com/votre-compte"
          disabled={isSubmitting}
          touched={fieldTouched.twitter_url}
          validationFn={(val) => validateField?.('twitter_url', val)}
        />
        <StoreFieldWithValidation
          id="linkedin-url"
          label="LinkedIn"
          type="url"
          value={linkedinUrl}
          onChange={setLinkedinUrl}
          onBlur={() => handleFieldBlur?.('linkedin_url')}
          placeholder="https://linkedin.com/company/votre-entreprise"
          disabled={isSubmitting}
          touched={fieldTouched.linkedin_url}
          validationFn={(val) => validateField?.('linkedin_url', val)}
        />
        <StoreFieldWithValidation
          id="youtube-url"
          label="YouTube"
          type="url"
          value={youtubeUrl}
          onChange={setYoutubeUrl}
          onBlur={() => handleFieldBlur?.('youtube_url')}
          placeholder="https://youtube.com/@votre-chaine"
          disabled={isSubmitting}
          touched={fieldTouched.youtube_url}
          validationFn={(val) => validateField?.('youtube_url', val)}
        />
        <StoreFieldWithValidation
          id="tiktok-url"
          label="TikTok"
          type="url"
          value={tiktokUrl}
          onChange={setTiktokUrl}
          onBlur={() => handleFieldBlur?.('tiktok_url')}
          placeholder="https://tiktok.com/@votre-compte"
          disabled={isSubmitting}
          touched={fieldTouched.tiktok_url}
          validationFn={(val) => validateField?.('tiktok_url', val)}
        />
        <StoreFieldWithValidation
          id="pinterest-url"
          label="Pinterest"
          type="url"
          value={pinterestUrl}
          onChange={setPinterestUrl}
          onBlur={() => handleFieldBlur?.('pinterest_url')}
          placeholder="https://pinterest.com/votre-compte"
          disabled={isSubmitting}
          touched={fieldTouched.pinterest_url}
          validationFn={(val) => validateField?.('pinterest_url', val)}
        />
        <div className="space-y-2">
          <Label htmlFor="snapchat-url">Snapchat</Label>
          <Input
            id="snapchat-url"
            type="url"
            value={snapchatUrl}
            onChange={(e) => setSnapchatUrl(e.target.value)}
            placeholder="https://snapchat.com/add/votre-compte"
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="discord-url">Discord</Label>
          <Input
            id="discord-url"
            type="url"
            value={discordUrl}
            onChange={(e) => setDiscordUrl(e.target.value)}
            placeholder="https://discord.gg/votre-serveur"
            disabled={isSubmitting}
          />
        </div>
        <StoreFieldWithValidation
          id="twitch-url"
          label="Twitch"
          type="url"
          value={twitchUrl}
          onChange={setTwitchUrl}
          onBlur={() => handleFieldBlur?.('twitch_url')}
          placeholder="https://twitch.tv/votre-compte"
          disabled={isSubmitting}
          touched={fieldTouched.twitch_url}
          validationFn={(val) => validateField?.('twitch_url', val)}
        />
      </div>
    </div>
  );
};
