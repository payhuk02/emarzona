/**
 * Store Theme Templates
 * Bibliothèque de thèmes prédéfinis pour les boutiques
 */

export interface StoreThemeTemplate {
  id: string;
  name: string;
  description: string;
  preview: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
  };
  colors: {
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    background_color: string;
    text_color: string;
    text_secondary_color: string;
    button_primary_color: string;
    button_primary_text: string;
    button_secondary_color: string;
    button_secondary_text: string;
    link_color: string;
    link_hover_color: string;
  };
  typography: {
    heading_font: string;
    body_font: string;
    font_size_base: string;
    heading_size_h1: string;
    heading_size_h2: string;
    heading_size_h3: string;
    line_height: string;
    letter_spacing: string;
  };
  layout: {
    border_radius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
    shadow_intensity: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    header_style: 'minimal' | 'standard' | 'extended';
    footer_style: 'minimal' | 'standard' | 'extended';
    product_grid_columns: number;
    product_card_style: 'minimal' | 'standard' | 'detailed';
    navigation_style: 'horizontal' | 'vertical' | 'mega';
  };
}

export const STORE_THEME_TEMPLATES: StoreThemeTemplate[] = [
  {
    id: 'modern-blue',
    name: 'Bleu Moderne',
    description: 'Thème professionnel avec palette bleue moderne',
    preview: {
      primaryColor: '#3b82f6',
      secondaryColor: '#8b5cf6',
      accentColor: '#f59e0b',
      backgroundColor: '#ffffff',
    },
    colors: {
      primary_color: '#3b82f6',
      secondary_color: '#8b5cf6',
      accent_color: '#f59e0b',
      background_color: '#ffffff',
      text_color: '#1f2937',
      text_secondary_color: '#6b7280',
      button_primary_color: '#3b82f6',
      button_primary_text: '#ffffff',
      button_secondary_color: '#e5e7eb',
      button_secondary_text: '#1f2937',
      link_color: '#3b82f6',
      link_hover_color: '#2563eb',
    },
    typography: {
      heading_font: 'Inter',
      body_font: 'Inter',
      font_size_base: '16px',
      heading_size_h1: '2.5rem',
      heading_size_h2: '2rem',
      heading_size_h3: '1.5rem',
      line_height: '1.6',
      letter_spacing: 'normal',
    },
    layout: {
      border_radius: 'md',
      shadow_intensity: 'md',
      header_style: 'standard',
      footer_style: 'standard',
      product_grid_columns: 3,
      product_card_style: 'standard',
      navigation_style: 'horizontal',
    },
  },
  {
    id: 'elegant-purple',
    name: 'Violet Élégant',
    description: 'Thème sophistiqué avec palette violette',
    preview: {
      primaryColor: '#8b5cf6',
      secondaryColor: '#ec4899',
      accentColor: '#f59e0b',
      backgroundColor: '#fafafa',
    },
    colors: {
      primary_color: '#8b5cf6',
      secondary_color: '#ec4899',
      accent_color: '#f59e0b',
      background_color: '#fafafa',
      text_color: '#1f2937',
      text_secondary_color: '#6b7280',
      button_primary_color: '#8b5cf6',
      button_primary_text: '#ffffff',
      button_secondary_color: '#e5e7eb',
      button_secondary_text: '#1f2937',
      link_color: '#8b5cf6',
      link_hover_color: '#7c3aed',
    },
    typography: {
      heading_font: 'Poppins',
      body_font: 'Inter',
      font_size_base: '16px',
      heading_size_h1: '2.75rem',
      heading_size_h2: '2.25rem',
      heading_size_h3: '1.75rem',
      line_height: '1.7',
      letter_spacing: '-0.01em',
    },
    layout: {
      border_radius: 'lg',
      shadow_intensity: 'lg',
      header_style: 'extended',
      footer_style: 'extended',
      product_grid_columns: 4,
      product_card_style: 'detailed',
      navigation_style: 'horizontal',
    },
  },
  {
    id: 'minimal-gray',
    name: 'Gris Minimaliste',
    description: 'Design épuré et minimaliste en nuances de gris',
    preview: {
      primaryColor: '#374151',
      secondaryColor: '#6b7280',
      accentColor: '#10b981',
      backgroundColor: '#ffffff',
    },
    colors: {
      primary_color: '#374151',
      secondary_color: '#6b7280',
      accent_color: '#10b981',
      background_color: '#ffffff',
      text_color: '#111827',
      text_secondary_color: '#6b7280',
      button_primary_color: '#374151',
      button_primary_text: '#ffffff',
      button_secondary_color: '#f3f4f6',
      button_secondary_text: '#374151',
      link_color: '#374151',
      link_hover_color: '#111827',
    },
    typography: {
      heading_font: 'Inter',
      body_font: 'Inter',
      font_size_base: '16px',
      heading_size_h1: '2.25rem',
      heading_size_h2: '1.875rem',
      heading_size_h3: '1.5rem',
      line_height: '1.6',
      letter_spacing: 'normal',
    },
    layout: {
      border_radius: 'sm',
      shadow_intensity: 'sm',
      header_style: 'minimal',
      footer_style: 'minimal',
      product_grid_columns: 3,
      product_card_style: 'minimal',
      navigation_style: 'horizontal',
    },
  },
  {
    id: 'vibrant-orange',
    name: 'Orange Vibrant',
    description: 'Thème énergique avec palette orange et rouge',
    preview: {
      primaryColor: '#f97316',
      secondaryColor: '#ef4444',
      accentColor: '#fbbf24',
      backgroundColor: '#ffffff',
    },
    colors: {
      primary_color: '#f97316',
      secondary_color: '#ef4444',
      accent_color: '#fbbf24',
      background_color: '#ffffff',
      text_color: '#1f2937',
      text_secondary_color: '#6b7280',
      button_primary_color: '#f97316',
      button_primary_text: '#ffffff',
      button_secondary_color: '#fed7aa',
      button_secondary_text: '#f97316',
      link_color: '#f97316',
      link_hover_color: '#ea580c',
    },
    typography: {
      heading_font: 'Montserrat',
      body_font: 'Open Sans',
      font_size_base: '16px',
      heading_size_h1: '2.5rem',
      heading_size_h2: '2rem',
      heading_size_h3: '1.5rem',
      line_height: '1.6',
      letter_spacing: 'normal',
    },
    layout: {
      border_radius: 'lg',
      shadow_intensity: 'md',
      header_style: 'standard',
      footer_style: 'standard',
      product_grid_columns: 3,
      product_card_style: 'standard',
      navigation_style: 'horizontal',
    },
  },
  {
    id: 'nature-green',
    name: 'Vert Nature',
    description: 'Thème apaisant avec palette verte naturelle',
    preview: {
      primaryColor: '#10b981',
      secondaryColor: '#059669',
      accentColor: '#f59e0b',
      backgroundColor: '#f9fafb',
    },
    colors: {
      primary_color: '#10b981',
      secondary_color: '#059669',
      accent_color: '#f59e0b',
      background_color: '#f9fafb',
      text_color: '#1f2937',
      text_secondary_color: '#6b7280',
      button_primary_color: '#10b981',
      button_primary_text: '#ffffff',
      button_secondary_color: '#d1fae5',
      button_secondary_text: '#059669',
      link_color: '#10b981',
      link_hover_color: '#059669',
    },
    typography: {
      heading_font: 'Nunito',
      body_font: 'Open Sans',
      font_size_base: '16px',
      heading_size_h1: '2.5rem',
      heading_size_h2: '2rem',
      heading_size_h3: '1.5rem',
      line_height: '1.7',
      letter_spacing: 'normal',
    },
    layout: {
      border_radius: 'xl',
      shadow_intensity: 'md',
      header_style: 'standard',
      footer_style: 'standard',
      product_grid_columns: 3,
      product_card_style: 'standard',
      navigation_style: 'horizontal',
    },
  },
  {
    id: 'dark-mode',
    name: 'Mode Sombre',
    description: 'Thème sombre moderne pour une expérience premium',
    preview: {
      primaryColor: '#6366f1',
      secondaryColor: '#8b5cf6',
      accentColor: '#f59e0b',
      backgroundColor: '#111827',
    },
    colors: {
      primary_color: '#6366f1',
      secondary_color: '#8b5cf6',
      accent_color: '#f59e0b',
      background_color: '#111827',
      text_color: '#f9fafb',
      text_secondary_color: '#d1d5db',
      button_primary_color: '#6366f1',
      button_primary_text: '#ffffff',
      button_secondary_color: '#374151',
      button_secondary_text: '#f9fafb',
      link_color: '#6366f1',
      link_hover_color: '#818cf8',
    },
    typography: {
      heading_font: 'Inter',
      body_font: 'Inter',
      font_size_base: '16px',
      heading_size_h1: '2.5rem',
      heading_size_h2: '2rem',
      heading_size_h3: '1.5rem',
      line_height: '1.6',
      letter_spacing: 'normal',
    },
    layout: {
      border_radius: 'md',
      shadow_intensity: 'lg',
      header_style: 'standard',
      footer_style: 'standard',
      product_grid_columns: 3,
      product_card_style: 'standard',
      navigation_style: 'horizontal',
    },
  },
];

/**
 * Applique un template de thème
 */
export function applyThemeTemplate(template: StoreThemeTemplate) {
  return {
    ...template.colors,
    ...template.typography,
    ...template.layout,
  };
}


