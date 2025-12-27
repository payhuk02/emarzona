/**
 * Tests unitaires pour url-validator
 * Utilitaire critique pour la sécurité (prévention open redirect)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateRedirectUrl,
  isPaymentDomain,
  safeRedirect,
  extractAndValidateUrl,
  getAllowedDomains,
} from '../url-validator';

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('url-validator', () => {
  beforeEach(() => {
    // Reset window.location mock
    delete (window as any).location;
    window.location = { href: '' } as any;
  });

  describe('validateRedirectUrl', () => {
    it('devrait valider une URL Moneroo valide', () => {
      const result = validateRedirectUrl('https://moneroo.io/checkout/123');
      
      expect(result.isValid).toBe(true);
      expect(result.url).toBeDefined();
    });

    it('devrait valider une URL emarzona.com valide', () => {
      const result = validateRedirectUrl('https://emarzona.com/dashboard');
      
      expect(result.isValid).toBe(true);
    });

    it('devrait rejeter une URL avec un domaine non autorisé', () => {
      const result = validateRedirectUrl('https://evil.com/steal');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('non autorisé');
    });

    it('devrait rejeter une URL vide', () => {
      const result = validateRedirectUrl('');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('vide');
    });

    it('devrait rejeter une URL avec un format invalide', () => {
      const result = validateRedirectUrl('not-a-valid-url');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Format d\'URL invalide');
    });

    it('devrait rejeter une URL avec un protocole non autorisé (ftp)', () => {
      const result = validateRedirectUrl('ftp://moneroo.io/checkout');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Protocole non autorisé');
    });

    it('devrait accepter localhost en développement', () => {
      const result = validateRedirectUrl('http://localhost:3000/checkout');
      
      expect(result.isValid).toBe(true);
    });
  });

  describe('isPaymentDomain', () => {
    it('devrait retourner true pour un domaine autorisé', () => {
      const result = isPaymentDomain('https://moneroo.io/checkout');
      expect(result).toBe(true);
    });

    it('devrait retourner false pour un domaine non autorisé', () => {
      const result = isPaymentDomain('https://evil.com/steal');
      expect(result).toBe(false);
    });
  });

  describe('safeRedirect', () => {
    it('devrait rediriger vers une URL valide', () => {
      const originalLocation = window.location;
      window.location = { href: '' } as any;

      safeRedirect('https://moneroo.io/checkout/123');
      
      expect(window.location.href).toBe('https://moneroo.io/checkout/123');
      
      window.location = originalLocation;
    });

    it('devrait appeler onError pour une URL invalide', () => {
      const onError = vi.fn();
      const originalLocation = window.location;
      window.location = { href: '' } as any;

      safeRedirect('https://evil.com/steal', onError);
      
      expect(onError).toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith(expect.stringContaining('non autorisé'));
      
      window.location = originalLocation;
    });

    it('devrait rediriger vers /dashboard si pas de callback d\'erreur', () => {
      const originalLocation = window.location;
      window.location = { href: '' } as any;

      safeRedirect('https://evil.com/steal');
      
      // Devrait rediriger vers /dashboard en fallback
      expect(window.location.href).toBe('/dashboard');
      
      window.location = originalLocation;
    });
  });

  describe('extractAndValidateUrl', () => {
    it('devrait extraire et valider une URL depuis une réponse API', () => {
      const response = {
        checkout_url: 'https://moneroo.io/checkout/123',
      };
      
      const url = extractAndValidateUrl(response);
      
      expect(url).toBe('https://moneroo.io/checkout/123');
    });

    it('devrait retourner null si l\'URL est invalide', () => {
      const response = {
        checkout_url: 'https://evil.com/steal',
      };
      
      const url = extractAndValidateUrl(response);
      
      expect(url).toBeNull();
    });

    it('devrait retourner null si le champ n\'existe pas', () => {
      const response = {};
      
      const url = extractAndValidateUrl(response);
      
      expect(url).toBeNull();
    });

    it('devrait utiliser un champ personnalisé', () => {
      const response = {
        redirect_url: 'https://moneroo.io/checkout/123',
      };
      
      const url = extractAndValidateUrl(response, 'redirect_url');
      
      expect(url).toBe('https://moneroo.io/checkout/123');
    });
  });

  describe('getAllowedDomains', () => {
    it('devrait retourner la liste des domaines autorisés', () => {
      const domains = getAllowedDomains();
      
      expect(domains).toContain('moneroo.io');
      expect(domains).toContain('emarzona.com');
      expect(domains.length).toBeGreaterThan(0);
    });
  });
});


 * Utilitaire critique pour la sécurité (prévention open redirect)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateRedirectUrl,
  isPaymentDomain,
  safeRedirect,
  extractAndValidateUrl,
  getAllowedDomains,
} from '../url-validator';

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('url-validator', () => {
  beforeEach(() => {
    // Reset window.location mock
    delete (window as any).location;
    window.location = { href: '' } as any;
  });

  describe('validateRedirectUrl', () => {
    it('devrait valider une URL Moneroo valide', () => {
      const result = validateRedirectUrl('https://moneroo.io/checkout/123');
      
      expect(result.isValid).toBe(true);
      expect(result.url).toBeDefined();
    });

    it('devrait valider une URL emarzona.com valide', () => {
      const result = validateRedirectUrl('https://emarzona.com/dashboard');
      
      expect(result.isValid).toBe(true);
    });

    it('devrait rejeter une URL avec un domaine non autorisé', () => {
      const result = validateRedirectUrl('https://evil.com/steal');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('non autorisé');
    });

    it('devrait rejeter une URL vide', () => {
      const result = validateRedirectUrl('');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('vide');
    });

    it('devrait rejeter une URL avec un format invalide', () => {
      const result = validateRedirectUrl('not-a-valid-url');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Format d\'URL invalide');
    });

    it('devrait rejeter une URL avec un protocole non autorisé (ftp)', () => {
      const result = validateRedirectUrl('ftp://moneroo.io/checkout');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Protocole non autorisé');
    });

    it('devrait accepter localhost en développement', () => {
      const result = validateRedirectUrl('http://localhost:3000/checkout');
      
      expect(result.isValid).toBe(true);
    });
  });

  describe('isPaymentDomain', () => {
    it('devrait retourner true pour un domaine autorisé', () => {
      const result = isPaymentDomain('https://moneroo.io/checkout');
      expect(result).toBe(true);
    });

    it('devrait retourner false pour un domaine non autorisé', () => {
      const result = isPaymentDomain('https://evil.com/steal');
      expect(result).toBe(false);
    });
  });

  describe('safeRedirect', () => {
    it('devrait rediriger vers une URL valide', () => {
      const originalLocation = window.location;
      window.location = { href: '' } as any;

      safeRedirect('https://moneroo.io/checkout/123');
      
      expect(window.location.href).toBe('https://moneroo.io/checkout/123');
      
      window.location = originalLocation;
    });

    it('devrait appeler onError pour une URL invalide', () => {
      const onError = vi.fn();
      const originalLocation = window.location;
      window.location = { href: '' } as any;

      safeRedirect('https://evil.com/steal', onError);
      
      expect(onError).toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith(expect.stringContaining('non autorisé'));
      
      window.location = originalLocation;
    });

    it('devrait rediriger vers /dashboard si pas de callback d\'erreur', () => {
      const originalLocation = window.location;
      window.location = { href: '' } as any;

      safeRedirect('https://evil.com/steal');
      
      // Devrait rediriger vers /dashboard en fallback
      expect(window.location.href).toBe('/dashboard');
      
      window.location = originalLocation;
    });
  });

  describe('extractAndValidateUrl', () => {
    it('devrait extraire et valider une URL depuis une réponse API', () => {
      const response = {
        checkout_url: 'https://moneroo.io/checkout/123',
      };
      
      const url = extractAndValidateUrl(response);
      
      expect(url).toBe('https://moneroo.io/checkout/123');
    });

    it('devrait retourner null si l\'URL est invalide', () => {
      const response = {
        checkout_url: 'https://evil.com/steal',
      };
      
      const url = extractAndValidateUrl(response);
      
      expect(url).toBeNull();
    });

    it('devrait retourner null si le champ n\'existe pas', () => {
      const response = {};
      
      const url = extractAndValidateUrl(response);
      
      expect(url).toBeNull();
    });

    it('devrait utiliser un champ personnalisé', () => {
      const response = {
        redirect_url: 'https://moneroo.io/checkout/123',
      };
      
      const url = extractAndValidateUrl(response, 'redirect_url');
      
      expect(url).toBe('https://moneroo.io/checkout/123');
    });
  });

  describe('getAllowedDomains', () => {
    it('devrait retourner la liste des domaines autorisés', () => {
      const domains = getAllowedDomains();
      
      expect(domains).toContain('moneroo.io');
      expect(domains).toContain('emarzona.com');
      expect(domains.length).toBeGreaterThan(0);
    });
  });
});


 * Utilitaire critique pour la sécurité (prévention open redirect)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateRedirectUrl,
  isPaymentDomain,
  safeRedirect,
  extractAndValidateUrl,
  getAllowedDomains,
} from '../url-validator';

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('url-validator', () => {
  beforeEach(() => {
    // Reset window.location mock
    delete (window as any).location;
    window.location = { href: '' } as any;
  });

  describe('validateRedirectUrl', () => {
    it('devrait valider une URL Moneroo valide', () => {
      const result = validateRedirectUrl('https://moneroo.io/checkout/123');
      
      expect(result.isValid).toBe(true);
      expect(result.url).toBeDefined();
    });

    it('devrait valider une URL emarzona.com valide', () => {
      const result = validateRedirectUrl('https://emarzona.com/dashboard');
      
      expect(result.isValid).toBe(true);
    });

    it('devrait rejeter une URL avec un domaine non autorisé', () => {
      const result = validateRedirectUrl('https://evil.com/steal');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('non autorisé');
    });

    it('devrait rejeter une URL vide', () => {
      const result = validateRedirectUrl('');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('vide');
    });

    it('devrait rejeter une URL avec un format invalide', () => {
      const result = validateRedirectUrl('not-a-valid-url');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Format d\'URL invalide');
    });

    it('devrait rejeter une URL avec un protocole non autorisé (ftp)', () => {
      const result = validateRedirectUrl('ftp://moneroo.io/checkout');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Protocole non autorisé');
    });

    it('devrait accepter localhost en développement', () => {
      const result = validateRedirectUrl('http://localhost:3000/checkout');
      
      expect(result.isValid).toBe(true);
    });
  });

  describe('isPaymentDomain', () => {
    it('devrait retourner true pour un domaine autorisé', () => {
      const result = isPaymentDomain('https://moneroo.io/checkout');
      expect(result).toBe(true);
    });

    it('devrait retourner false pour un domaine non autorisé', () => {
      const result = isPaymentDomain('https://evil.com/steal');
      expect(result).toBe(false);
    });
  });

  describe('safeRedirect', () => {
    it('devrait rediriger vers une URL valide', () => {
      const originalLocation = window.location;
      window.location = { href: '' } as any;

      safeRedirect('https://moneroo.io/checkout/123');
      
      expect(window.location.href).toBe('https://moneroo.io/checkout/123');
      
      window.location = originalLocation;
    });

    it('devrait appeler onError pour une URL invalide', () => {
      const onError = vi.fn();
      const originalLocation = window.location;
      window.location = { href: '' } as any;

      safeRedirect('https://evil.com/steal', onError);
      
      expect(onError).toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith(expect.stringContaining('non autorisé'));
      
      window.location = originalLocation;
    });

    it('devrait rediriger vers /dashboard si pas de callback d\'erreur', () => {
      const originalLocation = window.location;
      window.location = { href: '' } as any;

      safeRedirect('https://evil.com/steal');
      
      // Devrait rediriger vers /dashboard en fallback
      expect(window.location.href).toBe('/dashboard');
      
      window.location = originalLocation;
    });
  });

  describe('extractAndValidateUrl', () => {
    it('devrait extraire et valider une URL depuis une réponse API', () => {
      const response = {
        checkout_url: 'https://moneroo.io/checkout/123',
      };
      
      const url = extractAndValidateUrl(response);
      
      expect(url).toBe('https://moneroo.io/checkout/123');
    });

    it('devrait retourner null si l\'URL est invalide', () => {
      const response = {
        checkout_url: 'https://evil.com/steal',
      };
      
      const url = extractAndValidateUrl(response);
      
      expect(url).toBeNull();
    });

    it('devrait retourner null si le champ n\'existe pas', () => {
      const response = {};
      
      const url = extractAndValidateUrl(response);
      
      expect(url).toBeNull();
    });

    it('devrait utiliser un champ personnalisé', () => {
      const response = {
        redirect_url: 'https://moneroo.io/checkout/123',
      };
      
      const url = extractAndValidateUrl(response, 'redirect_url');
      
      expect(url).toBe('https://moneroo.io/checkout/123');
    });
  });

  describe('getAllowedDomains', () => {
    it('devrait retourner la liste des domaines autorisés', () => {
      const domains = getAllowedDomains();
      
      expect(domains).toContain('moneroo.io');
      expect(domains).toContain('emarzona.com');
      expect(domains.length).toBeGreaterThan(0);
    });
  });
});


 * Utilitaire critique pour la sécurité (prévention open redirect)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateRedirectUrl,
  isPaymentDomain,
  safeRedirect,
  extractAndValidateUrl,
  getAllowedDomains,
} from '../url-validator';

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('url-validator', () => {
  beforeEach(() => {
    // Reset window.location mock
    delete (window as any).location;
    window.location = { href: '' } as any;
  });

  describe('validateRedirectUrl', () => {
    it('devrait valider une URL Moneroo valide', () => {
      const result = validateRedirectUrl('https://moneroo.io/checkout/123');
      
      expect(result.isValid).toBe(true);
      expect(result.url).toBeDefined();
    });

    it('devrait valider une URL emarzona.com valide', () => {
      const result = validateRedirectUrl('https://emarzona.com/dashboard');
      
      expect(result.isValid).toBe(true);
    });

    it('devrait rejeter une URL avec un domaine non autorisé', () => {
      const result = validateRedirectUrl('https://evil.com/steal');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('non autorisé');
    });

    it('devrait rejeter une URL vide', () => {
      const result = validateRedirectUrl('');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('vide');
    });

    it('devrait rejeter une URL avec un format invalide', () => {
      const result = validateRedirectUrl('not-a-valid-url');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Format d\'URL invalide');
    });

    it('devrait rejeter une URL avec un protocole non autorisé (ftp)', () => {
      const result = validateRedirectUrl('ftp://moneroo.io/checkout');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Protocole non autorisé');
    });

    it('devrait accepter localhost en développement', () => {
      const result = validateRedirectUrl('http://localhost:3000/checkout');
      
      expect(result.isValid).toBe(true);
    });
  });

  describe('isPaymentDomain', () => {
    it('devrait retourner true pour un domaine autorisé', () => {
      const result = isPaymentDomain('https://moneroo.io/checkout');
      expect(result).toBe(true);
    });

    it('devrait retourner false pour un domaine non autorisé', () => {
      const result = isPaymentDomain('https://evil.com/steal');
      expect(result).toBe(false);
    });
  });

  describe('safeRedirect', () => {
    it('devrait rediriger vers une URL valide', () => {
      const originalLocation = window.location;
      window.location = { href: '' } as any;

      safeRedirect('https://moneroo.io/checkout/123');
      
      expect(window.location.href).toBe('https://moneroo.io/checkout/123');
      
      window.location = originalLocation;
    });

    it('devrait appeler onError pour une URL invalide', () => {
      const onError = vi.fn();
      const originalLocation = window.location;
      window.location = { href: '' } as any;

      safeRedirect('https://evil.com/steal', onError);
      
      expect(onError).toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith(expect.stringContaining('non autorisé'));
      
      window.location = originalLocation;
    });

    it('devrait rediriger vers /dashboard si pas de callback d\'erreur', () => {
      const originalLocation = window.location;
      window.location = { href: '' } as any;

      safeRedirect('https://evil.com/steal');
      
      // Devrait rediriger vers /dashboard en fallback
      expect(window.location.href).toBe('/dashboard');
      
      window.location = originalLocation;
    });
  });

  describe('extractAndValidateUrl', () => {
    it('devrait extraire et valider une URL depuis une réponse API', () => {
      const response = {
        checkout_url: 'https://moneroo.io/checkout/123',
      };
      
      const url = extractAndValidateUrl(response);
      
      expect(url).toBe('https://moneroo.io/checkout/123');
    });

    it('devrait retourner null si l\'URL est invalide', () => {
      const response = {
        checkout_url: 'https://evil.com/steal',
      };
      
      const url = extractAndValidateUrl(response);
      
      expect(url).toBeNull();
    });

    it('devrait retourner null si le champ n\'existe pas', () => {
      const response = {};
      
      const url = extractAndValidateUrl(response);
      
      expect(url).toBeNull();
    });

    it('devrait utiliser un champ personnalisé', () => {
      const response = {
        redirect_url: 'https://moneroo.io/checkout/123',
      };
      
      const url = extractAndValidateUrl(response, 'redirect_url');
      
      expect(url).toBe('https://moneroo.io/checkout/123');
    });
  });

  describe('getAllowedDomains', () => {
    it('devrait retourner la liste des domaines autorisés', () => {
      const domains = getAllowedDomains();
      
      expect(domains).toContain('moneroo.io');
      expect(domains).toContain('emarzona.com');
      expect(domains.length).toBeGreaterThan(0);
    });
  });
});


 * Utilitaire critique pour la sécurité (prévention open redirect)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateRedirectUrl,
  isPaymentDomain,
  safeRedirect,
  extractAndValidateUrl,
  getAllowedDomains,
} from '../url-validator';

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('url-validator', () => {
  beforeEach(() => {
    // Reset window.location mock
    delete (window as any).location;
    window.location = { href: '' } as any;
  });

  describe('validateRedirectUrl', () => {
    it('devrait valider une URL Moneroo valide', () => {
      const result = validateRedirectUrl('https://moneroo.io/checkout/123');
      
      expect(result.isValid).toBe(true);
      expect(result.url).toBeDefined();
    });

    it('devrait valider une URL emarzona.com valide', () => {
      const result = validateRedirectUrl('https://emarzona.com/dashboard');
      
      expect(result.isValid).toBe(true);
    });

    it('devrait rejeter une URL avec un domaine non autorisé', () => {
      const result = validateRedirectUrl('https://evil.com/steal');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('non autorisé');
    });

    it('devrait rejeter une URL vide', () => {
      const result = validateRedirectUrl('');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('vide');
    });

    it('devrait rejeter une URL avec un format invalide', () => {
      const result = validateRedirectUrl('not-a-valid-url');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Format d\'URL invalide');
    });

    it('devrait rejeter une URL avec un protocole non autorisé (ftp)', () => {
      const result = validateRedirectUrl('ftp://moneroo.io/checkout');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Protocole non autorisé');
    });

    it('devrait accepter localhost en développement', () => {
      const result = validateRedirectUrl('http://localhost:3000/checkout');
      
      expect(result.isValid).toBe(true);
    });
  });

  describe('isPaymentDomain', () => {
    it('devrait retourner true pour un domaine autorisé', () => {
      const result = isPaymentDomain('https://moneroo.io/checkout');
      expect(result).toBe(true);
    });

    it('devrait retourner false pour un domaine non autorisé', () => {
      const result = isPaymentDomain('https://evil.com/steal');
      expect(result).toBe(false);
    });
  });

  describe('safeRedirect', () => {
    it('devrait rediriger vers une URL valide', () => {
      const originalLocation = window.location;
      window.location = { href: '' } as any;

      safeRedirect('https://moneroo.io/checkout/123');
      
      expect(window.location.href).toBe('https://moneroo.io/checkout/123');
      
      window.location = originalLocation;
    });

    it('devrait appeler onError pour une URL invalide', () => {
      const onError = vi.fn();
      const originalLocation = window.location;
      window.location = { href: '' } as any;

      safeRedirect('https://evil.com/steal', onError);
      
      expect(onError).toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith(expect.stringContaining('non autorisé'));
      
      window.location = originalLocation;
    });

    it('devrait rediriger vers /dashboard si pas de callback d\'erreur', () => {
      const originalLocation = window.location;
      window.location = { href: '' } as any;

      safeRedirect('https://evil.com/steal');
      
      // Devrait rediriger vers /dashboard en fallback
      expect(window.location.href).toBe('/dashboard');
      
      window.location = originalLocation;
    });
  });

  describe('extractAndValidateUrl', () => {
    it('devrait extraire et valider une URL depuis une réponse API', () => {
      const response = {
        checkout_url: 'https://moneroo.io/checkout/123',
      };
      
      const url = extractAndValidateUrl(response);
      
      expect(url).toBe('https://moneroo.io/checkout/123');
    });

    it('devrait retourner null si l\'URL est invalide', () => {
      const response = {
        checkout_url: 'https://evil.com/steal',
      };
      
      const url = extractAndValidateUrl(response);
      
      expect(url).toBeNull();
    });

    it('devrait retourner null si le champ n\'existe pas', () => {
      const response = {};
      
      const url = extractAndValidateUrl(response);
      
      expect(url).toBeNull();
    });

    it('devrait utiliser un champ personnalisé', () => {
      const response = {
        redirect_url: 'https://moneroo.io/checkout/123',
      };
      
      const url = extractAndValidateUrl(response, 'redirect_url');
      
      expect(url).toBe('https://moneroo.io/checkout/123');
    });
  });

  describe('getAllowedDomains', () => {
    it('devrait retourner la liste des domaines autorisés', () => {
      const domains = getAllowedDomains();
      
      expect(domains).toContain('moneroo.io');
      expect(domains).toContain('emarzona.com');
      expect(domains.length).toBeGreaterThan(0);
    });
  });
});


 * Utilitaire critique pour la sécurité (prévention open redirect)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateRedirectUrl,
  isPaymentDomain,
  safeRedirect,
  extractAndValidateUrl,
  getAllowedDomains,
} from '../url-validator';

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('url-validator', () => {
  beforeEach(() => {
    // Reset window.location mock
    delete (window as any).location;
    window.location = { href: '' } as any;
  });

  describe('validateRedirectUrl', () => {
    it('devrait valider une URL Moneroo valide', () => {
      const result = validateRedirectUrl('https://moneroo.io/checkout/123');
      
      expect(result.isValid).toBe(true);
      expect(result.url).toBeDefined();
    });

    it('devrait valider une URL emarzona.com valide', () => {
      const result = validateRedirectUrl('https://emarzona.com/dashboard');
      
      expect(result.isValid).toBe(true);
    });

    it('devrait rejeter une URL avec un domaine non autorisé', () => {
      const result = validateRedirectUrl('https://evil.com/steal');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('non autorisé');
    });

    it('devrait rejeter une URL vide', () => {
      const result = validateRedirectUrl('');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('vide');
    });

    it('devrait rejeter une URL avec un format invalide', () => {
      const result = validateRedirectUrl('not-a-valid-url');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Format d\'URL invalide');
    });

    it('devrait rejeter une URL avec un protocole non autorisé (ftp)', () => {
      const result = validateRedirectUrl('ftp://moneroo.io/checkout');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Protocole non autorisé');
    });

    it('devrait accepter localhost en développement', () => {
      const result = validateRedirectUrl('http://localhost:3000/checkout');
      
      expect(result.isValid).toBe(true);
    });
  });

  describe('isPaymentDomain', () => {
    it('devrait retourner true pour un domaine autorisé', () => {
      const result = isPaymentDomain('https://moneroo.io/checkout');
      expect(result).toBe(true);
    });

    it('devrait retourner false pour un domaine non autorisé', () => {
      const result = isPaymentDomain('https://evil.com/steal');
      expect(result).toBe(false);
    });
  });

  describe('safeRedirect', () => {
    it('devrait rediriger vers une URL valide', () => {
      const originalLocation = window.location;
      window.location = { href: '' } as any;

      safeRedirect('https://moneroo.io/checkout/123');
      
      expect(window.location.href).toBe('https://moneroo.io/checkout/123');
      
      window.location = originalLocation;
    });

    it('devrait appeler onError pour une URL invalide', () => {
      const onError = vi.fn();
      const originalLocation = window.location;
      window.location = { href: '' } as any;

      safeRedirect('https://evil.com/steal', onError);
      
      expect(onError).toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith(expect.stringContaining('non autorisé'));
      
      window.location = originalLocation;
    });

    it('devrait rediriger vers /dashboard si pas de callback d\'erreur', () => {
      const originalLocation = window.location;
      window.location = { href: '' } as any;

      safeRedirect('https://evil.com/steal');
      
      // Devrait rediriger vers /dashboard en fallback
      expect(window.location.href).toBe('/dashboard');
      
      window.location = originalLocation;
    });
  });

  describe('extractAndValidateUrl', () => {
    it('devrait extraire et valider une URL depuis une réponse API', () => {
      const response = {
        checkout_url: 'https://moneroo.io/checkout/123',
      };
      
      const url = extractAndValidateUrl(response);
      
      expect(url).toBe('https://moneroo.io/checkout/123');
    });

    it('devrait retourner null si l\'URL est invalide', () => {
      const response = {
        checkout_url: 'https://evil.com/steal',
      };
      
      const url = extractAndValidateUrl(response);
      
      expect(url).toBeNull();
    });

    it('devrait retourner null si le champ n\'existe pas', () => {
      const response = {};
      
      const url = extractAndValidateUrl(response);
      
      expect(url).toBeNull();
    });

    it('devrait utiliser un champ personnalisé', () => {
      const response = {
        redirect_url: 'https://moneroo.io/checkout/123',
      };
      
      const url = extractAndValidateUrl(response, 'redirect_url');
      
      expect(url).toBe('https://moneroo.io/checkout/123');
    });
  });

  describe('getAllowedDomains', () => {
    it('devrait retourner la liste des domaines autorisés', () => {
      const domains = getAllowedDomains();
      
      expect(domains).toContain('moneroo.io');
      expect(domains).toContain('emarzona.com');
      expect(domains.length).toBeGreaterThan(0);
    });
  });
});


 * Utilitaire critique pour la sécurité (prévention open redirect)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateRedirectUrl,
  isPaymentDomain,
  safeRedirect,
  extractAndValidateUrl,
  getAllowedDomains,
} from '../url-validator';

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('url-validator', () => {
  beforeEach(() => {
    // Reset window.location mock
    delete (window as any).location;
    window.location = { href: '' } as any;
  });

  describe('validateRedirectUrl', () => {
    it('devrait valider une URL Moneroo valide', () => {
      const result = validateRedirectUrl('https://moneroo.io/checkout/123');
      
      expect(result.isValid).toBe(true);
      expect(result.url).toBeDefined();
    });

    it('devrait valider une URL emarzona.com valide', () => {
      const result = validateRedirectUrl('https://emarzona.com/dashboard');
      
      expect(result.isValid).toBe(true);
    });

    it('devrait rejeter une URL avec un domaine non autorisé', () => {
      const result = validateRedirectUrl('https://evil.com/steal');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('non autorisé');
    });

    it('devrait rejeter une URL vide', () => {
      const result = validateRedirectUrl('');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('vide');
    });

    it('devrait rejeter une URL avec un format invalide', () => {
      const result = validateRedirectUrl('not-a-valid-url');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Format d\'URL invalide');
    });

    it('devrait rejeter une URL avec un protocole non autorisé (ftp)', () => {
      const result = validateRedirectUrl('ftp://moneroo.io/checkout');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Protocole non autorisé');
    });

    it('devrait accepter localhost en développement', () => {
      const result = validateRedirectUrl('http://localhost:3000/checkout');
      
      expect(result.isValid).toBe(true);
    });
  });

  describe('isPaymentDomain', () => {
    it('devrait retourner true pour un domaine autorisé', () => {
      const result = isPaymentDomain('https://moneroo.io/checkout');
      expect(result).toBe(true);
    });

    it('devrait retourner false pour un domaine non autorisé', () => {
      const result = isPaymentDomain('https://evil.com/steal');
      expect(result).toBe(false);
    });
  });

  describe('safeRedirect', () => {
    it('devrait rediriger vers une URL valide', () => {
      const originalLocation = window.location;
      window.location = { href: '' } as any;

      safeRedirect('https://moneroo.io/checkout/123');
      
      expect(window.location.href).toBe('https://moneroo.io/checkout/123');
      
      window.location = originalLocation;
    });

    it('devrait appeler onError pour une URL invalide', () => {
      const onError = vi.fn();
      const originalLocation = window.location;
      window.location = { href: '' } as any;

      safeRedirect('https://evil.com/steal', onError);
      
      expect(onError).toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith(expect.stringContaining('non autorisé'));
      
      window.location = originalLocation;
    });

    it('devrait rediriger vers /dashboard si pas de callback d\'erreur', () => {
      const originalLocation = window.location;
      window.location = { href: '' } as any;

      safeRedirect('https://evil.com/steal');
      
      // Devrait rediriger vers /dashboard en fallback
      expect(window.location.href).toBe('/dashboard');
      
      window.location = originalLocation;
    });
  });

  describe('extractAndValidateUrl', () => {
    it('devrait extraire et valider une URL depuis une réponse API', () => {
      const response = {
        checkout_url: 'https://moneroo.io/checkout/123',
      };
      
      const url = extractAndValidateUrl(response);
      
      expect(url).toBe('https://moneroo.io/checkout/123');
    });

    it('devrait retourner null si l\'URL est invalide', () => {
      const response = {
        checkout_url: 'https://evil.com/steal',
      };
      
      const url = extractAndValidateUrl(response);
      
      expect(url).toBeNull();
    });

    it('devrait retourner null si le champ n\'existe pas', () => {
      const response = {};
      
      const url = extractAndValidateUrl(response);
      
      expect(url).toBeNull();
    });

    it('devrait utiliser un champ personnalisé', () => {
      const response = {
        redirect_url: 'https://moneroo.io/checkout/123',
      };
      
      const url = extractAndValidateUrl(response, 'redirect_url');
      
      expect(url).toBe('https://moneroo.io/checkout/123');
    });
  });

  describe('getAllowedDomains', () => {
    it('devrait retourner la liste des domaines autorisés', () => {
      const domains = getAllowedDomains();
      
      expect(domains).toContain('moneroo.io');
      expect(domains).toContain('emarzona.com');
      expect(domains.length).toBeGreaterThan(0);
    });
  });
});


 * Utilitaire critique pour la sécurité (prévention open redirect)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateRedirectUrl,
  isPaymentDomain,
  safeRedirect,
  extractAndValidateUrl,
  getAllowedDomains,
} from '../url-validator';

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('url-validator', () => {
  beforeEach(() => {
    // Reset window.location mock
    delete (window as any).location;
    window.location = { href: '' } as any;
  });

  describe('validateRedirectUrl', () => {
    it('devrait valider une URL Moneroo valide', () => {
      const result = validateRedirectUrl('https://moneroo.io/checkout/123');
      
      expect(result.isValid).toBe(true);
      expect(result.url).toBeDefined();
    });

    it('devrait valider une URL emarzona.com valide', () => {
      const result = validateRedirectUrl('https://emarzona.com/dashboard');
      
      expect(result.isValid).toBe(true);
    });

    it('devrait rejeter une URL avec un domaine non autorisé', () => {
      const result = validateRedirectUrl('https://evil.com/steal');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('non autorisé');
    });

    it('devrait rejeter une URL vide', () => {
      const result = validateRedirectUrl('');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('vide');
    });

    it('devrait rejeter une URL avec un format invalide', () => {
      const result = validateRedirectUrl('not-a-valid-url');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Format d\'URL invalide');
    });

    it('devrait rejeter une URL avec un protocole non autorisé (ftp)', () => {
      const result = validateRedirectUrl('ftp://moneroo.io/checkout');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Protocole non autorisé');
    });

    it('devrait accepter localhost en développement', () => {
      const result = validateRedirectUrl('http://localhost:3000/checkout');
      
      expect(result.isValid).toBe(true);
    });
  });

  describe('isPaymentDomain', () => {
    it('devrait retourner true pour un domaine autorisé', () => {
      const result = isPaymentDomain('https://moneroo.io/checkout');
      expect(result).toBe(true);
    });

    it('devrait retourner false pour un domaine non autorisé', () => {
      const result = isPaymentDomain('https://evil.com/steal');
      expect(result).toBe(false);
    });
  });

  describe('safeRedirect', () => {
    it('devrait rediriger vers une URL valide', () => {
      const originalLocation = window.location;
      window.location = { href: '' } as any;

      safeRedirect('https://moneroo.io/checkout/123');
      
      expect(window.location.href).toBe('https://moneroo.io/checkout/123');
      
      window.location = originalLocation;
    });

    it('devrait appeler onError pour une URL invalide', () => {
      const onError = vi.fn();
      const originalLocation = window.location;
      window.location = { href: '' } as any;

      safeRedirect('https://evil.com/steal', onError);
      
      expect(onError).toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith(expect.stringContaining('non autorisé'));
      
      window.location = originalLocation;
    });

    it('devrait rediriger vers /dashboard si pas de callback d\'erreur', () => {
      const originalLocation = window.location;
      window.location = { href: '' } as any;

      safeRedirect('https://evil.com/steal');
      
      // Devrait rediriger vers /dashboard en fallback
      expect(window.location.href).toBe('/dashboard');
      
      window.location = originalLocation;
    });
  });

  describe('extractAndValidateUrl', () => {
    it('devrait extraire et valider une URL depuis une réponse API', () => {
      const response = {
        checkout_url: 'https://moneroo.io/checkout/123',
      };
      
      const url = extractAndValidateUrl(response);
      
      expect(url).toBe('https://moneroo.io/checkout/123');
    });

    it('devrait retourner null si l\'URL est invalide', () => {
      const response = {
        checkout_url: 'https://evil.com/steal',
      };
      
      const url = extractAndValidateUrl(response);
      
      expect(url).toBeNull();
    });

    it('devrait retourner null si le champ n\'existe pas', () => {
      const response = {};
      
      const url = extractAndValidateUrl(response);
      
      expect(url).toBeNull();
    });

    it('devrait utiliser un champ personnalisé', () => {
      const response = {
        redirect_url: 'https://moneroo.io/checkout/123',
      };
      
      const url = extractAndValidateUrl(response, 'redirect_url');
      
      expect(url).toBe('https://moneroo.io/checkout/123');
    });
  });

  describe('getAllowedDomains', () => {
    it('devrait retourner la liste des domaines autorisés', () => {
      const domains = getAllowedDomains();
      
      expect(domains).toContain('moneroo.io');
      expect(domains).toContain('emarzona.com');
      expect(domains.length).toBeGreaterThan(0);
    });
  });
});


 * Utilitaire critique pour la sécurité (prévention open redirect)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateRedirectUrl,
  isPaymentDomain,
  safeRedirect,
  extractAndValidateUrl,
  getAllowedDomains,
} from '../url-validator';

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('url-validator', () => {
  beforeEach(() => {
    // Reset window.location mock
    delete (window as any).location;
    window.location = { href: '' } as any;
  });

  describe('validateRedirectUrl', () => {
    it('devrait valider une URL Moneroo valide', () => {
      const result = validateRedirectUrl('https://moneroo.io/checkout/123');
      
      expect(result.isValid).toBe(true);
      expect(result.url).toBeDefined();
    });

    it('devrait valider une URL emarzona.com valide', () => {
      const result = validateRedirectUrl('https://emarzona.com/dashboard');
      
      expect(result.isValid).toBe(true);
    });

    it('devrait rejeter une URL avec un domaine non autorisé', () => {
      const result = validateRedirectUrl('https://evil.com/steal');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('non autorisé');
    });

    it('devrait rejeter une URL vide', () => {
      const result = validateRedirectUrl('');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('vide');
    });

    it('devrait rejeter une URL avec un format invalide', () => {
      const result = validateRedirectUrl('not-a-valid-url');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Format d\'URL invalide');
    });

    it('devrait rejeter une URL avec un protocole non autorisé (ftp)', () => {
      const result = validateRedirectUrl('ftp://moneroo.io/checkout');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Protocole non autorisé');
    });

    it('devrait accepter localhost en développement', () => {
      const result = validateRedirectUrl('http://localhost:3000/checkout');
      
      expect(result.isValid).toBe(true);
    });
  });

  describe('isPaymentDomain', () => {
    it('devrait retourner true pour un domaine autorisé', () => {
      const result = isPaymentDomain('https://moneroo.io/checkout');
      expect(result).toBe(true);
    });

    it('devrait retourner false pour un domaine non autorisé', () => {
      const result = isPaymentDomain('https://evil.com/steal');
      expect(result).toBe(false);
    });
  });

  describe('safeRedirect', () => {
    it('devrait rediriger vers une URL valide', () => {
      const originalLocation = window.location;
      window.location = { href: '' } as any;

      safeRedirect('https://moneroo.io/checkout/123');
      
      expect(window.location.href).toBe('https://moneroo.io/checkout/123');
      
      window.location = originalLocation;
    });

    it('devrait appeler onError pour une URL invalide', () => {
      const onError = vi.fn();
      const originalLocation = window.location;
      window.location = { href: '' } as any;

      safeRedirect('https://evil.com/steal', onError);
      
      expect(onError).toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith(expect.stringContaining('non autorisé'));
      
      window.location = originalLocation;
    });

    it('devrait rediriger vers /dashboard si pas de callback d\'erreur', () => {
      const originalLocation = window.location;
      window.location = { href: '' } as any;

      safeRedirect('https://evil.com/steal');
      
      // Devrait rediriger vers /dashboard en fallback
      expect(window.location.href).toBe('/dashboard');
      
      window.location = originalLocation;
    });
  });

  describe('extractAndValidateUrl', () => {
    it('devrait extraire et valider une URL depuis une réponse API', () => {
      const response = {
        checkout_url: 'https://moneroo.io/checkout/123',
      };
      
      const url = extractAndValidateUrl(response);
      
      expect(url).toBe('https://moneroo.io/checkout/123');
    });

    it('devrait retourner null si l\'URL est invalide', () => {
      const response = {
        checkout_url: 'https://evil.com/steal',
      };
      
      const url = extractAndValidateUrl(response);
      
      expect(url).toBeNull();
    });

    it('devrait retourner null si le champ n\'existe pas', () => {
      const response = {};
      
      const url = extractAndValidateUrl(response);
      
      expect(url).toBeNull();
    });

    it('devrait utiliser un champ personnalisé', () => {
      const response = {
        redirect_url: 'https://moneroo.io/checkout/123',
      };
      
      const url = extractAndValidateUrl(response, 'redirect_url');
      
      expect(url).toBe('https://moneroo.io/checkout/123');
    });
  });

  describe('getAllowedDomains', () => {
    it('devrait retourner la liste des domaines autorisés', () => {
      const domains = getAllowedDomains();
      
      expect(domains).toContain('moneroo.io');
      expect(domains).toContain('emarzona.com');
      expect(domains.length).toBeGreaterThan(0);
    });
  });
});


 * Utilitaire critique pour la sécurité (prévention open redirect)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateRedirectUrl,
  isPaymentDomain,
  safeRedirect,
  extractAndValidateUrl,
  getAllowedDomains,
} from '../url-validator';

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('url-validator', () => {
  beforeEach(() => {
    // Reset window.location mock
    delete (window as any).location;
    window.location = { href: '' } as any;
  });

  describe('validateRedirectUrl', () => {
    it('devrait valider une URL Moneroo valide', () => {
      const result = validateRedirectUrl('https://moneroo.io/checkout/123');
      
      expect(result.isValid).toBe(true);
      expect(result.url).toBeDefined();
    });

    it('devrait valider une URL emarzona.com valide', () => {
      const result = validateRedirectUrl('https://emarzona.com/dashboard');
      
      expect(result.isValid).toBe(true);
    });

    it('devrait rejeter une URL avec un domaine non autorisé', () => {
      const result = validateRedirectUrl('https://evil.com/steal');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('non autorisé');
    });

    it('devrait rejeter une URL vide', () => {
      const result = validateRedirectUrl('');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('vide');
    });

    it('devrait rejeter une URL avec un format invalide', () => {
      const result = validateRedirectUrl('not-a-valid-url');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Format d\'URL invalide');
    });

    it('devrait rejeter une URL avec un protocole non autorisé (ftp)', () => {
      const result = validateRedirectUrl('ftp://moneroo.io/checkout');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Protocole non autorisé');
    });

    it('devrait accepter localhost en développement', () => {
      const result = validateRedirectUrl('http://localhost:3000/checkout');
      
      expect(result.isValid).toBe(true);
    });
  });

  describe('isPaymentDomain', () => {
    it('devrait retourner true pour un domaine autorisé', () => {
      const result = isPaymentDomain('https://moneroo.io/checkout');
      expect(result).toBe(true);
    });

    it('devrait retourner false pour un domaine non autorisé', () => {
      const result = isPaymentDomain('https://evil.com/steal');
      expect(result).toBe(false);
    });
  });

  describe('safeRedirect', () => {
    it('devrait rediriger vers une URL valide', () => {
      const originalLocation = window.location;
      window.location = { href: '' } as any;

      safeRedirect('https://moneroo.io/checkout/123');
      
      expect(window.location.href).toBe('https://moneroo.io/checkout/123');
      
      window.location = originalLocation;
    });

    it('devrait appeler onError pour une URL invalide', () => {
      const onError = vi.fn();
      const originalLocation = window.location;
      window.location = { href: '' } as any;

      safeRedirect('https://evil.com/steal', onError);
      
      expect(onError).toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith(expect.stringContaining('non autorisé'));
      
      window.location = originalLocation;
    });

    it('devrait rediriger vers /dashboard si pas de callback d\'erreur', () => {
      const originalLocation = window.location;
      window.location = { href: '' } as any;

      safeRedirect('https://evil.com/steal');
      
      // Devrait rediriger vers /dashboard en fallback
      expect(window.location.href).toBe('/dashboard');
      
      window.location = originalLocation;
    });
  });

  describe('extractAndValidateUrl', () => {
    it('devrait extraire et valider une URL depuis une réponse API', () => {
      const response = {
        checkout_url: 'https://moneroo.io/checkout/123',
      };
      
      const url = extractAndValidateUrl(response);
      
      expect(url).toBe('https://moneroo.io/checkout/123');
    });

    it('devrait retourner null si l\'URL est invalide', () => {
      const response = {
        checkout_url: 'https://evil.com/steal',
      };
      
      const url = extractAndValidateUrl(response);
      
      expect(url).toBeNull();
    });

    it('devrait retourner null si le champ n\'existe pas', () => {
      const response = {};
      
      const url = extractAndValidateUrl(response);
      
      expect(url).toBeNull();
    });

    it('devrait utiliser un champ personnalisé', () => {
      const response = {
        redirect_url: 'https://moneroo.io/checkout/123',
      };
      
      const url = extractAndValidateUrl(response, 'redirect_url');
      
      expect(url).toBe('https://moneroo.io/checkout/123');
    });
  });

  describe('getAllowedDomains', () => {
    it('devrait retourner la liste des domaines autorisés', () => {
      const domains = getAllowedDomains();
      
      expect(domains).toContain('moneroo.io');
      expect(domains).toContain('emarzona.com');
      expect(domains.length).toBeGreaterThan(0);
    });
  });
});







