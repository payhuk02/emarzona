/**
 * Types pour la personnalisation des pages
 */

export interface PageConfig {
  id: string;
  name: string;
  route: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  sections: PageSection[];
}

export interface PageSection {
  id: string;
  name: string;
  type: 'hero' | 'content' | 'features' | 'testimonials' | 'cta' | 'footer' | 'custom';
  elements: PageElement[];
}

export interface PageElement {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'image' | 'color' | 'font' | 'number' | 'url' | 'boolean';
  key: string;
  defaultValue?: string;
  description?: string;
  options?: { value: string; label: string }[];
}
