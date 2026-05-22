/**
 * Logo et favicon officiels Emarzona (unique identité plateforme).
 */
import { EMARZONA_DEFAULT_LOGO_PUBLIC, EMARZONA_FAVICON } from '@/lib/brand/emarzona-logo';

const PLATFORM_LOGO = EMARZONA_DEFAULT_LOGO_PUBLIC;

/** URL du logo plateforme (toujours le logo Emarzona officiel) */
export const usePlatformLogo = () => PLATFORM_LOGO;

export const usePlatformLogoLight = () => PLATFORM_LOGO;

export const usePlatformLogoDark = () => PLATFORM_LOGO;

export const usePlatformFavicon = () => EMARZONA_FAVICON;
