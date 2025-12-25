/**
 * Accessibilité Améliorée - Version Avancée
 * Fonctions avancées pour améliorer l'accessibilité WCAG 2.1 AA
 */

import { logger } from './logger';

/**
 * Convertit une couleur hex en RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Convertit une couleur RGB en luminance relative
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calcule le ratio de contraste entre deux couleurs (WCAG)
 * Retourne un ratio entre 1 et 21
 */
export function calculateContrastRatio(
  foreground: string,
  background: string
): number {
  const fgRgb = hexToRgb(foreground);
  const bgRgb = hexToRgb(background);

  if (!fgRgb || !bgRgb) {
    return 1; // Contraste minimal si les couleurs ne peuvent pas être analysées
  }

  const fgLuminance = getLuminance(fgRgb.r, fgRgb.g, fgRgb.b);
  const bgLuminance = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);

  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Vérifie le contraste des couleurs (WCAG AA et AAA)
 */
export function checkColorContrast(
  foreground: string,
  background: string,
  fontSize?: number,
  isBold?: boolean
): {
  ratio: number;
  passesAA: boolean;
  passesAAA: boolean;
  level: 'AA' | 'AAA' | 'fail';
  recommendations: string[];
} {
  const ratio = calculateContrastRatio(foreground, background);

  // Seuils WCAG
  // AA normal text: 4.5:1
  // AA large text (18pt+ ou 14pt+ bold): 3:1
  // AAA normal text: 7:1
  // AAA large text: 4.5:1

  const isLargeText = fontSize ? fontSize >= 18 || (fontSize >= 14 && isBold) : false;
  const aaThreshold = isLargeText ? 3 : 4.5;
  const aaaThreshold = isLargeText ? 4.5 : 7;

  const passesAA = ratio >= aaThreshold;
  const passesAAA = ratio >= aaaThreshold;

  const level: 'AA' | 'AAA' | 'fail' = passesAAA ? 'AAA' : passesAA ? 'AA' : 'fail';

  const recommendations: string[] = [];
  if (!passesAA) {
    recommendations.push(
      `Le contraste actuel (${ratio.toFixed(2)}:1) ne respecte pas WCAG AA.`
    );
    recommendations.push(
      `Augmentez le contraste pour atteindre au moins ${aaThreshold}:1.`
    );
  } else if (!passesAAA) {
    recommendations.push(
      `Le contraste actuel (${ratio.toFixed(2)}:1) respecte WCAG AA mais pas AAA.`
    );
    recommendations.push(
      `Pour atteindre AAA, augmentez le contraste à ${aaaThreshold}:1.`
    );
  }

  return {
    ratio,
    passesAA,
    passesAAA,
    level,
    recommendations,
  };
}

/**
 * Extrait la couleur calculée d'un élément
 */
export function getComputedColor(element: HTMLElement): string | null {
  const styles = window.getComputedStyle(element);
  const color = styles.color;
  
  // Convertir rgb() en hex si nécessaire
  if (color.startsWith('rgb')) {
    const rgb = color.match(/\d+/g);
    if (rgb && rgb.length >= 3) {
      const r = parseInt(rgb[0]);
      const g = parseInt(rgb[1]);
      const b = parseInt(rgb[2]);
      return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
    }
  }
  
  return color.startsWith('#') ? color : null;
}

/**
 * Vérifie le contraste d'un élément avec son arrière-plan
 */
export function checkElementContrast(element: HTMLElement): {
  ratio: number;
  passesAA: boolean;
  passesAAA: boolean;
  foreground: string | null;
  background: string | null;
} {
  const foreground = getComputedColor(element);
  const fontSize = parseFloat(window.getComputedStyle(element).fontSize);
  const fontWeight = window.getComputedStyle(element).fontWeight;
  const isBold = parseInt(fontWeight) >= 600 || fontWeight === 'bold';

  // Trouver l'arrière-plan effectif
  let background: string | null = null;
  let current: HTMLElement | null = element;

  while (current && !background) {
    const bgColor = window.getComputedStyle(current).backgroundColor;
    if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
      // Convertir rgba en hex
      const rgb = bgColor.match(/\d+/g);
      if (rgb && rgb.length >= 3) {
        const r = parseInt(rgb[0]);
        const g = parseInt(rgb[1]);
        const b = parseInt(rgb[2]);
        background = `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
      }
    }
    current = current.parentElement;
  }

  if (!foreground || !background) {
    return {
      ratio: 1,
      passesAA: false,
      passesAAA: false,
      foreground,
      background,
    };
  }

  const result = checkColorContrast(foreground, background, fontSize, isBold);

  return {
    ratio: result.ratio,
    passesAA: result.passesAA,
    passesAAA: result.passesAAA,
    foreground,
    background,
  };
}

/**
 * Valide l'accessibilité d'une page
 */
export interface AccessibilityReport {
  violations: Array<{
    type: string;
    element: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }>;
  warnings: Array<{
    type: string;
    element: string;
    message: string;
  }>;
  score: number; // 0-100
  recommendations: string[];
}

export function validatePageAccessibility(): AccessibilityReport {
  const violations: AccessibilityReport['violations'] = [];
  const warnings: AccessibilityReport['warnings'] = [];
  const recommendations: string[] = [];

  // Vérifier les images sans alt
  const images = document.querySelectorAll('img');
  images.forEach((img, index) => {
    if (!img.getAttribute('alt') && img.getAttribute('alt') !== '') {
      violations.push({
        type: 'missing-alt',
        element: `img[${index}]`,
        message: 'Image sans attribut alt',
        severity: 'error',
      });
    }
  });

  // Vérifier les boutons sans label
  const buttons = document.querySelectorAll('button');
  buttons.forEach((button, index) => {
    const hasText = button.textContent?.trim();
    const hasAriaLabel = button.getAttribute('aria-label');
    const hasAriaLabelledBy = button.getAttribute('aria-labelledby');
    
    if (!hasText && !hasAriaLabel && !hasAriaLabelledBy) {
      violations.push({
        type: 'missing-button-label',
        element: `button[${index}]`,
        message: 'Bouton sans label accessible',
        severity: 'error',
      });
    }
  });

  // Vérifier les liens sans texte
  const links = document.querySelectorAll('a[href]');
  links.forEach((link, index) => {
    const hasText = link.textContent?.trim();
    const hasAriaLabel = link.getAttribute('aria-label');
    const hasTitle = link.getAttribute('title');
    
    if (!hasText && !hasAriaLabel && !hasTitle) {
      violations.push({
        type: 'missing-link-text',
        element: `a[${index}]`,
        message: 'Lien sans texte accessible',
        severity: 'error',
      });
    }
  });

  // Vérifier les inputs sans label
  const inputs = document.querySelectorAll('input:not([type="hidden"])');
  inputs.forEach((input, index) => {
    const id = input.getAttribute('id');
    const hasLabel = id ? document.querySelector(`label[for="${id}"]`) : null;
    const hasAriaLabel = input.getAttribute('aria-label');
    const hasAriaLabelledBy = input.getAttribute('aria-labelledby');
    const hasPlaceholder = input.getAttribute('placeholder');
    
    if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy && !hasPlaceholder) {
      violations.push({
        type: 'missing-input-label',
        element: `input[${index}]`,
        message: 'Champ de formulaire sans label',
        severity: 'error',
      });
    }
  });

  // Vérifier le contraste des textes
  const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, a, button, label');
  let contrastIssues = 0;
  textElements.forEach((el) => {
    if (el instanceof HTMLElement && el.textContent?.trim()) {
      const contrast = checkElementContrast(el);
      if (!contrast.passesAA) {
        contrastIssues++;
        if (contrastIssues <= 5) { // Limiter les warnings
          warnings.push({
            type: 'low-contrast',
            element: el.tagName.toLowerCase(),
            message: `Contraste insuffisant (${contrast.ratio.toFixed(2)}:1)`,
          });
        }
      }
    }
  });

  // Vérifier la présence de landmarks
  const hasMain = !!document.querySelector('main, [role="main"]');
  const hasNav = !!document.querySelector('nav, [role="navigation"]');
  
  if (!hasMain) {
    warnings.push({
      type: 'missing-landmark',
      element: 'body',
      message: 'Landmark main manquant',
    });
  }

  // Calculer le score (0-100)
  const totalChecks = images.length + buttons.length + links.length + inputs.length;
  const errors = violations.filter(v => v.severity === 'error').length;
  const score = totalChecks > 0 
    ? Math.max(0, Math.round((1 - errors / totalChecks) * 100))
    : 100;

  // Recommandations générales
  if (violations.length > 0) {
    recommendations.push(`Corriger ${violations.length} violation(s) d'accessibilité`);
  }
  if (contrastIssues > 0) {
    recommendations.push(`Améliorer le contraste de ${contrastIssues} élément(s)`);
  }
  if (!hasMain || !hasNav) {
    recommendations.push('Ajouter des landmarks ARIA (main, nav)');
  }

  return {
    violations,
    warnings,
    score,
    recommendations,
  };
}

/**
 * Raccourcis clavier pour l'accessibilité
 */
export function setupKeyboardShortcuts(): () => void {
  const shortcuts = new Map<string, () => void>();

  // Raccourci pour aller au contenu principal (Alt+M)
  shortcuts.set('Alt+m', () => {
    const main = document.querySelector('main, [role="main"]');
    if (main instanceof HTMLElement) {
      main.focus();
      main.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  // Raccourci pour aller à la navigation (Alt+N)
  shortcuts.set('Alt+n', () => {
    const nav = document.querySelector('nav, [role="navigation"]');
    if (nav instanceof HTMLElement) {
      const firstLink = nav.querySelector('a, button');
      if (firstLink instanceof HTMLElement) {
        firstLink.focus();
      }
    }
  });

  // Raccourci pour afficher le rapport d'accessibilité (Alt+A)
  shortcuts.set('Alt+a', () => {
    const report = validatePageAccessibility();
    logger.info('📊 Rapport d\'accessibilité:', { report });
    
    // Annoncer le score
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = `Score d'accessibilité: ${report.score} sur 100. ${report.violations.length} violation(s) détectée(s).`;
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 3000);
  });

  const handleKeyDown = (e: KeyboardEvent) => {
    const key = `${e.altKey ? 'Alt+' : ''}${e.ctrlKey ? 'Ctrl+' : ''}${e.shiftKey ? 'Shift+' : ''}${e.key.toLowerCase()}`;
    const handler = shortcuts.get(key);
    if (handler) {
      e.preventDefault();
      handler();
    }
  };

  document.addEventListener('keydown', handleKeyDown);

  return () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
}

