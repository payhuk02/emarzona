export type CustomizationSection =
  | 'design'
  | 'settings'
  | 'content'
  | 'integrations'
  | 'security'
  | 'features'
  | 'notifications'
  | 'landing'
  | 'footer'
  | 'pages'
  | 'media';

export const PLATFORM_CUSTOMIZATION_PATH = '/admin/platform-customization';

export const CUSTOMIZATION_SECTION_IDS: readonly CustomizationSection[] = [
  'design',
  'settings',
  'content',
  'integrations',
  'security',
  'features',
  'notifications',
  'landing',
  'footer',
  'pages',
  'media',
] as const;

export function isValidCustomizationSection(value: string | null): value is CustomizationSection {
  return value != null && (CUSTOMIZATION_SECTION_IDS as readonly string[]).includes(value);
}

export function parseActiveSection(search: string): CustomizationSection {
  const param = new URLSearchParams(search).get('section');
  return isValidCustomizationSection(param) ? param : 'design';
}

export function buildSectionHref(section: CustomizationSection): string {
  return `${PLATFORM_CUSTOMIZATION_PATH}?section=${section}`;
}
